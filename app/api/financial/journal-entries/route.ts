import { NextRequest, NextResponse } from 'next/server';
import { withIdempotency } from '@/lib/idempotency';
import { validateLedgerInvariants } from '@/lib/ledger-invariants';
import { auditLogService } from '@/lib/audit-log';
import { JournalEntry } from '@/lib/accounting-engine';

export const POST = withIdempotency(
  async (req: NextRequest) => {
    const body = await req.json();
    const {
      date,
      descriptionEn,
      descriptionFa,
      lines,
      createdBy,
      signOff,
      sourceDocType = 'Manual',
      sourceDocRef,
    } = body;

    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'At least two journal lines (debit & credit) are required.',
          messageFa: 'حداقل دو ردیف سند حسابداری (بدهکار و بستانکار) الزامی است.',
        },
        { status: 400 }
      );
    }

    const jvRef = `#JV-1403-${Math.floor(1300 + Math.random() * 700)}`;
    const jv: JournalEntry = {
      id: `jv-${Date.now()}`,
      jvRef,
      date: date || new Date().toISOString().split('T')[0],
      timestamp: 'Just now',
      descriptionEn: descriptionEn || 'Manual Journal Voucher',
      descriptionFa: descriptionFa || 'سند حسابداری دستی',
      sourceDocType,
      sourceDocRef,
      status: 'Posted',
      createdBy: createdBy || 'API Financial Controller',
      signOff: signOff || 'CFO Sign-off',
      auditBlock: `#${Math.floor(482000 + Math.random() * 1000).toLocaleString()}`,
      lines: lines.map((l: any, idx: number) => ({
        id: l.id || `l-${idx}-${Date.now()}`,
        accountCode: l.accountCode,
        accountNameEn: l.accountNameEn || l.accountCode,
        accountNameFa: l.accountNameFa || l.accountCode,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        memoEn: l.memoEn || '',
        memoFa: l.memoFa || '',
        costCenter: l.costCenter,
        project: l.project,
      })),
    };

    const validation = validateLedgerInvariants(jv);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'INVARIANT_VIOLATION',
          message: validation.messageEn,
          messageFa: validation.messageFa,
          violations: validation.errors,
          imbalanceAmount: validation.imbalanceAmount,
        },
        { status: 422 }
      );
    }

    // Record audit mutation
    auditLogService.recordMutation({
      actor: {
        id: 'api-journal-controller',
        name: createdBy || 'Financial API Service',
        role: 'GL Controller',
      },
      actionType: 'JOURNAL_POSTED',
      entityType: 'JournalEntry',
      entityId: jvRef,
      summaryEn: `Journal entry ${jvRef} posted. Debit: $${validation.totalDebit.toFixed(2)}, Credit: $${validation.totalCredit.toFixed(2)}.`,
      summaryFa: `سند حسابداری شماره ${jvRef} ثبت گردید. گردش: ${validation.totalDebit.toLocaleString()} دلار.`,
      afterState: {
        id: jv.id,
        jvRef,
        totalDebit: validation.totalDebit,
        linesCount: jv.lines.length,
      },
      invariantsChecked: ['INV-01', 'INV-02', 'INV-03', 'INV-04', 'INV-05', 'INV-06', 'INV-10', 'INV-11', 'INV-12'],
      severity: 'AUDIT_CRITICAL',
    });

    return NextResponse.json(
      {
        success: true,
        journalEntry: jv,
        invariantsPassed: validation.checks.map((c) => c.code),
        turnover: validation.totalDebit,
      },
      { status: 201 }
    );
  },
  {
    requireKey: true,
    ttlSeconds: 86400,
    extractEntityType: () => 'JournalEntry',
    extractEntityId: (body, res) => res?.journalEntry?.jvRef || body?.jvRef,
  }
);
