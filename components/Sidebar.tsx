'use client';

import React from 'react';
import { Language, DICTIONARY } from '@/lib/localization';
import { PlanTier } from '@/lib/accounting-engine';
import { PLAN_CONFIGS } from '@/lib/plans';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  language: Language;
  activePlan: PlanTier;
  pendingApprovalsCount: number;
}

export default function Sidebar({
  currentView,
  onNavigate,
  language,
  activePlan,
  pendingApprovalsCount,
}: SidebarProps) {
  const t = DICTIONARY[language];
  const planConfig = PLAN_CONFIGS[activePlan];
  const isRtl = language === 'fa';

  const navItemsCore = [
    { id: 'command-center', icon: 'dashboard', label: t.commandCenter },
    { id: 'sales-and-invoicing', icon: 'receipt_long', label: t.salesAndInvoicing },
    { id: 'purchases-and-expenses', icon: 'shopping_bag', label: t.purchasesAndExpenses },
    { id: 'accounting-and-ledger', icon: 'menu_book', label: t.accountingAndLedger },
    { id: 'banking-and-treasury', icon: 'account_balance', label: t.bankingAndTreasury },
    { id: 'inventory-and-valuation', icon: 'inventory_2', label: t.inventoryAndValuation },
    { id: 'financial-reports', icon: 'analytics', label: t.financialReports },
  ];

  const navItemsGovernance = [
    {
      id: 'enterprise-controls',
      icon: 'verified_user',
      label: t.enterpriseControls,
      badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
    },
    { id: 'ai-financial-assistant', icon: 'neurology', label: t.himooraIntelligence },
    { id: 'system-settings-and-roles', icon: 'admin_panel_settings', label: t.settingsAndRoles },
  ];

  return (
    <aside
      className={`fixed top-16 bottom-0 w-64 bg-white border-slate-200/80 z-30 flex flex-col justify-between overflow-y-auto ${
        isRtl ? 'right-0 border-l' : 'left-0 border-r'
      }`}
    >
      <div className="py-4">
        {/* Core Operations Section */}
        <div className="px-4 pb-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          {language === 'fa' ? 'عملیات مالی اصلی' : 'Core Operations'}
        </div>

        <nav className="flex flex-col gap-1 px-2.5">
          {navItemsCore.map((item) => {
            const isAllowed = planConfig.allowedNavItems.includes(item.id);
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left ${
                  isActive
                    ? 'bg-blue-50 text-[#0051d5] font-semibold shadow-2xs'
                    : isAllowed
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[19px] ${
                    isActive ? 'text-[#0051d5]' : isAllowed ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {!isAllowed && (
                  <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    PRO+
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-slate-200/60 mx-4" />

        {/* Governance & AI Section */}
        <div className="px-4 pb-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          {language === 'fa' ? 'حاکمیت و هوش مصنوعی' : 'Governance & AI'}
        </div>

        <nav className="flex flex-col gap-1 px-2.5">
          {navItemsGovernance.map((item) => {
            const isAllowed = planConfig.allowedNavItems.includes(item.id);
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left ${
                  isActive
                    ? 'bg-blue-50 text-[#0051d5] font-semibold'
                    : isAllowed
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className={`material-symbols-outlined text-[19px] ${
                      isActive ? 'text-[#0051d5]' : isAllowed ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
                {!isAllowed && !item.badge && (
                  <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    ENT
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dual Currency Ticker & Ledger Synchronization */}
      <div className="p-3.5 border-t border-slate-200/70 bg-slate-50/80">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-500 font-medium">
            {language === 'fa' ? 'پایه چند ارزی (تلفیقی)' : 'Dual Currency Base'}
          </span>
          <span className="bg-slate-200/80 font-semibold px-1.5 py-0.5 rounded text-slate-800 font-mono">
            USD / IRR
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span className="truncate">
            {language === 'fa' ? 'تمام دفاتر کل همگام‌سازی شدند • ۲ دقیقه پیش' : 'All ledgers synced • 2m ago'}
          </span>
        </div>
      </div>
    </aside>
  );
}
