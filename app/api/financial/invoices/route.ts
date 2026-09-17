import { NextRequest, NextResponse } from 'next/server';
import { withIdempotency } from '@/lib/idempotency';
import { taxEngine } from '@/lib/tax-engine';
import { validateLedgerInvariants } from '@/lib/ledger-invariants';
import { auditLogService } from '@/lib/audit-log';
import { JournalEntry, JournalLine } from '@/lib/accounting-engine';

export const POST = withIdempotency(
  async (req: NextRequest) => {
    const body = await req.json();
    const {
      customerId,
      customerNameEn,
      customerNameFa,
      customerRefId,
      date,
      dueDate,
      items,
      notes,
      currency = 'USD',
      jurisdictionId = 'IR_STATUTORY_VAT',
    } = body;

    if (!customerNameEn || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Customer and at least one line item are required.',
          messageFa: 'مشخصات مشتری و حداقل یک ردیف کالا/خدمات الزامی است.',
        },
        { status: 400 }
      );
    }

    const taxSummary = taxEngine.calculateInvoiceTaxes(
      items.map((it: any) => ({
        id: it.id || `item-${Date.now()}-${Math.random()}`,
        nameEn: it.nameEn,
        nameFa: it.nameFa || it.nameEn,
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || 0),
        taxCategoryId: it.taxCategoryId || 'STANDARD_VAT_9',
      })),
      jurisdictionId
    );

    const invNumber = `#INV-2024-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceId = `inv-${Date.now()}`;

    // Auto-generate double entry GL lines
    const glLines: JournalLine[] = [
      {
        id: `l-ar-${Date.now()}`,
        accountCode: '1200',
        accountNameEn: '1200 Trade Accounts Receivable',
        accountNameFa: '۱۲۰۰ حساب‌ها و اسناد دریافتنی تجاری',
        debit: taxSummary.grandTotal,
        credit: 0,
        memoEn: `AR for ${customerNameEn} (${invNumber})`,
        memoFa: `شناسایی طلب تجاری فاکتور شماره ${invNumber}`,
      },
      {
        id: `l-rev-${Date.now()}`,
        accountCode: '4010',
        accountNameEn: '4010 Commercial Sales & Wholesale Revenue',
        accountNameFa: '۴۰۱۰ درآمد حاصل از فروش کالا و خدمات',
        debit: 0,
        credit: taxSummary.totalTaxableAmount,
        memoEn: `Commercial Sales ${invNumber}`,
        memoFa: `درآمد فروش فاکتور شماره ${invNumber}`,
      },
    ];

    if (taxSummary.totalStateTax > 0) {
      glLines.push({
        id: `l-tax-state-${Date.now()}`,
        accountCode: '2200',
        accountNameEn: '2200 Statutory Tax Provision Payable (State VAT 8%)',
        accountNameFa: '۲۲۰۰ مالیات ارزش افزوده سهم دولت پرداختنی (۸٪)',
        debit: 0,
        credit: taxSummary.totalStateTax,
        memoEn: `State VAT (8%) on ${invNumber}`,
        memoFa: `مالیات ارزش افزوده سهم دولت فاکتور ${invNumber}`,
      });
    }

    if (taxSummary.totalMunicipalTax > 0) {
      glLines.push({
        id: `l-tax-muni-${Date.now()}`,
        accountCode: '2200',
        accountNameEn: '2200 Statutory Tax Provision Payable (Municipal Toll 1%)',
        accountNameFa: '۲۲۰۰ عوارض شهرداری ارزش افزوده پرداختنی (۱٪)',
        debit: 0,
        credit: taxSummary.totalMunicipalTax,
        memoEn: `Municipal Toll (1%) on ${invNumber}`,
        memoFa: `عوارض شهرداری فاکتور ${invNumber}`,
      });
    }

    const jvRef = `#JV-1403-${Math.floor(1200 + Math.random() * 800)}`;
    const jv: JournalEntry = {
      id: `jv-${Date.now()}`,
      jvRef,
      date: date || new Date().toISOString().split('T')[0],
      timestamp: 'Just now',
      descriptionEn: `Commercial Invoice recognition (${invNumber} - ${customerNameEn})`,
      descriptionFa: `شناسایی فروش فاکتور شماره ${invNumber} برای ${customerNameFa || customerNameEn}`,
      sourceDocType: 'Invoice',
      sourceDocRef: invNumber,
      status: 'Posted',
      createdBy: 'Sales Invoicing Subsystem (API Idempotent Middleware)',
      signOff: 'Auto-GL Tax Auditor',
      lines: glLines,
    };

    const invariantCheck = validateLedgerInvariants(jv);
    if (!invariantCheck.isValid) {
      return NextResponse.json(
        {
          error: 'INVARIANT_VIOLATION',
          message: invariantCheck.messageEn,
          violations: invariantCheck.errors,
        },
        { status: 422 }
      );
    }

    // Record audit mutation
    auditLogService.recordMutation({
      actor: {
        id: 'api-caller',
        name: 'Financial Mutation API Client',
        role: 'Commercial Operations',
      },
      actionType: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invNumber,
      summaryEn: `Invoice ${invNumber} created for ${customerNameEn} ($${taxSummary.grandTotal.toFixed(2)}).`,
      summaryFa: `فاکتور شماره ${invNumber} برای ${customerNameFa || customerNameEn} به مبلغ ${taxSummary.grandTotal.toLocaleString()} صادر شد.`,
      afterState: {
        id: invoiceId,
        invNumber,
        totalAmount: taxSummary.grandTotal,
        subtotal: taxSummary.totalTaxableAmount,
        taxAmount: taxSummary.totalTaxAmount,
        jvRef,
      },
      invariantsChecked: ['INV-01', 'INV-02', 'INV-03', 'INV-05', 'INV-06', 'INV-10'],
      severity: 'AUDIT_CRITICAL',
    });

    return NextResponse.json(
      {
        success: true,
        invoice: {
          id: invoiceId,
          invNumber,
          customerId,
          customerNameEn,
          customerNameFa,
          customerRefId,
          date: date || new Date().toISOString().split('T')[0],
          dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          subtotal: taxSummary.subtotal,
          taxAmount: taxSummary.totalTaxAmount,
          discountAmount: taxSummary.totalDiscount,
          totalAmount: taxSummary.grandTotal,
          amountPaid: 0,
          amountDue: taxSummary.grandTotal,
          status: 'Sent',
          currency,
          taxBreakdown: taxSummary,
        },
        journalEntry: jv,
      },
      { status: 201 }
    );
  },
  {
    requireKey: true,
    ttlSeconds: 86400,
    extractEntityType: () => 'Invoice',
    extractEntityId: (body, res) => res?.invoice?.invNumber || body?.invNumber,
  }
);
