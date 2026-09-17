// Himoora Financial Suite - 4-Tier Plan System Configuration
// Starter, Professional, Business Pro, Enterprise (Flagship)

import { PlanTier } from './accounting-engine';

export interface PlanFeatureConfig {
  tier: PlanTier;
  labelEn: string;
  labelFa: string;
  priceNoteEn: string;
  priceNoteFa: string;
  targetEn: string;
  targetFa: string;
  badgeColor: string;
  maxCompanies: number;
  maxUsers: number;
  hasDoubleEntryVerification: boolean;
  hasAiAssistant: boolean;
  hasBankReconciliation: boolean;
  hasMultiCurrency: boolean;
  hasGovernanceApprovals: boolean;
  hasInventoryValuation: boolean;
  hasAuditLog: boolean;
  hasDimensionsCostCenters: boolean;
  hasPeriodLocking: boolean;
  hasOfflineSync: boolean;
  allowedNavItems: string[];
}

export const PLAN_CONFIGS: Record<PlanTier, PlanFeatureConfig> = {
  Starter: {
    tier: 'Starter',
    labelEn: 'Starter',
    labelFa: 'پایه (استارتر)',
    priceNoteEn: '~120M IRR / year',
    priceNoteFa: 'حدود ۱۲۰ میلیون تومان سالانه',
    targetEn: 'Small businesses, sole practitioners, simple bookkeeping',
    targetFa: 'کسب‌وکارهای کوچک، فریلنسرها و صدور صورتحساب ساده',
    badgeColor: 'bg-slate-700 text-slate-100',
    maxCompanies: 1,
    maxUsers: 2,
    hasDoubleEntryVerification: false,
    hasAiAssistant: false,
    hasBankReconciliation: false,
    hasMultiCurrency: false,
    hasGovernanceApprovals: false,
    hasInventoryValuation: false,
    hasAuditLog: false,
    hasDimensionsCostCenters: false,
    hasPeriodLocking: false,
    hasOfflineSync: false,
    allowedNavItems: [
      'command-center',
      'sales-and-invoicing',
      'purchases-and-expenses',
      'financial-reports',
    ],
  },
  Professional: {
    tier: 'Professional',
    labelEn: 'Professional',
    labelFa: 'حرفه‌ای (پرو)',
    priceNoteEn: '~280M–320M IRR / year',
    priceNoteFa: 'حدود ۲۸۰ تا ۳۲۰ میلیون تومان سالانه',
    targetEn: 'Growing companies requiring formal chart of accounts and P&L/Balance Sheet',
    targetFa: 'شرکت‌های در حال رشد نیازمند کدینگ استاندارد و ترازنامه',
    badgeColor: 'bg-emerald-700 text-white',
    maxCompanies: 1,
    maxUsers: 5,
    hasDoubleEntryVerification: true,
    hasAiAssistant: false,
    hasBankReconciliation: false,
    hasMultiCurrency: false,
    hasGovernanceApprovals: false,
    hasInventoryValuation: true,
    hasAuditLog: true,
    hasDimensionsCostCenters: false,
    hasPeriodLocking: true,
    hasOfflineSync: false,
    allowedNavItems: [
      'command-center',
      'sales-and-invoicing',
      'purchases-and-expenses',
      'accounting-and-ledger',
      'inventory-and-valuation',
      'financial-reports',
    ],
  },
  'Business Pro': {
    tier: 'Business Pro',
    labelEn: 'Business Pro',
    labelFa: 'کسب‌وکار پیشرفته',
    priceNoteEn: '~500M IRR / year',
    priceNoteFa: 'حدود ۵۰۰ میلیون تومان سالانه',
    targetEn: 'Mid-sized enterprises needing bank reconciliation, multi-warehouse & approvals',
    targetFa: 'بنگاه‌های متوسط با نیاز به مغایرت‌گیری بانکی، چند انباری و کارتابل تایید',
    badgeColor: 'bg-blue-700 text-white',
    maxCompanies: 3,
    maxUsers: 15,
    hasDoubleEntryVerification: true,
    hasAiAssistant: false,
    hasBankReconciliation: true,
    hasMultiCurrency: true,
    hasGovernanceApprovals: true,
    hasInventoryValuation: true,
    hasAuditLog: true,
    hasDimensionsCostCenters: true,
    hasPeriodLocking: true,
    hasOfflineSync: true,
    allowedNavItems: [
      'command-center',
      'sales-and-invoicing',
      'purchases-and-expenses',
      'accounting-and-ledger',
      'banking-and-treasury',
      'inventory-and-valuation',
      'financial-reports',
      'enterprise-controls',
    ],
  },
  Enterprise: {
    tier: 'Enterprise',
    labelEn: 'ENTERPRISE',
    labelFa: 'سازمانی جامع',
    priceNoteEn: 'Flagship (~650M–850M+ IRR)',
    priceNoteFa: 'نسخه سرآمد سازمانی (۶۵۰ تا ۸۵۰+ میلیون تومان)',
    targetEn: 'Corporations, conglomerates, institutional finance & holding companies',
    targetFa: 'شرکت‌های هلدینگ، سازمان‌های بزرگ و مدیریت چند شرکته با هوش مالی',
    badgeColor: 'bg-slate-900 text-blue-200 ring-1 ring-blue-400/40',
    maxCompanies: 99,
    maxUsers: 999,
    hasDoubleEntryVerification: true,
    hasAiAssistant: true,
    hasBankReconciliation: true,
    hasMultiCurrency: true,
    hasGovernanceApprovals: true,
    hasInventoryValuation: true,
    hasAuditLog: true,
    hasDimensionsCostCenters: true,
    hasPeriodLocking: true,
    hasOfflineSync: true,
    allowedNavItems: [
      'command-center',
      'sales-and-invoicing',
      'purchases-and-expenses',
      'accounting-and-ledger',
      'banking-and-treasury',
      'inventory-and-valuation',
      'financial-reports',
      'enterprise-controls',
      'ai-financial-assistant',
      'system-settings-and-roles',
    ],
  },
};
