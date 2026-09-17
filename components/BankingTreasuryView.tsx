'use client';

import React, { useState } from 'react';
import { Language, DICTIONARY } from '@/lib/localization';
import { BankAccount, formatMoney } from '@/lib/accounting-engine';

interface BankingTreasuryViewProps {
  language: Language;
  bankAccounts: BankAccount[];
  onReconcileTransaction: (bankId: string, txId: string) => void;
}

export default function BankingTreasuryView({
  language,
  bankAccounts,
  onReconcileTransaction,
}: BankingTreasuryViewProps) {
  const t = DICTIONARY[language];
  const [selectedBank, setSelectedBank] = useState<BankAccount>(bankAccounts[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleReconcile = (txId: string) => {
    onReconcileTransaction(selectedBank.id, txId);
    setToastMessage(
      language === 'fa'
        ? 'تراکنش با سند دفتر کل تطبیق و مغایرت رفع گردید.'
        : 'Transaction matched with Ledger! Balance zero variance verified.'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7 flex flex-col gap-6">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-[13px] animate-in slide-in-from-top duration-200">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[24px]">account_balance</span>
            <h1 className="text-[20px] font-bold text-slate-900">
              {language === 'fa' ? 'خزانه‌داری، مدیریت حساب‌های بانکی و مغایرت‌گیری' : 'Banking, Treasury & Bank Reconciliation'}
            </h1>
          </div>
          <p className="text-[12px] text-slate-500 mt-1">
            {language === 'fa'
              ? 'اتصال خودکار فیدهای بانکی ارزی و ریالی (شتاب، پایا، ساتنا، سوئیفت)، تطبیق هوشمند ۹۸٪ و رفع مغایرت'
              : 'Multi-currency corporate bank feeds, AI candidate transaction matching, MT940 statement sync, and zero-variance ledger proof.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Feeds Connected (3/3 Active)</span>
          </span>
        </div>
      </div>

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map((b) => {
          const isSelected = selectedBank.id === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBank(b)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-[14px]">
                  {language === 'fa' ? b.nameFa : b.nameEn}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{b.accountNumber}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {language === 'fa' ? b.typeFa : b.typeEn}
              </div>

              <div className="mt-3">
                <span className="text-[22px] font-extrabold text-slate-900 tabular-nums">
                  {formatMoney(b.balanceUsd, 'USD')}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {((b.balanceIrr) / 1000000000).toFixed(1)}B IRR
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Feed: {b.feedType}</span>
                {b.unmatchedCount > 0 ? (
                  <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                    {b.unmatchedCount} Unmatched
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Zero Variance
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RECONCILIATION WORKSPACE FOR SELECTED BANK */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">balance</span>
              <span>Reconciliation Workspace: {selectedBank.nameEn}</span>
            </h2>
            <span className="text-[12px] text-slate-500">
              Review imported statement lines against ledger documents and click &quot;Accept Match&quot;
            </span>
          </div>
          <button
            type="button"
            className="text-[12px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Import MT940 / OFX File</span>
          </button>
        </div>

        {/* Transactions Feed Table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Bank Statement Description</th>
                <th className="py-2.5 px-3">Counterparty</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Candidate Match in Ledger</th>
                <th className="py-2.5 px-3 text-center">AI Confidence</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedBank.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-slate-600 font-mono text-[12px]">{tx.date}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{tx.description}</td>
                  <td className="py-3 px-3 text-slate-600 text-[12px]">{tx.counterparty}</td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums">
                    <span className={tx.type === 'Credit' ? 'text-emerald-700' : 'text-slate-900'}>
                      {tx.type === 'Credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {tx.candidateMatchDoc ? (
                      <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-200/50">
                        {tx.candidateMatchDoc}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No candidate found</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {tx.matchConfidence ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                        {tx.matchConfidence}% Match
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">--</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {tx.status === 'Reconciled' ? (
                      <span className="text-emerald-700 text-[11px] font-semibold flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Reconciled
                      </span>
                    ) : tx.candidateMatchDoc ? (
                      <button
                        type="button"
                        onClick={() => handleReconcile(tx.id)}
                        className="bg-[#0051d5] hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1 rounded transition-colors"
                      >
                        Accept Match
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReconcile(tx.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold px-3 py-1 rounded transition-colors"
                      >
                        Allocate Manual
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
