'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/localization';
import { Account, Invoice, Customer, JournalEntry } from '@/lib/accounting-engine';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  accounts: Account[];
  invoices: Invoice[];
  customers: Customer[];
  journalEntries: JournalEntry[];
  onSelectResult: (view: string) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  language,
  accounts,
  invoices,
  customers,
  journalEntries,
  onSelectResult,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();

  const filteredAccounts = accounts.filter(
    (a) => a.code.includes(q) || a.nameEn.toLowerCase().includes(q) || a.nameFa.includes(q)
  );

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invNumber.toLowerCase().includes(q) ||
      i.customerNameEn.toLowerCase().includes(q) ||
      i.customerNameFa.includes(q)
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.nameEn.toLowerCase().includes(q) ||
      c.nameFa.includes(q) ||
      c.refId.toLowerCase().includes(q)
  );

  const filteredJVs = journalEntries.filter(
    (j) =>
      j.jvRef.toLowerCase().includes(q) ||
      j.descriptionEn.toLowerCase().includes(q) ||
      j.descriptionFa.includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input
            type="text"
            autoFocus
            placeholder={
              language === 'fa'
                ? 'جستجوی سرفصل حسابداری، شماره فاکتور، مشتری یا سند روزنامه...'
                : 'Search accounts, invoices, counterparties, or journals...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100">
          {/* Accounts */}
          {filteredAccounts.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Chart of Accounts
              </span>
              {filteredAccounts.slice(0, 3).map((a) => (
                <div
                  key={a.code}
                  onClick={() => {
                    onSelectResult('accounting-and-ledger');
                    onClose();
                  }}
                  className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-600 font-bold">{a.code}</span>
                    <span className="font-semibold text-slate-800">{a.nameEn}</span>
                    <span className="text-slate-400 text-[11px]">{a.nameFa}</span>
                  </div>
                  <span className="font-mono text-slate-600">${a.balanceUsd.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Sales Invoices
              </span>
              {filteredInvoices.slice(0, 3).map((i) => (
                <div
                  key={i.id}
                  onClick={() => {
                    onSelectResult('sales-and-invoicing');
                    onClose();
                  }}
                  className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900 font-bold">{i.invNumber}</span>
                    <span className="text-slate-600">{i.customerNameEn}</span>
                  </div>
                  <span className="font-bold text-red-600 tabular-nums">${i.amountDue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Counterparties
              </span>
              {filteredCustomers.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectResult('sales-and-invoicing');
                    onClose();
                  }}
                  className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{c.nameEn}</span>
                    <span className="text-slate-400 text-[11px]">{c.nameFa}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{c.refId}</span>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {filteredAccounts.length === 0 &&
            filteredInvoices.length === 0 &&
            filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-[13px]">
                No matching accounts, invoices, or counterparties found for &quot;{query}&quot;.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
