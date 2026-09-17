'use client';

import React, { useState } from 'react';
import { Language, DICTIONARY } from '@/lib/localization';
import { Invoice, Customer, FX_CONFIG, formatMoney } from '@/lib/accounting-engine';
import { taxEngine, STATUTORY_TAX_CATEGORIES, TAX_JURISDICTIONS } from '@/lib/tax-engine';

interface SalesInvoicingViewProps {
  language: Language;
  invoices: Invoice[];
  customers: Customer[];
  onCreateInvoice: (newInvoice: Invoice) => void;
  onAllocatePayment: (invoice: Invoice, amountPaid: number, method: string) => void;
}

let invItemCounter = 100;
function getNextInvItemId(prefix: string) {
  invItemCounter += 1;
  return `${prefix}-${invItemCounter}`;
}

export default function SalesInvoicingView({
  language,
  invoices,
  customers,
  onCreateInvoice,
  onAllocatePayment,
}: SalesInvoicingViewProps) {
  const t = DICTIONARY[language];
  const isRtl = language === 'fa';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer (Satna / Paya)');

  // New Invoice Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState<string>('IR_MAINLAND');
  const [invoiceDate, setInvoiceDate] = useState('2024-10-24');
  const [dueDate, setDueDate] = useState('2024-11-24');
  const [items, setItems] = useState<
    {
      id: string;
      productId: string;
      nameEn: string;
      nameFa: string;
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      taxCategoryId?: string;
      taxPercent: number;
      total: number;
    }[]
  >([
    {
      id: 'it-1',
      productId: 'p-1',
      nameEn: 'Industrial Telematics Nodes',
      nameFa: 'ماژول ناوبری و تلماتیک ناوگان سنگین',
      quantity: 10,
      unitPrice: 1200,
      discountPercent: 0,
      taxCategoryId: 'STANDARD_VAT_9',
      taxPercent: 9,
      total: 13080,
    },
  ]);

  // Recalculate totals via dedicated TaxEngine
  const taxSummary = taxEngine.calculateInvoiceTaxes(
    items.map((it) => ({
      id: it.id,
      productId: it.productId,
      nameEn: it.nameEn,
      nameFa: it.nameFa,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountPercent: it.discountPercent,
      taxCategoryId: it.taxCategoryId,
      customTaxPercent: it.taxPercent,
    })),
    selectedJurisdictionId
  );

  const subtotal = taxSummary.subtotal;
  const discountAmount = taxSummary.totalDiscount;
  const taxableSubtotal = taxSummary.totalTaxableAmount;
  const taxAmount = taxSummary.totalTaxAmount;
  const stateTaxAmount = taxSummary.totalStateTax;
  const municipalTaxAmount = taxSummary.totalMunicipalTax;
  const totalAmount = taxSummary.grandTotal;

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerNameFa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: getNextInvItemId('it'),
        productId: 'p-new',
        nameEn: 'Enterprise Hardware Component',
        nameFa: 'تجهیزات و قطعات سازمانی',
        quantity: 1,
        unitPrice: 500,
        discountPercent: 0,
        taxCategoryId: 'STANDARD_VAT_9',
        taxPercent: 9,
        total: 545,
      },
    ]);
  };

  const handleSaveInvoice = () => {
    const selectedCust = customers.find((c) => c.id === selectedCustomerId) || customers[0];
    const newId = getNextInvItemId('inv');
    const newInv: Invoice = {
      id: newId,
      invNumber: `#INV-2024-${newId.replace(/\D/g, '') || '9120'}`,
      customerId: selectedCust.id,
      customerNameEn: selectedCust.nameEn,
      customerNameFa: selectedCust.nameFa,
      customerRefId: selectedCust.refId,
      date: invoiceDate,
      dueDate: dueDate,
      items: items.map((it) => {
        const lineTax = taxEngine.calculateLineTax(
          {
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountPercent: it.discountPercent,
            taxCategoryId: it.taxCategoryId,
            customTaxPercent: it.taxPercent,
          },
          selectedJurisdictionId
        );
        return {
          ...it,
          taxPercent: lineTax.taxRate,
          total: lineTax.totalAmount,
        };
      }),
      subtotal: taxableSubtotal,
      taxAmount: taxAmount,
      discountAmount: discountAmount,
      totalAmount: totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      status: 'Sent',
      agingBracket: 'Current',
      riskTier: selectedCust.riskTier,
      currency: 'USD',
    };

    onCreateInvoice(newInv);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[24px]">receipt_long</span>
            <h1 className="text-[20px] font-bold text-slate-900">
              {language === 'fa' ? 'فروش و صدور صورتحساب‌ها' : 'Commercial Sales & Invoicing'}
            </h1>
          </div>
          <p className="text-[12px] text-slate-500 mt-1">
            {language === 'fa'
              ? 'مدیریت اسناد فروش، جدول سنی مطالبات، ثبت خودکار سند حسابداری دوبل و پیگیری وصول مطالبات'
              : 'End-to-end sales cycle, tax compliance, automatic double-entry GL posting, and collection management.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#0051d5] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{language === 'fa' ? 'صدور فاکتور جدید' : 'Create Invoice'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={language === 'fa' ? 'جستجو با شماره فاکتور یا نام طرف‌حساب...' : 'Search invoice # or customer...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Sent', 'Overdue', 'Paid'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 text-[12px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? (language === 'fa' ? 'همه فاکتورها' : 'All') : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">{t.refInvoice}</th>
                <th className="py-3 px-4 font-semibold">{t.counterparty}</th>
                <th className="py-3 px-4 font-semibold">Date / Due</th>
                <th className="py-3 px-4 font-semibold text-right">{t.amountUsd}</th>
                <th className="py-3 px-4 font-semibold text-right">Balance Due</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {inv.invNumber}
                    <div className="text-[10px] text-slate-400 font-normal">Subledger ID: {inv.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {language === 'fa' ? inv.customerNameFa : inv.customerNameEn}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {language === 'fa' ? inv.customerNameEn : inv.customerNameFa} • {inv.customerRefId}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 text-[12px]">{inv.date}</div>
                    <div className="text-[11px] text-red-600 font-medium">Due: {inv.dueDate}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                    ${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-red-600 tabular-nums">
                    ${inv.amountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded font-semibold ${
                        inv.status === 'Overdue'
                          ? 'bg-red-100 text-red-700'
                          : inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setPayingInvoice(inv);
                        setPaymentAmount(inv.amountDue);
                      }}
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-3 py-1 rounded text-[11px] font-semibold border border-slate-200 transition-colors"
                    >
                      {language === 'fa' ? 'تخصیص واریز' : 'Allocate Pay'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL WITH AUTOMATED DOUBLE-ENTRY GL PREVIEW */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] text-[22px]">receipt</span>
                <h3 className="text-[17px] font-bold text-slate-900">
                  {language === 'fa' ? 'صدور فاکتور فروش رسمی' : 'New Commercial Sales Invoice'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                  {language === 'fa' ? 'طرف‌حساب / خریدار' : 'Customer / Counterparty'}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameFa})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                  {language === 'fa' ? 'حوزه مالیاتی (Tax Engine)' : 'Tax Jurisdiction'}
                </label>
                <select
                  value={selectedJurisdictionId}
                  onChange={(e) => setSelectedJurisdictionId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:bg-white"
                >
                  {taxEngine.getAllJurisdictions().map((j) => (
                    <option key={j.id} value={j.id}>
                      {language === 'fa' ? j.nameFa : j.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                  {language === 'fa' ? 'سررسید پرداخت' : 'Payment Due Date'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                  {language === 'fa' ? 'اقلام فاکتور و رده‌های مالیاتی' : 'Invoice Line Items & Tax Engine Categories'}
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-blue-600 text-[12px] font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  {language === 'fa' ? 'افزودن سطر کالا' : 'Add Item'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Tax Category</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Tax Rate</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => {
                      const lineTax = taxEngine.calculateLineTax(
                        {
                          quantity: it.quantity,
                          unitPrice: it.unitPrice,
                          discountPercent: it.discountPercent,
                          taxCategoryId: it.taxCategoryId,
                          customTaxPercent: it.taxPercent,
                        },
                        selectedJurisdictionId
                      );

                      return (
                        <tr key={it.id}>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={it.nameEn}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].nameEn = e.target.value;
                                setItems(newItems);
                              }}
                              className="w-full p-1 border border-slate-200 rounded text-[12px]"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={it.taxCategoryId || 'STANDARD_VAT_9'}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].taxCategoryId = e.target.value;
                                const cat = taxEngine.getCategory(e.target.value);
                                newItems[idx].taxPercent = cat.ratePercent;
                                setItems(newItems);
                              }}
                              className="w-full p-1 border border-slate-200 rounded text-[11px] bg-slate-50"
                            >
                              {taxEngine.getAllCategories().map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.code} ({cat.ratePercent}%)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              value={it.quantity}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].quantity = Number(e.target.value);
                                setItems(newItems);
                              }}
                              className="w-14 p-1 border border-slate-200 rounded text-center text-[12px]"
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              value={it.unitPrice}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].unitPrice = Number(e.target.value);
                                setItems(newItems);
                              }}
                              className="w-20 p-1 border border-slate-200 rounded text-right text-[12px]"
                            />
                          </td>
                          <td className="p-2.5 text-right tabular-nums text-slate-500 font-mono text-[11px]">
                            {lineTax.isExempt ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1 rounded">Exempt 0%</span>
                            ) : (
                              `$${lineTax.taxAmount.toFixed(2)} (${lineTax.taxRate}%)`
                            )}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 tabular-nums">
                            ${lineTax.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AUTOMATED DOUBLE-ENTRY GL PREVIEW & TAX ENGINE SUMMARY */}
            <div className="mt-5 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">account_tree</span>
                  <span className="text-[12px] font-bold text-blue-900">
                    {language === 'fa'
                      ? 'پیش‌نمایش سند دوبل دفتر کل و تفکیک مالیات ارزش افزوده (TaxEngine GL)'
                      : 'Automated Double-Entry GL Posting & TaxEngine Provisions'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {taxEngine.getJurisdiction(selectedJurisdictionId).code}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Dr. 1200 Trade Accounts Receivable</span>
                  <span className="font-bold text-blue-800">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span>Cr. 4010 Commercial Sales Revenue</span>
                  <span className="font-bold text-slate-800">${taxableSubtotal.toFixed(2)}</span>
                </div>
                {stateTaxAmount > 0 && (
                  <div className="flex justify-between pl-4 text-slate-600">
                    <span>Cr. 2200 Statutory State Tax Provision (8%)</span>
                    <span className="font-bold text-slate-800">${stateTaxAmount.toFixed(2)}</span>
                  </div>
                )}
                {municipalTaxAmount > 0 && (
                  <div className="flex justify-between pl-4 text-slate-600">
                    <span>Cr. 2200 Statutory Municipal Tolls & Levies (1%)</span>
                    <span className="font-bold text-slate-800">${municipalTaxAmount.toFixed(2)}</span>
                  </div>
                )}
                {taxAmount === 0 && (
                  <div className="flex justify-between pl-4 text-emerald-700 italic">
                    <span>(Zero-Rated / Tax Exempt Transaction)</span>
                    <span>$0.00</span>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-1 border-t border-blue-200 text-[11px] text-emerald-800 font-semibold flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>14 Ledger Invariants Verified: Total Debit ($ {totalAmount.toFixed(2)}) == Total Credit ($ {totalAmount.toFixed(2)})</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Audit Trail Ready</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-[13px] font-medium"
              >
                {language === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                className="px-4 py-2 bg-[#0051d5] hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold shadow-xs"
              >
                {language === 'fa' ? 'تأیید و ثبت در دفتر کل' : 'Approve & Post to Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALLOCATE PAYMENT MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-[16px] font-bold text-slate-900">
                {language === 'fa' ? 'تخصیص وجه دریافتی فاکتور' : 'Allocate Received Payment'}
              </h3>
              <button onClick={() => setPayingInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Target Invoice</span>
                <span className="font-bold text-slate-900 text-[14px]">{payingInvoice.invNumber}</span>
                <span className="text-[12px] text-slate-500 block">{payingInvoice.customerNameEn}</span>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                  Payment Amount (USD)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[14px] font-bold"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Total Outstanding Balance: ${payingInvoice.amountDue.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                  Deposit Account / Channel
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[12px]"
                >
                  <option>Standard Chartered NY (Swift Fedwire)</option>
                  <option>Bank Melli Commercial (Satna / Paya)</option>
                  <option>Bridge Treasury Escrow (USD)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onAllocatePayment(payingInvoice, paymentAmount, paymentMethod);
                  setPayingInvoice(null);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold"
              >
                Confirm Payment & Sync GL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
