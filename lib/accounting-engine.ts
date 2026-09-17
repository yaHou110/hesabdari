// Himoora Financial Suite - Domain Accounting Engine & Data Model
// Adheres strictly to Double-Entry Invariants, Multi-Currency, Subledger-GL integrity

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type PlanTier = 'Starter' | 'Professional' | 'Business Pro' | 'Enterprise';

export interface Account {
  code: string;
  nameEn: string;
  nameFa: string;
  type: AccountType;
  category: string;
  balanceUsd: number;
  balanceIrr: number;
  isPostable: boolean;
  parentId?: string;
  descriptionEn?: string;
  descriptionFa?: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountNameEn: string;
  accountNameFa: string;
  debit: number;
  credit: number;
  memoEn: string;
  memoFa: string;
  costCenter?: string;
  project?: string;
}

export interface JournalEntry {
  id: string;
  jvRef: string; // e.g. #JV-1403-1048
  date: string;
  timestamp: string;
  descriptionEn: string;
  descriptionFa: string;
  sourceDocType?: 'Invoice' | 'Bill' | 'BankSync' | 'Manual' | 'Payroll' | 'Adjustment' | 'DataMigration' | 'YearEndClosing';
  sourceDocRef?: string;
  lines: JournalLine[];
  status: 'Draft' | 'Posted' | 'Locked' | 'Reversed';
  createdBy: string;
  signOff: string;
  auditBlock?: string;
  isAutoSync?: boolean;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  nameEn: string;
  nameFa: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
}

export interface Invoice {
  id: string;
  invNumber: string; // e.g. #INV-2024-0891
  customerId: string;
  customerNameEn: string;
  customerNameFa: string;
  customerRefId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: 'Draft' | 'Approved' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  agingBracket: 'Current' | '1-30 Days' | '31-60 Days' | '61-90 Days' | '90+ Days';
  riskTier: 'Prime / Low' | 'Moderate' | 'Elevated' | 'Critical';
  currency: 'USD' | 'IRR';
  notes?: string;
  paymentHistory?: {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
  }[];
}

export interface Customer {
  id: string;
  refId: string; // e.g. #CUST-4091
  nameEn: string;
  nameFa: string;
  nationalId?: string;
  economicCode?: string;
  phone: string;
  email: string;
  creditLimit: number;
  outstandingBalance: number;
  overdueAmount: number;
  agingBracket: 'Current' | '1-30 Days' | '31-60 Days' | '61-90 Days' | '90+ Days';
  riskTier: 'Prime / Low' | 'Moderate' | 'Elevated' | 'Critical';
  paymentTerms: string;
}

export interface Vendor {
  id: string;
  refId: string;
  nameEn: string;
  nameFa: string;
  phone: string;
  email: string;
  category: string;
  outstandingPayable: number;
  paymentTerms: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  counterparty: string;
  candidateMatchDoc?: string;
  matchConfidence?: number;
  status: 'Unmatched' | 'Suggested Match' | 'Reconciled';
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  nameEn: string;
  nameFa: string;
  typeEn: string;
  typeFa: string;
  balanceUsd: number;
  balanceIrr: number;
  unmatchedCount: number;
  status: 'Reconciled' | 'Needs Review' | 'Pending Sync';
  feedType: string;
  transactions: BankTransaction[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  nameEn: string;
  nameFa: string;
  categoryEn: string;
  categoryFa: string;
  warehouse: string;
  quantityOnHand: number;
  reorderPoint: number;
  unitCostUsd: number;
  sellingPriceUsd: number;
  valuationMethod: 'FIFO' | 'Weighted Average';
  status: 'Optimal' | 'Low Stock' | 'Critical Reorder';
}

export interface GovernanceApproval {
  id: string;
  code: string; // e.g. PO #8910
  type: 'CapEx' | 'Credit Memo' | 'Tax Adjustment' | 'Expense';
  titleEn: string;
  titleFa: string;
  amountUsd: number;
  departmentEn: string;
  departmentFa: string;
  vendorEn?: string;
  reasonEn: string;
  reasonFa: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  targetEntity: string;
  detailsEn: string;
  detailsFa: string;
  status: 'Verified' | 'Flagged';
}

export type Currency = 'IRR' | 'TOMAN' | 'USD' | 'EUR' | 'AED' | 'GBP';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  nameEn: string;
  nameFa: string;
  rateToUsd: number;
  isLocal: boolean;
  flag: string;
}

// EXCHANGE RATE & MULTI-CURRENCY CONFIGURATION
export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  IRR: {
    code: 'IRR',
    symbol: 'ریال',
    nameEn: 'Iranian Rial (IRR)',
    nameFa: 'ریال ایران (پیش‌فرض)',
    rateToUsd: 585000,
    isLocal: true,
    flag: '🇮🇷',
  },
  TOMAN: {
    code: 'TOMAN',
    symbol: 'تومان',
    nameEn: 'Iranian Toman (TMN)',
    nameFa: 'تومان ایران',
    rateToUsd: 58500,
    isLocal: true,
    flag: '🇮🇷',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    nameEn: 'US Dollar (USD)',
    nameFa: 'دلار آمریکا ($)',
    rateToUsd: 1.0,
    isLocal: false,
    flag: '🇺🇸',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    nameEn: 'Euro (EUR)',
    nameFa: 'یورو اروپا (€)',
    rateToUsd: 0.92,
    isLocal: false,
    flag: '🇪🇺',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    nameEn: 'UAE Dirham (AED)',
    nameFa: 'درهم امارات (د.إ)',
    rateToUsd: 3.6725,
    isLocal: false,
    flag: '🇦🇪',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    nameEn: 'British Pound (GBP)',
    nameFa: 'پوند بریتانیا (£)',
    rateToUsd: 0.78,
    isLocal: false,
    flag: '🇬🇧',
  },
};

export const FX_CONFIG = {
  baseUsdRate: 585000,
  tomanRate: 58500,
  currencySymbols: {
    USD: '$',
    IRR: 'ریال',
    TOMAN: 'تومان',
    EUR: '€',
    AED: 'د.إ',
    GBP: '£',
  },
};

// INITIAL CHART OF ACCOUNTS (Conforms to IFRS & Iranian Accounting Standards)
export const INITIAL_ACCOUNTS: Account[] = [
  // Assets
  { code: '1010', nameEn: 'Operating Cash & Bank Melli', nameFa: 'وجوه نقد و بانک ملی تجاری', type: 'Asset', category: 'Current Assets', balanceUsd: 920400, balanceIrr: 538434000000, isPostable: true },
  { code: '1020', nameEn: 'Term Deposits (30D) - Standard Chartered', nameFa: 'سپرده‌های کوتاه‌مدت بانکی', type: 'Asset', category: 'Current Assets', balanceUsd: 380000, balanceIrr: 222300000000, isPostable: true },
  { code: '1030', nameEn: 'Undeposited Drafts & Escrow', nameFa: 'اسناد دریافتنی در جریان وصول', type: 'Asset', category: 'Current Assets', balanceUsd: 128550, balanceIrr: 75201750000, isPostable: true },
  { code: '1200', nameEn: 'Trade Accounts Receivable (AR)', nameFa: 'حساب‌ها و اسناد دریافتنی تجاری', type: 'Asset', category: 'Current Assets', balanceUsd: 482150, balanceIrr: 282057750000, isPostable: true },
  { code: '1400', nameEn: 'Merchandise & Raw Material Inventory', nameFa: 'موجودی کالا و مواد اولیه', type: 'Asset', category: 'Current Assets', balanceUsd: 645000, balanceIrr: 377325000000, isPostable: true },
  { code: '1700', nameEn: 'Property, Plant & Server Equipment', nameFa: 'اموال، ماشین‌آلات و تجهیزات IT', type: 'Asset', category: 'Non-Current Assets', balanceUsd: 1250000, balanceIrr: 731250000000, isPostable: true },
  
  // Liabilities
  { code: '2010', nameEn: 'Trade Accounts Payable (AP)', nameFa: 'حساب‌ها و اسناد پرداختنی تجاری', type: 'Liability', category: 'Current Liabilities', balanceUsd: 318420, balanceIrr: 186275700000, isPostable: true },
  { code: '2050', nameEn: 'Contract Retainage & Short-Term Debt', nameFa: 'تعهدات قراردادی و بدهی‌های جاری', type: 'Liability', category: 'Current Liabilities', balanceUsd: 98620, balanceIrr: 57692700000, isPostable: true },
  { code: '2150', nameEn: 'Accrued Administrative Expenses', nameFa: 'هزینه‌های تحقق یافته پرداخت‌نشده', type: 'Liability', category: 'Current Liabilities', balanceUsd: 145000, balanceIrr: 84825000000, isPostable: true },
  { code: '2200', nameEn: 'Statutory Tax Provision Payable', nameFa: 'ذخیره مالیات بر عملکرد پرداختنی', type: 'Liability', category: 'Current Liabilities', balanceUsd: 176650, balanceIrr: 103340250000, isPostable: true },

  // Equity
  { code: '3010', nameEn: 'Issued Capital & Shareholders Equity', nameFa: 'سرمایه ثبت شده سهامداران', type: 'Equity', category: 'Equity', balanceUsd: 2426210, balanceIrr: 1419332850000, isPostable: true },
  { code: '3050', nameEn: 'Retained Earnings & Reserves', nameFa: 'سود و زیان انباشته و اندوخته‌ها', type: 'Equity', category: 'Equity', balanceUsd: 841200, balanceIrr: 492102000000, isPostable: true },

  // Revenue
  { code: '4010', nameEn: 'Commercial Sales & Wholesale Revenue', nameFa: 'درآمد حاصل از فروش کالا و خدمات', type: 'Revenue', category: 'Operating Revenue', balanceUsd: 3890000, balanceIrr: 2275650000000, isPostable: true },
  { code: '4080', nameEn: 'Realized FX & Treasury Gains', nameFa: 'سود تسعیر ارز و عملیات خزانه', type: 'Revenue', category: 'Non-Operating Revenue', balanceUsd: 48500, balanceIrr: 28372500000, isPostable: true },

  // Expenses
  { code: '5010', nameEn: 'Cost of Goods Sold (COGS)', nameFa: 'بهای تمام شده کالای فروش رفته', type: 'Expense', category: 'Cost of Sales', balanceUsd: 2340000, balanceIrr: 1368900000000, isPostable: true },
  { code: '6010', nameEn: 'General & Administrative Overhead (OPEX)', nameFa: 'هزینه‌های عمومی و اداری', type: 'Expense', category: 'Operating Expenses', balanceUsd: 492100, balanceIrr: 287878500000, isPostable: true },
  { code: '6020', nameEn: 'IT Infrastructure & Cloud Colocation', nameFa: 'هزینه زیرساخت و سرور ابری', type: 'Expense', category: 'Operating Expenses', balanceUsd: 98000, balanceIrr: 57330000000, isPostable: true },
  { code: '6090', nameEn: 'Depreciation & Amortization', nameFa: 'هزینه استهلاک دارایی‌ها', type: 'Expense', category: 'Operating Expenses', balanceUsd: 118700, balanceIrr: 69439500000, isPostable: true },
];

// INITIAL SAMPLE CUSTOMERS
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    refId: '#CUST-4091',
    nameEn: 'Alborz Logistics Corp',
    nameFa: 'شرکت ترابری البرز',
    nationalId: '10103492811',
    economicCode: '4115-8923-1122',
    phone: '+98 (21) 8876-2091',
    email: 'billing@alborzlogistics.ir',
    creditLimit: 100000,
    outstandingBalance: 48500,
    overdueAmount: 48500,
    agingBracket: '61-90 Days',
    riskTier: 'Elevated',
    paymentTerms: 'Net 30',
  },
  {
    id: 'cust-2',
    refId: '#CUST-1022',
    nameEn: 'Parsian Steel Industries',
    nameFa: 'مجتمع فولاد پارسیان',
    nationalId: '10109923812',
    economicCode: '4112-9831-5501',
    phone: '+98 (31) 3234-9000',
    email: 'finance@parsiansteel.ir',
    creditLimit: 150000,
    outstandingBalance: 34250,
    overdueAmount: 34250,
    agingBracket: '31-60 Days',
    riskTier: 'Moderate',
    paymentTerms: 'Net 45',
  },
  {
    id: 'cust-3',
    refId: '#CUST-8839',
    nameEn: 'Caspian Retail Network',
    nameFa: 'شبکه فروشگاه‌های کاسپین',
    nationalId: '10320091823',
    economicCode: '4119-1002-3344',
    phone: '+98 (13) 3344-5566',
    email: 'accounts@caspianretail.com',
    creditLimit: 300000,
    outstandingBalance: 186400,
    overdueAmount: 0,
    agingBracket: '1-30 Days',
    riskTier: 'Prime / Low',
    paymentTerms: 'Net 15',
  },
  {
    id: 'cust-4',
    refId: '#CUST-6112',
    nameEn: 'Karun Tech Solutions',
    nameFa: 'راهکارهای فناورانه کارون',
    nationalId: '10861120934',
    economicCode: '4118-7744-8899',
    phone: '+98 (61) 3333-8899',
    email: 'procurement@karuntech.io',
    creditLimit: 50000,
    outstandingBalance: 10000,
    overdueAmount: 10000,
    agingBracket: '90+ Days',
    riskTier: 'Critical',
    paymentTerms: 'Due on Receipt',
  },
];

// INITIAL SAMPLE INVOICES
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invNumber: '#INV-2024-0891',
    customerId: 'cust-1',
    customerNameEn: 'Alborz Logistics Corp',
    customerNameFa: 'شرکت ترابری البرز',
    customerRefId: '#CUST-4091',
    date: '2024-08-14',
    dueDate: '2024-09-14',
    items: [
      { id: 'item-1', productId: 'p-101', nameEn: 'Enterprise Fleet Telematics Units', nameFa: 'سیستم مانیتورینگ ناوبری ناوگان', quantity: 20, unitPrice: 2000, discountPercent: 0, taxPercent: 9, total: 43600 },
      { id: 'item-2', productId: 'p-102', nameEn: 'High-Torque Power Inverters', nameFa: 'اینورتر قدرت گشتاور بالا', quantity: 5, unitPrice: 980, discountPercent: 0, taxPercent: 9, total: 5341 },
    ],
    subtotal: 44900,
    taxAmount: 3600,
    discountAmount: 0,
    totalAmount: 48500,
    amountPaid: 0,
    amountDue: 48500,
    status: 'Overdue',
    agingBracket: '61-90 Days',
    riskTier: 'Elevated',
    currency: 'USD',
  },
  {
    id: 'inv-2',
    invNumber: '#INV-2024-0904',
    customerId: 'cust-2',
    customerNameEn: 'Parsian Steel Industries',
    customerNameFa: 'مجتمع فولاد پارسیان',
    customerRefId: '#CUST-1022',
    date: '2024-09-02',
    dueDate: '2024-10-02',
    items: [
      { id: 'item-3', productId: 'p-201', nameEn: 'Industrial High-Temp Sensors', nameFa: 'حسگرهای دمای بالای صنعتی', quantity: 30, unitPrice: 1050, discountPercent: 0, taxPercent: 9, total: 34335 },
    ],
    subtotal: 31500,
    taxAmount: 2750,
    discountAmount: 0,
    totalAmount: 34250,
    amountPaid: 0,
    amountDue: 34250,
    status: 'Overdue',
    agingBracket: '31-60 Days',
    riskTier: 'Moderate',
    currency: 'USD',
  },
  {
    id: 'inv-3',
    invNumber: '#INV-2024-0941',
    customerId: 'cust-3',
    customerNameEn: 'Caspian Retail Network',
    customerNameFa: 'شبکه فروشگاه‌های کاسپین',
    customerRefId: '#CUST-8839',
    date: '2024-10-18',
    dueDate: '2024-11-18',
    items: [
      { id: 'item-4', productId: 'p-301', nameEn: 'Automated Checkout Kiosks v3', nameFa: 'کیوسک‌های تسویه خودکار نسخه ۳', quantity: 12, unitPrice: 14500, discountPercent: 5, taxPercent: 9, total: 186400 },
    ],
    subtotal: 174000,
    taxAmount: 15660,
    discountAmount: 3260,
    totalAmount: 186400,
    amountPaid: 0,
    amountDue: 186400,
    status: 'Sent',
    agingBracket: '1-30 Days',
    riskTier: 'Prime / Low',
    currency: 'USD',
  },
  {
    id: 'inv-4',
    invNumber: '#INV-2024-0715',
    customerId: 'cust-4',
    customerNameEn: 'Karun Tech Solutions',
    customerNameFa: 'راهکارهای فناورانه کارون',
    customerRefId: '#CUST-6112',
    date: '2024-06-10',
    dueDate: '2024-07-10',
    items: [
      { id: 'item-5', productId: 'p-401', nameEn: 'Core Enterprise Routing Switches', nameFa: 'سوئیچ‌های هسته‌ای شبکه سازمانی', quantity: 2, unitPrice: 4600, discountPercent: 0, taxPercent: 9, total: 10000 },
    ],
    subtotal: 9200,
    taxAmount: 800,
    discountAmount: 0,
    totalAmount: 10000,
    amountPaid: 0,
    amountDue: 10000,
    status: 'Overdue',
    agingBracket: '90+ Days',
    riskTier: 'Critical',
    currency: 'USD',
  },
];

// INITIAL SAMPLE JOURNAL ENTRIES (Verifying Debit = Credit)
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'jv-1',
    jvRef: '#JV-1403-1048',
    date: '2024-10-24',
    timestamp: 'Today 14:22',
    descriptionEn: 'Wire settle from Caspian Retail (#INV-0938)',
    descriptionFa: 'وصول وجه حواله بانکی از فروشگاه‌های کاسپین بابت فاکتور شماره ۹۳۸',
    sourceDocType: 'BankSync',
    sourceDocRef: '#INV-0938',
    status: 'Posted',
    createdBy: 'Automated Bank Feeds Engine',
    signOff: 'Auto-Sync',
    isAutoSync: true,
    auditBlock: '#481,209',
    lines: [
      {
        id: 'l-1',
        accountCode: '1010',
        accountNameEn: '1010 Operating Cash (Bank Melli)',
        accountNameFa: '۱۰۱۰ موجودی نقد و بانک ملی تجاری',
        debit: 38400,
        credit: 0,
        memoEn: 'Bank transfer received',
        memoFa: 'واریز حواله تسویه به حساب جاری',
      },
      {
        id: 'l-2',
        accountCode: '1200',
        accountNameEn: '1200 Trade Accounts Receivable',
        accountNameFa: '۱۲۰۰ حساب‌ها و اسناد دریافتنی تجاری',
        debit: 0,
        credit: 38400,
        memoEn: 'Relieve AR for Caspian Retail',
        memoFa: 'کاهش حساب دریافتنی شبکه کاسپین',
      },
    ],
  },
  {
    id: 'jv-2',
    jvRef: '#JV-1403-1047',
    date: '2024-10-24',
    timestamp: 'Today 11:45',
    descriptionEn: 'Consignment receipt Batch #HRC-8812 - Hot Rolled Steel',
    descriptionFa: 'رسید انبار محموله ورق گرم فولادی اصفهان - سری #HRC-8812',
    sourceDocType: 'Bill',
    sourceDocRef: '#HRC-8812',
    status: 'Posted',
    createdBy: 'M. Rezvani (Senior Accountant)',
    signOff: 'M. Rezvani',
    isAutoSync: false,
    auditBlock: '#481,208',
    lines: [
      {
        id: 'l-3',
        accountCode: '5100',
        accountNameEn: '5100 Raw Material Inventory (Hot Rolled Steel)',
        accountNameFa: '۵۱۰۰ موجودی مواد اولیه - ورق گرم فولادی',
        debit: 62150,
        credit: 0,
        memoEn: 'Direct consignment inbound',
        memoFa: 'ثبت ورود فیزیکی بار به انبار مرکزی',
      },
      {
        id: 'l-4',
        accountCode: '2010',
        accountNameEn: '2010 Accounts Payable (Isfahan Foundries)',
        accountNameFa: '۲۰۱۰ اسناد و بستانکاران تجاری - صنایع ریخته‌گری اصفهان',
        debit: 0,
        credit: 62150,
        memoEn: 'AP voucher recognized',
        memoFa: 'تعهد بستانکاری تامین‌کننده فولاد',
      },
    ],
  },
  {
    id: 'jv-3',
    jvRef: '#JV-1403-1046',
    date: '2024-10-23',
    timestamp: 'Yesterday 17:30',
    descriptionEn: 'Monthly AWS & Cloud Colocation allocation',
    descriptionFa: 'تسهیم هزینه سرور ابری و خدمات کلوکیشن دیتاسنتر',
    sourceDocType: 'Adjustment',
    status: 'Posted',
    createdBy: 'S. Jamali (Financial Controller)',
    signOff: 'S. Jamali',
    isAutoSync: false,
    auditBlock: '#481,207',
    lines: [
      {
        id: 'l-5',
        accountCode: '6020',
        accountNameEn: '6020 IT Infrastructure Depreciation & Cloud Accrual',
        accountNameFa: '۶۰۲۰ هزینه ابری و استهلاک زیرساخت IT',
        debit: 5200,
        credit: 0,
        memoEn: 'Monthly AWS & Colocation allocation',
        memoFa: 'تخصیص هزینه ابری ماهانه',
      },
      {
        id: 'l-6',
        accountCode: '2150',
        accountNameEn: '2150 Accrued Administrative Expenses',
        accountNameFa: '۲۱۵۰ سایر هزینه‌های تحقق یافته پرداخت‌نشده',
        debit: 0,
        credit: 5200,
        memoEn: 'Accrual recognized',
        memoFa: 'شناسایی ذخیره تعهد پرداخت',
      },
    ],
  },
];

// INITIAL BANK FEEDS & RECONCILIATION
export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    accountNumber: '#8491',
    nameEn: 'Standard Chartered NY',
    nameFa: 'استاندارد چارترد نیویورک',
    typeEn: 'Direct Swift Fedwire',
    typeFa: 'سوئیفت مستقیم ارزی',
    balanceUsd: 684200,
    balanceIrr: 400257000000,
    unmatchedCount: 4,
    status: 'Needs Review',
    feedType: 'Swift / MT940',
    transactions: [
      { id: 'bt-1', date: '2024-10-23', description: 'Fedwire Inflow - Caspian Retail Alloc', amount: 38400, type: 'Credit', counterparty: 'Caspian Retail Network', candidateMatchDoc: '#INV-2024-0938', matchConfidence: 98, status: 'Suggested Match' },
      { id: 'bt-2', date: '2024-10-22', description: 'ACH Outflow - Cloud Flare Enterprise', amount: 4800, type: 'Debit', counterparty: 'Cloudflare Inc', candidateMatchDoc: 'PO #8890', matchConfidence: 95, status: 'Suggested Match' },
      { id: 'bt-3', date: '2024-10-20', description: 'Wire Transfer - Alborz Partial Pay', amount: 15000, type: 'Credit', counterparty: 'Alborz Logistics Corp', status: 'Unmatched' },
      { id: 'bt-4', date: '2024-10-19', description: 'Bank Wire Fee', amount: 45, type: 'Debit', counterparty: 'Standard Chartered', status: 'Unmatched' },
    ],
  },
  {
    id: 'bank-2',
    accountNumber: '#1029',
    nameEn: 'Bank Melli Commercial',
    nameFa: 'بانک ملی ایران - شعبه تجاری مرکزی',
    typeEn: 'SATNA / PAYA Linked',
    typeFa: 'متصل به سامانه پایا / ساتنا',
    balanceUsd: 539145,
    balanceIrr: 315400000000,
    unmatchedCount: 0,
    status: 'Reconciled',
    feedType: 'Paya / Satna API',
    transactions: [
      { id: 'bt-5', date: '2024-10-24', description: 'حواله ساتنا دریافتی - بازرگانی کاسپین', amount: 22471910, type: 'Credit', counterparty: 'فروشگاه‌های کاسپین', candidateMatchDoc: '#INV-0941', matchConfidence: 100, status: 'Reconciled' },
    ],
  },
  {
    id: 'bank-3',
    accountNumber: '#4402',
    nameEn: 'Bridge Treasury Escrow',
    nameFa: 'حساب امانی و خزانه‌داری بریج',
    typeEn: 'USD Operational Float',
    typeFa: 'تنخواه‌گردان عملیاتی ارزی',
    balanceUsd: 236200,
    balanceIrr: 138177000000,
    unmatchedCount: 1,
    status: 'Needs Review',
    feedType: 'Multi-Currency Escrow',
    transactions: [
      { id: 'bt-6', date: '2024-10-21', description: 'Escrow Release - Vendor Retention', amount: 12500, type: 'Credit', counterparty: 'Parsian Foundries', candidateMatchDoc: '#CR-MEMO-204', matchConfidence: 98, status: 'Suggested Match' },
    ],
  },
];

// INITIAL GOVERNANCE & APPROVALS QUEUE
export const INITIAL_APPROVALS: GovernanceApproval[] = [
  {
    id: 'app-1',
    code: 'PO #8910',
    type: 'CapEx',
    titleEn: 'Capex: Server Infrastructure',
    titleFa: 'سرمایه‌گذاری سرمایه‌ای: سرورهای دیتاسنتر',
    amountUsd: 24500,
    departmentEn: 'Enterprise IT Dept',
    departmentFa: 'واحد فناوری اطلاعات سازمانی',
    vendorEn: 'Supermicro direct',
    reasonEn: 'Storage cluster capacity expansion for ERP multi-company node',
    reasonFa: 'توسعه کلاستر ذخیره‌سازی داده‌های مالی نودهای ابری',
    status: 'Pending',
    timestamp: 'Today 09:30',
  },
  {
    id: 'app-2',
    code: 'CR-MEMO #204',
    type: 'Credit Memo',
    titleEn: 'Credit Memo: Caspian Retail',
    titleFa: 'اعلامیه بستانکاری: شبکه فروشگاه‌های کاسپین',
    amountUsd: 3800,
    departmentEn: 'Sales & Invoicing',
    departmentFa: 'واحد فروش و انبارداری',
    reasonEn: 'Product return inspection passed • Damaged casing on Kiosk #094',
    reasonFa: 'تأییدیه کنترل کیفیت بابت مرجوعی کالای با بسته‌بندی آسیب‌دیده',
    status: 'Pending',
    timestamp: 'Today 11:15',
  },
  {
    id: 'app-3',
    code: 'TAX-ADJ #14',
    type: 'Tax Adjustment',
    titleEn: 'Q2 Withholding Tax Variance',
    titleFa: 'تعدیل مالیات تکلیفی فصل دوم',
    amountUsd: 14200,
    departmentEn: 'Corporate Tax & Compliance',
    departmentFa: 'واحد امور مالیاتی و ممیزی',
    reasonEn: 'Statutory withholding rebalance • Tehran Tax Office assessment',
    reasonFa: 'تراز مجدد مالیات تکلیفی موضوع ماده ۱۶۹ مکرر قانون مالیات‌های مستقیم',
    status: 'Pending',
    timestamp: 'Yesterday 16:00',
  },
];

// INITIAL INVENTORY & WAREHOUSE
export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-item-1',
    sku: 'SKU-HRC-8812',
    nameEn: 'Hot Rolled Steel Coil (Grade 36)',
    nameFa: 'کلاف نورد گرم ورق فولادی ساختمانی',
    categoryEn: 'Raw Materials',
    categoryFa: 'مواد اولیه',
    warehouse: 'Main Logistics Terminal (Tehran)',
    quantityOnHand: 420,
    reorderPoint: 150,
    unitCostUsd: 680,
    sellingPriceUsd: 890,
    valuationMethod: 'FIFO',
    status: 'Optimal',
  },
  {
    id: 'inv-item-2',
    sku: 'SKU-TEL-2001',
    nameEn: 'Fleet Telematics OBD-II Nodes',
    nameFa: 'ماژول ناوبری و تلماتیک ناوگان سنگین',
    categoryEn: 'Finished Goods',
    categoryFa: 'کالای ساخته شده',
    warehouse: 'Depot B (Isfahan)',
    quantityOnHand: 48,
    reorderPoint: 60,
    unitCostUsd: 410,
    sellingPriceUsd: 650,
    valuationMethod: 'Weighted Average',
    status: 'Low Stock',
  },
  {
    id: 'inv-item-3',
    sku: 'SKU-SEN-3040',
    nameEn: 'High-Temperature Pyrometric Probes',
    nameFa: 'پروب پیرومتری با تاب‌آوری حرارتی بالا',
    categoryEn: 'Components',
    categoryFa: 'قطعات و حسگرها',
    warehouse: 'Depot C (Tabriz)',
    quantityOnHand: 18,
    reorderPoint: 25,
    unitCostUsd: 820,
    sellingPriceUsd: 1200,
    valuationMethod: 'FIFO',
    status: 'Critical Reorder',
  },
  {
    id: 'inv-item-4',
    sku: 'SKU-KSK-9003',
    nameEn: 'Self-Service Checkout Terminal Pro',
    nameFa: 'پایانه فروشگاهی خودکار لمسی پیشرفته',
    categoryEn: 'Finished Hardware',
    categoryFa: 'سخت‌افزار پایانه فروشگاهی',
    warehouse: 'Main Logistics Terminal (Tehran)',
    quantityOnHand: 85,
    reorderPoint: 30,
    unitCostUsd: 3200,
    sellingPriceUsd: 4900,
    valuationMethod: 'FIFO',
    status: 'Optimal',
  },
];

// DOUBLE-ENTRY INVARIANT VALIDATOR (Item 203)
export function validateJournalEntryInvariants(entry: JournalEntry): { isValid: boolean; messageEn: string; messageFa: string } {
  if (!entry.lines || entry.lines.length < 2) {
    return {
      isValid: false,
      messageEn: 'A balanced journal entry must contain at least one Debit and one Credit line.',
      messageFa: 'ثبت سند دوبل نیازمند حداقل یک سطر بدهکار و یک سطر بستانکار است.',
    };
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let hasDebit = false;
  let hasCredit = false;

  for (const line of entry.lines) {
    totalDebit += Number(line.debit || 0);
    totalCredit += Number(line.credit || 0);
    if (line.debit > 0) hasDebit = true;
    if (line.credit > 0) hasCredit = true;
  }

  // Float safe comparison with cent precision
  const diff = Math.abs(Math.round(totalDebit * 100) - Math.round(totalCredit * 100));

  if (!hasDebit || !hasCredit) {
    return {
      isValid: false,
      messageEn: 'Entry must have both debit and credit amounts greater than zero.',
      messageFa: 'سند باید دارای مقادیر بدهکار و بستانکار بزرگتر از صفر باشد.',
    };
  }

  if (diff > 1) { // Greater than 1 cent
    return {
      isValid: false,
      messageEn: `Ledger Out of Balance! Total Debit ($${totalDebit.toFixed(2)}) does not equal Total Credit ($${totalCredit.toFixed(2)}). Imbalance: $${(Math.abs(totalDebit - totalCredit)).toFixed(2)}`,
      messageFa: `سند تراز نیست! جمع بدهکار (${totalDebit.toLocaleString()} دلار) با جمع بستانکار (${totalCredit.toLocaleString()} دلار) همخوانی ندارد. اختلاف: ${(Math.abs(totalDebit - totalCredit)).toLocaleString()} دلار`,
    };
  }

  return {
    isValid: true,
    messageEn: 'Ledger invariants verified: Total Debit equals Total Credit.',
    messageFa: 'قوانین اسناد دوبل تایید شد: جمع بدهکار با جمع بستانکار برابر است.',
  };
}

// CONVERSION & FORMATTING UTILITIES FOR MULTI-CURRENCY
export function convertUsdToCurrency(amountUsd: number, targetCurrency: Currency): number {
  const rate = CURRENCIES[targetCurrency]?.rateToUsd || 1;
  return amountUsd * rate;
}

export function formatMoney(
  amount: number,
  currency: Currency = 'USD',
  isPersian = false,
  isBaseUsd = true
): string {
  const cfg = CURRENCIES[currency] || CURRENCIES.USD;
  const value = isBaseUsd ? (currency === 'USD' ? amount : amount * cfg.rateToUsd) : amount;

  if (currency === 'USD') {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (currency === 'EUR') {
    return isPersian
      ? value.toLocaleString('fa-IR', { maximumFractionDigits: 2 }) + ' €'
      : '€' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (currency === 'GBP') {
    return isPersian
      ? value.toLocaleString('fa-IR', { maximumFractionDigits: 2 }) + ' £'
      : '£' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (currency === 'AED') {
    return isPersian
      ? value.toLocaleString('fa-IR', { maximumFractionDigits: 2 }) + ' د.إ'
      : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' AED';
  }

  if (currency === 'IRR') {
    if (value >= 1000000000) {
      const billions = (value / 1000000000).toFixed(2);
      return isPersian ? Number(billions).toLocaleString('fa-IR') + ' میلیارد ریال' : billions + 'B IRR';
    }
    if (value >= 1000000) {
      const millions = (value / 1000000).toFixed(1);
      return isPersian ? Number(millions).toLocaleString('fa-IR') + ' میلیون ریال' : millions + 'M IRR';
    }
    return isPersian ? Math.round(value).toLocaleString('fa-IR') + ' ریال' : Math.round(value).toLocaleString('en-US') + ' IRR';
  }

  if (currency === 'TOMAN') {
    if (value >= 1000000000) {
      const billions = (value / 1000000000).toFixed(2);
      return isPersian ? Number(billions).toLocaleString('fa-IR') + ' میلیارد تومان' : billions + 'B TMN';
    }
    if (value >= 1000000) {
      const millions = (value / 1000000).toFixed(1);
      return isPersian ? Number(millions).toLocaleString('fa-IR') + ' میلیون تومان' : millions + 'M Toman';
    }
    return isPersian ? Math.round(value).toLocaleString('fa-IR') + ' تومان' : Math.round(value).toLocaleString('en-US') + ' Toman';
  }

  return value.toLocaleString() + ' ' + cfg.symbol;
}
