'use client';

import React from 'react';
import { PlanTier } from '@/lib/accounting-engine';
import { PLAN_CONFIGS } from '@/lib/plans';
import { Language } from '@/lib/localization';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: PlanTier;
  onSelectPlan: (plan: PlanTier) => void;
  language: Language;
}

export default function PlanComparisonModal({
  isOpen,
  onClose,
  activePlan,
  onSelectPlan,
  language,
}: PlanComparisonModalProps) {
  if (!isOpen) return null;

  const tiers: PlanTier[] = ['Starter', 'Professional', 'Business Pro', 'Enterprise'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">
              {language === 'fa' ? 'سطوح و بسته‌های نرم‌افزار حسابداری هیمورا' : 'Himoora Financial Suite - Product Plan Tiers'}
            </h2>
            <p className="text-[12px] text-slate-500">
              {language === 'fa'
                ? 'از کسب‌وکارهای نوپا تا شرکت‌های هلدینگ و هولدینگ‌های چند شرکته'
                : 'From sole practitioners to enterprise multi-entity conglomerates with AI governance.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {tiers.map((t) => {
            const conf = PLAN_CONFIGS[t];
            const isCurrent = activePlan === t;

            return (
              <div
                key={t}
                className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[15px] text-slate-900">
                      {language === 'fa' ? conf.labelFa : conf.labelEn}
                    </span>
                    {isCurrent && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span className="text-[13px] font-semibold text-blue-700 block">
                      {language === 'fa' ? conf.priceNoteFa : conf.priceNoteEn}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1 leading-snug">
                      {language === 'fa' ? conf.targetFa : conf.targetEn}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-[12px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">check</span>
                      <span>Max {conf.maxCompanies} Entity</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">check</span>
                      <span>Up to {conf.maxUsers} Users</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          conf.hasDoubleEntryVerification ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      >
                        {conf.hasDoubleEntryVerification ? 'check' : 'remove'}
                      </span>
                      <span>Double-Entry Verification</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          conf.hasBankReconciliation ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      >
                        {conf.hasBankReconciliation ? 'check' : 'remove'}
                      </span>
                      <span>Bank Feed Reconcile</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          conf.hasAiAssistant ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      >
                        {conf.hasAiAssistant ? 'check' : 'remove'}
                      </span>
                      <span className={conf.hasAiAssistant ? 'font-bold text-slate-900' : ''}>
                        AI Financial Copilot
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPlan(t);
                      onClose();
                    }}
                    className={`w-full py-2 rounded-lg text-[12px] font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-slate-200 text-slate-700 cursor-default'
                        : 'bg-[#0051d5] hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {isCurrent
                      ? language === 'fa'
                        ? 'پلن فعال فعلی'
                        : 'Current Active Tier'
                      : language === 'fa'
                      ? 'انتخاب این پلن'
                      : 'Switch to ' + conf.labelEn}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
