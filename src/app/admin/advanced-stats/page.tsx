'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Users, Fuel, MapPin, Calendar, Loader2, Building2, DollarSign } from 'lucide-react';

interface AdvancedStats {
  brandDemand: { brandId: string; name: string; logo: string | null; count: number }[];
  priceDistribution: { label: string; min: number; max: number | null; count: number }[];
  userActivity: { month: string; label: string; users: number; cars: number }[];
  cityDistribution: { cityId: string; name: string; count: number }[];
  fuelDistribution: { fuelType: string; count: number }[];
  yearDistribution: { year: string; count: number }[];
}

function SimpleBar({ data, color = '#3b82f6', height = 200 }: { data: { label: string; value: number; sub?: string }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.max(20, Math.min(60, 800 / data.length));

  return (
    <div className="flex items-end gap-1" style={{ height, direction: 'ltr' }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 min-w-0 group relative">
          <span className="text-[10px] font-medium text-gray-500 mb-0.5">{d.value}</span>
          <div
            className="w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer relative"
            style={{
              height: `${Math.max((d.value / max) * (height - 40), 4)}px`,
              backgroundColor: color,
              minWidth: barWidth,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[10px] text-gray-400 mt-1 truncate max-w-full" dir="rtl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAdvancedStatsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/admin/advanced-stats')
      .then(r => r.json())
      .then(data => {
        if (data.success) setStats(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  const fuelLabels: Record<string, string> = {
    gasoline: 'بنزين', diesel: 'ديزل', hybrid: 'هايبرد', electric: 'كهرباء', gas: 'غاز',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإحصائيات المتقدمة</h1>
          <p className="text-sm text-gray-500">رسوم بيانية وتحليلات متقدمة للسوق</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
      ) : !stats ? (
        <div className="text-center py-16"><p className="text-gray-500">فشل تحميل البيانات</p></div>
      ) : (
        <div className="space-y-8">
          {/* Brand Demand */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">أكثر الماركات طلباً</h2>
            </div>
            {stats.brandDemand.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد بيانات</p>
            ) : (
              <SimpleBar
                data={stats.brandDemand.map(b => ({ label: b.name, value: b.count }))}
                color="#3b82f6"
              />
            )}
          </div>

          {/* Price Distribution */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">توزيع الأسعار</h2>
            </div>
            {stats.priceDistribution.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد بيانات</p>
            ) : (
              <SimpleBar
                data={stats.priceDistribution.map(p => ({ label: p.label, value: p.count }))}
                color="#10b981"
              />
            )}
          </div>

          {/* User Activity */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">نشاط المستخدمين (آخر 6 أشهر)</h2>
            </div>
            {stats.userActivity.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد بيانات</p>
            ) : (
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">المستخدمون الجدد</h3>
                  <SimpleBar
                    data={stats.userActivity.map(u => ({ label: u.month, value: u.users }))}
                    color="#8b5cf6"
                    height={150}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">الإعلانات الجديدة</h3>
                  <SimpleBar
                    data={stats.userActivity.map(u => ({ label: u.month, value: u.cars }))}
                    color="#f59e0b"
                    height={150}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By City */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">حسب المحافظة</h2>
              </div>
              {stats.cityDistribution.length === 0 ? (
                <p className="text-gray-400 text-sm">لا توجد بيانات</p>
              ) : (
                <div className="space-y-2">
                  {stats.cityDistribution.slice(0, 10).map(city => {
                    const max = Math.max(...stats.cityDistribution.map(c => c.count), 1);
                    const pct = (city.count / max) * 100;
                    return (
                      <div key={city.cityId} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 w-24 truncate">{city.name}</span>
                        <div className="flex-1 h-5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-left">{city.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* By Fuel Type */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Fuel className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">حسب نوع الوقود</h2>
              </div>
              {stats.fuelDistribution.length === 0 ? (
                <p className="text-gray-400 text-sm">لا توجد بيانات</p>
              ) : (
                <div className="space-y-2">
                  {stats.fuelDistribution.map(fuel => {
                    const max = Math.max(...stats.fuelDistribution.map(f => f.count), 1);
                    const pct = (fuel.count / max) * 100;
                    return (
                      <div key={fuel.fuelType} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 w-24 truncate">{fuelLabels[fuel.fuelType] || fuel.fuelType}</span>
                        <div className="flex-1 h-5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-l from-orange-500 to-amber-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-left">{fuel.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Year Distribution */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">توزيع السنوات</h2>
            </div>
            {stats.yearDistribution.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد بيانات</p>
            ) : (
              <SimpleBar
                data={stats.yearDistribution.map(y => ({ label: y.year, value: y.count }))}
                color="#6366f1"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
