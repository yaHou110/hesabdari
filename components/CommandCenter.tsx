'use client';

import React, { useState } from 'react';
import { Language, DICTIONARY } from '@/lib/localization';
import {
  Invoice,
  JournalEntry,
  BankAccount,
  GovernanceApproval,
  Currency,
  CURRENCIES,
  formatMoney,
  FX_CONFIG,
} from '@/lib/accounting-engine';

interface CommandCenterProps {
  language: Language;
  currency?: Currency;
  onSelectCurrency?: (currency: Currency) => void;
  invoices: Invoice[];
  journalEntries: JournalEntry[];
  bankAccounts: BankAccount[];
  approvals: GovernanceApproval[];
  onOpenNewModal: (type: 'invoice' | 'expense' | 'journal') => void;
  onOpenReconcile: () => void;
  onOpenCopilotWithPrompt: (prompt: string) => void;
  onApproveItem: (id: string) => void;
  onAllocatePayment: (invoice: Invoice) => void;
  onNavigateTo: (view: string) => void;
}

export default function CommandCenter({
  language,
  currency,
  onSelectCurrency,
  invoices,
  journalEntries,
  bankAccounts,
  approvals,
  onOpenNewModal,
  onOpenReconcile,
  onOpenCopilotWithPrompt,
  onApproveItem,
  onAllocatePayment,
  onNavigateTo,
}: CommandCenterProps) {
  const t = DICTIONARY[language];
  const isRtl = language === 'fa';
  
  // Default to IRR (Rial) when in Persian mode, USD when in English mode, or respect incoming prop
  const [internalCurrency, setInternalCurrency] = useState<Currency>(
    currency || (language === 'fa' ? 'IRR' : 'USD')
  );
  
  const activeCurrency = currency || internalCurrency;
  const setActiveCurrency = onSelectCurrency || setInternalCurrency;

  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Quick Action Handler with visual feedback toast
  const handleActionToast = (messageEn: string, messageFa: string) => {
    setNotificationBanner(language === 'fa' ? messageFa : messageEn);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  return (
    <div className="flex flex-col w-full font-sans text-slate-800">
      {/* Toast Notification Alert */}
      {notificationBanner && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-[13px] animate-in slide-in-from-top duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* Top Executive Context Bar */}
      <section className="w-full bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-[1560px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Breadcrumb & Context Flag */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[12px]">
              <span className="hover:text-slate-800 cursor-pointer">{t.commandCenter}</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-slate-800 font-semibold">{t.consolidated}</span>
              <span className="mx-1 text-slate-300">•</span>
              <span className="text-slate-500">{language === 'fa' ? 'Himoora Sovereign Ledger' : 'مرکز فرماندهی مالی تلفیقی'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-tight">
                {language === 'fa' ? 'دفتر کل مستقل هیمورا (ترازحساب)' : 'Himoora Sovereign Ledger'}
              </h1>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg text-slate-600 text-[12px]">
                <span className="material-symbols-outlined text-[15px] text-blue-600">calendar_today</span>
                <span>
                  {t.fiscalPeriod}: <strong>Q3 FY-2024</strong> (Oct 1 – Dec 31)
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">{language === 'fa' ? 'ارز گزارشگری:' : 'Currency:'}</span>
                  <select
                    value={activeCurrency}
                    onChange={(e) => setActiveCurrency(e.target.value as Currency)}
                    className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="IRR">{language === 'fa' ? '🇮🇷 ریال ایران (IRR - پیش‌فرض)' : '🇮🇷 Iranian Rial (IRR)'}</option>
                    <option value="TOMAN">{language === 'fa' ? '🇮🇷 تومان (TOMAN)' : '🇮🇷 Toman (TOMAN)'}</option>
                    <option value="USD">{language === 'fa' ? '🇺🇸 دلار آمریکا (USD)' : '🇺🇸 US Dollar (USD)'}</option>
                    <option value="EUR">{language === 'fa' ? '🇪🇺 یورو (EUR)' : '🇪🇺 Euro (EUR)'}</option>
                    <option value="AED">{language === 'fa' ? '🇦🇪 درهم امارات (AED)' : '🇦🇪 UAE Dirham (AED)'}</option>
                    <option value="GBP">{language === 'fa' ? '🇬🇧 پوند بریتانیا (GBP)' : '🇬🇧 British Pound (GBP)'}</option>
                  </select>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-blue-600 font-medium">{t.rateNotice}</span>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1.5 border border-blue-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                {t.liveStreamActive}
              </span>
            </div>
          </div>

          {/* Quick Transactional Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenNewModal('invoice')}
              className="flex items-center gap-1.5 bg-[#0051d5] text-white px-3.5 py-1.5 rounded-lg shadow-xs hover:bg-blue-700 transition-all text-[12px] font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>{t.createInvoice}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenNewModal('expense')}
              className="flex items-center gap-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg transition-all text-[12px] font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">add_card</span>
              <span>{t.recordExpense}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenNewModal('journal')}
              className="flex items-center gap-1.5 bg-[#0F172A] text-white hover:bg-slate-800 px-3.5 py-1.5 rounded-lg transition-all text-[12px] font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>{t.postJournal}</span>
            </button>

            <button
              type="button"
              onClick={onOpenReconcile}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-800 text-[12px] font-medium"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">balance</span>
              <span>{t.reconcile}</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionToast('Exporting certified trial balance (IFRS Compliant Excel)...', 'خروجی اکسل تراز آزمایشی استاندارد دریافت شد.')}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              title="Export Certified Trial Balance (PDF / Excel)"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Body Canvas */}
      <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7 flex flex-col gap-6">
        {/* ROW 1: Working Capital & Liquidity Matrix (4 KPI Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Net Cash & Liquid Treasury */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0051d5]" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  {t.netLiquidTreasurySubtitle}
                </span>
                <h2 className="text-[16px] text-slate-900 font-bold mt-1">
                  {t.netLiquidTreasury}
                </h2>
              </div>
              <span className="p-2 bg-blue-50 text-[#0051d5] rounded-lg material-symbols-outlined text-[20px]">
                account_balance_wallet
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] xl:text-[28px] font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {formatMoney(1428950, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                <span className="font-semibold text-blue-600">
                  {activeCurrency === 'IRR' || activeCurrency === 'TOMAN' ? '۸۳۵.۹۳ میلیارد ریال' : '835.93B IRR equivalent'}
                </span>
                <span className="text-slate-300">•</span>
                <span>9.4 {t.runway}</span>
              </div>
            </div>

            <div className="mt-4 pt-2.5 bg-slate-50 p-2.5 rounded-lg flex flex-col gap-1.5 text-slate-600 text-[11px]">
              <div className="flex justify-between items-center">
                <span>{t.operatingCash}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(920400, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t.termDeposits}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(380000, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t.undepositedDrafts}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(128550, activeCurrency, isRtl)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Receivables Exposure (AR) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  {t.arTotalExposureSubtitle}
                </span>
                <h2 className="text-[16px] text-slate-900 font-bold mt-1">
                  {t.arTotalExposure}
                </h2>
              </div>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg material-symbols-outlined text-[20px]">
                request_quote
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] xl:text-[28px] font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {formatMoney(482150, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="text-[11px] flex items-center gap-1.5 mt-1">
                <span className="text-emerald-700 font-bold">{t.dsoLabel}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{t.targetDso}</span>
              </div>
            </div>

            <div className="mt-4 pt-2.5 bg-slate-50 p-2.5 rounded-lg flex flex-col gap-1.5 text-slate-600 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  {t.current0to30}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(389400, activeCurrency, isRtl)} (80.7%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  {t.overdue30Plus}
                </span>
                <span className="font-semibold text-red-600 tabular-nums">
                  {formatMoney(92750, activeCurrency, isRtl)} (4 Accts)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex mt-1">
                <div className="bg-emerald-600 h-full" style={{ width: '80.7%' }} />
                <div className="bg-red-600 h-full" style={{ width: '19.3%' }} />
              </div>
            </div>
          </div>

          {/* Card 3: Payables Obligations (AP) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F172A]" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  {t.apCurrentPositionSubtitle}
                </span>
                <h2 className="text-[16px] text-slate-900 font-bold mt-1">
                  {t.apCurrentPosition}
                </h2>
              </div>
              <span className="p-2 bg-slate-100 text-slate-800 rounded-lg material-symbols-outlined text-[20px]">
                payments
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] xl:text-[28px] font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {formatMoney(318420, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="text-[11px] flex items-center gap-1.5 mt-1">
                <span className="text-emerald-700 font-bold">
                  Net Gap: {formatMoney(163730, activeCurrency, isRtl)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{t.solvencyStatus}</span>
              </div>
            </div>

            <div className="mt-4 pt-2.5 bg-slate-50 p-2.5 rounded-lg flex flex-col gap-1.5 text-slate-600 text-[11px]">
              <div className="flex justify-between items-center">
                <span>{t.criticalDue7Days}</span>
                <span className="font-semibold text-red-600 tabular-nums">
                  {formatMoney(74800, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t.scheduledBatch}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(145000, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t.contractRetainage}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(98620, activeCurrency, isRtl)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Fiscal Performance YTD */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  {t.fiscalPnlYtdSubtitle}
                </span>
                <h2 className="text-[16px] text-slate-900 font-bold mt-1">
                  {t.fiscalPnlYtd}
                </h2>
              </div>
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg material-symbols-outlined text-[20px]">
                trending_up
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] xl:text-[28px] font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {formatMoney(841200, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="text-[11px] flex items-center gap-1.5 mt-1">
                <span className="text-emerald-700 font-bold">{t.marginLabel} 26.8%</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{t.revenueYoY}</span>
              </div>
            </div>

            <div className="mt-4 pt-2.5 bg-slate-50 p-2.5 rounded-lg flex flex-col gap-1.5 text-slate-600 text-[11px]">
              <div className="flex justify-between items-center">
                <span>{t.taxProvision}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(176650, activeCurrency, isRtl)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t.ebitdaMargin}</span>
                <span className="font-semibold text-emerald-700 tabular-nums">31.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t.operatingOpex}</span>
                <span className="font-semibold text-slate-900 tabular-nums">$492,100.00</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN ASYMMETRIC GRID: 8 Cols Left (Operations) & 4 Cols Right (Governance & Copilot) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: 8 of 12 */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* MODULE 1: Cash Velocity & Liquidity Horizon */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[20px]">save_as</span>
                    <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
                      {t.cashVelocityTitle}
                    </h3>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {t.cashVelocitySubtitle}
                  </p>
                </div>

                {/* Currency & Horizon Switchers */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveCurrency('USD')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                      activeCurrency === 'USD'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCurrency('IRR')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                      activeCurrency === 'IRR'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    IRR (ریال)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCurrency('TOMAN')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                      activeCurrency === 'TOMAN'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    TOMAN (تومان)
                  </button>
                  <span className="text-slate-300 text-[11px] px-1">|</span>
                  <span className="text-[11px] text-slate-500 px-1 font-medium">{t.trailing6Months}</span>
                </div>
              </div>

              {/* Cash Velocity Visualizer Chart (Institutional SVG) */}
              <div className="bg-slate-50/70 p-4 rounded-xl mt-3 border border-slate-100">
                <div className="flex flex-wrap items-center justify-between mb-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-[#0051d5]" />
                      <span>{t.grossCollections}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-red-600/70" />
                      <span>{t.disbursements}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-emerald-600 rounded-full" />
                      <span>{t.netBuffer}</span>
                    </div>
                  </div>
                  <span className="font-medium text-slate-800">
                    {t.avgInflow}: <strong>{formatMoney(648000, activeCurrency, language === 'fa')}</strong>
                  </span>
                </div>

                {/* SVG Bars & Net Spline */}
                <div className="w-full overflow-hidden">
                  <svg className="w-full h-44 text-[#0051d5]" preserveAspectRatio="none" viewBox="0 0 740 180">
                    <defs>
                      <linearGradient id="gradient-buffer" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0051d5" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#0051d5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Guidelines */}
                    <line stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="740" y1="30" y2="30" />
                    <line stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="740" y1="80" y2="80" />
                    <line stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="740" y1="130" y2="130" />

                    {/* Jul */}
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#0051d5" height="85" rx="3" width="28" x="40" y="55" />
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#ba1a1a" height="65" opacity="0.6" rx="3" width="28" x="72" y="75" />

                    {/* Aug */}
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#0051d5" height="95" rx="3" width="28" x="160" y="45" />
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#ba1a1a" height="70" opacity="0.6" rx="3" width="28" x="192" y="70" />

                    {/* Sep */}
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#0051d5" height="102" rx="3" width="28" x="280" y="38" />
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#ba1a1a" height="58" opacity="0.6" rx="3" width="28" x="312" y="82" />

                    {/* Oct */}
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#0051d5" height="110" rx="3" width="28" x="400" y="30" />
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#ba1a1a" height="75" opacity="0.6" rx="3" width="28" x="432" y="65" />

                    {/* Nov */}
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#0051d5" height="116" rx="3" width="28" x="520" y="24" />
                    <rect className="transition-all hover:opacity-80 cursor-pointer" fill="#ba1a1a" height="80" opacity="0.6" rx="3" width="28" x="552" y="60" />

                    {/* Dec (FCST) */}
                    <rect fill="#0051d5" height="120" opacity="0.8" rx="3" stroke="#0051d5" strokeDasharray="2,2" width="28" x="640" y="20" />
                    <rect fill="#ba1a1a" height="85" opacity="0.5" rx="3" stroke="#ba1a1a" strokeDasharray="2,2" width="28" x="672" y="55" />

                    {/* Predictive Treasury Spline */}
                    <path d="M 54 85 Q 176 72, 296 60 T 536 42 T 680 32" fill="none" stroke="#059669" strokeWidth="2.5" />
                    <path d="M 54 85 Q 176 72, 296 60 T 536 42 T 680 32 L 680 140 L 54 140 Z" fill="url(#gradient-buffer)" />

                    <circle cx="54" cy="85" fill="#059669" r="3.5" />
                    <circle cx="176" cy="72" fill="#059669" r="3.5" />
                    <circle cx="296" cy="60" fill="#059669" r="3.5" />
                    <circle cx="416" cy="50" fill="#059669" r="3.5" />
                    <circle cx="536" cy="42" fill="#059669" r="3.5" />
                    <circle cx="680" cy="32" fill="#059669" r="4.5" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* 6-Month Labels */}
                <div className="grid grid-cols-6 text-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                  <div>
                    <span className="font-semibold text-slate-800 block">Jul 2024</span>
                    <span className="tabular-nums">+$142,500</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Aug 2024</span>
                    <span className="tabular-nums">+$189,200</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Sep 2024</span>
                    <span className="tabular-nums">+$214,800</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Oct 2024</span>
                    <span className="tabular-nums">+$248,300</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Nov 2024</span>
                    <span className="tabular-nums">+$271,100</span>
                  </div>
                  <div className="bg-blue-50/80 rounded-md py-0.5">
                    <span className="font-bold text-blue-700 block">Dec (FCST)</span>
                    <span className="tabular-nums text-blue-700 font-semibold">+$295,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MODULE 2: AR Aging Schedule & Delinquency Monitor */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[20px]">hourglass_top</span>
                    <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
                      {t.arAgingTitle}
                    </h3>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {t.arAgingSubtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-700 font-semibold bg-red-50 border border-red-200/60 px-2.5 py-1 rounded-lg">
                    4 Critical Follow-ups
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateTo('sales-and-invoicing')}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded-lg"
                    title="View All Sales Invoices"
                  >
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto w-full mt-2">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3 font-semibold">{t.counterparty}</th>
                      <th className="py-2.5 px-3 font-semibold">{t.refInvoice}</th>
                      <th className="py-2.5 px-3 font-semibold text-center">{t.agingBracket}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{t.amountUsd}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{t.irrEquivalent}</th>
                      <th className="py-2.5 px-3 font-semibold text-center">{t.riskTier}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 leading-tight">
                            {inv.customerNameEn}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {inv.customerNameFa} • ID: {inv.customerRefId}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {inv.invNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                              inv.agingBracket === '90+ Days'
                                ? 'bg-red-100 text-red-700'
                                : inv.agingBracket === '61-90 Days'
                                ? 'bg-amber-100 text-amber-800'
                                : inv.agingBracket === '31-60 Days'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {inv.agingBracket}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                          ${inv.amountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right text-[11px] text-slate-500 tabular-nums">
                          {((inv.amountDue * FX_CONFIG.baseUsdRate) / 1000000000).toFixed(2)}B IRR
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                              inv.riskTier === 'Critical'
                                ? 'bg-red-600 text-white'
                                : inv.riskTier === 'Elevated'
                                ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                                : inv.riskTier === 'Moderate'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {inv.riskTier}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onAllocatePayment(inv)}
                            className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border border-slate-200"
                          >
                            {inv.riskTier === 'Critical'
                              ? t.legalLock
                              : inv.agingBracket === '61-90 Days'
                              ? t.demandNotice
                              : inv.agingBracket === '31-60 Days'
                              ? t.allocatePayment
                              : t.statement}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="mt-4 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
                <span>Showing 4 of 42 active commercial accounts in current billing cycles</span>
                <button
                  type="button"
                  onClick={() => onNavigateTo('sales-and-invoicing')}
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>{t.openDetailedMatrix}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* MODULE 3: Live General Ledger Stream (Debit = Credit Verification) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[20px]">account_tree</span>
                    <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
                      {t.generalLedgerTitle}
                    </h3>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {t.generalLedgerSubtitle}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-semibold text-slate-700">{t.auditBlockVerified}</span>
                </div>
              </div>

              {/* Double-Entry Ledger Rows */}
              <div className="overflow-x-auto w-full mt-2">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2 px-3 font-semibold">{t.timestampRef}</th>
                      <th className="py-2 px-3 font-semibold">{t.ledgerAccountsMemo}</th>
                      <th className="py-2 px-3 font-semibold text-right">{t.debit}</th>
                      <th className="py-2 px-3 font-semibold text-right">{t.credit}</th>
                      <th className="py-2 px-3 font-semibold text-center">{t.signOff}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journalEntries.map((jv) => {
                      const debitLine = jv.lines.find((l) => l.debit > 0);
                      const creditLine = jv.lines.find((l) => l.credit > 0);

                      return (
                        <tr key={jv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 align-top">
                            <div className="font-semibold text-slate-800 text-[12px] tabular-nums">
                              {jv.timestamp}
                            </div>
                            <span className="font-mono text-[11px] text-blue-600">{jv.jvRef}</span>
                          </td>
                          <td className="py-3 px-3 align-top">
                            <div className="font-medium text-slate-900">
                              {debitLine?.accountNameEn || 'Debit Account'}
                            </div>
                            <div className="text-slate-500 text-[11px] pl-3">
                              ↳ {creditLine?.accountNameEn || 'Credit Account'}
                            </div>
                            <div className="text-slate-400 text-[11px] italic mt-0.5">
                              {language === 'fa' ? jv.descriptionFa : jv.descriptionEn}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right align-top font-bold text-slate-900 tabular-nums">
                            ${debitLine?.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            <div className="text-[11px] text-slate-400 font-normal">--</div>
                          </td>
                          <td className="py-3 px-3 text-right align-top font-bold text-slate-900 tabular-nums">
                            <div className="text-[11px] text-slate-400 font-normal">--</div>
                            ${creditLine?.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-center align-top">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded font-semibold">
                              <span className="material-symbols-outlined text-[13px]">
                                {jv.isAutoSync ? 'verified' : 'person_check'}
                              </span>
                              {jv.signOff}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 4 of 12 (Governance, Bank Feeds, AI Copilot) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* MODULE 4: Governance & Approvals Queue */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                    assignment_turned_in
                  </span>
                  <h3 className="text-[16px] font-bold text-slate-900">
                    {t.governanceTitle}
                  </h3>
                </div>
                <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {approvals.filter((a) => a.status === 'Pending').length} {language === 'fa' ? 'در انتظار' : 'Pending'}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mb-3">
                {t.governanceSubtitle}
              </p>

              <div className="flex flex-col gap-2.5">
                {approvals.map((app) => (
                  <div
                    key={app.id}
                    className={`p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      app.status === 'Approved'
                        ? 'bg-emerald-50/50 border-emerald-200/60'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] bg-[#0F172A] text-white font-semibold px-1.5 py-0.5 rounded">
                          {app.code}
                        </span>
                        <span className="text-[13px] font-bold text-slate-900 block mt-1">
                          {language === 'fa' ? app.titleFa : app.titleEn}
                        </span>
                      </div>
                      <span className="text-[13px] font-extrabold text-slate-900 tabular-nums">
                        ${app.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {language === 'fa' ? app.reasonFa : app.reasonEn}
                    </p>

                    <div className="flex items-center justify-end gap-2 mt-1 pt-1.5 border-t border-slate-200/50">
                      {app.status === 'Approved' ? (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          {language === 'fa' ? 'تأیید شد' : 'Approved'}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleActionToast(`Reviewed details for ${app.code}`, `سند ${app.code} بررسی شد.`)}
                            className="text-slate-500 hover:text-slate-800 text-[11px] font-medium px-2 py-1"
                          >
                            {t.review}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onApproveItem(app.id);
                              handleActionToast(`Approved ${app.code} ($${app.amountUsd.toLocaleString()})`, `سند ${app.code} تأیید شد.`);
                            }}
                            className="bg-[#0051d5] hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1 rounded"
                          >
                            {t.approve}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MODULE 5: Bank Feeds & Treasury Health */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                    account_balance
                  </span>
                  <h3 className="text-[16px] font-bold text-slate-900">
                    {t.bankFeedsTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onOpenReconcile}
                  className="material-symbols-outlined text-[18px] text-emerald-600 hover:rotate-180 transition-transform"
                  title="Sync Bank Feeds"
                >
                  sync
                </button>
              </div>
              <p className="text-[12px] text-slate-500 mb-3">
                {t.bankFeedsSubtitle}
              </p>

              <div className="flex flex-col gap-2.5">
                {bankAccounts.map((bank) => (
                  <div key={bank.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-700 text-[18px]">
                          {bank.feedType.includes('API') ? 'account_balance' : 'domain'}
                        </span>
                        <span className="font-bold text-slate-900 text-[13px]">
                          {language === 'fa' ? bank.nameFa : bank.nameEn}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">{bank.accountNumber}</span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-[16px] font-extrabold text-slate-900 tabular-nums">
                        {bank.balanceIrr > 0 && language === 'fa'
                          ? formatMoney(bank.balanceIrr, 'IRR', true)
                          : formatMoney(bank.balanceUsd, 'USD')}
                      </span>
                      {bank.unmatchedCount > 0 ? (
                        <span className="bg-red-100 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded">
                          {bank.unmatchedCount} {t.unmatched}
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {t.reconciled}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/40">
                      <span>{language === 'fa' ? bank.typeFa : bank.typeEn}</span>
                      <button
                        type="button"
                        onClick={onOpenReconcile}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        {bank.unmatchedCount > 0 ? t.reconcileFeed : t.zeroVariance}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MODULE 6: Himoora Intelligence Copilot */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2 pb-1">
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">neurology</span>
                <h3 className="text-[16px] font-bold text-slate-900">
                  {t.copilotTitle}
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                {t.copilotSubtitle}
              </span>

              {/* Insights */}
              <div className="flex flex-col gap-2.5 mt-3">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-blue-600 text-[18px] mt-0.5">bolt</span>
                  <p className="text-[12px] text-slate-800 leading-snug">
                    <strong>AR Acceleration:</strong> Collection velocity in Wholesale Manufacturing accelerated by{' '}
                    <strong>4.2 days</strong> after activating automated multi-currency reminders.
                  </p>
                </div>

                <div className="p-3 bg-red-50/60 border border-red-100 rounded-lg flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-red-600 text-[18px] mt-0.5">warning</span>
                  <p className="text-[12px] text-slate-800 leading-snug">
                    <strong>Vendor Cost Variance:</strong> Steel Cold Rolled Coil unit cost spiked{' '}
                    <strong>+6.8%</strong> vs prior PO from Isfahan Foundries without prior price index warning.
                  </p>
                </div>
              </div>

              {/* Recommended Context Query Pills */}
              <div className="mt-4 pt-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-2">
                  {t.recommendedDeepDives}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCopilotWithPrompt(
                        language === 'fa' ? 'انحرافات مالیات عملکرد فصل سوم را تحلیل کن' : 'Analyze Q3 Tax Variance'
                      )
                    }
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                  >
                    {language === 'fa' ? 'تحلیل انحراف مالیات Q3' : 'Analyze Q3 Tax Variance'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCopilotWithPrompt(
                        language === 'fa' ? '۵ مشتری با بیشترین معوقه چه کسانی هستند؟' : 'Top 5 Slow-Paying Clients'
                      )
                    }
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                  >
                    {language === 'fa' ? 'مشتریان با بیشترین معوقه' : 'Top 5 Slow-Paying Clients'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCopilotWithPrompt(
                        language === 'fa' ? 'تست تاب‌آوری نقدینگی با افت ۱۵ درصدی نرخ ارز' : 'Liquidity Stress Test (IRR FX -15%)'
                      )
                    }
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                  >
                    {language === 'fa' ? 'تست تاب‌آوری نقدینگی (افت ۱۵٪ ریال)' : 'Liquidity Stress Test (IRR FX -15%)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Verification Footer */}
        <footer className="w-full bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified_user</span>
            <span>{t.footerCrypto}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>{t.footerCompliance}</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">
              {language === 'fa' ? 'توسعه: گروه نرم‌افزاری هیمورا (۰۹۳۵۴۴۶۷۲۶۹)' : 'Developed by Himoora Software (09354467269)'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
