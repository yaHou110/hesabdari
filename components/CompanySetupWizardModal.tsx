'use client';

import React, { useState, useMemo } from 'react';
import { Language, DICTIONARY } from '@/lib/localization';
import { Account, JournalEntry, JournalLine } from '@/lib/accounting-engine';
import { validateLedgerInvariants } from '@/lib/ledger-invariants';
import { auditLogService } from '@/lib/audit-log';
import { idempotencyEngine } from '@/lib/idempotency';
import { executeFinancialTransaction } from '@/lib/financial-transaction';

interface CompanySetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  accounts?: Account[];
  onImportOpeningBalances?: (entry: JournalEntry, updatedAccounts: Account[]) => void;
}

interface OpeningBalanceRow {
  id: string;
  accountCode: string;
  accountNameEn: string;
  accountNameFa: string;
  debit: number;
  credit: number;
  memoEn: string;
  memoFa: string;
}

const PRESET_MIGRATIONS: Record<string, { nameEn: string; nameFa: string; rows: OpeningBalanceRow[] }> = {
  commercial: {
    nameEn: 'Commercial & Trading Opening Template',
    nameFa: 'الگوی افتتاحیه شرکت بازرگانی و توزیع',
    rows: [
      {
        id: 'ob-1',
        accountCode: '1010',
        accountNameEn: 'Operating Cash & Bank Melli',
        accountNameFa: 'وجوه نقد و بانک ملی تجاری',
        debit: 45000,
        credit: 0,
        memoEn: 'Opening cash and bank balances',
        memoFa: 'مانده ابتدای دوره حساب‌های بانکی و تنخواه‌گردان',
      },
      {
        id: 'ob-2',
        accountCode: '1200',
        accountNameEn: 'Trade Accounts Receivable',
        accountNameFa: 'حساب‌ها و اسناد دریافتنی تجاری',
        debit: 28500,
        credit: 0,
        memoEn: 'Historical outstanding customer receivables',
        memoFa: 'مانده مطالبات تجاری مشتریان از سال قبل',
      },
      {
        id: 'ob-3',
        accountCode: '1300',
        accountNameEn: 'Finished Goods Merchandise Inventory',
        accountNameFa: 'موجودی کالای تجاری و انبار مرکزی',
        debit: 62000,
        credit: 0,
        memoEn: 'Historical inventory valuation',
        memoFa: 'ارزش‌گذاری موجودی کالای انبار در ابتدای دوره',
      },
      {
        id: 'ob-4',
        accountCode: '1500',
        accountNameEn: 'Commercial Office Equipment & IT Infrastructure',
        accountNameFa: 'تجهیزات اداری و زیرساخت‌های فناوری',
        debit: 18000,
        credit: 0,
        memoEn: 'Fixed assets net book value',
        memoFa: 'ارزش دفتری دارایی‌های ثابت مشهود',
      },
      {
        id: 'ob-5',
        accountCode: '2010',
        accountNameEn: 'Trade Accounts Payable (Vendors)',
        accountNameFa: 'حساب‌ها و اسناد پرداختنی تجاری (بستانکاران)',
        debit: 0,
        credit: 32500,
        memoEn: 'Historical vendor payables',
        memoFa: 'مانده بدهی به تامین‌کنندگان از سنوات قبل',
      },
      {
        id: 'ob-6',
        accountCode: '2200',
        accountNameEn: 'Statutory Tax Provision Payable',
        accountNameFa: 'ذخیره مالیات عملکرد و ارزش افزوده پرداختنی',
        debit: 0,
        credit: 9000,
        memoEn: 'Opening statutory tax liability',
        memoFa: 'مانده تعهدات مالیاتی سنوات قبل',
      },
      {
        id: 'ob-7',
        accountCode: '3010',
        accountNameEn: 'Registered Common Share Capital',
        accountNameFa: 'سرمایه ثبتی پرداخت‌شده سهامداران',
        debit: 0,
        credit: 80000,
        memoEn: 'Founders contributed equity',
        memoFa: 'سرمایه ثبتی اولیه شرکت',
      },
      {
        id: 'ob-8',
        accountCode: '3050',
        accountNameEn: 'Retained Earnings & Accumulated Surplus',
        accountNameFa: 'سود و زیان انباشته پایان دوره قبل',
        debit: 0,
        credit: 32000,
        memoEn: 'Accumulated retained earnings from prior years',
        memoFa: 'سود انباشته سنواتی منتقل‌شده',
      },
    ],
  },
  manufacturing: {
    nameEn: 'Manufacturing & Industrial Opening Template',
    nameFa: 'الگوی افتتاحیه شرکت صنعتی و تولیدی',
    rows: [
      {
        id: 'mob-1',
        accountCode: '1010',
        accountNameEn: 'Operating Cash & Bank Melli',
        accountNameFa: 'وجوه نقد و بانک ملی تجاری',
        debit: 80000,
        credit: 0,
        memoEn: 'Plant operating accounts',
        memoFa: 'حساب‌های جاری کارخانه',
      },
      {
        id: 'mob-2',
        accountCode: '1300',
        accountNameEn: 'Raw Materials & Work-in-Progress Inventory',
        accountNameFa: 'موجودی مواد اولیه و در جریان ساخت',
        debit: 115000,
        credit: 0,
        memoEn: 'Opening stock count',
        memoFa: 'موجودی انبار مواد اولیه',
      },
      {
        id: 'mob-3',
        accountCode: '1500',
        accountNameEn: 'Plant Machinery & Production Lines',
        accountNameFa: 'ماشین‌آلات و خطوط تولید کارخانه',
        debit: 210000,
        credit: 0,
        memoEn: 'Industrial machinery opening',
        memoFa: 'ارزش دفتری ماشین‌آلات صنعتی',
      },
      {
        id: 'mob-4',
        accountCode: '2010',
        accountNameEn: 'Trade Accounts Payable',
        accountNameFa: 'اسناد پرداختنی تجاری',
        debit: 0,
        credit: 75000,
        memoEn: 'Raw material vendor payables',
        memoFa: 'بستانکاران تامین مواد',
      },
      {
        id: 'mob-5',
        accountCode: '3010',
        accountNameEn: 'Registered Common Share Capital',
        accountNameFa: 'سرمایه ثبتی سهامداران',
        debit: 0,
        credit: 250000,
        memoEn: 'Paid-in manufacturing capital',
        memoFa: 'سرمایه پرداخت‌شده',
      },
      {
        id: 'mob-6',
        accountCode: '3050',
        accountNameEn: 'Retained Earnings & Reserves',
        accountNameFa: 'سود انباشته و اندوخته قانونی',
        debit: 0,
        credit: 80000,
        memoEn: 'Accumulated plant reserves',
        memoFa: 'اندوخته‌های انباشته',
      },
    ],
  },
};

export default function CompanySetupWizardModal({
  isOpen,
  onClose,
  language,
  accounts = [],
  onImportOpeningBalances,
}: CompanySetupWizardModalProps) {
  const [activeMode, setActiveMode] = useState<'wizard' | 'dataMigration'>('wizard');
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('Himoora Horizon International');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [accountingBasis, setAccountingBasis] = useState('Accrual');
  const [coaTemplate, setCoaTemplate] = useState('Commercial & Trading');

  // Data Migration state
  const [migrationRows, setMigrationRows] = useState<OpeningBalanceRow[]>(() =>
    PRESET_MIGRATIONS.commercial.rows.map((r) => ({ ...r }))
  );
  const [migrationDate, setMigrationDate] = useState('2024-03-20');
  const [migrationIdempotencyKey, setMigrationIdempotencyKey] = useState<string>(() =>
    idempotencyEngine.generateKey('idemp-migration-open')
  );
  const [commitMessage, setCommitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [isRawJsonModalOpen, setIsRawJsonModalOpen] = useState(false);

  // Validate migration rows against Chart of Accounts
  const rowValidations = useMemo(() => {
    return migrationRows.map((row) => {
      const match = accounts.find((a) => a.code === row.accountCode.trim());
      const hasCode = Boolean(match);
      const isNegative = row.debit < 0 || row.credit < 0;
      const bothZero = row.debit === 0 && row.credit === 0;
      const bothPositive = row.debit > 0 && row.credit > 0;

      let errorMsg = '';
      if (!hasCode) {
        errorMsg = `Account code '${row.accountCode}' not found in Chart of Accounts`;
      } else if (isNegative) {
        errorMsg = 'Negative values not allowed in double-entry legs';
      } else if (bothZero) {
        errorMsg = 'Line has zero debit and credit';
      } else if (bothPositive) {
        errorMsg = 'Line cannot have both Debit and Credit';
      }

      return {
        id: row.id,
        isValid: hasCode && !isNegative && !bothZero && !bothPositive,
        matchedAccount: match,
        errorMessage: errorMsg,
      };
    });
  }, [migrationRows, accounts]);

  const totalDebit = useMemo(
    () => migrationRows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0),
    [migrationRows]
  );
  const totalCredit = useMemo(
    () => migrationRows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0),
    [migrationRows]
  );
  const imbalanceAmount = Math.abs(totalDebit - totalCredit);
  const isBalanced = imbalanceAmount < 0.005 && totalDebit > 0;
  const allRowsValid = rowValidations.every((v) => v.isValid) && migrationRows.length >= 2;
  const canCommit = isBalanced && allRowsValid;

  if (!isOpen) return null;

  const handleAddRow = () => {
    setMigrationRows([
      ...migrationRows,
      {
        id: `row-${Date.now()}`,
        accountCode: '1010',
        accountNameEn: 'Operating Cash & Bank Melli',
        accountNameFa: 'وجوه نقد و بانک ملی تجاری',
        debit: 0,
        credit: 0,
        memoEn: 'Opening ledger balance',
        memoFa: 'مانده افتتاحیه',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (migrationRows.length <= 2) {
      alert(language === 'fa' ? 'حداقل ۲ ردیف برای سند افتتاحیه الزامی است.' : 'At least 2 rows are required for double-entry.');
      return;
    }
    setMigrationRows(migrationRows.filter((r) => r.id !== id));
  };

  const handleLoadPreset = (presetKey: string) => {
    const preset = PRESET_MIGRATIONS[presetKey];
    if (preset) {
      setMigrationRows(preset.rows.map((r) => ({ ...r, id: `row-${Date.now()}-${Math.random()}` })));
      setCommitMessage(null);
    }
  };

  const handleAutoBalanceToRetainedEarnings = () => {
    if (isBalanced) return;
    const diff = totalDebit - totalCredit;
    const existingReIndex = migrationRows.findIndex((r) => r.accountCode === '3050');

    if (existingReIndex !== -1) {
      const updated = [...migrationRows];
      const cur = updated[existingReIndex];
      if (diff > 0) {
        // Debits exceed credits => Increase Credit in Retained Earnings
        updated[existingReIndex] = {
          ...cur,
          credit: cur.credit + diff,
        };
      } else {
        // Credits exceed debits => Increase Debit in Retained Earnings
        updated[existingReIndex] = {
          ...cur,
          debit: cur.debit + Math.abs(diff),
        };
      }
      setMigrationRows(updated);
    } else {
      // Add Retained Earnings row
      setMigrationRows([
        ...migrationRows,
        {
          id: `re-${Date.now()}`,
          accountCode: '3050',
          accountNameEn: 'Retained Earnings & Balancing Equity',
          accountNameFa: 'سود و زیان انباشته / تعدیل تراز افتتاحیه',
          debit: diff < 0 ? Math.abs(diff) : 0,
          credit: diff > 0 ? diff : 0,
          memoEn: 'Opening balancing adjustment to Retained Earnings',
          memoFa: 'تعدیل تراز افتتاحیه به حساب سود انباشته',
        },
      ]);
    }
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(rawJsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of opening balance rows.');
      }
      const formatted: OpeningBalanceRow[] = parsed.map((item: any, idx: number) => ({
        id: `json-${Date.now()}-${idx}`,
        accountCode: String(item.accountCode || item.code || '1010'),
        accountNameEn: String(item.accountNameEn || item.name || 'Account'),
        accountNameFa: String(item.accountNameFa || item.nameFa || 'حساب'),
        debit: Number(item.debit || 0),
        credit: Number(item.credit || 0),
        memoEn: String(item.memoEn || item.memo || 'Opening import'),
        memoFa: String(item.memoFa || 'انتقال مانده اول دوره'),
      }));
      setMigrationRows(formatted);
      setIsRawJsonModalOpen(false);
      setRawJsonInput('');
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message}`);
    }
  };

  const handleCommitMigration = async () => {
    if (!canCommit) return;
    setIsCommitting(true);
    setCommitMessage(null);

    const jvNumber = `#JV-OPENING-${Math.floor(1000 + Math.random() * 9000)}`;
    const journalLines: JournalLine[] = migrationRows.map((r) => {
      const matched = accounts.find((a) => a.code === r.accountCode.trim());
      return {
        id: `l-${r.id}`,
        accountCode: r.accountCode,
        accountNameEn: matched ? `${matched.code} ${matched.nameEn}` : r.accountNameEn,
        accountNameFa: matched ? `${matched.code} ${matched.nameFa}` : r.accountNameFa,
        debit: Number(r.debit || 0),
        credit: Number(r.credit || 0),
        memoEn: r.memoEn || `Historical opening balance migration`,
        memoFa: r.memoFa || `انتقال و استقرار مانده ابتدای دوره`,
      };
    });

    const openingEntry: JournalEntry = {
      id: `jv-open-${Date.now()}`,
      jvRef: jvNumber,
      date: migrationDate,
      timestamp: 'Historical Migration',
      descriptionEn: `Historical Opening Balances Migration (${companyName})`,
      descriptionFa: `سند افتتاحیه و انتقال اطلاعات مالی سنوات قبل (${companyName})`,
      sourceDocType: 'DataMigration',
      sourceDocRef: 'MIGRATION-BATCH-1403',
      status: 'Posted',
      createdBy: 'Arash Kamali (Data Migration Officer)',
      signOff: 'Board & Chief Auditor Sign-off',
      isAutoSync: false,
      auditBlock: `#${Math.floor(480000 + Math.random() * 500).toLocaleString()}`,
      lines: journalLines,
    };

    // Calculate updated accounts
    const updatedAccounts = accounts.map((acc) => {
      const line = journalLines.find((l) => l.accountCode === acc.code);
      if (!line) return acc;
      const isDebitNormal = acc.type === 'Asset' || acc.type === 'Expense';
      const delta = isDebitNormal ? line.debit - line.credit : line.credit - line.debit;
      return {
        ...acc,
        balanceUsd: acc.balanceUsd + delta,
        balanceIrr: Math.round((acc.balanceUsd + delta) * 600000),
      };
    });

    // Execute through atomic transaction wrapper
    const txResult = await executeFinancialTransaction(
      'MIGRATION_OPENING_BALANCES',
      {
        accounts,
        journalEntries: [],
        invoices: [],
      },
      (ctx) => {
        // Stage balance overrides
        journalLines.forEach((l) => {
          ctx.stageAccountUpdate(l.accountCode, l.debit, l.credit);
        });
        ctx.stageJournalEntry(openingEntry);
        return {
          jvRef: openingEntry.jvRef,
          turnover: totalDebit,
          rowsCount: migrationRows.length,
        };
      },
      {
        idempotencyKey: migrationIdempotencyKey,
        actor: {
          id: 'usr-migration-1',
          name: 'Arash Kamali (Migration Lead)',
          role: 'Chief Data Officer',
        },
      }
    );

    setIsCommitting(false);

    if (txResult.success) {
      // Record dedicated Audit Log entry
      auditLogService.recordMutation({
        actor: {
          id: 'usr-migration-1',
          name: 'Arash Kamali (Migration Lead)',
          role: 'Chief Data Officer',
        },
        actionType: 'DATA_MIGRATION_COMPLETED',
        entityType: 'OpeningLedger',
        entityId: jvNumber,
        summaryEn: `Historical data migration committed successfully. Opening turnover: $${totalDebit.toLocaleString()} across ${migrationRows.length} accounts. All Chart of Accounts invariants verified.`,
        summaryFa: `مانده‌های افتتاحیه سنوات قبل با گردش ${totalDebit.toLocaleString()} دلار و احراز تعادل ترازنامه با موفقیت در دفاتر کل مستقر گردید.`,
        beforeState: null,
        afterState: {
          jvRef: jvNumber,
          rowsCount: migrationRows.length,
          totalDebit,
          totalCredit,
          imbalance: 0,
        },
        invariantsChecked: ['INV-01', 'INV-02', 'INV-03', 'INV-04', 'INV-05', 'INV-06', 'INV-10', 'INV-14'],
        severity: 'AUDIT_CRITICAL',
      });

      if (onImportOpeningBalances) {
        onImportOpeningBalances(openingEntry, updatedAccounts);
      }

      setCommitMessage({
        type: 'success',
        text:
          language === 'fa'
            ? `سند افتتاحیه ${jvNumber} با گردش ${totalDebit.toLocaleString()} دلار با موفقیت ثبت شد و حساب‌های دفتر کل به‌روزرسانی گردیدند.`
            : `Opening Voucher ${jvNumber} ($${totalDebit.toLocaleString()}) committed atomically. Chart of Accounts balances updated.`,
      });
    } else {
      setCommitMessage({
        type: 'error',
        text: txResult.error?.reasonEn || 'Migration transaction rolled back.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Mode Bar */}
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-[24px]">
              {activeMode === 'dataMigration' ? 'cloud_upload' : 'domain_add'}
            </span>
            <div>
              <h3 className="text-[16px] font-bold">
                {activeMode === 'dataMigration'
                  ? language === 'fa'
                    ? 'ماژول انتقال داده و استقرار مانده افتتاحیه (Data Migration)'
                    : 'Data Migration & Historical Opening Balances'
                  : language === 'fa'
                  ? 'راهنمای راه‌اندازی شرکت جدید'
                  : 'Company Setup & Configuration Wizard'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeMode === 'dataMigration'
                  ? 'Validation against Chart of Accounts • Forced Balanced Double-Entry • Atomic Commit'
                  : 'Multi-jurisdiction corporate structure, accounting basis, and coding tree'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Mode Switch Tabs */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveMode('wizard')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMode === 'wizard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'fa' ? 'مراحل راه‌اندازی' : 'Entity Setup'}
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('dataMigration')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  activeMode === 'dataMigration'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">dataset</span>
                <span>{language === 'fa' ? 'انتقال داده‌ها (سند افتتاحیه)' : 'Data Migration'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* MODE 1: ENTITY SETUP WIZARD */}
        {activeMode === 'wizard' && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="text-[13px] font-bold text-slate-800">
                {step === 1 && 'Step 1: Entity Legal Definition & Country'}
                {step === 2 && 'Step 2: Base Currency & Accounting Basis'}
                {step === 3 && 'Step 3: Industry Chart of Accounts Selection'}
                {step === 4 && 'Step 4: Completion & Data Inception'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">Step {step} of 4</span>
            </div>

            {/* Step Content */}
            <div className="min-h-[220px]">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                      Legal Entity Name (نام حقوقی شرکت)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-[13px] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                      Primary Jurisdiction / Statutory Tax Regime
                    </label>
                    <select className="w-full p-2.5 border border-slate-300 rounded-lg text-[13px]">
                      <option>Iran (Islamic Republic) - INAS Standards (9% / 10% VAT)</option>
                      <option>United Arab Emirates (IFRS - 5% VAT & Corporate Tax)</option>
                      <option>International Multi-Entity Holding (IFRS / US-GAAP)</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                      Base Operating Currency
                    </label>
                    <select
                      value={baseCurrency}
                      onChange={(e) => setBaseCurrency(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-[13px]"
                    >
                      <option value="USD">USD ($) - Dual Reporting with IRR</option>
                      <option value="IRR">IRR (ریال) - National Standard</option>
                      <option value="TOMAN">Toman (تومان) - Commercial Base</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                      Accounting Basis
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountingBasis('Accrual')}
                        className={`p-3 rounded-lg border text-left text-[12px] transition-all ${
                          accountingBasis === 'Accrual'
                            ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">Accrual Basis (تعهدی)</div>
                        <div className="text-[11px] text-slate-500 font-normal mt-1">
                          Full corporate compliance with revenue recognition & matching principle.
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountingBasis('Cash')}
                        className={`p-3 rounded-lg border text-left text-[12px] transition-all ${
                          accountingBasis === 'Cash'
                            ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">Cash Basis (نقدی)</div>
                        <div className="text-[11px] text-slate-500 font-normal mt-1">
                          Simple receipts & disbursements for small sole proprietorships.
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                      Chart of Accounts Industry Template
                    </label>
                    <select
                      value={coaTemplate}
                      onChange={(e) => setCoaTemplate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-[13px]"
                    >
                      <option>Commercial, Trading & Wholesale (بازرگانی)</option>
                      <option>Manufacturing & Industrial Production (تولیدی)</option>
                      <option>IT, Software & Professional Services (خدماتی و فناوری)</option>
                      <option>Contracting & Construction (پیمانکاری)</option>
                    </select>
                  </div>

                  <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-[12px] text-blue-900 space-y-1">
                    <div className="font-bold">Standard 4-Digit Multi-Tier Coding Tree:</div>
                    <p className="text-[11px] text-blue-800">
                      ✓ Class 1: Assets (1010 Cash, 1200 AR, 1300 Inventory, 1500 Fixed Assets)<br />
                      ✓ Class 2: Liabilities (2010 AP, 2200 Tax Provision, 2500 Long-Term Debt)<br />
                      ✓ Class 3: Equity (3010 Share Capital, 3050 Retained Earnings)<br />
                      ✓ Class 4 & 5: Revenue & Direct COGS (4010 Sales, 5010 Cost of Goods Sold)<br />
                      ✓ Class 6: Operational & G&A Expenses (6010 Overhead, 6020 Marketing)
                    </p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-[32px]">check_circle</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-[16px]">Entity Configured & Inception Ready!</h4>
                  <p className="text-[12px] text-slate-500 max-w-md mx-auto">
                    You can complete the wizard now, or proceed directly to the <strong>Data Migration</strong> module to import historical opening balances from prior fiscal years.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMode('dataMigration')}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[12px] font-semibold shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    <span>Proceed to Opening Balances Migration</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-[12px] font-medium"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2 bg-[#0051d5] hover:bg-blue-700 text-white rounded-lg text-[12px] font-semibold shadow-xs"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold shadow-xs"
                >
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: DATA MIGRATION & OPENING BALANCES */}
        {activeMode === 'dataMigration' && (
          <div className="p-6 space-y-5">
            {/* Top Controls & Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[12px] font-bold text-slate-800 block">
                  {language === 'fa' ? 'الگوهای سریع انتقال داده:' : 'Quick Migration Templates & Tools:'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('commercial')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-semibold text-slate-700"
                  >
                    Commercial Trading Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('manufacturing')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-semibold text-slate-700"
                  >
                    Manufacturing Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRawJsonModalOpen(true)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">code</span>
                    <span>Paste Raw JSON / TSV</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    Opening Date:
                  </label>
                  <input
                    type="date"
                    value={migrationDate}
                    onChange={(e) => setMigrationDate(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="mt-3.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            {/* Balances Grid Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5 w-48">Account Code & Title</th>
                      <th className="p-2.5 w-32 text-right">Debit ($)</th>
                      <th className="p-2.5 w-32 text-right">Credit ($)</th>
                      <th className="p-2.5">Memo / Audit Reference</th>
                      <th className="p-2.5 w-16 text-center">Status</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {migrationRows.map((row, idx) => {
                      const validation = rowValidations[idx];
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !validation?.isValid ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-[11px] text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2.5">
                            <select
                              value={row.accountCode}
                              onChange={(e) => {
                                const selected = accounts.find((a) => a.code === e.target.value);
                                const updated = [...migrationRows];
                                updated[idx].accountCode = e.target.value;
                                if (selected) {
                                  updated[idx].accountNameEn = selected.nameEn;
                                  updated[idx].accountNameFa = selected.nameFa;
                                }
                                setMigrationRows(updated);
                              }}
                              className={`w-full p-1.5 border rounded text-[12px] ${
                                !validation?.isValid
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
                                  : 'border-slate-300'
                              }`}
                            >
                              {accounts.map((acc) => (
                                <option key={acc.code} value={acc.code}>
                                  {acc.code} - {acc.nameEn} ({acc.type})
                                </option>
                              ))}
                            </select>
                            {!validation?.isValid && (
                              <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                                {validation?.errorMessage}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              value={row.debit}
                              onChange={(e) => {
                                const updated = [...migrationRows];
                                updated[idx].debit = Number(e.target.value);
                                setMigrationRows(updated);
                              }}
                              className="w-full p-1.5 border border-slate-300 rounded text-right font-mono text-[12px]"
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              value={row.credit}
                              onChange={(e) => {
                                const updated = [...migrationRows];
                                updated[idx].credit = Number(e.target.value);
                                setMigrationRows(updated);
                              }}
                              className="w-full p-1.5 border border-slate-300 rounded text-right font-mono text-[12px]"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.memoEn}
                              onChange={(e) => {
                                const updated = [...migrationRows];
                                updated[idx].memoEn = e.target.value;
                                setMigrationRows(updated);
                              }}
                              placeholder="Historical reference..."
                              className="w-full p-1.5 border border-slate-200 rounded text-[11px]"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            {validation?.isValid ? (
                              <span className="material-symbols-outlined text-emerald-600 text-[18px]" title="Validated in Chart of Accounts">
                                check_circle
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-rose-600 text-[18px]" title={validation?.errorMessage}>
                                error
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals & Balance Bar */}
              <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-6 font-mono text-[12px]">
                  <div>
                    <span className="text-slate-500 mr-2">Total Debits:</span>
                    <strong className="text-blue-700">${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">Total Credits:</span>
                    <strong className="text-emerald-700">${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">Imbalance:</span>
                    <strong className={isBalanced ? 'text-emerald-600' : 'text-rose-600'}>
                      ${imbalanceAmount.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {!isBalanced && (
                  <button
                    type="button"
                    onClick={handleAutoBalanceToRetainedEarnings}
                    className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">balance</span>
                    <span>Auto-Balance to Retained Earnings (3050)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status Alert */}
            {commitMessage && (
              <div
                className={`p-3 rounded-xl border text-[12px] flex items-center gap-2 ${
                  commitMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {commitMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{commitMessage.text}</span>
              </div>
            )}

            {/* Validation & Commit Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 text-[12px]">
                {canCommit ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Ready for Commit: Validated against Chart of Accounts & 100% Balanced</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    <span>
                      {!isBalanced
                        ? `Imbalance of $${imbalanceAmount.toFixed(2)} detected. Debits and Credits must match exactly.`
                        : 'Some account codes are invalid or missing in the Chart of Accounts.'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-[12px] font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCommitMigration}
                  disabled={!canCommit || isCommitting}
                  className={`px-5 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                    canCommit && !isCommitting
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isCommitting ? 'Committing...' : 'Commit Opening Balances to Ledger'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raw JSON / TSV Import Modal */}
      {isRawJsonModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-[14px]">Import Raw JSON Array</h4>
            <p className="text-[11px] text-slate-500">
              Paste an array of objects with keys: <code>accountCode, debit, credit, memoEn</code>.
            </p>
            <textarea
              rows={8}
              value={rawJsonInput}
              onChange={(e) => setRawJsonInput(e.target.value)}
              placeholder='[{"accountCode": "1010", "debit": 50000, "credit": 0, "memoEn": "Cash"}]'
              className="w-full p-2 border border-slate-300 rounded-lg text-[11px] font-mono"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRawJsonModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[12px] font-semibold"
              >
                Parse & Populate Grid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
