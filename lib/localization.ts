// Himoora Financial Suite - Bilingual Localization Engine (English & Persian)

export type Language = 'en' | 'fa';

export interface TranslationDictionary {
  brandTitle: string;
  brandSubtitle: string;
  commandCenter: string;
  salesAndInvoicing: string;
  purchasesAndExpenses: string;
  accountingAndLedger: string;
  bankingAndTreasury: string;
  inventoryAndValuation: string;
  financialReports: string;
  enterpriseControls: string;
  himooraIntelligence: string;
  settingsAndRoles: string;
  
  // Executive Header
  fiscalPeriod: string;
  consolidated: string;
  rateNotice: string;
  liveStreamActive: string;
  createInvoice: string;
  recordExpense: string;
  postJournal: string;
  reconcile: string;
  exportAudit: string;
  searchPlaceholder: string;
  newButton: string;

  // KPI Cards
  netLiquidTreasury: string;
  netLiquidTreasurySubtitle: string;
  arTotalExposure: string;
  arTotalExposureSubtitle: string;
  apCurrentPosition: string;
  apCurrentPositionSubtitle: string;
  fiscalPnlYtd: string;
  fiscalPnlYtdSubtitle: string;
  operatingCash: string;
  termDeposits: string;
  undepositedDrafts: string;
  runway: string;
  current0to30: string;
  overdue30Plus: string;
  dsoLabel: string;
  targetDso: string;
  criticalDue7Days: string;
  scheduledBatch: string;
  contractRetainage: string;
  solvencyStatus: string;
  taxProvision: string;
  ebitdaMargin: string;
  operatingOpex: string;
  marginLabel: string;
  revenueYoY: string;

  // Chart & Modules
  cashVelocityTitle: string;
  cashVelocitySubtitle: string;
  grossCollections: string;
  disbursements: string;
  netBuffer: string;
  avgInflow: string;
  trailing6Months: string;
  
  arAgingTitle: string;
  arAgingSubtitle: string;
  counterparty: string;
  refInvoice: string;
  agingBracket: string;
  amountUsd: string;
  irrEquivalent: string;
  riskTier: string;
  action: string;
  demandNotice: string;
  allocatePayment: string;
  statement: string;
  legalLock: string;
  openDetailedMatrix: string;

  generalLedgerTitle: string;
  generalLedgerSubtitle: string;
  auditBlockVerified: string;
  timestampRef: string;
  ledgerAccountsMemo: string;
  debit: string;
  credit: string;
  signOff: string;

  governanceTitle: string;
  governanceSubtitle: string;
  pendingCount: string;
  review: string;
  approve: string;
  reviewEntry: string;

  bankFeedsTitle: string;
  bankFeedsSubtitle: string;
  unmatched: string;
  reconciled: string;
  reconcileFeed: string;
  acceptMatch: string;
  zeroVariance: string;

  copilotTitle: string;
  copilotSubtitle: string;
  recommendedDeepDives: string;

  footerCompliance: string;
  footerCrypto: string;

  // Plan tiers
  starter: string;
  professional: string;
  businessPro: string;
  enterprise: string;

  // View modes
  mobileSimulator: string;
  desktopView: string;
}

export const DICTIONARY: Record<Language, TranslationDictionary> = {
  en: {
    brandTitle: 'Himoora Suite',
    brandSubtitle: 'ترازحساب ابری',
    commandCenter: 'Command Center',
    salesAndInvoicing: 'Sales & Invoicing',
    purchasesAndExpenses: 'Purchases & Expenses',
    accountingAndLedger: 'Accounting & Ledger',
    bankingAndTreasury: 'Banking & Treasury',
    inventoryAndValuation: 'Inventory & Valuation',
    financialReports: 'Financial Reports',
    enterpriseControls: 'Enterprise Controls',
    himooraIntelligence: 'Himoora Intelligence',
    settingsAndRoles: 'Settings & Roles',

    fiscalPeriod: 'Fiscal Period',
    consolidated: 'Consolidated',
    rateNotice: '1 USD ≈ 585,000 IRR',
    liveStreamActive: 'Live Stream Active',
    createInvoice: 'Create Invoice',
    recordExpense: 'Record Expense',
    postJournal: 'Post Journal',
    reconcile: 'Reconcile',
    exportAudit: 'Export Balance',
    searchPlaceholder: 'Search accounts, invoices, journals... (⌘K)',
    newButton: 'New',

    netLiquidTreasury: 'Net Liquid Treasury',
    netLiquidTreasurySubtitle: 'نقدینگی و خزانه‌داری',
    arTotalExposure: 'AR Total Exposure',
    arTotalExposureSubtitle: 'مطالبات / اسناد دریافتنی',
    apCurrentPosition: 'AP Current Position',
    apCurrentPositionSubtitle: 'تعهدات و بستانکاران',
    fiscalPnlYtd: 'Fiscal P&L (YTD)',
    fiscalPnlYtdSubtitle: 'سود خالص و عملکرد سالانه',
    operatingCash: 'Operating Cash',
    termDeposits: 'Term Deposits (30D)',
    undepositedDrafts: 'Undeposited Drafts',
    runway: 'Runway',
    current0to30: 'Current (0–30 Days)',
    overdue30Plus: 'Overdue (>30 Days)',
    dsoLabel: 'DSO 34.2 Days',
    targetDso: 'Target < 35d',
    criticalDue7Days: 'Critical Due (<7 Days)',
    scheduledBatch: 'Scheduled Batch',
    contractRetainage: 'Contract Retainage',
    solvencyStatus: 'Solvent Position',
    taxProvision: 'Accrued Tax Provision',
    ebitdaMargin: 'EBITDA Margin',
    operatingOpex: 'Operating Overhead (Opex)',
    marginLabel: 'Margin',
    revenueYoY: 'Rev: $3.89M (+18.4% YoY)',

    cashVelocityTitle: 'Cash Velocity & Liquidity Horizon',
    cashVelocitySubtitle: 'Monthly Net Inflow/Outflow dynamics with rolling 60-day predictive variance (تحلیل جریان وجوه نقد)',
    grossCollections: 'Gross Collections (Inflow)',
    disbursements: 'Disbursements (Outflow)',
    netBuffer: 'Net Treasury Buffer',
    avgInflow: 'Avg Monthly Inflow',
    trailing6Months: 'Trailing 6 Months',

    arAgingTitle: 'AR Aging Schedule & Delinquency Monitor',
    arAgingSubtitle: 'سود و دریافتنی‌ها بر اساس دوره سنی وصول، تفکیک اعتبار و شاخص وصول مطالبات',
    counterparty: 'Counterparty / Customer',
    refInvoice: 'Ref / Invoice',
    agingBracket: 'Aging Bracket',
    amountUsd: 'Amount (USD)',
    irrEquivalent: 'IRR Equivalent',
    riskTier: 'Risk Tier',
    action: 'Action',
    demandNotice: 'Demand Notice',
    allocatePayment: 'Allocate Pay',
    statement: 'Statement',
    legalLock: 'Legal Lock',
    openDetailedMatrix: 'Open Detailed Aging Matrix (دفتر معین تفصیلی)',

    generalLedgerTitle: 'Real-Time General Ledger Stream',
    generalLedgerSubtitle: 'دفتر روزنامه زنده و اسناد ثبت دوبل با تأییدیه حسابرسی الکترونیک',
    auditBlockVerified: 'Audit Block #481,209 Verified',
    timestampRef: 'Timestamp / JV Ref',
    ledgerAccountsMemo: 'Ledger Accounts & Memo',
    debit: 'Debit (بدهکار)',
    credit: 'Credit (بستانکار)',
    signOff: 'Sign-off',

    governanceTitle: 'Governance & Approvals',
    governanceSubtitle: 'اقدامات مالی نیازمند تأیید مدیر مالی / کنترلر',
    pendingCount: '3 Pending',
    review: 'Review',
    approve: 'Approve',
    reviewEntry: 'Review Entry',

    bankFeedsTitle: 'Bank Feeds & Treasury Health',
    bankFeedsSubtitle: 'وضعیت مغایرت‌گیری و تطبیق تراکنش‌های بانکی',
    unmatched: 'Unmatched',
    reconciled: 'Reconciled',
    reconcileFeed: 'Reconcile Feed',
    acceptMatch: 'Accept Match',
    zeroVariance: 'Zero Variance',

    copilotTitle: 'Himoora Intelligence Copilot',
    copilotSubtitle: 'تحلیل هوشمند انحرافات مالی و الگوهای خزانه‌داری',
    recommendedDeepDives: 'Recommended Deep Dives',

    footerCompliance: 'IFRS & Iranian National Accounting Standards (INAS) Compliant',
    footerCrypto: 'Cryptographically Timestamped Accounting Session • Enterprise Ledger ID: HL-1403-ENT-90218',

    starter: 'Starter',
    professional: 'Professional',
    businessPro: 'Business Pro',
    enterprise: 'ENTERPRISE',

    mobileSimulator: 'Android Phone View',
    desktopView: 'Desktop Command Center',
  },
  fa: {
    brandTitle: 'ترازحساب ابری هیمورا',
    brandSubtitle: 'Himoora Financial Suite',
    commandCenter: 'مرکز فرماندهی مالی',
    salesAndInvoicing: 'فروش و صورتحساب‌ها',
    purchasesAndExpenses: 'خریدها و هزینه‌ها',
    accountingAndLedger: 'حسابداری و اسناد روزنامه',
    bankingAndTreasury: 'خزانه‌داری و مغایرت بانکی',
    inventoryAndValuation: 'انبارداری و ارزش‌گذاری کالا',
    financialReports: 'صورت‌های مالی و گزارش‌ها',
    enterpriseControls: 'کنترل‌های حاکمیتی و مجوزها',
    himooraIntelligence: 'دستیار هوش مالی هیمورا',
    settingsAndRoles: 'تنظیمات و دسترسی کاربران',

    fiscalPeriod: 'دوره مالی',
    consolidated: 'تلفیقی',
    rateNotice: '۱ دلار ≈ ۵۸۵،۰۰۰ ریال (۵۸،۵۰۰ تومان)',
    liveStreamActive: 'جریان زنده حسابرسی فعال',
    createInvoice: 'صدور فاکتور فروش',
    recordExpense: 'ثبت سند هزینه',
    postJournal: 'ثبت سند دوبل',
    reconcile: 'مغایرت‌گیری بانکی',
    exportAudit: 'خروجی تراز آزمایشی',
    searchPlaceholder: 'جستجو در سرفصل‌ها، فاکتورها، اسناد... (⌘K)',
    newButton: 'جدید',

    netLiquidTreasury: 'خالص نقدینگی و خزانه‌داری',
    netLiquidTreasurySubtitle: 'Net Liquid Treasury',
    arTotalExposure: 'مجموع اسناد دریافتنی (مطالبات)',
    arTotalExposureSubtitle: 'AR Total Exposure',
    apCurrentPosition: 'مجموع بدهی‌ها و اسناد پرداختنی',
    apCurrentPositionSubtitle: 'AP Current Position',
    fiscalPnlYtd: 'سود و زیان سالانه (YTD)',
    fiscalPnlYtdSubtitle: 'Fiscal P&L (YTD)',
    operatingCash: 'وجوه نقد در گردش',
    termDeposits: 'سپرده‌های کوتاه‌مدت',
    undepositedDrafts: 'اسناد در جریان وصول',
    runway: 'ماهه دوره تاب‌آوری نقدی',
    current0to30: 'جاری (۰ تا ۳۰ روز)',
    overdue30Plus: 'معوق (بیش از ۳۰ روز)',
    dsoLabel: 'دوره وصول ۳۴.۲ روز',
    targetDso: 'هدف: زیر ۳۵ روز',
    criticalDue7Days: 'سررسید بحرانی (کمتر از ۷ روز)',
    scheduledBatch: 'برنامه پرداخت دوره‌ای',
    contractRetainage: 'سپرده حسن انجام کار',
    solvencyStatus: 'وضعیت با توان پرداخت کامل',
    taxProvision: 'ذخیره مالیات عملکرد',
    ebitdaMargin: 'حاشیه سود ناخالص',
    operatingOpex: 'هزینه‌های عملیاتی و اداری',
    marginLabel: 'حاشیه سود خالص',
    revenueYoY: 'فروش: ۳.۸۹ میلیون دلار (+۱۸.۴٪ رشد سالانه)',

    cashVelocityTitle: 'سرعت نقدینگی و افق خزانه‌داری',
    cashVelocitySubtitle: 'جریان ورودی و خروجی وجوه نقد با پیش‌بینی واریانس ۶۰ روزه',
    grossCollections: 'وصولی ناخالص (ورودی)',
    disbursements: 'پرداخت‌ها و مصارف (خروجی)',
    netBuffer: 'خط مازاد نقدینگی',
    avgInflow: 'میانگین وصول ماهانه',
    trailing6Months: '۶ ماه گذشته',

    arAgingTitle: 'جدول سنی مطالبات و پایش معوقات (AR Aging)',
    arAgingSubtitle: 'تفکیک اعتبار طرف‌حساب‌ها، رتبه‌بندی ریسک و وضعیت وصول مطالبات',
    counterparty: 'طرف‌حساب / مشتری',
    refInvoice: 'شناسه / فاکتور',
    agingBracket: 'دوره سنی وصول',
    amountUsd: 'مبلغ (دلار)',
    irrEquivalent: 'معادل ریالی',
    riskTier: 'سطح ریسک',
    action: 'عملیات',
    demandNotice: 'اخطار وصول',
    allocatePayment: 'تخصیص وجه',
    statement: 'صورتحساب',
    legalLock: 'قفل حقوقی',
    openDetailedMatrix: 'مشاهده ماتریس تفصیلی دفتر معین مطالبات',

    generalLedgerTitle: 'دفتر روزنامه زنده و اسناد حسابداری دوبل',
    generalLedgerSubtitle: 'سیستم ثبت آنی اسناد با قفل غیرقابل بازگشت و کد اعتبارسنجی بلاک',
    auditBlockVerified: 'تأییدیه بلاک حسابرسی #۴۸۱،۲۰۹',
    timestampRef: 'زمان / عطف سند',
    ledgerAccountsMemo: 'سرفصل‌های کل و معین و شرح سند',
    debit: 'بدهکار (Debit)',
    credit: 'بستانکار (Credit)',
    signOff: 'تأییدکننده',

    governanceTitle: 'کارتابل کنترل‌های حاکمیتی و مجوزها',
    governanceSubtitle: 'درخواست‌های مالی نیازمند تأیید مدیر ارشد مالی و کنترلر',
    pendingCount: '۳ مورد در انتظار',
    review: 'بررسی جزئیات',
    approve: 'تأیید نهایی',
    reviewEntry: 'مشاهده سند حسابداری',

    bankFeedsTitle: 'تراکنش‌های بانکی و مغایرت‌گیری خودکار',
    bankFeedsSubtitle: 'وضعیت اتصال فیدهای بانکی و تطبیق هوشمند هوایی و شتاب',
    unmatched: 'تطبیق‌نیافته',
    reconciled: 'تراز شده کامل',
    reconcileFeed: 'مغایرت‌گیری فید',
    acceptMatch: 'تأیید تطابق',
    zeroVariance: 'مغایرت صفر',

    copilotTitle: 'دستیار تحلیل مالی هوشمند هیمورا',
    copilotSubtitle: 'کشف الگوهای خزانه‌داری، انحرافات بودجه و سرعت گردش وجه نقد',
    recommendedDeepDives: 'تحلیل‌های عمیق پیشنهادی',

    footerCompliance: 'منطبق با استانداردهای حسابداری بین‌المللی (IFRS) و استانداردهای ملی حسابداری ایران (INAS)',
    footerCrypto: 'نشست حسابداری با امضای دیجیتال • شناسه دفتر کل سازمانی: HL-1403-ENT-90218',

    starter: 'پایه (استارتر)',
    professional: 'حرفه‌ای (پرو)',
    businessPro: 'کسب‌وکار پیشرفته',
    enterprise: 'سازمانی جامع',

    mobileSimulator: 'نمای گوشی اندروید',
    desktopView: 'مرکز فرماندهی دسکتاپ',
  },
};
