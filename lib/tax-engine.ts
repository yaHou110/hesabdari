// Himoora Financial Suite - Enterprise Tax Engine
// Multi-jurisdiction statutory compliance, line-level calculation, and subledger GL tax provisions

export interface TaxCategory {
  id: string;
  code: string;
  nameEn: string;
  nameFa: string;
  ratePercent: number;
  stateTaxPercent: number;
  municipalTaxPercent: number;
  descriptionEn: string;
  descriptionFa: string;
  isExempt: boolean;
  requiresTaxId: boolean;
}

export interface TaxJurisdiction {
  id: string;
  code: string;
  nameEn: string;
  nameFa: string;
  defaultCategoryId: string;
  currency: 'USD' | 'IRR' | 'AED';
  statutoryAuthorityEn: string;
  statutoryAuthorityFa: string;
  standardRate: number;
  allowsTaxInclusivity: boolean;
  withholdingTaxRate: number;
}

export interface LineTaxInput {
  id?: string;
  productId?: string;
  nameEn?: string;
  nameFa?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxCategoryId?: string;
  customTaxPercent?: number;
  isTaxInclusive?: boolean;
}

export interface LineTaxResult {
  id?: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  discountPercent: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  stateTaxAmount: number;
  municipalTaxAmount: number;
  totalAmount: number;
  taxCategoryId: string;
  taxCategoryNameEn: string;
  taxCategoryNameFa: string;
  isExempt: boolean;
}

export interface TaxCategoryBreakdown {
  categoryId: string;
  categoryNameEn: string;
  categoryNameFa: string;
  ratePercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface InvoiceTaxSummary {
  subtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  totalStateTax: number;
  totalMunicipalTax: number;
  grandTotal: number;
  effectiveTaxRate: number;
  jurisdictionId: string;
  categoryBreakdown: TaxCategoryBreakdown[];
  glPostingAdvice: {
    stateTaxCredit: number;
    municipalTaxCredit: number;
    totalTaxPayable: number;
    accountCodeStateTax: string;
    accountCodeMunicipalTax: string;
  };
}

export const STATUTORY_TAX_CATEGORIES: Record<string, TaxCategory> = {
  STANDARD_VAT_9: {
    id: 'STANDARD_VAT_9',
    code: 'VAT-9',
    nameEn: 'Standard Iranian VAT (9%)',
    nameFa: 'مالیات بر ارزش افزوده استاندارد (۹٪ - ۸٪ مالیات + ۱٪ عوارض)',
    ratePercent: 9.0,
    stateTaxPercent: 8.0,
    municipalTaxPercent: 1.0,
    descriptionEn: 'Statutory standard VAT (8% state revenue + 1% municipal toll).',
    descriptionFa: 'نرخ استاندارد قانون مالیات بر ارزش افزوده جمهوری اسلامی ایران.',
    isExempt: false,
    requiresTaxId: true,
  },
  STANDARD_VAT_10: {
    id: 'STANDARD_VAT_10',
    code: 'VAT-10',
    nameEn: 'Standard VAT Tier 2 (10%)',
    nameFa: 'مالیات بر ارزش افزوده مصوب بودجه (۱۰٪)',
    ratePercent: 10.0,
    stateTaxPercent: 8.5,
    municipalTaxPercent: 1.5,
    descriptionEn: 'Updated statutory VAT 10% under budget law expansion.',
    descriptionFa: 'نرخ توسعه‌یافته ۱۰٪ مالیات و عوارض ارزش افزوده.',
    isExempt: false,
    requiresTaxId: true,
  },
  REDUCED_5: {
    id: 'REDUCED_5',
    code: 'VAT-5',
    nameEn: 'Reduced Essential Goods (5%)',
    nameFa: 'کالاهای اساسی و دارو با نرخ ترجیحی (۵٪)',
    ratePercent: 5.0,
    stateTaxPercent: 4.0,
    municipalTaxPercent: 1.0,
    descriptionEn: 'Staple foods, pharmaceuticals, and agricultural equipment.',
    descriptionFa: 'نهاده‌های دامی، کالاهای اساسی و اقلام دارویی ترجیحی.',
    isExempt: false,
    requiresTaxId: false,
  },
  EXEMPT_0: {
    id: 'EXEMPT_0',
    code: 'VAT-0-EX',
    nameEn: 'Zero-Rated / Tax Exempt (0%)',
    nameFa: 'معاف از مالیات و عوارض (ماده ۹ قانون مالیات ارزش افزوده - ۰٪)',
    ratePercent: 0.0,
    stateTaxPercent: 0.0,
    municipalTaxPercent: 0.0,
    descriptionEn: 'Unprocessed agricultural, export goods, books, educational services.',
    descriptionFa: 'صادرات کالا، خدمات آموزشی، محصولات کشاورزی فرآوری‌نشده و کتاب.',
    isExempt: true,
    requiresTaxId: false,
  },
  UAE_GCC_5: {
    id: 'UAE_GCC_5',
    code: 'GCC-VAT-5',
    nameEn: 'UAE / GCC Standard VAT (5%)',
    nameFa: 'مالیات بر ارزش افزوده استاندارد امارات و خلیج فارس (۵٪)',
    ratePercent: 5.0,
    stateTaxPercent: 5.0,
    municipalTaxPercent: 0.0,
    descriptionEn: 'Federal Tax Authority (FTA) standard VAT for UAE entity transactions.',
    descriptionFa: 'مالیات بر ارزش افزوده ۵٪ مصوب اداره مالیاتی فدرال امارات متحده عربی.',
    isExempt: false,
    requiresTaxId: true,
  },
  WITHHOLDING_3: {
    id: 'WITHHOLDING_3',
    code: 'WHT-3',
    nameEn: 'Contractor Withholding Tax (3%)',
    nameFa: 'مالیات تکلیفی قراردادهای پیمانکاری (۳٪ ماده ۱۰۴)',
    ratePercent: 3.0,
    stateTaxPercent: 3.0,
    municipalTaxPercent: 0.0,
    descriptionEn: 'Withholding deduction for technical and consulting service contracts.',
    descriptionFa: 'کسر مالیات تکلیفی از قراردادهای خدمات مشاوره و پیمانکاری.',
    isExempt: false,
    requiresTaxId: true,
  },
};

export const TAX_JURISDICTIONS: Record<string, TaxJurisdiction> = {
  IR_MAINLAND: {
    id: 'IR_MAINLAND',
    code: 'IRN',
    nameEn: 'Iran Mainland (INAS / INTA)',
    nameFa: 'سرزمین اصلی ایران (سازمان امور مالیاتی کشور)',
    defaultCategoryId: 'STANDARD_VAT_9',
    currency: 'IRR',
    statutoryAuthorityEn: 'Iranian National Tax Administration (INTA)',
    statutoryAuthorityFa: 'سازمان امور مالیاتی کشور (سامانه مودیان)',
    standardRate: 9.0,
    allowsTaxInclusivity: true,
    withholdingTaxRate: 3.0,
  },
  IR_FREEZONE: {
    id: 'IR_FREEZONE',
    code: 'IRN-FTZ',
    nameEn: 'Iran Free Trade Zones (Kish/Chabahar/Arvand)',
    nameFa: 'مناطق آزاد تجاری و صنعتی (کیش، چابهار، اروند)',
    defaultCategoryId: 'EXEMPT_0',
    currency: 'USD',
    statutoryAuthorityEn: 'Free Zones High Council Authority',
    statutoryAuthorityFa: 'دبیرخانه شورای عالی مناطق آزاد تجاری-صنعتی',
    standardRate: 0.0,
    allowsTaxInclusivity: false,
    withholdingTaxRate: 0.0,
  },
  UAE_FTA: {
    id: 'UAE_FTA',
    code: 'ARE',
    nameEn: 'United Arab Emirates (FTA)',
    nameFa: 'امارات متحده عربی (FTA)',
    defaultCategoryId: 'UAE_GCC_5',
    currency: 'USD',
    statutoryAuthorityEn: 'Federal Tax Authority (FTA UAE)',
    statutoryAuthorityFa: 'اداره کل امور مالیاتی فدرال امارات',
    standardRate: 5.0,
    allowsTaxInclusivity: true,
    withholdingTaxRate: 0.0,
  },
  GLOBAL_B2B: {
    id: 'GLOBAL_B2B',
    code: 'GLO-EXP',
    nameEn: 'International Cross-Border B2B Export',
    nameFa: 'صادرات بین‌المللی کالا و خدمات B2B (معافیت صفر)',
    defaultCategoryId: 'EXEMPT_0',
    currency: 'USD',
    statutoryAuthorityEn: 'International Customs & Revenue Harmonization',
    statutoryAuthorityFa: 'معافیت صادرات بین‌المللی IFRS',
    standardRate: 0.0,
    allowsTaxInclusivity: false,
    withholdingTaxRate: 0.0,
  },
};

/**
 * High-Precision Tax Engine Class
 */
export class TaxEngine {
  private categories: Record<string, TaxCategory>;
  private jurisdictions: Record<string, TaxJurisdiction>;
  private defaultJurisdictionId: string;

  constructor(
    categories = STATUTORY_TAX_CATEGORIES,
    jurisdictions = TAX_JURISDICTIONS,
    defaultJurisdictionId = 'IR_MAINLAND'
  ) {
    this.categories = categories;
    this.jurisdictions = jurisdictions;
    this.defaultJurisdictionId = defaultJurisdictionId;
  }

  public getCategory(id?: string): TaxCategory {
    if (!id || !this.categories[id]) {
      return this.categories['STANDARD_VAT_9'];
    }
    return this.categories[id];
  }

  public getAllCategories(): TaxCategory[] {
    return Object.values(this.categories);
  }

  public getJurisdiction(id?: string): TaxJurisdiction {
    if (!id || !this.jurisdictions[id]) {
      return this.jurisdictions[this.defaultJurisdictionId];
    }
    return this.jurisdictions[id];
  }

  public getAllJurisdictions(): TaxJurisdiction[] {
    return Object.values(this.jurisdictions);
  }

  /**
   * Calculate precise tax for a single line item with support for discount and multi-rate categories
   */
  public calculateLineTax(input: LineTaxInput, jurisdictionId?: string): LineTaxResult {
    const jur = this.getJurisdiction(jurisdictionId);
    const category = input.customTaxPercent !== undefined
      ? {
          id: 'CUSTOM',
          code: 'CUSTOM',
          nameEn: `Custom Rate (${input.customTaxPercent}%)`,
          nameFa: `نرخ سفارشی (${input.customTaxPercent}٪)`,
          ratePercent: input.customTaxPercent,
          stateTaxPercent: input.customTaxPercent * (8 / 9),
          municipalTaxPercent: input.customTaxPercent * (1 / 9),
          descriptionEn: 'Custom user-specified tax rate',
          descriptionFa: 'نرخ مالیات سفارشی کاربر',
          isExempt: input.customTaxPercent === 0,
          requiresTaxId: false,
        }
      : this.getCategory(input.taxCategoryId || jur.defaultCategoryId);

    const quantity = Math.max(0, Number(input.quantity) || 0);
    const unitPrice = Math.max(0, Number(input.unitPrice) || 0);
    const discountPercent = Math.min(100, Math.max(0, Number(input.discountPercent) || 0));

    const grossAmount = quantity * unitPrice;
    const discountAmount = (grossAmount * discountPercent) / 100;
    const taxableAmount = grossAmount - discountAmount;

    let taxRate = category.ratePercent;
    let taxAmount = 0;
    let stateTaxAmount = 0;
    let municipalTaxAmount = 0;
    let totalAmount = 0;

    if (category.isExempt || taxRate <= 0) {
      taxAmount = 0;
      stateTaxAmount = 0;
      municipalTaxAmount = 0;
      totalAmount = taxableAmount;
    } else if (input.isTaxInclusive) {
      // Inclusive tax: Total = Taxable + Tax. Tax = Total - (Total / (1 + r))
      totalAmount = taxableAmount;
      const baseNet = taxableAmount / (1 + taxRate / 100);
      taxAmount = totalAmount - baseNet;
      stateTaxAmount = (taxAmount * category.stateTaxPercent) / (category.ratePercent || 1);
      municipalTaxAmount = taxAmount - stateTaxAmount;
    } else {
      // Standard Exclusive tax
      taxAmount = (taxableAmount * taxRate) / 100;
      stateTaxAmount = (taxableAmount * category.stateTaxPercent) / 100;
      municipalTaxAmount = (taxableAmount * category.municipalTaxPercent) / 100;
      totalAmount = taxableAmount + taxAmount;
    }

    // Cent rounding
    const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
    const roundedStateTax = Math.round(stateTaxAmount * 100) / 100;
    const roundedMunicipalTax = Math.round(municipalTaxAmount * 100) / 100;
    const roundedTotal = Math.round(totalAmount * 100) / 100;

    return {
      id: input.id,
      quantity,
      unitPrice,
      grossAmount: Math.round(grossAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercent,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxRate,
      taxAmount: roundedTaxAmount,
      stateTaxAmount: roundedStateTax,
      municipalTaxAmount: roundedMunicipalTax,
      totalAmount: roundedTotal,
      taxCategoryId: category.id,
      taxCategoryNameEn: category.nameEn,
      taxCategoryNameFa: category.nameFa,
      isExempt: category.isExempt,
    };
  }

  /**
   * Calculate full invoice tax summary across multiple line items
   */
  public calculateInvoiceTaxes(
    items: LineTaxInput[],
    jurisdictionId?: string
  ): InvoiceTaxSummary {
    const jur = this.getJurisdiction(jurisdictionId);
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxableAmount = 0;
    let totalTaxAmount = 0;
    let totalStateTax = 0;
    let totalMunicipalTax = 0;
    let grandTotal = 0;

    const categoryMap: Record<
      string,
      { category: TaxCategory; taxable: number; tax: number }
    > = {};

    for (const item of items) {
      const lineRes = this.calculateLineTax(item, jur.id);
      subtotal += lineRes.grossAmount;
      totalDiscount += lineRes.discountAmount;
      totalTaxableAmount += lineRes.taxableAmount;
      totalTaxAmount += lineRes.taxAmount;
      totalStateTax += lineRes.stateTaxAmount;
      totalMunicipalTax += lineRes.municipalTaxAmount;
      grandTotal += lineRes.totalAmount;

      const catId = lineRes.taxCategoryId;
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          category: this.getCategory(catId),
          taxable: 0,
          tax: 0,
        };
      }
      categoryMap[catId].taxable += lineRes.taxableAmount;
      categoryMap[catId].tax += lineRes.taxAmount;
    }

    const categoryBreakdown: TaxCategoryBreakdown[] = Object.values(categoryMap).map(
      (entry) => ({
        categoryId: entry.category.id,
        categoryNameEn: entry.category.nameEn,
        categoryNameFa: entry.category.nameFa,
        ratePercent: entry.category.ratePercent,
        taxableAmount: Math.round(entry.taxable * 100) / 100,
        taxAmount: Math.round(entry.tax * 100) / 100,
      })
    );

    const effectiveTaxRate =
      totalTaxableAmount > 0
        ? Math.round((totalTaxAmount / totalTaxableAmount) * 10000) / 100
        : 0;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalStateTax: Math.round(totalStateTax * 100) / 100,
      totalMunicipalTax: Math.round(totalMunicipalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      effectiveTaxRate,
      jurisdictionId: jur.id,
      categoryBreakdown,
      glPostingAdvice: {
        stateTaxCredit: Math.round(totalStateTax * 100) / 100,
        municipalTaxCredit: Math.round(totalMunicipalTax * 100) / 100,
        totalTaxPayable: Math.round(totalTaxAmount * 100) / 100,
        accountCodeStateTax: '2200', // Statutory Tax Provision
        accountCodeMunicipalTax: '2210', // Municipal Levies & Tolls
      },
    };
  }
}

// Global Singleton Instance
export const taxEngine = new TaxEngine();
