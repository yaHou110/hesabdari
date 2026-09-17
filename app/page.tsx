'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import CommandCenter from '@/components/CommandCenter';
import SalesInvoicingView from '@/components/SalesInvoicingView';
import AccountingLedgerView from '@/components/AccountingLedgerView';
import BankingTreasuryView from '@/components/BankingTreasuryView';
import InventoryValuationView from '@/components/InventoryValuationView';
import FinancialReportsView from '@/components/FinancialReportsView';
import HimooraIntelligenceDrawer from '@/components/HimooraIntelligenceDrawer';
import PlanComparisonModal from '@/components/PlanComparisonModal';
import CompanySetupWizardModal from '@/components/CompanySetupWizardModal';
import GlobalSearchModal from '@/components/GlobalSearchModal';

import { Language } from '@/lib/localization';
import {
  PlanTier,
  Currency,
  CURRENCIES,
  Account,
  Invoice,
  JournalEntry,
  BankAccount,
  GovernanceApproval,
  InventoryItem,
  Customer,
  INITIAL_ACCOUNTS,
  INITIAL_INVOICES,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_APPROVALS,
  INITIAL_INVENTORY,
  INITIAL_CUSTOMERS,
} from '@/lib/accounting-engine';
import { validateLedgerInvariants } from '@/lib/ledger-invariants';
import { taxEngine } from '@/lib/tax-engine';
import { auditLogService } from '@/lib/audit-log';
import { idempotencyEngine, withFinancialIdempotency } from '@/lib/idempotency';
import { FiscalYearPeriod } from '@/lib/fiscal-year-closing';
import { executeFinancialTransaction } from '@/lib/financial-transaction';

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [activePlan, setActivePlan] = useState<PlanTier>('Enterprise');
  const [currentView, setCurrentView] = useState<string>('command-center');

  // Accounting Domain Datasets
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [approvals, setApprovals] = useState<GovernanceApproval[]>(INITIAL_APPROVALS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  // Idempotency feedback toast
  const [idempotencyToast, setIdempotencyToast] = useState<{
    visible: boolean;
    messageEn: string;
    messageFa: string;
    key: string;
  } | null>(null);

  // Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState<string>('');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // Keyboard shortcut ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle language and currency sync
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (newLang === 'fa') {
      setCurrency((prev) => (prev === 'USD' ? 'IRR' : prev));
    } else {
      setCurrency((prev) => (prev === 'IRR' ? 'USD' : prev));
    }
  };

  // Sync RTL / LTR document direction
  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Idempotent Invoice creation middleware with automated double-entry GL posting & TaxEngine compliance
  const handleCreateInvoice = async (newInv: Invoice, explicitKey?: string) => {
    const middleware = withFinancialIdempotency(
      async (inv: Invoice, { idempotencyKey }) => {
        // Calculate statutory line-level taxes via dedicated TaxEngine
        const taxSummary = taxEngine.calculateInvoiceTaxes(
          inv.items.map((it) => ({
            id: it.id,
            productId: it.productId,
            nameEn: it.nameEn,
            nameFa: it.nameFa,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountPercent: it.discountPercent || 0,
            customTaxPercent: it.taxPercent,
          })),
          'IR_MAINLAND'
        );

        // Apply finalized tax engine numbers
        const finalizedInv: Invoice = {
          ...inv,
          subtotal: taxSummary.subtotal - taxSummary.totalDiscount,
          taxAmount: taxSummary.totalTaxAmount,
          totalAmount: taxSummary.grandTotal,
          amountDue: taxSummary.grandTotal,
        };

        const nowTimestamp = Date.now();
        const randJvNum = Math.floor(1100 + Math.random() * 800);

        // Create corresponding automated double-entry journal entry with statutory tax lines
        const glLines = [
          {
            id: `l-ar-${nowTimestamp}`,
            accountCode: '1200',
            accountNameEn: '1200 Trade Accounts Receivable',
            accountNameFa: '۱۲۰۰ حساب‌ها و اسناد دریافتنی تجاری',
            debit: finalizedInv.totalAmount,
            credit: 0,
            memoEn: `AR for ${finalizedInv.customerNameEn}`,
            memoFa: `مطالبات تجاری بابت فاکتور ${finalizedInv.invNumber}`,
          },
          {
            id: `l-rev-${nowTimestamp}`,
            accountCode: '4010',
            accountNameEn: '4010 Commercial Sales & Wholesale Revenue',
            accountNameFa: '۴۰۱۰ درآمد حاصل از فروش کالا و خدمات',
            debit: 0,
            credit: finalizedInv.subtotal,
            memoEn: 'Sales revenue recognized',
            memoFa: 'درآمد حاصل از فروش کالا',
          },
        ];

        // Statutory State Tax Provision (8%)
        if (taxSummary.totalStateTax > 0) {
          glLines.push({
            id: `l-tax-state-${nowTimestamp}`,
            accountCode: '2200',
            accountNameEn: '2200 Statutory Tax Provision Payable',
            accountNameFa: '۲۲۰۰ ذخیره مالیات بر عملکرد و ارزش افزوده پرداختنی',
            debit: 0,
            credit: taxSummary.totalStateTax,
            memoEn: `State VAT (8%) on ${finalizedInv.invNumber}`,
            memoFa: `مالیات ارزش افزوده سهم دولت بابت فاکتور ${finalizedInv.invNumber}`,
          });
        }

        // Statutory Municipal Surcharge Toll (1%)
        if (taxSummary.totalMunicipalTax > 0) {
          glLines.push({
            id: `l-tax-muni-${nowTimestamp}`,
            accountCode: '2200',
            accountNameEn: '2200 Statutory Tax Provision Payable (Municipal Toll)',
            accountNameFa: '۲۲۰۰ عوارض شهرداری ارزش افزوده پرداختنی',
            debit: 0,
            credit: taxSummary.totalMunicipalTax,
            memoEn: `Municipal Toll (1%) on ${finalizedInv.invNumber}`,
            memoFa: `عوارض شهرداری ارزش افزوده بابت فاکتور ${finalizedInv.invNumber}`,
          });
        }

        // Fallback single tax line
        if (
          taxSummary.totalTaxAmount > 0 &&
          taxSummary.totalStateTax === 0 &&
          taxSummary.totalMunicipalTax === 0
        ) {
          glLines.push({
            id: `l-tax-gen-${nowTimestamp}`,
            accountCode: '2200',
            accountNameEn: '2200 Statutory Tax Provision Payable',
            accountNameFa: '۲۲۰۰ ذخیره مالیات ارزش افزوده پرداختنی',
            debit: 0,
            credit: taxSummary.totalTaxAmount,
            memoEn: `Statutory Tax on ${finalizedInv.invNumber}`,
            memoFa: `مالیات ارزش افزوده فاکتور ${finalizedInv.invNumber}`,
          });
        }

        const jv: JournalEntry = {
          id: `jv-${nowTimestamp}`,
          jvRef: `#JV-1403-${randJvNum}`,
          date: finalizedInv.date,
          timestamp: 'Just now',
          descriptionEn: `Commercial Invoice recognition (${finalizedInv.invNumber} - ${finalizedInv.customerNameEn})`,
          descriptionFa: `شناسایی فروش فاکتور تجاری شماره ${finalizedInv.invNumber} برای ${finalizedInv.customerNameFa}`,
          sourceDocType: 'Invoice',
          sourceDocRef: finalizedInv.invNumber,
          status: 'Posted',
          createdBy: 'Sales Invoicing Subsystem (TaxEngine)',
          signOff: 'Auto-GL Tax Auditor',
          isAutoSync: true,
          auditBlock: `#${Math.floor(481220 + Math.random() * 500).toLocaleString()}`,
          lines: glLines,
        };

        // Execute through atomic financial transaction manager
        const txResult = await executeFinancialTransaction(
          'CREATE_INVOICE',
          { accounts, journalEntries, invoices },
          (ctx) => {
            ctx.stageInvoice(finalizedInv);
            ctx.stageJournalEntry(jv);
            ctx.stageAccountUpdate('1200', finalizedInv.totalAmount, 0);
            ctx.stageAccountUpdate('4010', 0, finalizedInv.subtotal);
            if (finalizedInv.taxAmount > 0) {
              ctx.stageAccountUpdate('2200', 0, finalizedInv.taxAmount);
            }
            return finalizedInv;
          },
          {
            idempotencyKey,
            actor: {
              id: 'subsys-invoicing',
              name: 'Sales Invoicing Subsystem',
              role: 'Automated Billing & Tax Worker',
            },
          }
        );

        if (txResult.success) {
          setInvoices(txResult.updatedInvoices);
          setJournalEntries(txResult.updatedJournalEntries);
          setAccounts(txResult.updatedAccounts);
          return finalizedInv;
        } else {
          alert(language === 'fa' ? txResult.error.reasonFa : txResult.error.reasonEn);
          throw new Error(txResult.error.reasonEn);
        }
      },
      {
        actionName: 'CREATE_INVOICE',
        extractKey: (inv) => `idemp-inv-${inv.id || inv.invNumber}`,
        extractEntityType: () => 'Invoice',
        extractEntityId: (inv) => inv.id || inv.invNumber,
        onReplayDetected: (rec) => {
          setIdempotencyToast({
            visible: true,
            key: rec.key,
            messageEn: `Idempotency Protected • Returned cached invoice for key "${rec.key}". Duplicate entry prevented.`,
            messageFa: `محافظت با کلید یکتایی (Idempotency) • فاکتور قبلی با کلید «${rec.key}» بازگردانده شد و از ثبت تکراری جلوگیری شد.`,
          });
          setTimeout(() => setIdempotencyToast(null), 4500);
        },
      }
    );

    return await middleware(newInv, explicitKey);
  };

  // Payment allocation inside atomic transaction (Settles invoice & creates Dr. Cash, Cr. AR)
  const handleAllocatePayment = async (
    invoice: Invoice,
    amountPaid: number,
    method: string
  ) => {
    const newAmountPaid = invoice.amountPaid + amountPaid;
    const newAmountDue = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus = newAmountDue <= 0 ? 'Paid' : 'Partially Paid';

    const nowTimestamp = Date.now();
    const randJvNum = Math.floor(1200 + Math.random() * 800);

    // Create Payment Journal Entry
    const jv: JournalEntry = {
      id: `jv-${nowTimestamp}`,
      jvRef: `#JV-1403-${randJvNum}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: 'Just now',
      descriptionEn: `Payment settlement for ${invoice.invNumber} via ${method}`,
      descriptionFa: `وصول وجه فاکتور شماره ${invoice.invNumber} از طریق ${method}`,
      sourceDocType: 'BankSync',
      sourceDocRef: invoice.invNumber,
      status: 'Posted',
      createdBy: 'Treasury Cashier Desk',
      signOff: 'Treasury Desk Officer',
      isAutoSync: false,
      auditBlock: `#${Math.floor(481230 + Math.random() * 500).toLocaleString()}`,
      lines: [
        {
          id: `l-cash-${nowTimestamp}`,
          accountCode: '1010',
          accountNameEn: '1010 Operating Cash & Bank Melli',
          accountNameFa: '۱۰۱۰ وجوه نقد و بانک ملی تجاری',
          debit: amountPaid,
          credit: 0,
          memoEn: 'Direct collection received',
          memoFa: 'واریز وجه به حساب جاری',
        },
        {
          id: `l-ar-relieve-${nowTimestamp}`,
          accountCode: '1200',
          accountNameEn: '1200 Trade Accounts Receivable',
          accountNameFa: '۱۲۰۰ حساب‌ها و اسناد دریافتنی تجاری',
          debit: 0,
          credit: amountPaid,
          memoEn: `Relieve AR for ${invoice.customerNameEn}`,
          memoFa: `کاهش حساب دریافتنی`,
        },
      ],
    };

    const txResult = await executeFinancialTransaction(
      'ALLOCATE_PAYMENT',
      { accounts, journalEntries, invoices },
      (ctx) => {
        ctx.stageInvoiceUpdate(invoice.id, (inv) => ({
          ...inv,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
        }));
        ctx.stageJournalEntry(jv);
        ctx.stageAccountUpdate('1010', amountPaid, 0);
        ctx.stageAccountUpdate('1200', 0, amountPaid);
        return { invoiceId: invoice.id, amountPaid, newAmountDue };
      },
      {
        idempotencyKey: `idemp-pay-${invoice.id}-${nowTimestamp}`,
        actor: {
          id: 'usr-treasury-1',
          name: 'Shayan Farhadi',
          role: 'Treasury Cashier Desk',
        },
      }
    );

    if (txResult.success) {
      setInvoices(txResult.updatedInvoices);
      setJournalEntries(txResult.updatedJournalEntries);
      setAccounts(txResult.updatedAccounts);
    } else {
      alert(language === 'fa' ? txResult.error.reasonFa : txResult.error.reasonEn);
    }
  };

  // Idempotent Journal Entry posting middleware with strict atomic transactional execution & invariant validation
  const handlePostJournalEntry = async (entry: JournalEntry, explicitKey?: string) => {
    const middleware = withFinancialIdempotency(
      async (e: JournalEntry, { idempotencyKey }) => {
        const txResult = await executeFinancialTransaction(
          'POST_JOURNAL_ENTRY',
          { accounts, journalEntries, invoices },
          (ctx) => {
            e.lines.forEach((line) => {
              ctx.stageAccountUpdate(line.accountCode, line.debit, line.credit);
            });
            ctx.stageJournalEntry(e);
            return e;
          },
          {
            idempotencyKey,
            actor: {
              id: 'usr-cfo-1',
              name: e.createdBy || 'Arash Kamali (CFO)',
              role: 'Chief Financial Officer',
            },
          }
        );

        if (txResult.success) {
          setAccounts(txResult.updatedAccounts);
          setJournalEntries(txResult.updatedJournalEntries);
          return e;
        } else {
          alert(language === 'fa' ? txResult.error.reasonFa : txResult.error.reasonEn);
          throw new Error(txResult.error.reasonEn);
        }
      },
      {
        actionName: 'POST_JOURNAL_ENTRY',
        extractKey: (e) => `idemp-jv-${e.id || e.jvRef}`,
        extractEntityType: () => 'JournalEntry',
        extractEntityId: (e) => e.id || e.jvRef,
        onReplayDetected: (rec) => {
          setIdempotencyToast({
            visible: true,
            key: rec.key,
            messageEn: `Idempotency Protected • Returned cached journal voucher for key "${rec.key}". Duplicate ledger entry prevented.`,
            messageFa: `محافظت با کلید یکتایی (Idempotency) • سند حسابداری با کلید «${rec.key}» قبلاً ثبت شده بود. از ثبت دوبل در دفاتر کل جلوگیری شد.`,
          });
          setTimeout(() => setIdempotencyToast(null), 4500);
        },
      }
    );

    return await middleware(entry, explicitKey);
  };

  // Handle Historical Opening Balances Data Migration
  const handleImportOpeningBalances = (entry: JournalEntry, updatedAccounts: Account[]) => {
    setAccounts(updatedAccounts);
    setJournalEntries((prev) => [entry, ...prev]);
  };

  // Handle Fiscal Year Closed event
  const handleFiscalYearClosed = (result: {
    closedPeriod: FiscalYearPeriod;
    nextPeriod: FiscalYearPeriod;
    closingJournalEntry: JournalEntry;
    openingJournalEntry: JournalEntry;
    updatedAccounts: Account[];
    updatedJournalEntries: JournalEntry[];
  }) => {
    setAccounts(result.updatedAccounts);
    setJournalEntries(result.updatedJournalEntries);
  };

  // 1-Click Governance Approval
  const handleApproveItem = (id: string) => {
    const target = approvals.find((a) => a.id === id);
    setApprovals((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'Approved' } : app))
    );

    if (target) {
      auditLogService.recordMutation({
        actor: {
          id: 'usr-board-1',
          name: 'Executive Governance Committee',
          role: 'Audit & Risk Board',
        },
        actionType: 'GOVERNANCE_APPROVED',
        entityType: 'GovernanceApproval',
        entityId: target.code,
        summaryEn: `Governance item ${target.code} (${target.titleEn}) approved by Board.`,
        summaryFa: `آیتم حاکمیتی شماره ${target.code} (${target.titleFa}) توسط هیئت‌مدیره تأیید شد.`,
        beforeState: { status: 'Pending' },
        afterState: { status: 'Approved' },
        severity: 'INFO',
      });
    }
  };

  // Bank reconciliation transaction match
  const handleReconcileTransaction = (bankId: string, txId: string) => {
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.id !== bankId) return b;
        const updatedTxs = b.transactions.map((tx) =>
          tx.id === txId ? { ...tx, status: 'Reconciled' as const } : tx
        );
        const remainingUnmatched = updatedTxs.filter(
          (tx) => tx.status !== 'Reconciled'
        ).length;
        return {
          ...b,
          unmatchedCount: remainingUnmatched,
          status: remainingUnmatched === 0 ? 'Reconciled' : 'Needs Review',
          transactions: updatedTxs,
        };
      })
    );

    auditLogService.recordMutation({
      actor: {
        id: 'usr-treasury-2',
        name: 'Automated Bank Reconciler',
        role: 'Treasury GL Sync',
      },
      actionType: 'BANK_RECONCILED',
      entityType: 'BankAccount',
      entityId: bankId,
      summaryEn: `Transaction ${txId} in bank account ${bankId} marked as Reconciled.`,
      summaryFa: `تراکنش ${txId} در حساب بانکی ${bankId} تطبیق و مغایرت‌گیری شد.`,
      beforeState: { txId, status: 'Unmatched' },
      afterState: { txId, status: 'Reconciled' },
      severity: 'INFO',
    });
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Pending').length;

  const isRtl = language === 'fa';

  // Render the active view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'command-center':
        return (
          <CommandCenter
            language={language}
            currency={currency}
            onSelectCurrency={(c) => setCurrency(c)}
            invoices={invoices}
            journalEntries={journalEntries}
            bankAccounts={bankAccounts}
            approvals={approvals}
            onOpenNewModal={(type) => {
              if (type === 'invoice') setCurrentView('sales-and-invoicing');
              else if (type === 'journal') setCurrentView('accounting-and-ledger');
              else setCurrentView('purchases-and-expenses');
            }}
            onOpenReconcile={() => setCurrentView('banking-and-treasury')}
            onOpenCopilotWithPrompt={(prompt) => {
              setCopilotPrompt(prompt);
              setIsCopilotOpen(true);
            }}
            onApproveItem={handleApproveItem}
            onAllocatePayment={(inv) => {
              setCurrentView('sales-and-invoicing');
            }}
            onNavigateTo={(v) => setCurrentView(v)}
          />
        );
      case 'sales-and-invoicing':
        return (
          <SalesInvoicingView
            language={language}
            invoices={invoices}
            customers={customers}
            onCreateInvoice={handleCreateInvoice}
            onAllocatePayment={handleAllocatePayment}
          />
        );
      case 'accounting-and-ledger':
        return (
          <AccountingLedgerView
            language={language}
            accounts={accounts}
            journalEntries={journalEntries}
            onPostJournalEntry={handlePostJournalEntry}
          />
        );
      case 'banking-and-treasury':
        return (
          <BankingTreasuryView
            language={language}
            bankAccounts={bankAccounts}
            onReconcileTransaction={handleReconcileTransaction}
          />
        );
      case 'inventory-and-valuation':
        return (
          <InventoryValuationView language={language} inventory={inventory} />
        );
      case 'financial-reports':
        return (
          <FinancialReportsView
            language={language}
            accounts={accounts}
            journalEntries={journalEntries}
            onFiscalYearClosed={handleFiscalYearClosed}
          />
        );
      case 'enterprise-controls':
        return (
          <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h2 className="text-[18px] font-bold text-slate-900">
                {language === 'fa' ? 'کارتابل کنترل‌های حاکمیتی و تأییدات مالی' : 'Enterprise Governance, Delegation of Authority & Approvals'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-1">
                {language === 'fa'
                  ? 'بررسی مجوزهای مخارج سرمایه‌ای (CapEx)، اعلامیه‌های بستانکاری و تعدیلات مالیاتی'
                  : 'Review multi-level authorizations, capital expenditure requisitions, and statutory adjustments.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {approvals.map((app) => (
                <div key={app.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded font-bold">
                        {app.code}
                      </span>
                      <span className="text-[14px] font-extrabold text-slate-900 tabular-nums">
                        ${app.amountUsd.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mt-2 text-[14px]">
                      {language === 'fa' ? app.titleFa : app.titleEn}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'fa' ? app.reasonFa : app.reasonEn}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">{app.timestamp}</span>
                    {app.status === 'Approved' ? (
                      <span className="text-emerald-700 font-bold text-[12px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Approved
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApproveItem(app.id)}
                        className="bg-[#0051d5] hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1 rounded"
                      >
                        Approve Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'ai-financial-assistant':
        return (
          <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs text-center space-y-3">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">neurology</span>
              </div>
              <h2 className="text-[20px] font-bold text-slate-900">
                {language === 'fa' ? 'دستیار هوش مالی هیمورا' : 'Himoora Intelligence Copilot'}
              </h2>
              <p className="text-[13px] text-slate-600 max-w-lg mx-auto">
                {language === 'fa'
                  ? 'سیستم تحلیل گر هوشمند مبتنی بر مدل Gemini با اتصال مستقیم به دفاتر کل جهت پاسخ به سوالات خزانه‌داری و انحرافات مالی'
                  : 'AI accounting advisor grounded in your real-time audited general ledger, bank feeds, and receivables aging.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="bg-[#0051d5] hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs text-[13px] inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Open Intelligence Drawer</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <CommandCenter
            language={language}
            currency={currency}
            onSelectCurrency={(c) => setCurrency(c)}
            invoices={invoices}
            journalEntries={journalEntries}
            bankAccounts={bankAccounts}
            approvals={approvals}
            onOpenNewModal={(type) => {
              if (type === 'invoice') setCurrentView('sales-and-invoicing');
              else if (type === 'journal') setCurrentView('accounting-and-ledger');
            }}
            onOpenReconcile={() => setCurrentView('banking-and-treasury')}
            onOpenCopilotWithPrompt={(prompt) => {
              setCopilotPrompt(prompt);
              setIsCopilotOpen(true);
            }}
            onApproveItem={handleApproveItem}
            onAllocatePayment={() => setCurrentView('sales-and-invoicing')}
            onNavigateTo={(v) => setCurrentView(v)}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#F8FAFC] text-slate-800 ${
        language === 'fa' ? 'font-farsi' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <Header
        language={language}
        onToggleLanguage={handleLanguageChange}
        currency={currency}
        onSelectCurrency={(c) => setCurrency(c)}
        activePlan={activePlan}
        onSelectPlan={(p) => setActivePlan(p)}
        onOpenNewModal={(type) => {
          if (type === 'invoice') setCurrentView('sales-and-invoicing');
          else if (type === 'journal') setCurrentView('accounting-and-ledger');
          else setCurrentView('purchases-and-expenses');
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        pendingApprovalsCount={pendingApprovalsCount}
        onNavigateTo={(v) => setCurrentView(v)}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
      />

      {/* Idempotency Protection Feedback Banner */}
      {idempotencyToast && idempotencyToast.visible && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-3 text-[13px] animate-in slide-in-from-top duration-200">
          <span className="material-symbols-outlined text-blue-400 text-[22px]">verified_user</span>
          <div>
            <div className="font-bold text-white text-[13px]">
              {language === 'fa' ? 'سپر محافظت یکتایی هیمورا (Idempotency Engine)' : 'Himoora Idempotency Engine Active'}
            </div>
            <div className="text-[12px] text-slate-300">
              {language === 'fa' ? idempotencyToast.messageFa : idempotencyToast.messageEn}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIdempotencyToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main Layout Body */}
      <div className="flex pt-16">
        {/* Desktop Navigation Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            currentView={currentView}
            onNavigate={(v) => setCurrentView(v)}
            language={language}
            activePlan={activePlan}
            pendingApprovalsCount={pendingApprovalsCount}
          />
        </div>

        {/* Center Main Work Content */}
        <main className={`flex-1 min-w-0 pb-20 lg:pb-8 ${isRtl ? 'lg:mr-64' : 'lg:ml-64'}`}>
          {renderCurrentView()}
        </main>

        {/* Bottom Bar on Small Screens */}
        <div className="lg:hidden">
          <MobileNav
            currentView={currentView}
            onNavigate={(v) => setCurrentView(v)}
            language={language}
            onOpenNewModal={() => setCurrentView('sales-and-invoicing')}
          />
        </div>
      </div>

      {/* Global Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        language={language}
        accounts={accounts}
        invoices={invoices}
        customers={customers}
        journalEntries={journalEntries}
        onSelectResult={(view) => setCurrentView(view)}
      />

      {/* AI Copilot Drawer */}
      <HimooraIntelligenceDrawer
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setCopilotPrompt('');
        }}
        language={language}
        initialPrompt={copilotPrompt}
      />

      {/* Plan Tier Comparison Modal */}
      <PlanComparisonModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        activePlan={activePlan}
        onSelectPlan={(p) => setActivePlan(p)}
        language={language}
      />

      {/* Company Setup Wizard & Data Migration Modal */}
      <CompanySetupWizardModal
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        language={language}
        accounts={accounts}
        onImportOpeningBalances={handleImportOpeningBalances}
      />
    </div>
  );
}
