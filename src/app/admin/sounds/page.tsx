'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, AlertTriangle, CheckCircle, XCircle, Clock, 
  User, MessageCircle, Play, Pause, Ban, Shield, Trash2,
  ChevronDown, ChevronUp, Search, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundReport {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  recording: {
    id: string;
    url: string;
    duration: number;
  };
  car: {
    id: string;
    brand: { nameAr: string };
    model: { nameAr: string };
    year: number;
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

interface SoundBan {
  id: string;
  reason: string;
  message: string | null;
  duration: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  banner: {
    id: string;
    name: string;
  };
}

const durationLabels: Record<string, string> = {
  '1hour': 'ساعة واحدة',
  '2days': 'يومان',
  '1week': 'أسبوع واحد',
  '2weeks': 'أسبوعان',
  '1month': 'شهر واحد',
  'permanent': 'دائم'
};

export default function SoundReportsAdmin() {
  const [reports, setReports] = useState<SoundReport[]>([]);
  const [bans, setBans] = useState<SoundBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'bans'>('reports');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  
  const [banModal, setBanModal] = useState<{ open: boolean; report: SoundReport | null }>({
    open: false,
    report: null
  });
  const [banForm, setBanForm] = useState({
    duration: '1week',
    reason: '',
    message: ''
  });

  useEffect(() => {
    fetchReports();
    fetchBans();
  }, [filterStatus]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/sounds/reports?status=${filterStatus}`);
      const data = await res.json();
      if (data.success) setReports(data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBans = async () => {
    try {
      const res = await fetch('/api/sounds/bans');
      const data = await res.json();
      if (data.success) setBans(data.data);
    } catch (error) {
      console.error('Error fetching bans:', error);
    }
  };

  const handlePlay = async (recordingId: string, id: string) => {
    if (audioRef) {
      audioRef.pause();
      audioRef.src = '';
    }
    
    if (playingId === id) {
      setPlayingId(null);
      setAudioRef(null);
      return;
    }

    const audio = new Audio(`/api/sounds/stream/${recordingId}`);
    audio.onerror = () => {
      setPlayingId(null);
      setAudioRef(null);
    };
    audio.onended = () => setPlayingId(null);
    try {
      await audio.play();
      setAudioRef(audio);
      setPlayingId(id);
    } catch {
      setPlayingId(null);
      setAudioRef(null);
    }
  };

  const handleBanUser = async () => {
    if (!banModal.report) return;

    try {
      const soundsRes = await fetch(`/api/cars/${banModal.report.car.id}/sounds`);
      const soundsData = await soundsRes.json();
      const recording = soundsData.data?.find((r: any) => r.id === banModal.report!.recording.id);
      const userId = recording?.userId;

      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const res = await fetch('/api/sounds/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reason: banForm.reason,
          message: banForm.message,
          duration: banForm.duration,
          reportId: banModal.report.id
        })
      });

      if (res.ok) {
        setBanModal({ open: false, report: null });
        setBanForm({ duration: '1week', reason: '', message: '' });
        fetchReports();
        fetchBans();
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await fetch('/api/sounds/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status: 'dismissed' })
      });
      fetchReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة بلاغات الصوت
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            مراجعة البلاغات وإدارة الحظرات
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-colors",
              activeTab === 'reports'
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            البلاغات ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('bans')}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-colors",
              activeTab === 'bans'
                ? "bg-red-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            الحظرات ({bans.length})
          </button>
        </div>

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    filterStatus === status
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {status === 'pending' ? 'قيد المراجعة' :
                   status === 'reviewed' ? 'تمت المراجعة' :
                   status === 'resolved' ? 'تم الحل' : 'مرفوض'}
                </button>
              ))}
            </div>

            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handlePlay(report.recording.id, report.id)}
                      className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0"
                    >
                      {playingId === report.id ? (
                        <Pause className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Play className="w-5 h-5 text-blue-500 mr-0.5" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {report.car.brand.nameAr} {report.car.model.nameAr} {report.car.year}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {report.recording.duration.toFixed(1)}ث
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="font-medium">السبب:</span> {report.reason}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {report.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        بلغ: {report.reporter.name} - {new Date(report.createdAt).toLocaleDateString('ar-JO')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBanModal({ open: true, report })}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      حظر
                    </button>
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      تجاهل
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {reports.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد بلاغات</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bans' && (
          <div className="space-y-4">
            {bans.map((ban) => (
              <motion.div
                key={ban.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Ban className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ban.user.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({durationLabels[ban.duration] || ban.duration})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span className="font-medium">السبب:</span> {ban.reason}
                    </p>
                    {ban.message && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <span className="font-medium">الرسالة:</span> {ban.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      بواسطة: {ban.banner.name} - {new Date(ban.createdAt).toLocaleDateString('ar-JO')}
                      {ban.expiresAt && ` - ينتهي: ${new Date(ban.expiresAt).toLocaleDateString('ar-JO')}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {bans.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد حظرات نشطة</p>
              </div>
            )}
          </div>
        )}
      </div>

      {banModal.open && banModal.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              حظر المستخدم
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مدة الحظر
                </label>
                <select
                  value={banForm.duration}
                  onChange={(e) => setBanForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="1hour">ساعة واحدة</option>
                  <option value="2days">يومان</option>
                  <option value="1week">أسبوع واحد</option>
                  <option value="2weeks">أسبوعان</option>
                  <option value="1month">شهر واحد</option>
                  <option value="permanent">دائم</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  سبب الحظر
                </label>
                <input
                  type="text"
                  value={banForm.reason}
                  onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="مثال: محتوى مخالف"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رسالة لصاحب الإعلان (تظهر للجميع)
                </label>
                <textarea
                  value={banForm.message}
                  onChange={(e) => setBanForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="اكتب رسالة توضيحية..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setBanModal({ open: false, report: null })}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleBanUser}
                disabled={!banForm.reason}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                حظر المستخدم
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
