'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings, Save, Loader2, Upload, Image, Palette, Globe, Fuel, Grid3X3,
  MapPin, Building2, Car, Star, CreditCard, ChevronLeft, Plus, X, Check, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'general', label: 'عام', icon: Settings },
  { id: 'appearance', label: 'المظهر', icon: Palette },
  { id: 'homepage', label: 'الصفحة الرئيسية', icon: Globe },
  { id: 'fuel-types', label: 'أنواع الوقود', icon: Fuel },
  { id: 'body-types', label: 'الفئات', icon: Grid3X3 },
  { id: 'links', label: 'إدارة المحتوى', icon: Car },
];

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState<Record<string, any>>({});

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data.success) setForm(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      // logo files are handled by file inputs separately
      // send all text fields
      const textFields = [
        'siteName', 'siteNameAr', 'metaDescription', 'metaKeywords',
        'currency', 'currencyAr', 'taxPercent',
        'contactEmail', 'contactPhone', 'address', 'socialMedia',
        'maintenance', 'maintenanceMessage',
        'primaryColor', 'secondaryColor', 'accentColor',
        'homeHeroTitle', 'homeHeroSubtitle',
        'homeShowFeatured', 'homeShowCities', 'homeShowBrands', 'homeShowStats',
        'fuelTypes', 'bodyTypes',
      ];
      for (const key of textFields) {
        if (form[key] !== undefined) fd.append(key, String(form[key]));
      }
      const res = await fetch('/api/admin/settings', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) toast.success('تم حفظ الإعدادات');
      else toast.error(data.error || 'فشل الحفظ');
    } catch { toast.error('حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (key: string, file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append(key, file);
    const res = await fetch('/api/admin/settings', { method: 'PUT', body: fd });
    const data = await res.json();
    if (data.success) { setForm(data.data); toast.success('تم رفع الشعار'); }
    else toast.error('فشل الرفع');
  };

  // Fuel & body types management
  const [newFuel, setNewFuel] = useState('');
  const [newBody, setNewBody] = useState('');

  const addFuelType = () => {
    if (!newFuel.trim()) return;
    const arr = JSON.parse(form.fuelTypes || '[]');
    if (arr.includes(newFuel.trim())) { toast.error('موجود مسبقاً'); return; }
    arr.push(newFuel.trim());
    update('fuelTypes', JSON.stringify(arr));
    setNewFuel('');
  };
  const removeFuelType = (v: string) => {
    const arr = JSON.parse(form.fuelTypes || '[]').filter((x: string) => x !== v);
    update('fuelTypes', JSON.stringify(arr));
  };

  const addBodyType = () => {
    if (!newBody.trim()) return;
    const arr = JSON.parse(form.bodyTypes || '[]');
    if (arr.includes(newBody.trim())) { toast.error('موجود مسبقاً'); return; }
    arr.push(newBody.trim());
    update('bodyTypes', JSON.stringify(arr));
    setNewBody('');
  };
  const removeBodyType = (v: string) => {
    const arr = JSON.parse(form.bodyTypes || '[]').filter((x: string) => x !== v);
    update('bodyTypes', JSON.stringify(arr));
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const TabButton = ({ tab }: { tab: typeof tabs[0] }) => (
    <button onClick={() => setActiveTab(tab.id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
        activeTab === tab.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}>
      <tab.icon className="w-4 h-4" /> {tab.label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إعدادات الموقع</h1>
          <p className="text-sm text-gray-500">التحكم الكامل بإعدادات ومحتوى الموقع</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => <TabButton key={t.id} tab={t} />)}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">

        {/* GENERAL */}
        {activeTab === 'general' && (
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">الإعدادات العامة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الموقع (عربي)</label>
                <input value={form.siteNameAr || ''} onChange={e => update('siteNameAr', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الموقع (إنجليزي)</label>
                <input value={form.siteName || ''} onChange={e => update('siteName', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العملة</label>
                <input value={form.currency || ''} onChange={e => update('currency', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رمز العملة</label>
                <input value={form.currencyAr || ''} onChange={e => update('currencyAr', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الضريبة (%)</label>
                <input type="number" value={form.taxPercent || 0} onChange={e => update('taxPercent', parseFloat(e.target.value) || 0)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">معلومات الاتصال</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                  <input value={form.contactEmail || ''} onChange={e => update('contactEmail', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                  <input value={form.contactPhone || ''} onChange={e => update('contactPhone', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                  <input value={form.address || ''} onChange={e => update('address', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">تحسين محركات البحث (SEO)</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وصف الموقع</label>
                  <input value={form.metaDescription || ''} onChange={e => update('metaDescription', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكلمات المفتاحية</label>
                  <input value={form.metaKeywords || ''} onChange={e => update('metaKeywords', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">صيانة الموقع</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.maintenance || false} onChange={e => update('maintenance', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">تفعيل وضع الصيانة</span>
              </label>
              {form.maintenance && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رسالة الصيانة</label>
                  <input value={form.maintenanceMessage || ''} onChange={e => update('maintenanceMessage', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPEARANCE */}
        {activeTab === 'appearance' && (
          <div className="card p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">الشعار</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                  {form.logo ? <img src={form.logo} alt="Logo" className="w-full h-full object-contain" /> : <Image className="w-8 h-8 text-gray-300" />}
                </div>
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                  <Upload className="w-4 h-4 inline ml-1" />رفع الشعار
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload('logo', e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">الألوان</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { key: 'primaryColor', label: 'اللون الأساسي' },
                  { key: 'secondaryColor', label: 'اللون الثانوي' },
                  { key: 'accentColor', label: 'لون التمييز' },
                ].map(c => (
                  <div key={c.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{c.label}</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form[c.key] || '#2563eb'} onChange={e => update(c.key, e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700" />
                      <input value={form[c.key] || ''} onChange={e => update(c.key, e.target.value)}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HOMEPAGE */}
        {activeTab === 'homepage' && (
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">إعدادات الصفحة الرئيسية</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان القسم الرئيسي (Hero)</label>
                <input value={form.homeHeroTitle || ''} onChange={e => update('homeHeroTitle', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النص الفرعي</label>
                <input value={form.homeHeroSubtitle || ''} onChange={e => update('homeHeroSubtitle', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">إظهار الأقسام</h3>
              <div className="space-y-3">
                {[
                  { key: 'homeShowFeatured', label: 'إظهار السيارات المميزة' },
                  { key: 'homeShowCities', label: 'إظهار قسم المحافظات' },
                  { key: 'homeShowBrands', label: 'إظهار قسم الشركات' },
                  { key: 'homeShowStats', label: 'إظهار الإحصائيات' },
                ].map(s => (
                  <label key={s.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form[s.key] !== false} onChange={e => update(s.key, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FUEL TYPES */}
        {activeTab === 'fuel-types' && (
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">أنواع الوقود</h2>
            <div className="flex gap-2">
              <input value={newFuel} onChange={e => setNewFuel(e.target.value.toUpperCase())}
                placeholder="أدخل نوع الوقود..."
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
              <button onClick={addFuelType} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all flex items-center gap-1">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {JSON.parse(form.fuelTypes || '[]').map((v: string) => (
                <span key={v} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  {v}
                  <button onClick={() => removeFuelType(v)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* BODY TYPES */}
        {activeTab === 'body-types' && (
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">فئات السيارات</h2>
            <div className="flex gap-2">
              <input value={newBody} onChange={e => setNewBody(e.target.value.toUpperCase())}
                placeholder="أدخل الفئة..."
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
              <button onClick={addBodyType} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all flex items-center gap-1">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {JSON.parse(form.bodyTypes || '[]').map((v: string) => (
                <span key={v} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  {v}
                  <button onClick={() => removeBodyType(v)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* LINKS TO OTHER PAGES */}
        {activeTab === 'links' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { href: '/admin/cities', label: 'المحافظات', icon: MapPin, desc: 'إدارة المحافظات والمدن', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/10' },
              { href: '/admin/brands', label: 'الشركات', icon: Building2, desc: 'إدارة شركات السيارات', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' },
              { href: '/admin/models', label: 'الموديلات', icon: Car, desc: 'إدارة موديلات السيارات', color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-500/10' },
              { href: '/admin/plans', label: 'الباقات', icon: Star, desc: 'باقات الإعلانات المميزة', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10' },
              { href: '/admin/subscriptions', label: 'الاشتراكات', icon: CreditCard, desc: 'إدارة الاشتراكات', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-500/10' },
              { href: '/admin/badges', label: 'الشارات', icon: Award, desc: 'نظام شارات المستخدمين', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="card p-5 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center`}>
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">{link.label}</p>
                    <p className="text-xs text-gray-400">{link.desc}</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}

      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
        </button>
      </div>
    </div>
  );
}
