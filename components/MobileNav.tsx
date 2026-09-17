'use client';

import React, { useState } from 'react';
import { Language } from '@/lib/localization';

interface MobileNavProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  language: Language;
  onOpenNewModal: (type: 'invoice' | 'expense' | 'journal') => void;
}

export default function MobileNav({
  currentView,
  onNavigate,
  language,
  onOpenNewModal,
}: MobileNavProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isRtl = language === 'fa';

  const mainTabs = [
    { id: 'command-center', icon: 'dashboard', labelEn: 'Home', labelFa: 'داشبورد' },
    { id: 'sales-and-invoicing', icon: 'receipt_long', labelEn: 'Sales', labelFa: 'فروش' },
    { id: 'accounting-and-ledger', icon: 'menu_book', labelEn: 'Ledger', labelFa: 'دفاتر' },
    { id: 'banking-and-treasury', icon: 'account_balance', labelEn: 'Banking', labelFa: 'بانک' },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) for Quick Accounting Actions */}
      <div className={`fixed bottom-20 z-40 ${isRtl ? 'left-4' : 'right-4'} lg:hidden`}>
        <button
          type="button"
          onClick={() => onOpenNewModal('invoice')}
          className="w-13 h-13 rounded-full bg-[#0051d5] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          title="New Invoice"
        >
          <span className="material-symbols-outlined text-[26px]">add</span>
        </button>
      </div>

      {/* Android Mobile Navigation Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {mainTabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onNavigate(tab.id);
                setIsMoreMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
                isActive ? 'text-[#0051d5]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">
                {language === 'fa' ? tab.labelFa : tab.labelEn}
              </span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          type="button"
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
            isMoreMenuOpen ? 'text-[#0051d5]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">more_horiz</span>
          <span className="text-[10px] font-medium mt-0.5">
            {language === 'fa' ? 'بیشتر' : 'More'}
          </span>
        </button>
      </nav>

      {/* Bottom Sheet Drawer for "More" Navigation */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end lg:hidden">
          <div
            className="bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-[14px]">
                {language === 'fa' ? 'منوی تکمیلی حسابداری' : 'Additional Accounting Modules'}
              </span>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <button
                onClick={() => {
                  onNavigate('purchases-and-expenses');
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
              >
                <span className="material-symbols-outlined text-slate-700 text-[20px]">shopping_bag</span>
                <span className="text-[12px] font-medium">{language === 'fa' ? 'خریدها و هزینه‌ها' : 'Purchases & Bills'}</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('inventory-and-valuation');
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
              >
                <span className="material-symbols-outlined text-slate-700 text-[20px]">inventory_2</span>
                <span className="text-[12px] font-medium">{language === 'fa' ? 'انبارداری و موجودی' : 'Inventory'}</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('financial-reports');
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
              >
                <span className="material-symbols-outlined text-slate-700 text-[20px]">analytics</span>
                <span className="text-[12px] font-medium">{language === 'fa' ? 'صورت‌های مالی و گزارشات' : 'Reports & P&L'}</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('enterprise-controls');
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-left"
              >
                <span className="material-symbols-outlined text-slate-700 text-[20px]">verified_user</span>
                <span className="text-[12px] font-medium">{language === 'fa' ? 'کارتابل تاییدات' : 'Approvals'}</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('ai-financial-assistant');
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 text-blue-800 text-left col-span-2"
              >
                <span className="material-symbols-outlined text-blue-600 text-[20px]">neurology</span>
                <span className="text-[12px] font-semibold">{language === 'fa' ? 'هوش مالی ترازحساب هیمورا' : 'Himoora Intelligence'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
