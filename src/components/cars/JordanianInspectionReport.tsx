'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';

export interface InspectionData {
  frontRight?: string; // أمامي يمين
  frontLeft?: string;  // أمامي يسار
  rearRight?: string;   // خلفي يمين
  rearLeft?: string;    // خلفي يسار
  chassis?: string;     // الشاسي
  engine?: string;      // المحرك
  gear?: string;        // الجير
  differentials?: string; // البككس
  inspectorName?: string; // اسم مركز الفحص
  inspectionDate?: string; // تاريخ الفحص
  notes?: string;       // ملاحظات الإضافية
}

interface Props {
  data?: InspectionData;
  score?: string; // e.g., "7 جيد" or "4 جيد"
}

export default function JordanianInspectionReport({ data, score }: Props) {
  // Default values if none provided
  const report = data || {
    frontRight: 'جيد',
    frontLeft: 'جيد',
    rearRight: 'جيد',
    rearLeft: 'جيد',
    chassis: 'جيد خالي من العيوب',
    engine: 'جيد 60%',
    gear: 'جيد',
    differentials: 'جيد',
    inspectorName: 'مركز الفحص الفني المعتمد (عمان)',
    inspectionDate: '2026-08-01',
    notes: 'فحص ميكانيكي وبودي ممتاز',
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="text-slate-400">غير محدد</span>;
    if (status.includes('جيد') || status.includes('سليم') || status.includes('خالي')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {status}
        </span>
      );
    }
    if (status.includes('قصعة') || status.includes('دقة') || status.includes('مصلح')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
        <XCircle className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl dir-rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">كارت الفحص الأردني الموحد 🇯🇴</h3>
            <p className="text-xs text-slate-400">{report.inspectorName}</p>
          </div>
        </div>

        {score && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-black tracking-wide">
            نتيجة الفحص: {score}
          </div>
        )}
      </div>

      {/* Grid of 8 Parts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">أمامي يمين</span>
          {getStatusBadge(report.frontRight)}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">أمامي يسار</span>
          {getStatusBadge(report.frontLeft)}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">خلفي يمين</span>
          {getStatusBadge(report.rearRight)}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">خلفي يسار</span>
          {getStatusBadge(report.rearLeft)}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">الشاسي والجوانب</span>
          {getStatusBadge(report.chassis)}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">المحرك</span>
          {getStatusBadge(report.engine)}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">الجيربركس</span>
          {getStatusBadge(report.gear)}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">البككس / النظام الحركي</span>
          {getStatusBadge(report.differentials)}
        </div>
      </div>

      {/* Additional Notes */}
      {report.notes && (
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block mb-0.5">ملاحظات الفحص الفني:</span>
            <span>{report.notes}</span>
          </div>
        </div>
      )}
    </div>
  );
}
