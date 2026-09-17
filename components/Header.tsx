'use client';

import React, { useState } from 'react';
import { PlanTier, Currency, CURRENCIES } from '@/lib/accounting-engine';
import { Language, DICTIONARY } from '@/lib/localization';
import { PLAN_CONFIGS } from '@/lib/plans';

interface HeaderProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  currency?: Currency;
  onSelectCurrency?: (currency: Currency) => void;
  activePlan: PlanTier;
  onSelectPlan: (plan: PlanTier) => void;
  onOpenNewModal: (type: 'invoice' | 'expense' | 'journal') => void;
  onOpenSearch: () => void;
  onOpenCopilot: () => void;
  pendingApprovalsCount: number;
  onNavigateTo: (view: string) => void;
  onOpenSetupWizard?: () => void;
}

export default function Header({
  language,
  onToggleLanguage,
  currency = 'IRR',
  onSelectCurrency,
  activePlan,
  onSelectPlan,
  onOpenNewModal,
  onOpenSearch,
  onOpenCopilot,
  pendingApprovalsCount,
  onNavigateTo,
  onOpenSetupWizard,
}: HeaderProps) {
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const t = DICTIONARY[language];
  const isRtl = language === 'fa';

  const companies = [
    { id: 'himoora', nameEn: 'Himoora Software Group (09354467269)', nameFa: 'گروه نرم‌افزاری هیمورا (۰۹۳۵۴۴۶۷۲۶۹)', fiscal: 'FY 1403 / 24-25' },
    { id: 'alborz', nameEn: 'Alborz Logistics Holding', nameFa: 'هلدینگ لجستیک و ترابری البرز', fiscal: 'FY 1403 / 24-25' },
    { id: 'caspian', nameEn: 'Caspian Tech Industries', nameFa: 'صنایع فناوری و توسعه کاسپین', fiscal: 'FY 1403 / 24-25' },
  ];
  const [selectedCompany, setSelectedCompany] = useState(companies[0]);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200/80 z-40 flex items-center justify-between px-3 md:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Brand & Multi-Company Selector */}
      <div className="flex items-center gap-2.5 md:gap-3.5 shrink-0">
        <button
          onClick={() => onNavigateTo('command-center')}
          className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-95"
        >
          {/* Logo Badge */}
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center p-1.5 shadow-sm text-blue-400 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
              <line x1="2" y1="21" x2="22" y2="21" stroke="#475569" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex flex-col text-start">
            <span className="font-bold text-slate-900 text-[14px] md:text-[15px] leading-tight tracking-tight whitespace-nowrap">
              {language === 'fa' ? 'گروه نرم‌افزاری هیمورا' : 'Himoora Software'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
              {language === 'fa' ? 'ترازحساب ابری • ۰۹۳۵۴۴۶۷۲۶۹' : 'Cloud Accounting • 09354467269'}
            </span>
          </div>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden xl:block" />

        {/* Multi-Company Selector */}
        <div className="relative hidden xl:block">
          <button
            type="button"
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg text-slate-800 text-[13px] font-medium transition-colors max-w-[240px]"
          >
            <span className="material-symbols-outlined text-[#0051d5] text-[16px] shrink-0">domain</span>
            <span className="truncate">
              {language === 'fa' ? selectedCompany.nameFa : selectedCompany.nameEn}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">arrow_drop_down</span>
          </button>

          {isCompanyDropdownOpen && (
            <div className={`absolute top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 ${isRtl ? 'right-0' : 'left-0'}`}>
              <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-100">
                {language === 'fa' ? 'انتخاب واحد تجاری / شرکت' : 'Select Entity / Company'}
              </div>
              {companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompany(comp);
                    setIsCompanyDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] flex flex-col hover:bg-slate-50 transition-colors ${
                    comp.id === selectedCompany.id ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{language === 'fa' ? comp.nameFa : comp.nameEn}</span>
                  <span className="text-[10px] text-slate-400">{comp.fiscal}</span>
                </button>
              ))}
              {onOpenSetupWizard && (
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsCompanyDropdownOpen(false);
                      onOpenSetupWizard();
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] text-indigo-700 hover:bg-indigo-50 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">domain_add</span>
                    <span>{language === 'fa' ? '+ راه‌اندازی شرکت جدید و انتقال مانده‌ها' : '+ Setup Entity / Data Migration'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plan Tier Badge with Switcher */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
            className="flex items-center gap-1 bg-[#131b2e] hover:bg-[#1a253e] text-blue-200 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider transition-all border border-blue-500/20"
            title="Click to Switch Plan Tier (Starter, Professional, Business Pro, Enterprise)"
          >
            <span className="material-symbols-outlined text-amber-400 text-[13px]">diamond</span>
            <span>{activePlan === 'Enterprise' ? 'ENTERPRISE' : activePlan.toUpperCase()}</span>
            <span className="material-symbols-outlined text-slate-400 text-[13px]">unfold_more</span>
          </button>

          {isPlanDropdownOpen && (
            <div className={`absolute top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 ${isRtl ? 'right-0' : 'left-0'}`}>
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                {language === 'fa' ? 'انتخاب سطح پلن تجاری' : 'Select Plan Tier'}
              </div>
              {(['Starter', 'Professional', 'Business Pro', 'Enterprise'] as PlanTier[]).map((tier) => {
                const conf = PLAN_CONFIGS[tier];
                const isActive = activePlan === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => {
                      onSelectPlan(tier);
                      setIsPlanDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-[12px] flex items-center justify-between transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{language === 'fa' ? conf.labelFa : conf.labelEn}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {language === 'fa' ? conf.priceNoteFa : conf.priceNoteEn}
                      </div>
                    </div>
                    {isActive && <span className="material-symbols-outlined text-blue-600 text-[16px]">check</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Global Search Bar (⌘K) */}
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-3 lg:mx-4 min-w-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between gap-2 bg-slate-100/90 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg text-slate-500 text-[13px] transition-all border border-slate-200/50 overflow-hidden text-left"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">search</span>
            <span className="truncate block font-normal text-slate-500">{t.searchPlaceholder}</span>
          </div>
          <kbd className="shrink-0 text-[11px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Bilingual LTR / RTL Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
          <button
            type="button"
            onClick={() => onToggleLanguage('en')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
              language === 'en'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onToggleLanguage('fa')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
              language === 'fa'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            فا
          </button>
        </div>

        {/* Currency Switcher Dropdown (IRR Default for Persian, TMN / Foreign Currencies) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-lg text-slate-800 text-[11px] font-semibold border border-slate-200/70 transition-colors"
            title={language === 'fa' ? 'انتخاب واحد پولی (ریال، تومان، ارز خارجی)' : 'Select Currency (IRR, Toman, Foreign)'}
          >
            <span>{CURRENCIES[currency]?.flag}</span>
            <span className="text-slate-900 font-bold">
              {language === 'fa' ? CURRENCIES[currency]?.symbol : currency}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[14px]">arrow_drop_down</span>
          </button>

          {isCurrencyDropdownOpen && (
            <div
              className={`absolute top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 ${
                isRtl ? 'left-0' : 'right-0'
              }`}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                {language === 'fa' ? 'واحد پول گزارشات و مبالغ' : 'Currency Selection'}
              </div>
              {(['IRR', 'TOMAN', 'USD', 'EUR', 'AED', 'GBP'] as Currency[]).map((cCode) => {
                const cCfg = CURRENCIES[cCode];
                const isSelected = currency === cCode;
                return (
                  <button
                    key={cCode}
                    type="button"
                    onClick={() => {
                      if (onSelectCurrency) onSelectCurrency(cCode);
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-[12px] flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{cCfg.flag}</span>
                      <span>{language === 'fa' ? cCfg.nameFa : cCfg.nameEn}</span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-blue-600 text-[14px]">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fiscal Period Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[12px] text-slate-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-semibold">{language === 'fa' ? 'فصل ۳ باز' : 'Q3 Open'}</span>
          <span className="text-slate-400 text-[11px]">(14d)</span>
        </div>

        {/* Quick New Action Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNewDropdownOpen(!isNewDropdownOpen)}
            className="flex items-center gap-1 bg-[#0051d5] hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">{t.newButton}</span>
          </button>

          {isNewDropdownOpen && (
            <div className={`absolute top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 ${isRtl ? 'left-0' : 'right-0'}`}>
              <button
                onClick={() => {
                  onOpenNewModal('invoice');
                  setIsNewDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-blue-600 text-[18px]">receipt_long</span>
                <span>{language === 'fa' ? 'فاکتور فروش جدید' : 'New Invoice'}</span>
              </button>
              <button
                onClick={() => {
                  onOpenNewModal('expense');
                  setIsNewDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-slate-600 text-[18px]">add_card</span>
                <span>{language === 'fa' ? 'ثبت سند هزینه' : 'Record Expense'}</span>
              </button>
              <button
                onClick={() => {
                  onOpenNewModal('journal');
                  setIsNewDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">edit_note</span>
                <span>{language === 'fa' ? 'ثبت سند دوبل روزنامه' : 'Post Journal Entry'}</span>
              </button>
              {onOpenSetupWizard && (
                <button
                  onClick={() => {
                    setIsNewDropdownOpen(false);
                    onOpenSetupWizard();
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <span className="material-symbols-outlined text-indigo-600 text-[18px]">cloud_upload</span>
                  <span>{language === 'fa' ? 'سند افتتاحیه و انتقال مانده‌ها' : 'Data Migration & Opening'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Approvals / Notifications Button */}
        <button
          type="button"
          onClick={() => onNavigateTo('enterprise-controls')}
          className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          title="Governance Queue & Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* AI Copilot Trigger */}
        <button
          type="button"
          onClick={onOpenCopilot}
          className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          title="Himoora Intelligence Copilot"
        >
          <span className="material-symbols-outlined text-[20px]">neurology</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-[13px]">
            AK
          </div>
          <div className="hidden 2xl:flex flex-col text-left">
            <span className="text-[13px] font-semibold text-slate-800 leading-tight">Arash K.</span>
            <span className="text-[10px] text-slate-400">Chief Financial Officer</span>
          </div>
        </div>
      </div>
    </header>
  );
}
