'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BarChart3, Star, MessageCircle, Car, Eye, Clock, Search, Loader2, TrendingUp, ThumbsUp, Zap, Store } from 'lucide-react';

interface SellerReport {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dealerName: string | null;
  dealerLogo: string | null;
  image: string | null;
  rating: number;
  ratingCount: number;
  joinedAt: string;
  totalCars: number;
  soldCars: number;
  activeCars: number;
  totalViews: number;
  totalConversations: number;
  avgResponseTime: number | null;
  ratingDistribution: { score: number; count: number }[];
}

export default function AdminSellerReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<SellerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'soldCars' | 'totalCars' | 'avgResponseTime'>('rating');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadReports();
  }, [isAuthenticated, user, router, search]);

  const loadReports = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`/api/admin/seller-reports${params}`)
      .then(r => r.json())
      .then(data => { setReports(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const sortedReports = [...reports].sort((a, b) => {
    switch (sortBy) {
      case 'soldCars': return b.soldCars - a.soldCars;
      case 'totalCars': return b.totalCars - a.totalCars;
      case 'avgResponseTime': return (a.avgResponseTime ?? 9999) - (b.avgResponseTime ?? 9999);
      default: return (b.rating || 0) - (a.rating || 0);
    }
  });

  const getResponseTimeLabel = (minutes: number | null) => {
    if (minutes === null) return '—';
    if (minutes < 1) return 'أقل من دقيقة';
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}س ${mins}د`;
  };

  const getStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
    ));
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تقرير أداء البائعين</h1>
            <p className="text-sm text-gray-500">إحصائيات المبيعات والتقييمات وسرعة الاستجابة</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input value={search} onChange={e => { setSearch(e.target.value); setLoading(true); }}
            placeholder="بحث باسم التاجر أو البريد..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 pr-10 pl-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors" />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <div className="flex gap-2">
          {(['rating', 'soldCars', 'totalCars', 'avgResponseTime'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                sortBy === s
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}>
              {s === 'rating' ? 'التقييم' : s === 'soldCars' ? 'المبيعات' : s === 'totalCars' ? 'السيارات' : 'سرعة الرد'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : sortedReports.length === 0 ? (
        <div className="text-center py-16"><Store className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا يوجد بائعون</p></div>
      ) : (
        <div className="space-y-4">
          {sortedReports.map(seller => (
            <div key={seller.id} className="card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                      {seller.dealerName?.charAt(0) || seller.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{seller.dealerName || seller.name}</p>
                      <p className="text-xs text-gray-400">{seller.email}</p>
                      {seller.phone && <p className="text-xs text-gray-400">{seller.phone}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        {getStars(seller.rating)}
                        <span className="text-xs text-gray-500 mr-1">({seller.ratingCount})</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(expanded === seller.id ? null : seller.id)}
                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
                    {expanded === seller.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <Car className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{seller.totalCars}</p>
                    <p className="text-xs text-gray-500">إجمالي السيارات</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <ThumbsUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{seller.soldCars}</p>
                    <p className="text-xs text-gray-500">سيارات مباعة</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <Eye className="w-5 h-5 text-cyan-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{seller.totalViews}</p>
                    <p className="text-xs text-gray-500">إجمالي المشاهدات</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{getResponseTimeLabel(seller.avgResponseTime)}</p>
                    <p className="text-xs text-gray-500">متوسط سرعة الرد</p>
                  </div>
                </div>

                {expanded === seller.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">توزيع التقييمات</h4>
                        {[5, 4, 3, 2, 1].map(score => {
                          const dist = seller.ratingDistribution.find(r => r.score === score);
                          const count = dist?.count || 0;
                          const maxCount = Math.max(...seller.ratingDistribution.map(r => r.count), 1);
                          const pct = (count / maxCount) * 100;
                          return (
                            <div key={score} className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-gray-500 w-4">{score}</span>
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-6 text-left">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">معلومات الاتصال</h4>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>البريد: {seller.email}</p>
                          {seller.phone && <p>الهاتف: {seller.phone}</p>}
                          <p>عضو منذ: {new Date(seller.joinedAt).toLocaleDateString('ar-JO')}</p>
                          <p>المحادثات: {seller.totalConversations}</p>
                          <p>السيارات النشطة: {seller.activeCars}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
