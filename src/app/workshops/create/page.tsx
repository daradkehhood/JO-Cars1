'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Wrench, ArrowRight, Plus, X, Loader2, CheckCircle2,
  MapPin, Phone, Clock, DollarSign, Upload, AlertCircle,
  Camera, Image as ImageIcon,
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
  'فحص الكمبيوتر', 'تبديل البطارية', 'موازنة الإطارات', 'تكييف',
];

interface FieldError {
  field: string;
  message: string;
}

export default function CreateWorkshopPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const _hydrated = useAuth((s) => s._hydrated);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/auth/login?redirect=/workshops/create');
    }
  }, [isAuthenticated, _hydrated, router]);

  const update = (key: string, value: unknown) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((prev) => prev.filter((e) => e.field !== key));
  };

  const getFieldError = (field: string) => errors.find((e) => e.field === field);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => [...prev, { field: 'logo', message: 'حجم الصورة يجب أن يكون أقل من 5 ميغابايت' }]);
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((prev) => prev.filter((e) => e.field !== 'logo'));
  };

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => [...prev, { field: 'coverImage', message: 'حجم الصورة يجب أن يكون أقل من 10 ميغابايت' }]);
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrors((prev) => prev.filter((e) => e.field !== 'coverImage'));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.data?.url) return data.data.url;
      return null;
    } catch { return null; }
  };

  const toggleService = (name: string) => {
    setForm((p) => ({
      ...p,
      services: p.services.includes(name)
        ? p.services.filter((s) => s !== name)
        : [...p.services, name],
    }));
    setErrors((prev) => prev.filter((e) => e.field !== 'services'));
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

  const validate = (): boolean => {
    const newErrors: FieldError[] = [];

    if (step === 1) {
      if (!form.name.trim()) newErrors.push({ field: 'name', message: 'اسم الورشة مطلوب' });
      if (!form.phone.trim() && !form.whatsapp.trim()) {
        newErrors.push({ field: 'phone', message: 'أدخل رقم الهاتف أو الواتساب' });
      }
    }
    if (step === 2) {
      if (form.services.length === 0) newErrors.push({ field: 'services', message: 'اختر خدمة واحدة على الأقل' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.services.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setErrors([{ field: 'name', message: 'اسم الورشة مطلوب' }]);
      setStep(1);
      return;
    }
    if (form.services.length === 0) {
      setErrors([{ field: 'services', message: 'اختر خدمة واحدة على الأقل' }]);
      setStep(2);
      return;
    }

    setLoading(true);
    setErrors([]);
    try {
      let logoUrl = null;
      let coverUrl = null;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile);
      }
      if (coverFile) {
        coverUrl = await uploadImage(coverFile);
      }

      const payload = {
        ...form,
        logo: logoUrl,
        coverImage: coverUrl,
        services: form.services.map((name) => {
          const found = SERVICE_OPTIONS.find((s) => s.name === name);
          return { name, category: found?.category || 'other' };
        }),
        brands: form.brands.map((brand) => ({ brand })),
        prices: form.prices.filter((p) => p.serviceName && p.minPrice > 0),
      };

      const res = await fetch('/api/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setErrors([{ field: 'auth', message: 'يجب تسجيل الدخول أولاً' }]);
          return;
        }
        setErrors([{ field: 'submit', message: data.error || 'فشل إنشاء الورشة' }]);
        return;
      }

      router.push(`/workshops/${data.data?.id || ''}`);
    } catch {
      setErrors([{ field: 'submit', message: 'حدث خطأ، حاول مرة أخرى' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084ff] mx-auto mb-4" />
          <p className="text-gray-400">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  const ErrorTag = ({ field }: { field: string }) => {
    const err = getFieldError(field);
    if (!err) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-xs">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{err.message}</span>
      </div>
    );
  };

  const FieldWrapper = ({ field, label, required, children }: { field: string; label: string; required?: boolean; children: React.ReactNode }) => {
    const hasError = !!getFieldError(field);
    return (
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {children}
        <ErrorTag field={field} />
      </div>
    );
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
                  i + 1 <= step ? 'bg-[#0084ff] text-white' : 'bg-[#16213e] text-gray-500 border border-gray-700'
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

        {/* Global Errors */}
        <AnimatePresence>
          {errors.filter((e) => e.field === 'auth' || e.field === 'submit').length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errors.filter((e) => e.field === 'auth' || e.field === 'submit').map((e) => e.message).join(', ')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
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

              {/* Logo & Cover Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">شعار الورشة</label>
                  <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className={`w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                      getFieldError('logo')
                        ? 'border-red-500 bg-red-500/10'
                        : logoPreview
                          ? 'border-[#0084ff] bg-[#0084ff]/10'
                          : 'border-gray-700 bg-[#0f3460] hover:border-[#0084ff] hover:bg-[#0084ff]/5'
                    }`}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="شعار الورشة" className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-500" />
                        <span className="text-sm text-gray-500">اضغط لرفع الشعار</span>
                      </>
                    )}
                  </button>
                  <ErrorTag field="logo" />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">صورة الغلاف</label>
                  <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    className={`w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                      getFieldError('coverImage')
                        ? 'border-red-500 bg-red-500/10'
                        : coverPreview
                          ? 'border-[#0084ff] bg-[#0084ff]/10'
                          : 'border-gray-700 bg-[#0f3460] hover:border-[#0084ff] hover:bg-[#0084ff]/5'
                    }`}
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="غلاف الورشة" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-500" />
                        <span className="text-sm text-gray-500">اضغط لرفع صورة الغلاف</span>
                      </>
                    )}
                  </button>
                  <ErrorTag field="coverImage" />
                </div>
              </div>

              <FieldWrapper field="name" label="اسم الورشة" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="مثال: ورشة أحمد للميكانيك"
                  className={`w-full rounded-xl border bg-[#0f3460] text-white px-4 py-3 text-sm outline-none transition-colors ${
                    getFieldError('name') ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#0084ff]'
                  }`}
                />
              </FieldWrapper>

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
                <FieldWrapper field="phone" label="رقم الهاتف" required>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="07XXXXXXXX"
                    className={`w-full rounded-xl border bg-[#0f3460] text-white px-4 py-3 text-sm outline-none transition-colors ${
                      getFieldError('phone') ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#0084ff]'
                    }`}
                  />
                </FieldWrapper>
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

              <FieldWrapper field="services" label="الخدمات المقدمة" required>
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
              </FieldWrapper>

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

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-[#0084ff]" />
                مراجعة وإرسال
              </h2>

              <div className="space-y-4">
                {/* Preview Cover & Logo */}
                <div className="relative rounded-xl overflow-hidden bg-[#0f3460] border border-gray-700">
                  {coverPreview ? (
                    <img src={coverPreview} alt="غلاف" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-[#0f3460] to-[#1a1a2e] flex items-center justify-center">
                      <Wrench className="w-12 h-12 text-[#0084ff]/20" />
                    </div>
                  )}
                  {logoPreview && (
                    <div className="absolute bottom-0 right-4 translate-y-1/2">
                      <img src={logoPreview} alt="شعار" className="w-20 h-20 rounded-xl border-4 border-[#16213e] object-cover" />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#0f3460] border border-gray-700 pt-12">
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

                {form.prices.filter((p) => p.serviceName).length > 0 && (
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
              onClick={() => { setErrors([]); setStep((s) => s - 1); }}
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
              onClick={() => { if (validate()) setStep((s) => s + 1); }}
              className="flex items-center gap-2 px-6 py-3 bg-[#0084ff] text-white rounded-xl font-medium hover:bg-[#006cd9] transition-all"
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
