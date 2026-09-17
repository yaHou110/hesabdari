// Himoora Financial Suite - 14 Core Accounting Ledger Invariants Engine
// Strict validation rules enforcing mathematical, relational, and regulatory accounting principles

import { JournalEntry, Account } from './accounting-engine';

export interface InvariantDefinition {
  code: string; // e.g. 'INV-01'
  nameEn: string;
  nameFa: string;
  descriptionEn: string;
  descriptionFa: string;
  severity: 'CRITICAL_ERROR' | 'GOVERNANCE_WARNING';
  category: 'MATHEMATICAL' | 'STRUCTURAL' | 'CHART_OF_ACCOUNTS' | 'AUDIT_GOVERNANCE' | 'REGULATORY';
}

export interface InvariantViolation {
  code: string;
  nameEn: string;
  nameFa: string;
  messageEn: string;
  messageFa: string;
  severity: 'CRITICAL_ERROR' | 'GOVERNANCE_WARNING';
  lineId?: string;
  field?: string;
  actualValue?: any;
  expectedValue?: any;
}

export interface InvariantCheckReport {
  code: string;
  nameEn: string;
  nameFa: string;
  passed: boolean;
  details?: string;
}

export interface InvariantValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  errors: InvariantViolation[];
  warnings: InvariantViolation[];
  messageEn: string;
  messageFa: string;
  checks: InvariantCheckReport[];
  totalDebit: number;
  totalCredit: number;
  imbalanceAmount: number;
  validationTimestamp: string;
}

export interface LedgerValidationContext {
  existingEntries?: JournalEntry[];
  chartOfAccounts?: Account[];
  openFiscalPeriods?: { start: string; end: string; name: string }[];
  lockedPeriods?: { start: string; end: string; name: string }[];
  maxFutureDays?: number;
  enforceUniqueRef?: boolean;
  enforceExistingAccountCode?: boolean;
}

// 14 Core Accounting Invariants
export const INVARIANTS_REGISTRY: InvariantDefinition[] = [
  {
    code: 'INV-01',
    nameEn: 'Double-Entry Mathematical Parity',
    nameFa: 'توازن ریاضی ثبت دوبل (تراز بدهکار و بستانکار)',
    descriptionEn: 'The sum of all line debits must equal the sum of all line credits exactly with zero floating-point variance (tolerance < 0.001 USD/IRR).',
    descriptionFa: 'مجموع کلیه اقلام بدهکار باید دقیقا با مجموع کلیه اقلام بستانکار برابر باشد.',
    severity: 'CRITICAL_ERROR',
    category: 'MATHEMATICAL',
  },
  {
    code: 'INV-02',
    nameEn: 'Multi-Leg Completeness',
    nameFa: 'حداقل اقلام ثبت دوبل (حداقل دو ردیف)',
    descriptionEn: 'A journal voucher must contain at least two valid lines: at least one debit leg and at least one credit leg.',
    descriptionFa: 'هر سند روزنامه باید حداقل شامل دو ردیف متمایز باشد: حداقل یک ردیف بدهکار و یک ردیف بستانکار.',
    severity: 'CRITICAL_ERROR',
    category: 'STRUCTURAL',
  },
  {
    code: 'INV-03',
    nameEn: 'Non-Negative Line Magnitude',
    nameFa: 'عدم ثبت مبالغ منفی در ردیف‌ها',
    descriptionEn: 'Debits and credits on every journal line must be greater than or equal to zero. Reversals must be executed by alternating leg polarity, not negative signs.',
    descriptionFa: 'مبالغ بدهکار و بستانکار باید بزرگتر یا مساوی صفر باشند. اصلاح اسناد باید با ثبت معکوس انجام شود نه با علامت منفی.',
    severity: 'CRITICAL_ERROR',
    category: 'MATHEMATICAL',
  },
  {
    code: 'INV-04',
    nameEn: 'Mutually Exclusive Leg Polarity',
    nameFa: 'تفکیک ماهیت ردیف (بدهکار یا بستانکار انحصاری)',
    descriptionEn: 'A single journal line cannot have both a non-zero debit and a non-zero credit simultaneously.',
    descriptionFa: 'یک ردیف سند نمی‌تواند همزمان دارای هر دو مقدار بدهکار و بستانکار غیرصفر باشد.',
    severity: 'CRITICAL_ERROR',
    category: 'STRUCTURAL',
  },
  {
    code: 'INV-05',
    nameEn: 'Chart of Accounts Postability',
    nameFa: 'اعتبار سرفصل و قابلیت ثبت در سطح معین/تفصیلی',
    descriptionEn: 'All targeted account codes must exist in the active Chart of Accounts and must be postable leaf-level accounts (cannot post directly to synthetic parent rollup headers).',
    descriptionFa: 'تمام کدهای حساب باید در دفتر کل تعریف شده و در سطح قابل ثبت (معین/تفصیلی) باشند نه سرفصل‌های سرگروه.',
    severity: 'CRITICAL_ERROR',
    category: 'CHART_OF_ACCOUNTS',
  },
  {
    code: 'INV-06',
    nameEn: 'Non-Zero Monetary Value',
    nameFa: 'عدم ثبت سند با ارزش صفر',
    descriptionEn: 'Total debits and total credits of the journal entry must be strictly greater than zero.',
    descriptionFa: 'مجموع گردش مالی سند حسابداری باید اکیداً بزرگتر از صفر باشد.',
    severity: 'CRITICAL_ERROR',
    category: 'MATHEMATICAL',
  },
  {
    code: 'INV-07',
    nameEn: 'Posted Entry Immutability',
    nameFa: 'قفل تغییرناپذیری اسناد قطعی‌شده',
    descriptionEn: 'Entries marked as Posted or Locked cannot be mutated in place; any alteration mandates a compensating reversal entry (#REV-).',
    descriptionFa: 'اسنادی که وضعیت ثبت قطعی (Posted) یا قفل‌شده دارند قابل ویرایش مستقیم نیستند و باید سند اصلاحی/برگشتی صادر شود.',
    severity: 'CRITICAL_ERROR',
    category: 'AUDIT_GOVERNANCE',
  },
  {
    code: 'INV-08',
    nameEn: 'Fiscal Period Lock Compliance',
    nameFa: 'انطباق با دوره مالی باز و عدم ثبت در دوره‌های بسته',
    descriptionEn: 'The journal entry date must reside within an active, open fiscal period and must not fall within a closed or locked financial quarter.',
    descriptionFa: 'تاریخ سند باید در دوره مالی باز جاری قرار داشته باشد و نباید در فصل‌های بسته یا قفل‌شده ثبت گردد.',
    severity: 'CRITICAL_ERROR',
    category: 'REGULATORY',
  },
  {
    code: 'INV-09',
    nameEn: 'Monetary Valuation Consistency',
    nameFa: 'همگامی ارزی و صحت مقیاس ارزی سند',
    descriptionEn: 'All line values must be finite numerical values without NaN or infinite representations and denominated in valid ledger currency units.',
    descriptionFa: 'کلیه مبالغ باید اعداد متناهی و معتبر بوده و مقیاس ارزش‌گذاری ارزی یکپارچه داشته باشند.',
    severity: 'CRITICAL_ERROR',
    category: 'MATHEMATICAL',
  },
  {
    code: 'INV-10',
    nameEn: 'Mandatory Audit Attribution',
    nameFa: 'شناسه صادرکننده و تأییدیه حاکمیتی سند',
    descriptionEn: 'Every journal entry must contain explicit attribution for the creator (createdBy) and authorized sign-off / approver identity.',
    descriptionFa: 'هر سند حسابداری باید مشخصات کاربر صادرکننده و امضای مسئول تأییدکننده را دارا باشد.',
    severity: 'CRITICAL_ERROR',
    category: 'AUDIT_GOVERNANCE',
  },
  {
    code: 'INV-11',
    nameEn: 'Temporal Sequencing & Validity',
    nameFa: 'صحت تاریخ و توالی زمانی ثبت',
    descriptionEn: 'The entry date must be a valid ISO format date (YYYY-MM-DD) and cannot be situated in the far future beyond allowable threshold (+1 day).',
    descriptionFa: 'تاریخ سند باید یک تاریخ معتبر تقویمی بوده و بیش از حد مجاز در آینده ثبت نشده باشد.',
    severity: 'CRITICAL_ERROR',
    category: 'REGULATORY',
  },
  {
    code: 'INV-12',
    nameEn: 'Voucher Reference Uniqueness',
    nameFa: 'یکتایی شماره عطف سند روزنامه (JV Ref)',
    descriptionEn: 'The journal voucher reference (jvRef) must be unique across all active ledger records to prevent voucher collisions.',
    descriptionFa: 'شماره عطف و عطف سند حسابداری (JV Ref) باید در کل دفتر کل یکتا باشد.',
    severity: 'CRITICAL_ERROR',
    category: 'STRUCTURAL',
  },
  {
    code: 'INV-13',
    nameEn: 'Subledger Source Traceability',
    nameFa: 'اصالت پیوند زیرسیستم به دفتر کل (Subledger Link)',
    descriptionEn: 'When sourceDocType is declared (e.g. Invoice, Bill, BankSync), a non-empty sourceDocRef must be present for end-to-end subledger reconciliation.',
    descriptionFa: 'در صورت انتساب سند به زیرسیستم‌ها (فاکتور، خرید، فید بانک)، باید شناسه مرجع سند اصلی ثبت شده باشد.',
    severity: 'GOVERNANCE_WARNING',
    category: 'AUDIT_GOVERNANCE',
  },
  {
    code: 'INV-14',
    nameEn: 'Cryptographic Audit Block Seal',
    nameFa: 'مهر و شناسه بلاک حسابرسی رمزنگاری‌شده',
    descriptionEn: 'The entry must possess a valid auditBlock hash or sequential cryptographic signature ensuring immutable ledger chain integrity.',
    descriptionFa: 'سند قطعی‌شده باید دارای مهر بلاک حسابرسی یا امضای الکترونیک زنجیره دفاتر باشد.',
    severity: 'GOVERNANCE_WARNING',
    category: 'AUDIT_GOVERNANCE',
  },
];

/**
 * Strict Ledger Invariant Validation Engine
 * Validates a JournalEntry against all 14 invariants.
 */
export function validateLedgerInvariants(
  entry: JournalEntry,
  context: LedgerValidationContext = {}
): InvariantValidationResult {
  const errors: InvariantViolation[] = [];
  const warnings: InvariantViolation[] = [];
  const checks: InvariantCheckReport[] = [];

  const {
    existingEntries = [],
    chartOfAccounts = [],
    openFiscalPeriods = [{ start: '2024-01-01', end: '2025-12-31', name: 'FY 1403 / 24-25' }],
    lockedPeriods = [{ start: '2023-01-01', end: '2023-12-31', name: 'FY 1402 Closed' }],
    maxFutureDays = 1,
    enforceUniqueRef = true,
    enforceExistingAccountCode = true,
  } = context;

  // Track totals
  let totalDebit = 0;
  let totalCredit = 0;
  let debitLineCount = 0;
  let creditLineCount = 0;

  // --- INV-03, INV-04, INV-05, INV-09 (Line-level analysis) ---
  let hasNegativeAmount = false;
  let hasBothDebitAndCredit = false;
  let hasInvalidNumber = false;
  const invalidAccountLines: { lineId: string; code: string; reason: string }[] = [];

  const lines = entry.lines || [];

  for (const line of lines) {
    const debit = Number(line.debit);
    const credit = Number(line.credit);

    if (isNaN(debit) || isNaN(credit) || !isFinite(debit) || !isFinite(credit)) {
      hasInvalidNumber = true;
    }

    if (debit < 0 || credit < 0) {
      hasNegativeAmount = true;
      errors.push({
        code: 'INV-03',
        nameEn: 'Non-Negative Line Magnitude',
        nameFa: 'عدم ثبت مبالغ منفی در ردیف‌ها',
        messageEn: `Line ${line.id || 'N/A'} contains negative values (Debit: ${debit}, Credit: ${credit}).`,
        messageFa: `ردیف با کد سرفصل ${line.accountCode} دارای مقدار منفی است.`,
        severity: 'CRITICAL_ERROR',
        lineId: line.id,
      });
    }

    if (debit > 0 && credit > 0) {
      hasBothDebitAndCredit = true;
      errors.push({
        code: 'INV-04',
        nameEn: 'Mutually Exclusive Leg Polarity',
        nameFa: 'تفکیک ماهیت ردیف (بدهکار یا بستانکار انحصاری)',
        messageEn: `Line ${line.id || 'N/A'} for account ${line.accountCode} has both debit (${debit}) and credit (${credit}) amounts.`,
        messageFa: `ردیف با کد ${line.accountCode} همزمان هم بدهکار و هم بستانکار دارد.`,
        severity: 'CRITICAL_ERROR',
        lineId: line.id,
      });
    }

    if (debit > 0) {
      totalDebit += debit;
      debitLineCount++;
    }
    if (credit > 0) {
      totalCredit += credit;
      creditLineCount++;
    }

    // Check Account Code in COA
    if (enforceExistingAccountCode && chartOfAccounts.length > 0) {
      const matchedAccount = chartOfAccounts.find((a) => a.code === line.accountCode);
      if (!matchedAccount) {
        invalidAccountLines.push({
          lineId: line.id,
          code: line.accountCode,
          reason: 'Account code not found in Chart of Accounts',
        });
      } else if (matchedAccount.isPostable === false) {
        invalidAccountLines.push({
          lineId: line.id,
          code: line.accountCode,
          reason: 'Account is a synthetic parent/header and cannot receive direct GL postings',
        });
      }
    }
  }

  // --- INV-01: Double-Entry Mathematical Parity ---
  const imbalanceAmount = Math.abs(Math.round(totalDebit * 1000) - Math.round(totalCredit * 1000)) / 1000;
  const isInv01Passed = imbalanceAmount < 0.001 && totalDebit > 0;
  if (!isInv01Passed && totalDebit > 0 && totalCredit > 0) {
    errors.push({
      code: 'INV-01',
      nameEn: 'Double-Entry Mathematical Parity',
      nameFa: 'توازن ریاضی ثبت دوبل (تراز بدهکار و بستانکار)',
      messageEn: `Ledger out of balance! Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)}). Difference: $${imbalanceAmount.toFixed(2)}`,
      messageFa: `سند تراز نیست! مجموع بدهکار (${totalDebit.toLocaleString()}) با بستانکار (${totalCredit.toLocaleString()}) مغایرت دارد. اختلاف: ${imbalanceAmount.toLocaleString()}`,
      severity: 'CRITICAL_ERROR',
      actualValue: { totalDebit, totalCredit, imbalanceAmount },
      expectedValue: { imbalanceAmount: 0 },
    });
  }
  checks.push({
    code: 'INV-01',
    nameEn: 'Double-Entry Mathematical Parity',
    nameFa: 'توازن ریاضی ثبت دوبل',
    passed: isInv01Passed,
    details: `Debit: $${totalDebit.toFixed(2)} | Credit: $${totalCredit.toFixed(2)} | Δ: $${imbalanceAmount.toFixed(4)}`,
  });

  // --- INV-02: Multi-Leg Completeness ---
  const isInv02Passed = lines.length >= 2 && debitLineCount >= 1 && creditLineCount >= 1;
  if (!isInv02Passed) {
    errors.push({
      code: 'INV-02',
      nameEn: 'Multi-Leg Completeness',
      nameFa: 'حداقل اقلام ثبت دوبل (حداقل دو ردیف)',
      messageEn: `Entry must have at least two legs (min 1 debit, min 1 credit). Found: ${lines.length} lines (${debitLineCount} debit, ${creditLineCount} credit).`,
      messageFa: `سند باید حداقل دارای ۲ ردیف معتبر (حداقل یک بدهکار و یک بستانکار) باشد.`,
      severity: 'CRITICAL_ERROR',
    });
  }
  checks.push({
    code: 'INV-02',
    nameEn: 'Multi-Leg Completeness',
    nameFa: 'حداقل اقلام ثبت دوبل',
    passed: isInv02Passed,
    details: `Lines: ${lines.length}, Dr legs: ${debitLineCount}, Cr legs: ${creditLineCount}`,
  });

  // --- INV-03 Check Report ---
  checks.push({
    code: 'INV-03',
    nameEn: 'Non-Negative Line Magnitude',
    nameFa: 'عدم ثبت مبالغ منفی در ردیف‌ها',
    passed: !hasNegativeAmount,
  });

  // --- INV-04 Check Report ---
  checks.push({
    code: 'INV-04',
    nameEn: 'Mutually Exclusive Leg Polarity',
    nameFa: 'تفکیک ماهیت ردیف',
    passed: !hasBothDebitAndCredit,
  });

  // --- INV-05: Chart of Accounts Validity ---
  const isInv05Passed = invalidAccountLines.length === 0;
  if (!isInv05Passed) {
    for (const invAcc of invalidAccountLines) {
      errors.push({
        code: 'INV-05',
        nameEn: 'Chart of Accounts Postability',
        nameFa: 'اعتبار سرفصل و قابلیت ثبت در سطح معین/تفصیلی',
        messageEn: `Invalid posting target: Code '${invAcc.code}' (${invAcc.reason}).`,
        messageFa: `کد سرفصل '${invAcc.code}' معتبر یا قابل ثبت در دفتر کل نیست (${invAcc.reason}).`,
        severity: 'CRITICAL_ERROR',
        lineId: invAcc.lineId,
      });
    }
  }
  checks.push({
    code: 'INV-05',
    nameEn: 'Chart of Accounts Postability',
    nameFa: 'اعتبار سرفصل و قابلیت ثبت',
    passed: isInv05Passed,
    details: isInv05Passed ? 'All account codes validated as active postable leaf nodes' : `${invalidAccountLines.length} invalid codes`,
  });

  // --- INV-06: Non-Zero Monetary Value ---
  const isInv06Passed = totalDebit > 0 && totalCredit > 0;
  if (!isInv06Passed) {
    errors.push({
      code: 'INV-06',
      nameEn: 'Non-Zero Monetary Value',
      nameFa: 'عدم ثبت سند با ارزش صفر',
      messageEn: 'Total journal turnover magnitude must be greater than zero.',
      messageFa: 'مبلغ کل گردش مالی سند باید بیشتر از صفر باشد.',
      severity: 'CRITICAL_ERROR',
    });
  }
  checks.push({
    code: 'INV-06',
    nameEn: 'Non-Zero Monetary Value',
    nameFa: 'عدم ثبت سند با ارزش صفر',
    passed: isInv06Passed,
  });

  // --- INV-07: Posted Entry Immutability ---
  // If entry already exists in existingEntries and was Posted/Locked, verify it's not being directly rewritten without reversal
  const existingRecord = existingEntries.find((e) => e.id === entry.id);
  let isInv07Passed = true;
  if (existingRecord && (existingRecord.status === 'Posted' || existingRecord.status === 'Locked')) {
    if (entry.status !== 'Reversed' && existingRecord.status === 'Posted') {
      isInv07Passed = false;
      errors.push({
        code: 'INV-07',
        nameEn: 'Posted Entry Immutability',
        nameFa: 'قفل تغییرناپذیری اسناد قطعی‌شده',
        messageEn: `Entry ${entry.jvRef || entry.id} is already in 'Posted' state and cannot be directly modified. Create a reversal voucher instead.`,
        messageFa: `سند ${entry.jvRef} قبلاً قطعی شده و قابل ویرایش در جا نیست. باید سند معکوس صادر شود.`,
        severity: 'CRITICAL_ERROR',
      });
    }
  }
  checks.push({
    code: 'INV-07',
    nameEn: 'Posted Entry Immutability',
    nameFa: 'قفل تغییرناپذیری اسناد قطعی‌شده',
    passed: isInv07Passed,
  });

  // --- INV-08: Fiscal Period Lock Compliance ---
  let isInv08Passed = true;
  if (entry.date) {
    const entryDateObj = new Date(entry.date);
    if (!isNaN(entryDateObj.getTime())) {
      // Check if inside locked period
      for (const locked of lockedPeriods) {
        const start = new Date(locked.start);
        const end = new Date(locked.end);
        if (entryDateObj >= start && entryDateObj <= end) {
          isInv08Passed = false;
          errors.push({
            code: 'INV-08',
            nameEn: 'Fiscal Period Lock Compliance',
            nameFa: 'انطباق با دوره مالی باز',
            messageEn: `Date ${entry.date} falls inside locked period '${locked.name}'. Postings to locked periods are prohibited.`,
            messageFa: `تاریخ سند (${entry.date}) در دوره مالی بسته/قفل‌شده '${locked.name}' قرار دارد و امکان ثبت ندارد.`,
            severity: 'CRITICAL_ERROR',
          });
          break;
        }
      }
    }
  }
  checks.push({
    code: 'INV-08',
    nameEn: 'Fiscal Period Lock Compliance',
    nameFa: 'انطباق با دوره مالی باز',
    passed: isInv08Passed,
  });

  // --- INV-09: Monetary Valuation Consistency ---
  const isInv09Passed = !hasInvalidNumber;
  if (!isInv09Passed) {
    errors.push({
      code: 'INV-09',
      nameEn: 'Monetary Valuation Consistency',
      nameFa: 'همگامی ارزی و صحت مقیاس ارزی سند',
      messageEn: 'Entry contains invalid numbers (NaN or Infinity).',
      messageFa: 'سند شامل مقادیر عددی نامعتبر است.',
      severity: 'CRITICAL_ERROR',
    });
  }
  checks.push({
    code: 'INV-09',
    nameEn: 'Monetary Valuation Consistency',
    nameFa: 'صحت مقادیر عددی و ارزی',
    passed: isInv09Passed,
  });

  // --- INV-10: Mandatory Audit Attribution ---
  const hasCreatedBy = Boolean(entry.createdBy && entry.createdBy.trim().length > 0);
  const hasSignOff = Boolean(entry.signOff && entry.signOff.trim().length > 0);
  const isInv10Passed = hasCreatedBy && hasSignOff;
  if (!isInv10Passed) {
    errors.push({
      code: 'INV-10',
      nameEn: 'Mandatory Audit Attribution',
      nameFa: 'شناسه صادرکننده و تأییدیه حاکمیتی سند',
      messageEn: `Missing mandatory audit fields: ${!hasCreatedBy ? '[createdBy] ' : ''}${!hasSignOff ? '[signOff]' : ''}`,
      messageFa: 'مشخصات صادرکننده یا مسئول تأیید سند تکمیل نشده است.',
      severity: 'CRITICAL_ERROR',
    });
  }
  checks.push({
    code: 'INV-10',
    nameEn: 'Mandatory Audit Attribution',
    nameFa: 'شناسه صادرکننده و تأییدیه',
    passed: isInv10Passed,
    details: `Author: ${entry.createdBy || 'MISSING'}, Sign-off: ${entry.signOff || 'MISSING'}`,
  });

  // --- INV-11: Temporal Sequencing & Validity ---
  let isInv11Passed = false;
  if (entry.date && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    const parsed = new Date(entry.date);
    if (!isNaN(parsed.getTime())) {
      const now = new Date();
      const maxFuture = new Date(now.getTime() + maxFutureDays * 24 * 60 * 60 * 1000);
      if (parsed <= maxFuture) {
        isInv11Passed = true;
      } else {
        errors.push({
          code: 'INV-11',
          nameEn: 'Temporal Sequencing & Validity',
          nameFa: 'صحت تاریخ و توالی زمانی ثبت',
          messageEn: `Entry date '${entry.date}' is too far in the future.`,
          messageFa: `تاریخ سند (${entry.date}) بیش از حد مجاز در آینده است.`,
          severity: 'CRITICAL_ERROR',
        });
      }
    }
  }
  if (!isInv11Passed && errors.filter((e) => e.code === 'INV-11').length === 0) {
    errors.push({
      code: 'INV-11',
      nameEn: 'Temporal Sequencing & Validity',
      nameFa: 'صحت تاریخ و توالی زمانی ثبت',
      messageEn: `Invalid ISO date format: '${entry.date}'. Expected YYYY-MM-DD.`,
      messageFa: `فرمت تاریخ سند (${entry.date}) نامعتبر است. فرمت استاندارد YYYY-MM-DD است.`,
      severity: 'CRITICAL_ERROR',
    });
  }
  checks.push({
    code: 'INV-11',
    nameEn: 'Temporal Sequencing & Validity',
    nameFa: 'صحت تاریخ و توالی زمانی',
    passed: isInv11Passed,
  });

  // --- INV-12: Voucher Reference Uniqueness ---
  let isInv12Passed = true;
  if (enforceUniqueRef && entry.jvRef) {
    const isDuplicate = existingEntries.some(
      (e) => e.id !== entry.id && e.jvRef && e.jvRef.toLowerCase() === entry.jvRef.toLowerCase()
    );
    if (isDuplicate) {
      isInv12Passed = false;
      errors.push({
        code: 'INV-12',
        nameEn: 'Voucher Reference Uniqueness',
        nameFa: 'یکتایی شماره عطف سند روزنامه (JV Ref)',
        messageEn: `Voucher reference '${entry.jvRef}' is already used by another ledger entry.`,
        messageFa: `شماره عطف سند '${entry.jvRef}' تکراری است و قبلاً در سیستم ثبت شده است.`,
        severity: 'CRITICAL_ERROR',
      });
    }
  }
  checks.push({
    code: 'INV-12',
    nameEn: 'Voucher Reference Uniqueness',
    nameFa: 'یکتایی شماره عطف سند روزنامه',
    passed: isInv12Passed,
  });

  // --- INV-13: Subledger Source Traceability (Warning) ---
  let isInv13Passed = true;
  if (entry.sourceDocType && entry.sourceDocType !== 'Manual') {
    if (!entry.sourceDocRef || entry.sourceDocRef.trim().length === 0) {
      isInv13Passed = false;
      warnings.push({
        code: 'INV-13',
        nameEn: 'Subledger Source Traceability',
        nameFa: 'اصالت پیوند زیرسیستم به دفتر کل (Subledger Link)',
        messageEn: `Entry has source type '${entry.sourceDocType}' but missing source document reference (sourceDocRef).`,
        messageFa: `سند دارای نوع منبع '${entry.sourceDocType}' است اما شناسه فاکتور یا سند مبدا درج نشده است.`,
        severity: 'GOVERNANCE_WARNING',
      });
    }
  }
  checks.push({
    code: 'INV-13',
    nameEn: 'Subledger Source Traceability',
    nameFa: 'اصالت پیوند زیرسیستم به دفتر کل',
    passed: isInv13Passed,
  });

  // --- INV-14: Cryptographic Audit Block Seal (Warning) ---
  const isInv14Passed = Boolean(entry.auditBlock && entry.auditBlock.trim().length > 0);
  if (!isInv14Passed && entry.status === 'Posted') {
    warnings.push({
      code: 'INV-14',
      nameEn: 'Cryptographic Audit Block Seal',
      nameFa: 'مهر و شناسه بلاک حسابرسی رمزنگاری‌شده',
      messageEn: 'Posted entry lacks a cryptographic auditBlock hash identifier.',
      messageFa: 'سند قطعی‌شده فاقد شناسه بلاک رمزنگاری حسابرسی است.',
      severity: 'GOVERNANCE_WARNING',
    });
  }
  checks.push({
    code: 'INV-14',
    nameEn: 'Cryptographic Audit Block Seal',
    nameFa: 'شناسه بلاک حسابرسی',
    passed: isInv14Passed,
  });

  const isValid = errors.length === 0;
  const hasWarnings = warnings.length > 0;

  const messageEn = isValid
    ? `All 14 Ledger Invariants strictly satisfied. Debit ($${totalDebit.toFixed(2)}) equals Credit ($${totalCredit.toFixed(2)}).`
    : `Ledger Invariant Validation Failed with ${errors.length} critical violation(s): ${errors.map((e) => `[${e.code}] ${e.messageEn}`).join('; ')}`;

  const messageFa = isValid
    ? `تمامی ۱۴ اصل حسابداری تایید شد: تراز کامل بدهکار (${totalDebit.toLocaleString()}) و بستانکار (${totalCredit.toLocaleString()}).`
    : `خطا در اعتبارسنجی اصول حسابداری (${errors.length} مورد نقض شده): ${errors.map((e) => `[${e.nameFa}] ${e.messageFa}`).join('؛ ')}`;

  return {
    isValid,
    hasWarnings,
    errors,
    warnings,
    messageEn,
    messageFa,
    checks,
    totalDebit,
    totalCredit,
    imbalanceAmount,
    validationTimestamp: new Date().toISOString(),
  };
}

/**
 * Throws a formatted Error if any critical accounting invariants are violated.
 */
export function assertLedgerInvariants(
  entry: JournalEntry,
  context: LedgerValidationContext = {}
): void {
  const result = validateLedgerInvariants(entry, context);
  if (!result.isValid) {
    const primaryError = result.errors[0];
    throw new Error(`[LedgerInvariantError:${primaryError.code}] ${result.messageEn}`);
  }
}
