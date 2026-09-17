'use client';

import React from 'react';
import { Language } from '@/lib/localization';
import { InventoryItem } from '@/lib/accounting-engine';

interface InventoryValuationViewProps {
  language: Language;
  inventory: InventoryItem[];
}

export default function InventoryValuationView({
  language,
  inventory,
}: InventoryValuationViewProps) {
  const totalValuation = inventory.reduce(
    (acc, it) => acc + it.quantityOnHand * it.unitCostUsd,
    0
  );

  return (
    <div className="w-full max-w-[1560px] mx-auto p-4 lg:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[24px]">inventory_2</span>
            <h1 className="text-[20px] font-bold text-slate-900">
              {language === 'fa' ? 'انبارداری و ارزش‌گذاری موجودی کالا' : 'Inventory Management & Valuation'}
            </h1>
          </div>
          <p className="text-[12px] text-slate-500 mt-1">
            {language === 'fa'
              ? 'ردیابی چند انباره، ارزش‌گذاری به روش FIFO و میانگین موزون، نقطه سفارش مجدد و انطباق با سرفصل ۵۱۰۰ دفتر کل'
              : 'Multi-warehouse stock ledger, FIFO/Weighted Average cost flow, reorder trigger alerts, and GL inventory synchronization.'}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
              Total Stock Valuation (GL 1400)
            </span>
            <span className="text-[18px] font-extrabold text-slate-900 tabular-nums">
              ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Item Name (EN / FA)</th>
                <th className="py-3 px-4">Warehouse Location</th>
                <th className="py-3 px-4 text-center">Valuation Method</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Value (USD)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{it.sku}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{it.nameEn}</div>
                    <div className="text-[11px] text-slate-500">{it.nameFa}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-[12px]">{it.warehouse}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {it.valuationMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                    {it.quantityOnHand.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums">
                    ${it.unitCostUsd.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 tabular-nums">
                    ${(it.quantityOnHand * it.unitCostUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded font-semibold ${
                        it.status === 'Critical Reorder'
                          ? 'bg-red-100 text-red-700'
                          : it.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {it.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
