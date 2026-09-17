'use client';

import React, { useState } from 'react';
import { Language } from '@/lib/localization';
import { Account, JournalEntry, formatMoney } from '@/lib/accounting-engine';
import {
  fiscalYearClosingService,
  FiscalYearPeriod,
  FiscalYearClosingSimulation,
} from '@/lib/fiscal-year-closing';
import { idempotencyEngine, executeIdempotentMutation } from '@/lib/idempotency';

interface FinancialReportsViewProps {
  language: Language;
  accounts: Account[];
  journalEntries?: JournalEntry[];
  onFiscalYearClosed?: (result: {
    closedPeriod: FiscalYearPeriod;
    nextPeriod: FiscalYearPeriod;
    closingJournalEntry: JournalEntry;
    openingJournalEntry: JournalEntry;
    updatedAccounts: Account[];
    updatedJournalEntries: JournalEntry[];
  }) => void;
}

export default function FinancialReportsView({
  language,
  accounts,
  journalEntries = [],
  onFiscalYearClosed,
}: FinancialReportsViewProps) {
  const [reportType, setReportType] = useState<
    'pnl' | 'balanceSheet' | 'trialBalance' | 'fiscalClosing'
  >('pnl');

  const [periods, setPeriods] = useState<FiscalYearPeriod[]>(() =>
    fiscalYearClosingService.getPeriods()
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('FY-1403');
  const [signOffName, setSignOffName] = useState<string>('Arash Kamali (CFO)');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState<boolean>(false);
  const [closingSimulation, setClosingSimulation] = useState<FiscalYearClosingSimulation | null>(
    null
  );
  const [idempotencyKeyInput, setIdempotencyKeyInput] = useState<string>(() =>
    idempotencyEngine.generateKey('idemp-fy1403-close')
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionFeedback, setExecutionFeedback] = useState<{
    type: 'success' | 'replay' | 'error';
    message: string;
    details?: any;
  } | null>(null);

  const revenueAccounts = accounts.filter((a) => a.type === 'Revenue');
  const expenseAccounts = accounts.filter((a) => a.type === 'Expense');
  const assetAccounts = accounts.filter((a) => a.type === 'Asset');
  const liabilityAccounts = accounts.filter((a) => a.type === 'Liability');
  const equityAccounts = accounts.filter((a) => a.type === 'Equity');

  const totalRevenue = revenueAccounts.reduce((acc, a) => acc + a.balanceUsd, 0);
  const totalExpenses = expenseAccounts.reduce((acc, a) => acc + a.balanceUsd, 0);
  const netIncome = totalRevenue - totalExpenses;

  const totalAssets = assetAccounts.reduce((acc, a) => acc + a.balanceUsd, 0);
  const totalLiabilities = liabilityAccounts.reduce((acc, a) => acc + a.balanceUsd, 0);
  const totalEquity = equityAccounts.reduce((acc, a) => acc + a.balanceUsd, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenClosingWizard = (periodId: string) => {
    setSelectedPeriodId(periodId);
    const sim = fiscalYearClosingService.simulateClosing(periodId, accounts, journalEntries);
    setClosingSimulation(sim);
    setIdempotencyKeyInput(idempotencyEngine.generateKey(`idemp-${periodId.toLowerCase()}-close`));
    setExecutionFeedback(null);
    setIsClosingModalOpen(true);
  };

  const handleExecuteFiscalClosing = async () => {
    if (!closingSimulation) return;
    setIsExecuting(true);
    setExecutionFeedback(null);

    try {
      // Execute with Idempotency Key protection
      const nextPeriodId = selectedPeriodId === 'FY-1403' ? 'FY-1404' : `FY-${Date.now()}`;
      
      const res = await executeIdempotentMutation(
        'fiscal-closing',
        {
          periodId: selectedPeriodId,
          nextPeriodId,
          accountsCount: accounts.length,
          totalRevenue: closingSimulation.totalRevenueUsd,
          totalExpense: closingSimulation.totalExpenseUsd,
          netIncome: closingSimulation.netIncomeUsd,
        },
        async (key) => {
          return fiscalYearClosingService.executeFiscalYearClosing({
            periodId: selectedPeriodId,
            nextPeriodId,
            accounts,
            journalEntries,
            closedBy: signOffName,
            signOff: signOffName,
            idempotencyKey: key,
          });
        },
        idempotencyKeyInput
      );

      setPeriods(fiscalYearClosingService.getPeriods());

      if (res.isReplay) {
        setExecutionFeedback({
          type: 'replay',
          message:
            language === 'fa'
              ? `[پاسخ کش‌شده Idempotency] این درخواست با کلید '${res.idempotencyKey}' قبلاً پردازش شده است. عملیات تکراری مسدود و وضعیت تثبیت‌شده بازگردانده شد.`
              : `[Idempotency Replay Cache] Request with key '${res.idempotencyKey}' was already processed. Duplicate mutation prevented and cached state returned.`,
          details: res.data,
        });
      } else {
        setExecutionFeedback({
          type: 'success',
          message:
            language === 'fa'
              ? `سال مالی ${selectedPeriodId} با موفقیت بسته شد. سود خالص به حساب سود انباشته منتقل و سند اختتامیه و افتتاحیه ثبت گردید.`
              : `Fiscal Period ${selectedPeriodId} successfully closed! Net income transferred to Retained Earnings and closing/opening vouchers generated.`,
          details: res.data,
        });

        if (onFiscalYearClosed && res.data) {
          onFiscalYearClosed(res.data);
        }
      }
    } catch (err: any) {
      setExecutionFeedback({
        type: 'error',
        message: err.message || 'Fiscal year closing failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[24px]">analytics</span>
            <h1 className="text-[20px] font-bold text-slate-900">
              {language === 'fa' ? 'صورت‌های مالی و بستن سال مالی' : 'Statutory Financial Reports & Period Closing'}
            </h1>
          </div>
          <p className="text-[12px] text-slate-500 mt-1">
            {language === 'fa'
              ? 'صورت سود و زیان جامع، ترازنامه، تراز آزمایشی چهارستونی و سرویس بستن دوره‌ها و انتقال به سود انباشته'
              : 'Statement of Profit or Loss, Balance Sheet, Trial Balance, and Fiscal Year Closing Service with Retained Earnings Transfer.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 pt-3 rounded-t-xl no-print overflow-x-auto">
        <button
          type="button"
          onClick={() => setReportType('pnl')}
          className={`pb-3 px-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
            reportType === 'pnl'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'fa' ? 'صورت سود و زیان (P&L)' : 'Profit & Loss Statement (P&L)'}
        </button>
        <button
          type="button"
          onClick={() => setReportType('balanceSheet')}
          className={`pb-3 px-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
            reportType === 'balanceSheet'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'fa' ? 'ترازنامه (Balance Sheet)' : 'Balance Sheet (ترازنامه)'}
        </button>
        <button
          type="button"
          onClick={() => setReportType('trialBalance')}
          className={`pb-3 px-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
            reportType === 'trialBalance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'fa' ? 'تراز آزمایشی (Trial Balance)' : 'Trial Balance (تراز آزمایشی)'}
        </button>
        <button
          type="button"
          onClick={() => setReportType('fiscalClosing')}
          className={`pb-3 px-3 text-[13px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            reportType === 'fiscalClosing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">lock_clock</span>
          <span>{language === 'fa' ? 'مدیریت و بستن سال مالی (Fiscal Closing)' : 'Fiscal Year Closing & Periods'}</span>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border border-indigo-200">
            Engine
          </span>
        </button>
      </div>

      {/* REPORT CONTENT: PROFIT & LOSS */}
      {reportType === 'pnl' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs max-w-4xl mx-auto w-full">
          <div className="text-center pb-6 border-b border-slate-200">
            <h2 className="text-[18px] font-extrabold text-slate-900">Himoora Trading Co. (LLC)</h2>
            <p className="text-[14px] font-bold text-slate-700 mt-1">
              {language === 'fa' ? 'صورت سود و زیان منتهی به دوره سال مالی ۱۴۰۳' : 'Statement of Profit or Loss (YTD FY-2024)'}
            </p>
            <span className="text-[11px] text-slate-400">All amounts in USD (Dual Base: 1 USD = 585,000 IRR)</span>
          </div>

          <div className="mt-6 space-y-6">
            {/* Operating Revenue */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-[14px] pb-2 border-b border-slate-200">
                <span>OPERATING REVENUES (درآمدهای عملیاتی)</span>
                <span className="tabular-nums">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {revenueAccounts.map((r) => (
                  <div key={r.code} className="flex justify-between py-2 text-[13px] text-slate-700 pl-4">
                    <span>
                      {r.code} - {r.nameEn} ({r.nameFa})
                    </span>
                    <span className="font-mono tabular-nums">${r.balanceUsd.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-[14px] pb-2 border-b border-slate-200">
                <span>COST OF SALES & OPERATING EXPENSES (بهای تمام‌شده و هزینه‌ها)</span>
                <span className="tabular-nums text-red-600">
                  (${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {expenseAccounts.map((e) => (
                  <div key={e.code} className="flex justify-between py-2 text-[13px] text-slate-700 pl-4">
                    <span>
                      {e.code} - {e.nameEn} ({e.nameFa})
                    </span>
                    <span className="font-mono tabular-nums">${e.balanceUsd.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Income Summary */}
            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-[16px] font-extrabold text-slate-900">
              <span>NET COMPREHENSIVE INCOME (سود خالص دوره مالی)</span>
              <span className="text-emerald-700 tabular-nums font-mono">
                ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: BALANCE SHEET */}
      {reportType === 'balanceSheet' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs max-w-4xl mx-auto w-full">
          <div className="text-center pb-6 border-b border-slate-200">
            <h2 className="text-[18px] font-extrabold text-slate-900">Himoora Trading Co. (LLC)</h2>
            <p className="text-[14px] font-bold text-slate-700 mt-1">
              {language === 'fa' ? 'ترازنامه منتهی به دوره جاری' : 'Consolidated Balance Sheet'}
            </p>
            <span className="text-[11px] text-slate-400">Assets = Liabilities + Shareholders Equity</span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ASSETS */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-[14px] pb-2 border-b border-slate-900">
                <span>TOTAL ASSETS (مجموع دارایی‌ها)</span>
                <span className="tabular-nums">${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {assetAccounts.map((a) => (
                  <div key={a.code} className="flex justify-between py-2 text-[12px] text-slate-700">
                    <span>
                      {a.code} - {a.nameEn}
                    </span>
                    <span className="font-mono tabular-nums">${a.balanceUsd.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-[14px] pb-2 border-b border-slate-900">
                <span>TOTAL LIABILITIES & EQUITY (بدهی‌ها و حقوق صاحبان سهام)</span>
                <span className="tabular-nums">
                  ${(totalLiabilities + totalEquity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                <div className="font-semibold text-slate-800 text-[12px] pt-1">Liabilities (بدهی‌های جاری):</div>
                {liabilityAccounts.map((l) => (
                  <div key={l.code} className="flex justify-between py-1.5 text-[12px] text-slate-700 pl-3">
                    <span>
                      {l.code} - {l.nameEn}
                    </span>
                    <span className="font-mono tabular-nums">${l.balanceUsd.toLocaleString()}</span>
                  </div>
                ))}

                <div className="font-semibold text-slate-800 text-[12px] pt-2">Shareholders Equity (حقوق سهامداران):</div>
                {equityAccounts.map((eq) => (
                  <div key={eq.code} className="flex justify-between py-1.5 text-[12px] text-slate-700 pl-3">
                    <span>
                      {eq.code} - {eq.nameEn}
                    </span>
                    <span className="font-mono tabular-nums">${eq.balanceUsd.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: TRIAL BALANCE */}
      {reportType === 'trialBalance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-[13px]">
              {language === 'fa' ? 'تراز آزمایشی چهارستونی منتهی به دوره جاری' : 'Four-Column Working Trial Balance'}
            </span>
            <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Reconciled: Total Debit = Total Credit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Account Title</th>
                  <th className="py-2.5 px-4 text-right">Debit Balance ($)</th>
                  <th className="py-2.5 px-4 text-right">Credit Balance ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const isDebitNormal = acc.type === 'Asset' || acc.type === 'Expense';
                  return (
                    <tr key={acc.code} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{acc.code}</td>
                      <td className="py-2.5 px-4 text-slate-900">{acc.nameEn} ({acc.nameFa})</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {isDebitNormal ? `$${acc.balanceUsd.toLocaleString()}` : '--'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {!isDebitNormal ? `$${acc.balanceUsd.toLocaleString()}` : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FISCAL YEAR CLOSING SERVICE & PERIOD MANAGEMENT */}
      {reportType === 'fiscalClosing' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[24px]">lock_clock</span>
                <h2 className="text-[17px] font-bold">
                  {language === 'fa' ? 'سرویس جامع بستن سال مالی (FiscalYearClosing Service)' : 'FiscalYearClosing Service & Governance Engine'}
                </h2>
              </div>
              <p className="text-[12px] text-slate-300 max-w-3xl">
                {language === 'fa'
                  ? 'محاسبه مکانیزه سود/زیان خالص دوره، صفر کردن حساب‌های موقت درآمد و هزینه، انتقال قطعی به سرفصل سود و زیان انباشته (۳۰۵۰)، صدور سند افتتاحیه سال جدید و قفل رمزنگاری‌شده تغییرناپذیر سال قبل.'
                  : 'Automated income summary calculation, clearing temporary nominal revenue/expense accounts, transferring Net Income to Retained Earnings (Acc 3050), generating opening vouchers, and hard-locking prior fiscal periods against retroactive modifications.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenClosingWizard('FY-1403')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>{language === 'fa' ? 'بستن سال مالی ۱۴۰۳ (Year-End Wizard)' : 'Close Fiscal Year 1403'}</span>
              </button>
            </div>
          </div>

          {/* Periods Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-[18px]">calendar_month</span>
                <span className="font-bold text-slate-800 text-[13px]">
                  {language === 'fa' ? 'جدول دوره‌های مالی و وضعیت قفل حسابداری' : 'Fiscal Periods Registry & Locking State'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Active Year: FY-1403
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Period Code</th>
                    <th className="py-3 px-4">Title / Range</th>
                    <th className="py-3 px-4">Status & Lock</th>
                    <th className="py-3 px-4 text-right">Net Income Transferred</th>
                    <th className="py-3 px-4">Closing Voucher</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periods.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.id}
                        {p.isCurrent && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{language === 'fa' ? p.titleFa : p.titleEn}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {p.startDate} ~ {p.endDate}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.isLocked ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 text-[11px] px-2.5 py-1 rounded-md font-semibold">
                            <span className="material-symbols-outlined text-[14px]">lock</span>
                            <span>HARD_LOCKED (قفل تغییرناپذیر)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] px-2.5 py-1 rounded-md font-semibold">
                            <span className="material-symbols-outlined text-[14px]">lock_open</span>
                            <span>OPEN (دوره باز فعال)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {p.closingDetails ? (
                          <span className="text-emerald-700">
                            +${p.closingDetails.netIncomeTransferred.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[12px]">
                        {p.closingDetails?.closingJvRef ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {p.closingDetails.closingJvRef}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!p.isLocked ? (
                          <button
                            type="button"
                            onClick={() => handleOpenClosingWizard(p.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold px-3 py-1 rounded-lg transition-colors"
                          >
                            {language === 'fa' ? 'شروع بستن سال' : 'Close Period'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational Closing Architecture Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-[13px]">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>1. Pre-Closing Audit</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {language === 'fa'
                  ? 'بررسی اسناد موقت، تراز آزمایشی و احراز کامل ۱۴ اصل حسابداری دفتر کل.'
                  : 'Verifies zero unposted drafts, perfect trial balance parity, and 14 ledger invariant compliance.'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-[13px]">
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                <span>2. Income Calculation</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {language === 'fa'
                  ? 'تفکیک حساب‌های موقت درآمد (۴xxx) و هزینه (۵xxx, ۶xxx) و تعیین سود/زیان خالص.'
                  : 'Aggregates nominal revenue (4xxx) & expense (5xxx/6xxx) accounts to determine Net Income.'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-[13px]">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>3. Retained Earnings (3050)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {language === 'fa'
                  ? 'انتقال سود خالص به سرفصل سود انباشته و صفر کردن کامل مانده حساب‌های موقت.'
                  : 'Transfers Net Profit/Loss to Equity Account 3050 and clears nominal accounts to zero.'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-[13px]">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>4. Immutable Hard-Lock</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {language === 'fa'
                  ? 'قفل تغییرناپذیر دوره مالی و جلوگیری قطعی از ثبت‌های اصلاحی غیرمجاز طبق اصل INV-08.'
                  : 'Hard-locks previous period and prevents unauthorized retroactive postings per INV-08.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FISCAL YEAR CLOSING MODAL WIZARD */}
      {isClosingModalOpen && closingSimulation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-400 text-[26px]">lock_clock</span>
                <div>
                  <h3 className="font-bold text-[16px]">
                    {language === 'fa' ? `بستن سال مالی ${closingSimulation.periodId}` : `Fiscal Year Closing Wizard (${closingSimulation.periodId})`}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {language === 'fa' ? closingSimulation.periodNameFa : closingSimulation.periodNameEn}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Pre-Check Status */}
              <div
                className={`p-4 rounded-xl border ${
                  closingSimulation.preCheck.canProceed
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-[13px] mb-1">
                  <span className="material-symbols-outlined text-[18px]">
                    {closingSimulation.preCheck.canProceed ? 'check_circle' : 'error'}
                  </span>
                  <span>
                    {closingSimulation.preCheck.canProceed
                      ? (language === 'fa' ? 'پیش‌شرط‌های بستن سال مالی با موفقیت احراز شد' : 'Pre-Closing Audit Passed: Ready to Lock Period')
                      : (language === 'fa' ? 'موانع بستن سال مالی مشاهده شد' : 'Pre-Closing Violations Found')}
                  </span>
                </div>
                <div className="text-[11px] space-y-1 mt-2">
                  <div>
                    • <strong>Posted Journal Entries:</strong> {closingSimulation.preCheck.summary.totalPostedEntries}
                  </div>
                  <div>
                    • <strong>Unposted Drafts:</strong> {closingSimulation.preCheck.summary.totalDraftEntries} (Must be 0)
                  </div>
                  <div>
                    • <strong>Revenue Accounts to Clear:</strong> {closingSimulation.revenueAccountsToZero.length} (${closingSimulation.totalRevenueUsd.toLocaleString()})
                  </div>
                  <div>
                    • <strong>Expense Accounts to Clear:</strong> {closingSimulation.expenseAccountsToZero.length} (${closingSimulation.totalExpenseUsd.toLocaleString()})
                  </div>
                </div>
              </div>

              {/* Net Income Calculation Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-[13px] flex items-center justify-between">
                  <span>Net Comprehensive Income (سود خالص دوره مالی):</span>
                  <span className="text-[16px] font-mono text-emerald-700">
                    ${closingSimulation.netIncomeUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px] pt-2 border-t border-slate-200">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Total Revenues Debited to $0:</span>
                    <span className="font-bold font-mono text-slate-900">
                      ${closingSimulation.totalRevenueUsd.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Total Expenses Credited to $0:</span>
                    <span className="font-bold font-mono text-slate-900">
                      ${closingSimulation.totalExpenseUsd.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Retained Earnings Delta */}
                <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-200 text-[12px] space-y-1">
                  <div className="font-bold text-indigo-900">
                    Equity Impact: Retained Earnings (Account 3050 - سود و زیان انباشته)
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-indigo-800">
                    <span>Balance Before: ${closingSimulation.retainedEarningsAccount.beforeBalance.toLocaleString()}</span>
                    <span>Transfer: +${closingSimulation.retainedEarningsAccount.transferAmount.toLocaleString()}</span>
                    <span className="font-bold">New Balance: ${closingSimulation.retainedEarningsAccount.afterBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Generated Closing Voucher Preview */}
              <div>
                <div className="font-bold text-slate-900 text-[13px] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">receipt_long</span>
                  <span>
                    {language === 'fa' ? 'پیش‌نمایش سند اختتامیه دفتر کل' : `Generated Closing Voucher (${closingSimulation.closingJournalEntryDraft.jvRef})`}
                  </span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0">
                      <tr>
                        <th className="py-1.5 px-3">Account</th>
                        <th className="py-1.5 px-3 text-right">Debit ($)</th>
                        <th className="py-1.5 px-3 text-right">Credit ($)</th>
                        <th className="py-1.5 px-3">Memo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {closingSimulation.closingJournalEntryDraft.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-semibold text-slate-800">{l.accountNameEn}</td>
                          <td className="py-1.5 px-3 text-right text-blue-700">{l.debit > 0 ? `$${l.debit.toLocaleString()}` : '--'}</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{l.credit > 0 ? `$${l.credit.toLocaleString()}` : '--'}</td>
                          <td className="py-1.5 px-3 text-slate-500 font-sans text-[10px]">{language === 'fa' ? l.memoFa : l.memoEn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Idempotency Key & Governance Sign-off */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'fa' ? 'کلید یکتایی تراکنش (Idempotency-Key):' : 'Mutation Idempotency Key:'}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={idempotencyKeyInput}
                      onChange={(e) => setIdempotencyKeyInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-mono bg-slate-50 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setIdempotencyKeyInput(idempotencyEngine.generateKey('idemp-fy1403'))}
                      title="Generate new UUID key"
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Guarantees exact-once execution and prevents double-closing.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'fa' ? 'امضای حاکمیتی و تأییدکننده:' : 'Authorized Sign-off Officer:'}
                  </label>
                  <input
                    type="text"
                    value={signOffName}
                    onChange={(e) => setSignOffName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[12px] text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">
                    Recorded in cryptographic audit trail for statutory compliance.
                  </span>
                </div>
              </div>

              {/* Execution Feedback */}
              {executionFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-[12px] ${
                    executionFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : executionFeedback.type === 'replay'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span className="material-symbols-outlined text-[18px]">
                      {executionFeedback.type === 'success'
                        ? 'check_circle'
                        : executionFeedback.type === 'replay'
                        ? 'history'
                        : 'error'}
                    </span>
                    <span>
                      {executionFeedback.type === 'success'
                        ? 'Closing Executed & Locked'
                        : executionFeedback.type === 'replay'
                        ? 'Idempotency Cache Replay'
                        : 'Execution Error'}
                    </span>
                  </div>
                  <p className="text-[11px]">{executionFeedback.message}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 text-[12px] font-semibold"
              >
                {language === 'fa' ? 'انصراف' : 'Close Wizard'}
              </button>

              <button
                type="button"
                onClick={handleExecuteFiscalClosing}
                disabled={isExecuting || !closingSimulation.preCheck.canProceed}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>
                  {isExecuting
                    ? (language === 'fa' ? 'در حال بستن و قفل سال...' : 'Closing & Locking...')
                    : (language === 'fa' ? 'تأیید نهایی، انتقال به انباشته و قفل سال مالی' : 'Execute Year-End Closing & Hard-Lock')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
