// Himoora Financial Suite - Atomic Financial Transaction Engine
// Guarantees all-or-nothing atomicity for critical accounting mutations (Journal Postings, Invoice Generation, Payment Settlement)
// If any invariant, leg balance, period lock, or calculation check fails, all staged updates are rolled back to the pristine state snapshot.

import { Account, JournalEntry, Invoice } from './accounting-engine';
import { validateLedgerInvariants, InvariantValidationResult } from './ledger-invariants';
import { auditLogService, AuditLogEntry } from './audit-log';
import { idempotencyEngine, executeIdempotentMutation } from './idempotency';

export interface TransactionSnapshot {
  timestamp: number;
  accounts: Account[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
}

export interface TransactionRollbackInfo {
  reasonEn: string;
  reasonFa: string;
  errorCode: string;
  attemptedOperation: string;
  rolledBackEntities: {
    accountsCount: number;
    journalEntriesCount: number;
    invoicesCount: number;
  };
  invariantErrors?: Array<{ code: string; nameEn: string; nameFa: string }>;
}

export interface TransactionSuccessResult<T> {
  success: true;
  data: T;
  updatedAccounts: Account[];
  updatedJournalEntries: JournalEntry[];
  updatedInvoices: Invoice[];
  isReplay: boolean;
  idempotencyKey?: string;
  auditBlockIndex?: number;
}

export interface TransactionFailureResult {
  success: false;
  error: TransactionRollbackInfo;
  updatedAccounts: Account[];
  updatedJournalEntries: JournalEntry[];
  updatedInvoices: Invoice[];
  isReplay: boolean;
  idempotencyKey?: string;
}

export type TransactionResult<T> = TransactionSuccessResult<T> | TransactionFailureResult;

export interface TransactionContext {
  // Read state
  getAccounts: () => Account[];
  getJournalEntries: () => JournalEntry[];
  getInvoices: () => Invoice[];
  
  // Staged mutations
  stageAccountUpdate: (accountCode: string, deltaDebit: number, deltaCredit: number) => void;
  stageAccountDirectBalance: (accountCode: string, newBalanceUsd: number, newBalanceIrr?: number) => void;
  stageJournalEntry: (entry: JournalEntry) => void;
  stageInvoice: (invoice: Invoice) => void;
  stageInvoiceUpdate: (invoiceId: string, updater: (inv: Invoice) => Invoice) => void;
  
  // Explicit transaction abort
  abort: (reasonEn: string, reasonFa: string, errorCode?: string) => never;
}

/**
 * Deep clones state to ensure complete isolation for atomic rollback
 */
function cloneState<T>(state: T): T {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Executes a critical financial mutation inside an atomic transaction boundary.
 * If any step fails or violates double-entry invariants, all financial changes are rolled back.
 */
export async function executeFinancialTransaction<T>(
  operationName: string,
  initialState: {
    accounts: Account[];
    journalEntries: JournalEntry[];
    invoices: Invoice[];
  },
  mutationFn: (ctx: TransactionContext) => Promise<T> | T,
  options?: {
    idempotencyKey?: string;
    actor?: { id: string; name: string; role: string };
    skipInvariantCheck?: boolean;
  }
): Promise<TransactionResult<T>> {
  const actor = options?.actor || {
    id: 'usr-cfo-tx',
    name: 'Arash Kamali (CFO)',
    role: 'Financial Transaction Coordinator',
  };

  // 1. Idempotency Check
  const effectiveKey = options?.idempotencyKey || idempotencyEngine.generateKey(`tx-${operationName.toLowerCase()}`);
  
  const existingRecord = idempotencyEngine.getRecord(effectiveKey);
  if (existingRecord && existingRecord.status === 'RESOLVED') {
    return {
      success: true,
      data: existingRecord.responseBody,
      updatedAccounts: initialState.accounts,
      updatedJournalEntries: initialState.journalEntries,
      updatedInvoices: initialState.invoices,
      isReplay: true,
      idempotencyKey: effectiveKey,
    };
  }

  // 2. Capture Pristine State Snapshot
  const snapshot: TransactionSnapshot = {
    timestamp: Date.now(),
    accounts: cloneState(initialState.accounts),
    journalEntries: cloneState(initialState.journalEntries),
    invoices: cloneState(initialState.invoices),
  };

  // Working state copy
  let workingAccounts = cloneState(initialState.accounts);
  let workingJournalEntries = cloneState(initialState.journalEntries);
  let workingInvoices = cloneState(initialState.invoices);
  const stagedEntries: JournalEntry[] = [];

  const context: TransactionContext = {
    getAccounts: () => workingAccounts,
    getJournalEntries: () => workingJournalEntries,
    getInvoices: () => workingInvoices,

    stageAccountUpdate: (accountCode: string, deltaDebit: number, deltaCredit: number) => {
      const accIndex = workingAccounts.findIndex((a) => a.code === accountCode);
      if (accIndex === -1) {
        throw new Error(`[TX_ERROR_ACCOUNT_NOT_FOUND] Account code ${accountCode} does not exist in Chart of Accounts.`);
      }
      const acc = workingAccounts[accIndex];
      const isDebitNormal = acc.type === 'Asset' || acc.type === 'Expense';
      const netDelta = isDebitNormal
        ? deltaDebit - deltaCredit
        : deltaCredit - deltaDebit;

      const newBalanceUsd = acc.balanceUsd + netDelta;
      workingAccounts[accIndex] = {
        ...acc,
        balanceUsd: newBalanceUsd,
        balanceIrr: Math.round(newBalanceUsd * 600000),
      };
    },

    stageAccountDirectBalance: (accountCode: string, newBalanceUsd: number, newBalanceIrr?: number) => {
      const accIndex = workingAccounts.findIndex((a) => a.code === accountCode);
      if (accIndex === -1) {
        throw new Error(`[TX_ERROR_ACCOUNT_NOT_FOUND] Account code ${accountCode} does not exist in Chart of Accounts.`);
      }
      workingAccounts[accIndex] = {
        ...workingAccounts[accIndex],
        balanceUsd: newBalanceUsd,
        balanceIrr: newBalanceIrr !== undefined ? newBalanceIrr : Math.round(newBalanceUsd * 600000),
      };
    },

    stageJournalEntry: (entry: JournalEntry) => {
      stagedEntries.push(entry);
      workingJournalEntries = [entry, ...workingJournalEntries];
    },

    stageInvoice: (invoice: Invoice) => {
      workingInvoices = [invoice, ...workingInvoices];
    },

    stageInvoiceUpdate: (invoiceId: string, updater: (inv: Invoice) => Invoice) => {
      const idx = workingInvoices.findIndex((i) => i.id === invoiceId);
      if (idx === -1) {
        throw new Error(`[TX_ERROR_INVOICE_NOT_FOUND] Invoice ID ${invoiceId} not found.`);
      }
      workingInvoices[idx] = updater(workingInvoices[idx]);
    },

    abort: (reasonEn: string, reasonFa: string, errorCode: string = 'TX_ABORTED_BY_LOGIC') => {
      const err: any = new Error(reasonEn);
      err.isTxAbort = true;
      err.reasonEn = reasonEn;
      err.reasonFa = reasonFa;
      err.errorCode = errorCode;
      throw err;
    },
  };

  try {
    // 3. Execute Mutation Logic
    const resultData = await mutationFn(context);

    // 4. Invariant Validation Suite on Staged Entries
    if (!options?.skipInvariantCheck && stagedEntries.length > 0) {
      for (const entry of stagedEntries) {
        const report: InvariantValidationResult = validateLedgerInvariants(entry, {
          existingEntries: workingJournalEntries.filter((e) => e.id !== entry.id),
          chartOfAccounts: workingAccounts,
        });

        if (!report.isValid) {
          const firstErr = report.errors[0];
          const err: any = new Error(`Invariant failed: ${firstErr ? firstErr.nameEn : 'Debit != Credit'}`);
          err.isTxAbort = true;
          err.reasonEn = report.messageEn;
          err.reasonFa = report.messageFa;
          err.errorCode = firstErr ? firstErr.code : 'INVARIANT_VIOLATION';
          err.invariantErrors = report.errors;
          throw err;
        }
      }
    }

    // 5. Atomic Commit: Record Audit Log Entry
    const auditRecord = auditLogService.recordMutation({
      actor,
      actionType: 'TRANSACTION_COMMITTED',
      entityType: 'FinancialTransaction',
      entityId: effectiveKey,
      summaryEn: `Transaction [${operationName}] committed atomically. Key: ${effectiveKey}. Staged entries: ${stagedEntries.length}.`,
      summaryFa: `تراکنش مالی [${operationName}] با شناسه ${effectiveKey} و تعداد ${stagedEntries.length} سند با موفقیت به صورت یکپارچه نهایی شد.`,
      beforeState: {
        accountsCount: snapshot.accounts.length,
        journalsCount: snapshot.journalEntries.length,
      },
      afterState: {
        accountsCount: workingAccounts.length,
        journalsCount: workingJournalEntries.length,
        operation: operationName,
      },
      invariantsChecked: ['INV-01', 'INV-02', 'INV-03', 'INV-05', 'INV-06', 'INV-10'],
      severity: 'AUDIT_CRITICAL',
    });

    // 6. Record in Idempotency Engine
    idempotencyEngine.acquireLock(effectiveKey, `/transactions/${operationName.toLowerCase()}`, 'POST', {
      operation: operationName,
    });
    idempotencyEngine.resolveLock(
      effectiveKey,
      200,
      resultData,
      {},
      {
        entityType: 'FinancialTransaction',
        entityId: effectiveKey,
        sideEffects: [`Committed ${operationName} atomically with ${stagedEntries.length} journal postings`],
      }
    );

    return {
      success: true,
      data: resultData,
      updatedAccounts: workingAccounts,
      updatedJournalEntries: workingJournalEntries,
      updatedInvoices: workingInvoices,
      isReplay: false,
      idempotencyKey: effectiveKey,
      auditBlockIndex: auditRecord.sequenceNumber,
    };
  } catch (error: any) {
    // 7. ATOMIC ROLLBACK: Discard all working state and restore snapshot
    console.warn(`[TRANSACTION_ROLLED_BACK] Operation '${operationName}' failed:`, error.message);

    const rollbackInfo: TransactionRollbackInfo = {
      reasonEn: error.reasonEn || error.message || 'Transaction aborted due to runtime violation.',
      reasonFa: error.reasonFa || 'تراکنش به دلیل عدم برقراری شرایط اعتبارسنجی لغو گردید و تمام تغییرات بازیابی شدند.',
      errorCode: error.errorCode || 'TRANSACTION_EXECUTION_ERROR',
      attemptedOperation: operationName,
      rolledBackEntities: {
        accountsCount: workingAccounts.length,
        journalEntriesCount: workingJournalEntries.length,
        invoicesCount: workingInvoices.length,
      },
      invariantErrors: error.invariantErrors,
    };

    // Log rollback event in cryptographic audit log
    auditLogService.recordMutation({
      actor,
      actionType: 'TRANSACTION_ROLLED_BACK',
      entityType: 'FinancialTransaction',
      entityId: effectiveKey,
      summaryEn: `ROLLBACK: Transaction [${operationName}] failed and all state changes were restored. Reason: ${rollbackInfo.reasonEn}`,
      summaryFa: `بازیابی وضعیت (Rollback): تراکنش [${operationName}] لغو و تغییرات بازگردانی شدند. علت: ${rollbackInfo.reasonFa}`,
      beforeState: { rollbackInfo },
      afterState: { restoredToTimestamp: snapshot.timestamp },
      invariantsChecked: ['INV-01', 'INV-02'],
      severity: 'GOVERNANCE_OVERRIDE',
    });

    // Record rejection in idempotency engine if key was registered
    if (idempotencyEngine.hasRecord(effectiveKey)) {
      idempotencyEngine.rejectLock(
        effectiveKey,
        422,
        { error: rollbackInfo },
        rollbackInfo.reasonEn
      );
    }

    return {
      success: false,
      error: rollbackInfo,
      updatedAccounts: snapshot.accounts,
      updatedJournalEntries: snapshot.journalEntries,
      updatedInvoices: snapshot.invoices,
      isReplay: false,
      idempotencyKey: effectiveKey,
    };
  }
}
