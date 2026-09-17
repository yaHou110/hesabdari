import { NextRequest, NextResponse } from 'next/server';
import { withIdempotency } from '@/lib/idempotency';
import { fiscalYearClosingService } from '@/lib/fiscal-year-closing';
import { INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES } from '@/lib/accounting-engine';

export const POST = withIdempotency(
  async (req: NextRequest) => {
    const body = await req.json();
    const {
      periodId = 'FY-1403',
      nextPeriodId = 'FY-1404',
      closedBy = 'Arash Kamali (CFO)',
      signOff = 'A. Kamali (Chief Financial Officer)',
      accounts = INITIAL_ACCOUNTS,
      journalEntries = INITIAL_JOURNAL_ENTRIES,
    } = body;

    try {
      const result = fiscalYearClosingService.executeFiscalYearClosing({
        periodId,
        nextPeriodId,
        accounts,
        journalEntries,
        closedBy,
        signOff,
      });

      return NextResponse.json(
        {
          success: true,
          closedPeriod: result.closedPeriod,
          nextPeriod: result.nextPeriod,
          closingVoucherRef: result.closingJournalEntry.jvRef,
          openingVoucherRef: result.openingJournalEntry.jvRef,
          netIncomeTransferred: result.closedPeriod.closingDetails?.netIncomeTransferred,
          retainedEarningsAfter: result.closedPeriod.closingDetails?.retainedEarningsAfter,
          closingJournalEntry: result.closingJournalEntry,
          openingJournalEntry: result.openingJournalEntry,
        },
        { status: 200 }
      );
    } catch (err: any) {
      return NextResponse.json(
        {
          error: 'CLOSING_FAILED',
          message: err.message,
          messageFa: 'عملیات بستن سال مالی با خطا مواجه شد.',
        },
        { status: 422 }
      );
    }
  },
  {
    requireKey: true,
    ttlSeconds: 86400,
    extractEntityType: () => 'FiscalPeriod',
    extractEntityId: (body, res) => res?.closedPeriod?.id || body?.periodId,
  }
);
