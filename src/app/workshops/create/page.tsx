'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wrench, ArrowRight, Plus, X, Loader2, CheckCircle2,
  MapPin, Phone, Clock, Star, DollarSign, Image as ImageIcon,
} from 'lucide-react';

const SERVICE_OPTIONS = [
  { name: 'ميكانيك', category: 'mechanical' },
  { name: 'كهرباء', category: 'electrical' },
  { name: 'برمجة', category: 'electrical' },
  { name: 'تغيير زيت', category: 'maintenance' },
  { name: 'ميزان', category: 'maintenance' },
  { name: 'فحص كمبيوتر', category: 'electrical' },
  { name: 'سمكرة', category: 'body' },
  { name: 'دهان', category: 'body' },
  { name: 'بطاريات', category: 'maintenance' },
  { name: 'إطارات', category: 'maintenance' },
  { name: 'تكييف', category: 'mechanical' },
  { name: 'هايبرد', category: 'mechanical' },
  { name: 'سيارات كهربائية', category: 'mechanical' },
  { name: 'خدمات متنقلة', category: 'other' },
  { name: 'سحب سيارات', category: 'other' },
];

const BRAND_OPTIONS = [
  'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Mitsubishi',
  'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Jeep',
  'Tesla', 'Lexus', 'Infiniti', 'Acura', 'Suzuki', 'Isuzu',
  'Peugeot', 'Renault', 'Fiat', 'Volvo', 'Skoda',
];

const PRICE_SERVICES = [
  'تغيير الزيت', 'تبديل البواجي', 'تبديل الكلتش', 'غسيل الرديتر',
  'فحص الكمبيوتر', 'تبديل البطارية', ' balancing الإطارات', 'تكييف',
];

export default function CreateWorkshopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    address: '',
    workingHours: '08:00-17:00',
    workingDays: 'Sun-Thu',
    yearsOfExperience: 0,
    employeeCount: 1,
    services: [] as string[],
    brands: [] as string[],
    prices: [] as { serviceName: string; minPrice: number; maxPrice: number }[],
  });

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const toggleService = (name: string) => {
    setForm((p) => ({
      ...p,
      services: p.services.includes(name)
        ? p.services.filter((s) => s !== name)
        : [...p.services, name],
    }));
  };

  const toggleBrand = (brand: string) => {
    setForm((p) => ({
      ...p,
      brands: p.brands.includes(brand)
        ? p.brands.filter((b) => b !== brand)
        : [...p.brands, brand],
    }));
  };

  const addPrice = () => {
    setForm((p) => ({
      ...p,
      prices: [...p.prices, { serviceName: '', minPrice: 0, maxPrice: 0 }],
    }));
  };

  const updatePrice = (index: number, key: string, value: string | number) => {
    setForm((p) => {
      const prices = [...p.prices];
      prices[index] = { ...prices[index], [key]: value };
      return { ...p, prices };
    });
  };

  const removePrice = (index: number) => {
    setForm((p) => ({ ...p, prices: p.prices.filter((_, i) => i !== index) }));
  };

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.services.length > 0;
    if (step === 3) return true;
    return true;
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('اسم الورشة مطلوب');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        services: form.services.map((name) => {
          const found = SERVICE_OPTIONS.find((s) => s.name === name);
          return { name, category: found?.category || 'other' };
        }),
        brands: form.brands.map((brand) => ({ brand })),
        prices: form.prices.filter((p) => p.serviceName),
      };

      const res = await fetch('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل إنشاء الورشة');
        return;
      }

      router.push(`/workshops/${data.data?.id || ''}`);
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/workshops" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#0084ff] transition-colors mb-4">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm">العودة للورش</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">إضافة ورشة جديدة</h1>
          <p className="text-gray-400">سجّل ورشتك وابدأ في استقطاب العملاء</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                  i + 1 <= step
                    ? 'bg-[#0084ff] text-white'
                    : 'bg-[#16213e] text-gray-500 border border-gray-700'
                }`}
              >
                {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-1 rounded-full transition-all ${i + 1 < step ? 'bg-[#0084ff]' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Steps */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === 1 ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-gray-700 bg-[#16213e] p-6 md:p-8"
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Wrench className="w-5 h-5 text-[#0084ff]" />
                المعلومات الأساسية
              </h2>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">اسم الورشة *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="مثال: ورشة أحمد للميكانيك"
                  className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">وصف الورشة</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="اكتب وصفاً مختصراً عن ورشتك..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">رقم الواتساب</label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                    placeholder="9627XXXXXXXX"
                    className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="workshop@example.com"
                    className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">الموقع الإلكتروني</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">العنوان</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="المحافظة، المدينة، الشارع"
                  className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">ساعات العمل</label>
                  <input
                    type="text"
                    value={form.workingHours}
                    onChange={(e) => update('workingHours', e.target.value)}
                    placeholder="08:00-17:00"
                    className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">أيام العمل</label>
                  <input
                    type="text"
                    value={form.workingDays}
                    onChange={(e) => update('workingDays', e.target.value)}
                    placeholder="Sun-Thu"
                    className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">سنوات الخبرة</label>
                  <input
                    type="number"
                    value={form.yearsOfExperience}
                    onChange={(e) => update('yearsOfExperience', parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">عدد الموظفين</label>
                <input
                  type="number"
                  value={form.employeeCount}
                  onChange={(e) => update('employeeCount', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full rounded-xl border border-gray-700 bg-[#0f3460] text-white px-4 py-3 text-sm outline-none focus:border-[#0084ff] transition-colors md:w-1/3"
                />
              </div>
            </div>
          )}

          {/* Step 2: Services & Brands */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Wrench className="w-5 h-5 text-[#0084ff]" />
                الخدمات والماركات
              </h2>

              <div>
                <label className="block text-sm text-gray-400 mb-3">الخدمات المقدمة *</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleService(s.name)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        form.services.includes(s.name)
                          ? 'bg-[#0084ff] text-white shadow-lg shadow-blue-500/20'
                          : 'bg-[#0f3460] text-gray-400 border border-gray-700 hover:border-[#0084ff] hover:text-white'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {form.services.length > 0 && (
                  <p className="text-xs text-[#0084ff] mt-2">{form.services.length} خدمة محددة</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">الماركات المدعومة</label>
                <div className="flex flex-wrap gap-2">
                  {BRAND_OPTIONS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBrand(b)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        form.brands.includes(b)
                          ? 'bg-[#0084ff] text-white shadow-lg shadow-blue-500/20'
                          : 'bg-[#0f3460] text-gray-400 border border-gray-700 hover:border-[#0084ff] hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {form.brands.length > 0 && (
                  <p className="text-xs text-[#0084ff] mt-2">{form.brands.length} ماركة محددة</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Prices */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-[#0084ff]" />
                الأسعار التقريبية <span className="text-sm font-normal text-gray-500">(اختياري)</span>
              </h2>

              <p className="text-sm text-gray-400">
                أضف الأسعار التقريبية لخدماتك حتى يعرف العملاء التكلفة المتوقعة
              </p>

              <div className="space-y-3">
                {form.prices.map((price, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[#0f3460] border border-gray-700">
                    <select
                      value={price.serviceName}
                      onChange={(e) => updatePrice(i, 'serviceName', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-700 bg-[#16213e] text-white text-sm outline-none focus:border-[#0084ff]"
                    >
                      <option value="">اختر الخدمة</option>
                      {PRICE_SERVICES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={price.minPrice || ''}
                        onChange={(e) => updatePrice(i, 'minPrice', parseFloat(e.target.value) || 0)}
                        placeholder="من"
                        className="w-20 h-10 px-2 rounded-lg border border-gray-700 bg-[#16213e] text-white text-sm text-center outline-none focus:border-[#0084ff]"
                      />
                      <span className="text-gray-500 text-sm">-</span>
                      <input
                        type="number"
                        value={price.maxPrice || ''}
                        onChange={(e) => updatePrice(i, 'maxPrice', parseFloat(e.target.value) || 0)}
                        placeholder="إلى"
                        className="w-20 h-10 px-2 rounded-lg border border-gray-700 bg-[#16213e] text-white text-sm text-center outline-none focus:border-[#0084ff]"
                      />
                      <span className="text-gray-500 text-xs">د.أ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrice(i)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPrice}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:border-[#0084ff] hover:text-[#0084ff] transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                إضافة سعر
              </button>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-[#0084ff]" />
                مراجعة وإرسال
              </h2>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0f3460] border border-gray-700">
                  <h3 className="text-white font-semibold mb-2">{form.name}</h3>
                  {form.description && <p className="text-gray-400 text-sm mb-3">{form.description}</p>}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {form.phone && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        {form.phone}
                      </div>
                    )}
                    {form.whatsapp && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-3.5 h-3.5 text-green-500" />
                        واتساب: {form.whatsapp}
                      </div>
                    )}
                    {form.address && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {form.address}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {form.workingHours} | {form.workingDays}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0f3460] border border-gray-700">
                  <h4 className="text-white text-sm font-semibold mb-2">الخدمات ({form.services.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {form.services.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-[#0084ff]/10 text-[#0084ff] text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                {form.brands.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#0f3460] border border-gray-700">
                    <h4 className="text-white text-sm font-semibold mb-2">الماركات ({form.brands.length})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {form.brands.map((b) => (
                        <span key={b} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">{b}</span>
                      ))}
                    </div>
                  </div>
                )}

                {form.prices.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#0f3460] border border-gray-700">
                    <h4 className="text-white text-sm font-semibold mb-2">الأسعار</h4>
                    <div className="space-y-1.5">
                      {form.prices.filter((p) => p.serviceName).map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{p.serviceName}</span>
                          <span className="text-[#0084ff]">{p.minPrice} - {p.maxPrice} د.أ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
                سيتم مراجعة ورشتك من قبل الإدارة قبل النشر. سيتم إشعارك عند الموافقة.
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-700 bg-[#16213e] text-gray-300 hover:border-[#0084ff] hover:text-white transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              السابق
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-3 bg-[#0084ff] text-white rounded-xl font-medium hover:bg-[#006cd9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              التالي
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  إرسال للمراجعة
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
