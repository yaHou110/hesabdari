'use client';

import React, { useState } from 'react';
import { Language, DICTIONARY } from '@/lib/localization';
import {
  Account,
  JournalEntry,
  INITIAL_ACCOUNTS,
} from '@/lib/accounting-engine';
import { validateLedgerInvariants, InvariantCheckReport } from '@/lib/ledger-invariants';
import { auditLogService, AuditLogEntry } from '@/lib/audit-log';
import { idempotencyEngine, IdempotencyRecord, executeIdempotentMutation } from '@/lib/idempotency';

interface AccountingLedgerViewProps {
  language: Language;
  accounts: Account[];
  journalEntries: JournalEntry[];
  onPostJournalEntry: (entry: JournalEntry) => void;
}

export default function AccountingLedgerView({
  language,
  accounts,
  journalEntries,
  onPostJournalEntry,
}: AccountingLedgerViewProps) {
  const t = DICTIONARY[language];
  const isRtl = language === 'fa';

  const [activeTab, setActiveTab] = useState<'journals' | 'chartOfAccounts' | 'auditTrail' | 'idempotency'>('journals');
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);

  // New Journal Entry Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [descriptionEn, setDescriptionEn] = useState('Monthly adjusting accrual entry');
  const [descriptionFa, setDescriptionFa] = useState('ثبت تعدیلی و ذخیره انباشته پایان دوره');
  const [modalIdempotencyKey, setModalIdempotencyKey] = useState<string>(() =>
    idempotencyEngine.generateKey('idemp-jv-manual')
  );
  const [postingFeedback, setPostingFeedback] = useState<string | null>(null);

  const [lines, setLines] = useState([
    {
      id: 'l-1',
      accountCode: '1010',
      accountNameEn: '1010 Operating Cash (Bank Melli)',
      accountNameFa: '۱۰۱۰ وجوه نقد و بانک ملی تجاری',
      debit: 5000,
      credit: 0,
      memoEn: 'Direct inflow allocation',
      memoFa: 'واریز مستقیم به حساب جاری',
    },
    {
      id: 'l-2',
      accountCode: '4010',
      accountNameEn: '4010 Commercial Sales & Wholesale Revenue',
      accountNameFa: '۴۰۱۰ درآمد حاصل از فروش کالا و خدمات',
      debit: 0,
      credit: 5000,
      memoEn: 'Direct commercial revenue',
      memoFa: 'شناسایی فروش کالا',
    },
  ]);

  // Validation & Invariant calculation
  const currentDraftEntry: JournalEntry = {
    id: 'draft-entry',
    jvRef: '#JV-1403-DRAFT',
    date: entryDate,
    timestamp: 'Just now',
    descriptionEn,
    descriptionFa,
    status: 'Draft',
    createdBy: 'Arash K. (Chief Financial Officer)',
    signOff: 'A. Kamali (CFO)',
    isAutoSync: false,
    auditBlock: '#481210',
    lines: lines.map((l) => ({
      ...l,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
    })),
  };

  const invariantResult = validateLedgerInvariants(currentDraftEntry, {
    existingEntries: journalEntries,
    chartOfAccounts: accounts,
  });

  const totalDebit = invariantResult.totalDebit;
  const totalCredit = invariantResult.totalCredit;
  const imbalance = invariantResult.imbalanceAmount;
  const isBalanced = invariantResult.isValid;

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => auditLogService.getLogs());
  const [chainIntegrity, setChainIntegrity] = useState<{ valid: boolean; totalBlocks: number } | null>(null);
  const [idempotencyRecords, setIdempotencyRecords] = useState<IdempotencyRecord[]>(() =>
    idempotencyEngine.getAllRecords()
  );

  // Replay test simulator state
  const [testKey, setTestKey] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const handleVerifyChain = () => {
    const res = auditLogService.verifyChainIntegrity();
    setChainIntegrity({ valid: res.isValid, totalBlocks: res.totalVerified });
    setAuditLogs(auditLogService.getLogs());
  };

  const handleRefreshIdempotency = () => {
    setIdempotencyRecords(idempotencyEngine.getAllRecords());
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: `l-${Date.now()}`,
        accountCode: '6010',
        accountNameEn: '6010 General & Administrative Overhead',
        accountNameFa: '۶۰۱۰ هزینه‌های عمومی و اداری',
        debit: 0,
        credit: 0,
        memoEn: '',
        memoFa: '',
      },
    ]);
  };

  const handleOpenNewEntryModal = () => {
    setModalIdempotencyKey(idempotencyEngine.generateKey('idemp-jv-manual'));
    setPostingFeedback(null);
    setIsNewEntryModalOpen(true);
  };

  const handleSaveEntry = async () => {
    const tempEntry: JournalEntry = {
      id: `jv-${Date.now()}`,
      jvRef: `#JV-1403-${Math.floor(1050 + Math.random() * 500)}`,
      date: entryDate,
      timestamp: 'Just now',
      descriptionEn,
      descriptionFa,
      status: 'Posted',
      createdBy: 'Arash K. (Chief Financial Officer)',
      signOff: 'A. Kamali (CFO)',
      isAutoSync: false,
      auditBlock: `#${Math.floor(481210 + Math.random() * 1000).toLocaleString()}`,
      lines: lines.map((l) => ({
        ...l,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      })),
    };

    const validation = validateLedgerInvariants(tempEntry, {
      existingEntries: journalEntries,
      chartOfAccounts: accounts,
    });

    if (!validation.isValid) {
      alert(language === 'fa' ? validation.messageFa : validation.messageEn);
      return;
    }

    try {
      // Execute through idempotent mutation wrapper
      const result = await executeIdempotentMutation(
        'journal-entry',
        {
          date: entryDate,
          lines: tempEntry.lines,
          totalTurnover: validation.totalDebit,
        },
        async (key) => {
          onPostJournalEntry(tempEntry);
          return {
            success: true,
            jvRef: tempEntry.jvRef,
            totalTurnover: validation.totalDebit,
          };
        },
        modalIdempotencyKey
      );

      if (result.isReplay) {
        setPostingFeedback(
          language === 'fa'
            ? `[پاسخ کش‌شده Idempotency] کلید ${result.idempotencyKey} قبلاً ثبت شده است. از ثبت سند تکراری جلوگیری شد.`
            : `[Idempotency Replay] Key ${result.idempotencyKey} was already executed. Duplicate entry prevented.`
        );
      } else {
        setAuditLogs(auditLogService.getLogs());
        setIdempotencyRecords(idempotencyEngine.getAllRecords());
        setIsNewEntryModalOpen(false);
      }
    } catch (err: any) {
      setPostingFeedback(err.message);
    }
  };

  return (
    <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7 flex flex-col gap-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[24px]">menu_book</span>
            <h1 className="text-[20px] font-bold text-slate-900">
              {language === 'fa' ? 'دفاتر کل، معین و اسناد حسابداری' : 'General Ledger & Double-Entry Accounting'}
            </h1>
          </div>
          <p className="text-[12px] text-slate-500 mt-1">
            {language === 'fa'
              ? 'تراز آزمایشی، دفتر روزنامه، احراز ۱۴ اصل تغییرناپذیر، مانیتورینگ کلیدهای یکتایی (Idempotency) و زنجیره هش حسابرسی'
              : 'Strict double-entry invariants, immutable audit blocks, subledger-to-GL reconciliation, idempotency mutation gateway, and fiscal period control.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewEntryModal}
          className="flex items-center gap-2 bg-[#0051d5] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          <span>{language === 'fa' ? 'ثبت سند دوبل جدید' : 'Post Journal Entry'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 pt-3 rounded-t-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('journals')}
          className={`pb-3 px-3 text-[13px] font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'journals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt</span>
          <span>{language === 'fa' ? 'اسناد دفتر روزنامه' : 'Journal Entries (JV)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chartOfAccounts')}
          className={`pb-3 px-3 text-[13px] font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'chartOfAccounts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          <span>{language === 'fa' ? 'کدینگ حساب‌ها (COA)' : 'Chart of Accounts'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auditTrail')}
          className={`pb-3 px-3 text-[13px] font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'auditTrail'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>{language === 'fa' ? 'ردیابی تغییرات و حسابرسی' : 'Audit Trail & Immutability'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('idempotency');
            handleRefreshIdempotency();
          }}
          className={`pb-3 px-3 text-[13px] font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'idempotency'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">fingerprint</span>
          <span>{language === 'fa' ? 'دروازه یکتایی تراکنش‌ها (Idempotency Engine)' : 'Idempotency Keys & API Gateway'}</span>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border border-indigo-200">
            {idempotencyRecords.length}
          </span>
        </button>
      </div>

      {/* TAB 1: JOURNAL ENTRIES LIST */}
      {activeTab === 'journals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">{t.timestampRef}</th>
                  <th className="py-3 px-4 font-semibold">{t.ledgerAccountsMemo}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t.debit}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t.credit}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t.signOff}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journalEntries.map((jv) => {
                  const debitLine = jv.lines.find((l) => l.debit > 0);
                  const creditLine = jv.lines.find((l) => l.credit > 0);

                  return (
                    <tr key={jv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900">{jv.timestamp}</div>
                        <div className="font-mono text-blue-600 text-[12px]">{jv.jvRef}</div>
                        <span className="text-[10px] text-slate-400">Block {jv.auditBlock}</span>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {debitLine?.accountNameEn || 'Debit'}
                        </div>
                        <div className="text-slate-500 text-[12px] pl-3">
                          ↳ {creditLine?.accountNameEn || 'Credit'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 italic">
                          {language === 'fa' ? jv.descriptionFa : jv.descriptionEn}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right align-top font-mono font-bold text-blue-700 tabular-nums">
                        ${debitLine?.debit ? debitLine.debit.toLocaleString() : '0'}
                      </td>
                      <td className="py-3.5 px-4 text-right align-top font-mono font-bold text-emerald-700 tabular-nums">
                        ${creditLine?.credit ? creditLine.credit.toLocaleString() : '0'}
                      </td>
                      <td className="py-3.5 px-4 text-center align-top">
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          <span>{jv.status}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{jv.signOff}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'chartOfAccounts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Account Name (EN/FA)</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Balance (USD)</th>
                  <th className="py-3 px-4 text-right">Balance (IRR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {accounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{acc.code}</td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{acc.nameEn}</div>
                      <div className="text-[11px] text-slate-500">{acc.nameFa}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {acc.type} ({acc.category})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      ${acc.balanceUsd.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 tabular-nums text-[12px]">
                      {acc.balanceIrr.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'auditTrail' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-[14px]">
                {language === 'fa' ? 'زنجیره هش تغییرناپذیر ثبت‌های مالی (Cryptographic Audit Chain)' : 'Cryptographic Audit Trail'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'fa'
                  ? 'هر تراکنش دارای امضای هش پیوسته به بلاک قبلی است تا از هرگونه دستکاری یا تغییر عطف به ماسبق جلوگیری شود.'
                  : 'Every financial mutation is cryptographically hashed and chained to the previous block.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleVerifyChain}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-[12px] font-semibold shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Verify Chain Integrity</span>
            </button>
          </div>

          {chainIntegrity && (
            <div className={`p-3 rounded-lg border text-[12px] flex items-center gap-2 ${
              chainIntegrity.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {chainIntegrity.valid ? 'check_circle' : 'warning'}
              </span>
              <span>
                {chainIntegrity.valid
                  ? `Cryptographic Chain Verified 100% Intact across all ${chainIntegrity.totalBlocks} mutation blocks.`
                  : 'Chain corruption detected! Hash mismatch between consecutive blocks.'}
              </span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        Block #{log.sequenceNumber}
                      </span>
                      <span className="font-bold text-slate-900">{log.actionType}</span>
                      <span className="text-slate-400">({log.entityType} {log.entityId})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                  </div>

                  <p className="text-[12px] text-slate-700">
                    {language === 'fa' ? log.summaryFa : log.summaryEn}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500 pt-1">
                    <span><strong>Actor:</strong> {log.actor.name} ({log.actor.role})</span>
                    <span><strong>Hash:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">{log.blockHash}</code></span>
                    <span><strong>Prev Hash:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{log.previousBlockHash}</code></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IDEMPOTENCY KEYS & API GATEWAY */}
      {activeTab === 'idempotency' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-5 rounded-xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[24px]">fingerprint</span>
                <h3 className="font-bold text-[16px]">
                  {language === 'fa' ? 'دروازه کلیدهای یکتایی و عدم تکرار تراکنش‌ها' : 'Idempotency Key Middleware & Replay Guard'}
                </h3>
              </div>
              <p className="text-[12px] text-slate-300 mt-1 max-w-3xl">
                {language === 'fa'
                  ? 'جلوگیری از صدور دوباره فاکتور، اسناد دوبل تکراری یا بستن مجدد سال مالی در اثر قطعی شبکه یا کلیک‌های مکرر. پاسخ‌های کش‌شده با همان کلید برگردانده می‌شوند و تغییر در بدنه مسدود می‌گردد.'
                  : 'Enforces exact-once execution for financial mutations. Replayed requests return cached idempotent responses. Altered payloads with existing keys trigger 422 IDEMPOTENCY_PAYLOAD_MISMATCH.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefreshIdempotency}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Refresh Keys</span>
            </button>
          </div>

          {/* Idempotency Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[13px]">
                {language === 'fa' ? 'سیاهه کلیدهای فعال در لایه میانی (Registered Idempotency Registry)' : 'Active Idempotency Locks & Cached Results'}
              </span>
              <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
                TTL: 24 Hours Cache
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider border-b border-slate-200 font-mono">
                    <th className="py-2.5 px-3">Idempotency Key</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Request Hash</th>
                    <th className="py-2.5 px-3">Target Endpoint</th>
                    <th className="py-2.5 px-3">Entity / Target</th>
                    <th className="py-2.5 px-3">Side Effects</th>
                    <th className="py-2.5 px-3 text-right">Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {idempotencyRecords.map((rec) => (
                    <tr key={rec.key} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{rec.key}</td>
                      <td className="py-2.5 px-3">
                        {rec.status === 'RESOLVED' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-bold">
                            <span className="material-symbols-outlined text-[12px]">check</span>
                            RESOLVED
                          </span>
                        ) : rec.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-bold animate-pulse">
                            <span className="material-symbols-outlined text-[12px]">pending</span>
                            PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] px-2 py-0.5 rounded font-bold">
                            REJECTED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-indigo-600 font-semibold">{rec.requestHash}</td>
                      <td className="py-2.5 px-3 text-slate-600">{rec.endpoint}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                          {rec.entityType || 'Mutation'}: {rec.entityId || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[11px] text-slate-600">
                        {rec.sideEffects.length > 0 ? (
                          <span>{rec.sideEffects[0]}</span>
                        ) : (
                          <span className="text-slate-400">Exact-once safe</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">
                        {rec.executionDurationMs ? `${rec.executionDurationMs}ms` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW JOURNAL ENTRY MODAL */}
      {isNewEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[24px]">edit_note</span>
                <h3 className="font-bold text-[16px] text-slate-900">
                  {language === 'fa' ? 'ثبت سند حسابداری دوطرفه (Double-Entry Journal Voucher)' : 'Create Journal Entry (General Ledger)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'fa' ? 'تاریخ سند:' : 'Posting Date:'}
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'fa' ? 'شرح سند (انگلیسی):' : 'Description (EN):'}
                </label>
                <input
                  type="text"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'fa' ? 'کلید یکتایی (Idempotency-Key):' : 'Mutation Idempotency Key:'}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={modalIdempotencyKey}
                    onChange={(e) => setModalIdempotencyKey(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[10px] font-mono bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setModalIdempotencyKey(idempotencyEngine.generateKey('idemp-jv-manual'))}
                    className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Posting Feedback */}
            {postingFeedback && (
              <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px]">
                {postingFeedback}
              </div>
            )}

            {/* Lines Table */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 text-[12px]">
                  {language === 'fa' ? 'ردیف‌های بدهکار و بستانکار سند:' : 'Journal Voucher Legs (Min 2 legs required):'}
                </span>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add Line</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50 text-slate-600 text-[11px]">
                    <tr>
                      <th className="p-2.5">Account Code & Title</th>
                      <th className="p-2.5 text-right">Debit ($)</th>
                      <th className="p-2.5 text-right">Credit ($)</th>
                      <th className="p-2.5">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((l, idx) => (
                      <tr key={l.id}>
                        <td className="p-2.5">
                          <select
                            value={l.accountCode}
                            onChange={(e) => {
                              const found = accounts.find((a) => a.code === e.target.value);
                              const newLines = [...lines];
                              newLines[idx].accountCode = e.target.value;
                              if (found) {
                                newLines[idx].accountNameEn = `${found.code} ${found.nameEn}`;
                                newLines[idx].accountNameFa = `${found.code} ${found.nameFa}`;
                              }
                              setLines(newLines);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-[12px]"
                          >
                            {accounts.map((a) => (
                              <option key={a.code} value={a.code}>
                                {a.code} - {a.nameEn} ({a.nameFa})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            value={l.debit}
                            onChange={(e) => {
                              const newLines = [...lines];
                              newLines[idx].debit = Number(e.target.value);
                              setLines(newLines);
                            }}
                            className="w-28 p-1 border border-slate-200 rounded text-right text-[12px] font-mono"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            value={l.credit}
                            onChange={(e) => {
                              const newLines = [...lines];
                              newLines[idx].credit = Number(e.target.value);
                              setLines(newLines);
                            }}
                            className="w-28 p-1 border border-slate-200 rounded text-right text-[12px] font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={l.memoEn}
                            onChange={(e) => {
                              const newLines = [...lines];
                              newLines[idx].memoEn = e.target.value;
                              setLines(newLines);
                            }}
                            placeholder="Memo..."
                            className="w-full p-1 border border-slate-200 rounded text-[12px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td className="p-2.5 text-slate-700">Total Amounts:</td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-900">
                        ${totalDebit.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-900">
                        ${totalCredit.toFixed(2)}
                      </td>
                      <td className="p-2.5"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* REAL-TIME 14 INVARIANTS VALIDATION SUITE */}
            <div className="mt-4">
              {isBalanced ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[12px]">
                  <div className="flex items-center gap-2 mb-2 font-bold">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                    <span>
                      {language === 'fa'
                        ? 'احراز کامل ۱۴ اصل حسابداری دفتر کل (All 14 Core Invariants Satisfied)'
                        : `All 14 Core Ledger Invariants Verified ($${totalDebit.toFixed(2)})`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono text-emerald-800">
                    {invariantResult.checks.map((c) => (
                      <div key={c.code} className="flex items-center gap-1 bg-emerald-100/50 px-1.5 py-0.5 rounded">
                        <span className="material-symbols-outlined text-[12px] text-emerald-600">check</span>
                        <span>{c.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[12px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
                    <span className="font-bold">
                      {language === 'fa' ? 'خطای نقض قوانین پایه حسابداری' : 'Accounting Invariant Violation'}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 mb-2">
                    {language === 'fa' ? invariantResult.messageFa : invariantResult.messageEn}
                  </p>
                  <div className="space-y-1">
                    {invariantResult.errors.map((err) => (
                      <div key={err.code} className="text-[11px] font-mono text-rose-800 bg-rose-100/60 p-1.5 rounded flex items-center gap-1">
                        <span className="font-bold">{err.code}:</span>
                        <span>{language === 'fa' ? err.nameFa : err.nameEn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsNewEntryModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-[13px] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEntry}
                disabled={!isBalanced}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  isBalanced
                    ? 'bg-[#0051d5] hover:bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {language === 'fa' ? 'ثبت نهایی سند در دفتر کل' : 'Post to General Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
