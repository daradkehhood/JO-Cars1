'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Wrench, UserCheck, FileText, Search, ClipboardCheck, Car, Loader2, ChevronDown, ChevronUp, Clock, Gauge, Shield } from 'lucide-react';

interface CarHistory {
  id: string;
  vin: string;
  eventType: string;
  title: string;
  description: string | null;
  eventDate: string;
  mileage: number | null;
  source: string;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

interface SummaryType {
  totalRecords: number;
  accidentCount: number;
  serviceCount: number;
  totalOwners: number;
  lastMileage: number | null;
  hasAccidents: boolean;
  hasServiceHistory: boolean;
}

interface HistoryData {
  history: CarHistory[];
  summary: SummaryType;
}

const eventIcons: Record<string, any> = {
  ACCIDENT: AlertTriangle,
  MAINTENANCE: Wrench,
  SERVICE: Wrench,
  OWNER_CHANGE: UserCheck,
  INSPECTION: ClipboardCheck,
  REGISTRATION: FileText,
  TITLE: FileText,
  RECALL: Shield,
};

const eventColors: Record<string, string> = {
  ACCIDENT: 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  MAINTENANCE: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  SERVICE: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  OWNER_CHANGE: 'text-green-500 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
  INSPECTION: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
  REGISTRATION: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  TITLE: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  RECALL: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
};

const eventLabels: Record<string, string> = {
  ACCIDENT: 'حادث',
  MAINTENANCE: 'صيانة',
  SERVICE: 'خدمة',
  OWNER_CHANGE: 'تغيير مالك',
  INSPECTION: 'فحص',
  REGISTRATION: 'تسجيل',
  TITLE: 'سند ملكية',
  RECALL: 'استدعاء',
};

export function CarHistorySection({ vin, carId }: { vin?: string | null; carId?: string }) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [addModal, setAddModal] = useState(false);

  const fetchHistory = async (searchVin: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/car-history?vin=${encodeURIComponent(searchVin)}`);
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (vin) fetchHistory(vin);
  }, [vin]);

  if (!vin) return null;

  const summary = data?.summary;
  const history = data?.history || [];

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <h3 className="font-bold text-gray-900 dark:text-white">سجل السيارة الكامل</h3>
            <p className="text-xs text-gray-500">
              {loading ? 'جاري التحميل...' : summary ? `${summary.totalRecords} سجل | ${summary.totalOwners} مالك${summary.totalOwners > 1 ? 'ين' : ''}` : 'Carfax'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary?.hasAccidents && (
            <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-semibold">
              {summary.accidentCount} حادث
            </span>
          )}
          {summary?.hasServiceHistory && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-xs font-semibold">
              صيانة
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.totalRecords}</p>
                <p className="text-[10px] text-gray-500">سجل</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.totalOwners}</p>
                <p className="text-[10px] text-gray-500">مالك{summary.totalOwners > 1 ? 'ين' : ''}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className={`text-lg font-bold ${summary.hasAccidents ? 'text-red-500' : 'text-green-500'}`}>
                  {summary.accidentCount}
                </p>
                <p className="text-[10px] text-gray-500">حوادث</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.serviceCount}</p>
                <p className="text-[10px] text-gray-500">صيانة</p>
              </div>
            </div>
          )}

          {/* History Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">لا توجد سجلات لرقم الهيكل هذا</p>
              <p className="text-xs text-gray-400 mt-1">يمكنك إضافة أول سجل للسيارة</p>
            </div>
          ) : (
            <div className="space-y-0 relative">
              <div className="absolute right-[19px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
              {history.map((record, i) => {
                const Icon = eventIcons[record.eventType] || FileText;
                const colorClass = eventColors[record.eventType] || 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200';
                const label = eventLabels[record.eventType] || record.eventType;
                const date = new Date(record.eventDate).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' });

                return (
                  <div key={record.id} className="flex items-start gap-4 pr-10 relative pb-5 last:pb-0">
                    <div className={`absolute right-0 top-1 w-[38px] h-[38px] rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass}`}>
                            {label}
                          </span>
                          {record.mileage && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Gauge className="w-3 h-3" />{record.mileage.toLocaleString()} كم
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{date}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{record.title}</p>
                      {record.description && <p className="text-xs text-gray-500 mt-1">{record.description}</p>}
                      {record.user && (
                        <p className="text-[10px] text-gray-400 mt-1.5">أضيف بواسطة: {record.user.name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
