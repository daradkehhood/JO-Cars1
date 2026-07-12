'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ConditionEditor } from '@/components/cars/ConditionEditor';
import type { ConditionItem } from '@/types';
import { useDropzone } from 'react-dropzone';
import {
  Car, Upload, Image as ImageIcon, X, Plus, Video, MapPin, ChevronDown,
  Sparkles, Loader2, AlertCircle, Check, Camera, Star, Search
} from 'lucide-react';
import { PriceEvaluation } from '@/components/cars/PriceEvaluation';
import { MapPicker } from '@/components/cars/MapPicker';
import { CarReviewGenerator } from '@/components/cars/CarReviewGenerator';
import toast from 'react-hot-toast';

interface Brand { id: string; nameAr: string; nameEn: string; slug: string; }
interface Model { id: string; nameAr: string; nameEn: string; slug: string; }
interface City { id: string; nameAr: string; nameEn: string; slug: string; }

type CarFormData = {
  brandId: string; modelId: string; year: number; trim: string;
  kilometers: number; fuelType: string; transmission: string; color: string;
  doors: number; engineCapacity: string; cylinders: string; drivetrain: string;
  condition: string; bodyType: string; lightingType: string; rimType: string;
  vin: string; description: string; price: number; cityId: string;
  locationLat: string; locationLng: string; phone: string; whatsapp: string;
  isNegotiable: boolean; hasWarranty: boolean; hasServiceHistory: boolean;
  isDamaged: boolean; isPaintOriginal: boolean; ownerCount: number;
  platesNumber: string; videoUrl: string;
};

const initialForm: CarFormData = {
  brandId: '', modelId: '', year: new Date().getFullYear(), trim: '',
  kilometers: 0, fuelType: '', transmission: '', color: '',
  doors: 4, engineCapacity: '', cylinders: '', drivetrain: '',
  condition: '', bodyType: '', lightingType: '', rimType: '',
  vin: '', description: '', price: 0, cityId: '',
  locationLat: '', locationLng: '', phone: '', whatsapp: '',
  isNegotiable: false, hasWarranty: false, hasServiceHistory: false,
  isDamaged: false, isPaintOriginal: true, ownerCount: 1,
  platesNumber: '', videoUrl: '',
};

export default function AddCarPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [form, setForm] = useState<CarFormData>(initialForm);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState({ price: false, description: false, specs: false });
  const [vinInfo, setVinInfo] = useState<any>(null);
  const [vinHistory, setVinHistory] = useState<any[]>([]);
  const [conditionDetails, setConditionDetails] = useState<ConditionItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetch('/api/cars/brands').then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
    fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (form.brandId) {
      fetch(`/api/cars/models?brandId=${form.brandId}`)
        .then(r => r.json()).then(d => setModels(d.data || [])).catch(() => setModels([]));
    } else { setModels([]); }
  }, [form.brandId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles].slice(0, 20);
    setImages(newImages);
    setImagePreviews(newImages.map(f => URL.createObjectURL(f)));
  }, [images]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10485760, maxFiles: 20,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newImages.map(f => URL.createObjectURL(f)));
  };

  const updateForm = (field: keyof CarFormData, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'vin') { setVinInfo(null); setVinHistory([]); }
  };

  const handleAiPrice = async () => {
    setAiLoading({ ...aiLoading, price: true });
    try {
      const res = await fetch('/api/ai/price-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: form.brandId, modelId: form.modelId, year: form.year,
          kilometers: form.kilometers, condition: form.condition, cityId: form.cityId,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`السعر المقترح: ${data.data.fairPrice?.toLocaleString()} دينار`);
        updateForm('price', data.data.fairPrice || 0);
      }
    } catch { toast.error('تعذر الحصول على تقدير السعر'); }
    finally { setAiLoading({ ...aiLoading, price: false }); }
  };

  const handleAiDescription = async () => {
    if (!form.description || form.description.length < 20) {
      toast.error('الرجاء كتابة وصف أساسي أولاً');
      return;
    }
    setAiLoading({ ...aiLoading, description: true });
    try {
      const res = await fetch('/api/ai/description', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.data) {
        updateForm('description', data.data.description);
        toast.success('تم تحسين الوصف');
      }
    } catch { toast.error('تعذر تحسين الوصف'); }
    finally { setAiLoading({ ...aiLoading, description: false }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null) formData.append(key, String(value));
      });
      if (conditionDetails.length > 0) formData.append('conditionDetails', JSON.stringify(conditionDetails));
      images.forEach(img => formData.append('images', img));
      if (coverImage) formData.append('coverImage', coverImage);
      if (videoFile) formData.append('video', videoFile);

      const res = await fetch('/api/cars', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success('تم إضافة السيارة بنجاح! في انتظار المراجعة.');
        router.push(`/cars/${data.data.slug || data.data.id}`);
      } else {
        const errMap: Record<string, string> = {};
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((d: { field: string; message: string }) => { errMap[d.field] = d.message; });
          setErrors(errMap);
          toast.error('يوجد أخطاء في البيانات، الحقول الخطأ محددة بالأحمر', { duration: 5000 });
        } else {
          toast.error(data.error || 'فشل إضافة السيارة');
        }
      }
    } catch { toast.error('حدث خطأ'); }
    finally { setLoading(false); }
  };

  const fieldError = (name: string) => errors[name] || '';

  const fuelTypes = ['بنزين', 'ديزل', 'هايبرد', 'كهرباء', 'هايبرد بلق إن'].map((v, i) => ({ value: ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID'][i], label: v }));
  const transmissions = ['يدوي', 'أوتوماتيك', 'CVT', 'DCT', 'نصف أوتوماتيك'].map((v, i) => ({ value: ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT', 'SEMI_AUTOMATIC'][i], label: v }));
  const drivetrains = ['دفع أمامي', 'دفع خلفي', 'دفع كلي', 'دفع رباعي'].map((v, i) => ({ value: ['FWD', 'RWD', 'AWD', 'FOUR_WD'][i], label: v }));
  const conditions = ['ممتازة', 'ممتازة جداً', 'جيدة جداً', 'جيدة', 'تحتاج صيانة', 'تحتاج فحص شامل'].map((v, i) => ({ value: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'NEEDS_MAINTENANCE', 'NEEDS_INSPECTION'][i], label: v }));
  const bodyTypes = ['SUV', 'سيدان', 'هاتشباك', 'كوبيه', 'مكشوفة', 'ستيشن', 'بيك أب', 'فان', 'ميني فان', 'كروس أوفر', 'رياضية', 'فاخرة'].map((v, i) => ({ value: ['SUV', 'SEDAN', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'MINIVAN', 'CROSSOVER', 'SPORTS', 'LUXURY'][i], label: v }));

  const SelectField = ({ label, value, onChange, options, placeholder, disabled, error }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean; error?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 appearance-none cursor-pointer outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          }`}
        >
          <option value="">{placeholder || `اختر ${label}`}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  const CitySelector = ({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedCity = cities.find(c => c.id === value);
    const filtered = cities.filter(c => c.nameAr.includes(search));

    return (
      <div ref={ref} className="space-y-1.5 relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المدينة</label>
        <button type="button" onClick={() => { setOpen(!open); setSearch(''); setTimeout(() => inputRef.current?.focus(), 50); }}
          className={`w-full rounded-xl border bg-white dark:bg-gray-900/50 px-4 py-3 text-sm text-right appearance-none cursor-pointer outline-none transition-all ${
            error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
          }`}>
          <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}>{selectedCity?.nameAr || 'اختر المدينة'}</span>
        </button>
        <ChevronDown className="absolute left-3 bottom-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن مدينة..." className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
                {search && <button type="button" onClick={() => setSearch('')}><X className="w-3 h-3 text-gray-400" /></button>}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
                ) : (
                  filtered.map(c => (
                    <button key={c.id} type="button" onClick={() => { onChange(c.id); setOpen(false); }}
                      className={`w-full px-4 py-2 text-right text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${value === c.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {c.nameAr}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إضافة سيارة جديدة</h1>
                <p className="text-gray-500 text-sm">املأ جميع المعلومات المطلوبة لعرض سيارتك</p>
              </div>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mb-8 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              {[1, 2, 3, 4].map(s => (
                <button key={s} onClick={() => setStep(s)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    step === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' :
                    step > s ? 'text-green-500' : 'text-gray-400'
                  }`}
                >
                  {s === 1 && 'المعلومات الأساسية'}
                  {s === 2 && 'المزيد من التفاصيل'}
                  {s === 3 && 'الصور والفيديو'}
                  {s === 4 && 'معلومات الاتصال'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectField label="الشركة" value={form.brandId} onChange={v => { updateForm('brandId', v); updateForm('modelId', ''); }}
                      options={brands.map(b => ({ value: b.id, label: b.nameAr }))} error={fieldError('brandId')} />
                    <SelectField label="الموديل" value={form.modelId} onChange={v => updateForm('modelId', v)}
                      options={models.map(m => ({ value: m.id, label: m.nameAr }))} disabled={!form.brandId} error={fieldError('modelId')} />
                    <Input label="سنة الصنع" type="number" value={form.year} onChange={e => updateForm('year', parseInt(e.target.value))} error={fieldError('year')} />
                    <Input label="الفئة" placeholder="مثلاً: GLX، فل أوبشن، بسيط..." value={form.trim} onChange={e => updateForm('trim', e.target.value)} error={fieldError('trim')} />
                    <Input label="عدد الكيلومترات" type="number" value={form.kilometers} onChange={e => updateForm('kilometers', parseInt(e.target.value))} error={fieldError('kilometers')} />
                    <SelectField label="نوع الوقود" value={form.fuelType} onChange={v => updateForm('fuelType', v)} options={fuelTypes} error={fieldError('fuelType')} />
                    <SelectField label="ناقل الحركة" value={form.transmission} onChange={v => updateForm('transmission', v)} options={transmissions} error={fieldError('transmission')} />
                    <Input label="لون السيارة" value={form.color} onChange={e => updateForm('color', e.target.value)} error={fieldError('color')} />
                    <SelectField label="نوع الجر" value={form.drivetrain} onChange={v => updateForm('drivetrain', v)} options={drivetrains} error={fieldError('drivetrain')} />
                    <SelectField label="حالة السيارة" value={form.condition} onChange={v => updateForm('condition', v)} options={conditions} error={fieldError('condition')} />
                    <Input label="السعر (دينار)" type="number" value={form.price} onChange={e => updateForm('price', parseFloat(e.target.value))} error={fieldError('price')} />
                  </div>

                  <PriceEvaluation
                    brandId={form.brandId}
                    modelId={form.modelId}
                    year={form.year}
                    kilometers={form.kilometers}
                    condition={form.condition}
                    cityId={form.cityId}
                    currentPrice={form.price}
                    onPriceSelect={(price) => updateForm('price', price)}
                  />

                  <div className="flex justify-between pt-4">
                    <div />
                    <Button type="button" onClick={() => setStep(2)}>التالي</Button>
                  </div>
                </div>
              )}

              {/* Step 2: Detailed Info */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input label="عدد الأبواب" type="number" value={form.doors} onChange={e => updateForm('doors', parseInt(e.target.value))} error={fieldError('doors')} />
                    <Input label="سعة المحرك (CC)" value={form.engineCapacity} onChange={e => updateForm('engineCapacity', e.target.value)} error={fieldError('engineCapacity')} />
                    <Input label="عدد السلندرات" value={form.cylinders} onChange={e => updateForm('cylinders', e.target.value)} error={fieldError('cylinders')} />
                    <SelectField label="نوع الهيكل" value={form.bodyType} onChange={v => updateForm('bodyType', v)} options={bodyTypes} placeholder="اختر" error={fieldError('bodyType')} />
                    <SelectField label="نوع الإضاءة" value={form.lightingType} onChange={v => updateForm('lightingType', v)}
                      options={['هالوجين', 'LED', 'زينون', 'ليزر', 'Matrix LED'].map((v, i) => ({ value: ['HALOGEN', 'LED', 'XENON', 'LASER', 'MATRIX_LED'][i], label: v }))} placeholder="اختر" error={fieldError('lightingType')} />
                    <SelectField label="نوع الجنوط" value={form.rimType} onChange={v => updateForm('rimType', v)}
                      options={['ستيل', 'ألمنيوم', 'كروم', 'فورجية'].map((v, i) => ({ value: ['STEEL', 'ALLOY', 'CHROME', 'FORGED'][i], label: v }))} placeholder="اختر" error={fieldError('rimType')} />
                    <div className="relative">
                      <Input label="رقم الهيكل (VIN)" value={form.vin} onChange={e => updateForm('vin', e.target.value.toUpperCase())} placeholder="17 حرف" error={fieldError('vin')} />
                      {form.vin.length >= 11 && (
                        <button type="button" onClick={async () => {
                          try {
                            const res = await fetch(`/api/car-history/decode/${form.vin}`);
                            const d = await res.json();
                            if (d.success) {
                              setVinInfo(d.data);
                              const hist = await fetch(`/api/car-history/${form.vin}`);
                              const hd = await hist.json();
                              if (hd.success) setVinHistory(hd.data.history || []);
                            }
                          } catch {}
                        }} className="absolute left-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                          فك
                        </button>
                      )}
                    </div>
                    <Input label="عدد المالكين" type="number" value={form.ownerCount} onChange={e => updateForm('ownerCount', parseInt(e.target.value))} error={fieldError('ownerCount')} />
                    <Input label="رقم اللوحة" value={form.platesNumber} onChange={e => updateForm('platesNumber', e.target.value)} error={fieldError('platesNumber')} />
                  </div>

                  {/* VIN Decode Result */}
                  {vinInfo && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-100 dark:border-blue-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">معلومات رقم الهيكل</h4>
                        <button type="button" onClick={() => {
                          const decoded = vinInfo;
                          let desc = form.description;
                          if (decoded.manufacturer) {
                            const parts = [
                              decoded.year ? `السيارة من موديل ${decoded.year}` : '',
                              decoded.manufacturer ? `من شركة ${decoded.manufacturer}` : '',
                              decoded.model ? `موديل ${decoded.model}` : '',
                              decoded.trim ? `فئة ${decoded.trim}` : '',
                              decoded.engine ? `، محرك ${decoded.engine}` : '',
                              decoded.fuelType ? `، وقود ${decoded.fuelType}` : '',
                              vinHistory.length > 0 ? `\n\nسجل السيارة: ${vinHistory.length} حدث مسجل` : '',
                            ].filter(Boolean).join(' ');
                            if (parts) updateForm('description', desc + (desc ? '\n\n' : '') + parts);
                          }
                        }} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors">
                          إضافة للوصف
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {vinInfo.manufacturer && <div><span className="text-gray-500">الشركة:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.manufacturer}</p></div>}
                        {vinInfo.model && <div><span className="text-gray-500">الموديل:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.model}</p></div>}
                        {vinInfo.year && <div><span className="text-gray-500">السنة:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.year}</p></div>}
                        {vinInfo.trim && <div><span className="text-gray-500">الفئة:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.trim}</p></div>}
                        {vinInfo.engine && <div><span className="text-gray-500">المحرك:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.engine}</p></div>}
                        {vinInfo.fuelType && <div><span className="text-gray-500">الوقود:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.fuelType}</p></div>}
                        {vinInfo.drivetrain && <div><span className="text-gray-500">الجر:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.drivetrain}</p></div>}
                        {vinInfo.bodyClass && <div><span className="text-gray-500">نوع الهيكل:</span><p className="font-medium text-gray-900 dark:text-white">{vinInfo.bodyClass}</p></div>}
                      </div>
                      {vinHistory.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-500/10">
                          <p className="text-xs text-gray-500 mb-2">سجل السيارة ({vinHistory.length} حدث):</p>
                          <div className="flex flex-wrap gap-2">
                            {vinHistory.slice(0, 5).map((h: any) => (
                              <span key={h.id} className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                {h.title}
                              </span>
                            ))}
                            {vinHistory.length > 5 && <span className="text-[10px] text-gray-400">+{vinHistory.length - 5}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {[
                      { key: 'isNegotiable' as const, label: 'قابل للتفاوض' },
                      { key: 'hasWarranty' as const, label: 'يوجد ضمان' },
                      { key: 'hasServiceHistory' as const, label: 'سجل صيانة' },
                      { key: 'isDamaged' as const, label: 'مصدومة سابقاً' },
                      { key: 'isPaintOriginal' as const, label: 'الدهان أصلي' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form[key] as boolean} onChange={e => updateForm(key, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوصف</label>
                    <textarea value={form.description} onChange={e => updateForm('description', e.target.value)}
                      placeholder="اكتب وصفاً تفصيلياً للسيارة..."
                      className={`w-full rounded-xl border bg-white dark:bg-gray-900/50 px-4 py-3 text-sm min-h-[150px] resize-y outline-none transition-all ${
                        fieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {fieldError('description') && <p className="text-xs text-red-500 mt-1">{fieldError('description')}</p>}
                  </div>
                  <Button type="button" variant="outline" onClick={handleAiDescription} loading={aiLoading.description}
                    icon={<Sparkles className="w-4 h-4" />} className="w-full">
                    تحسين الوصف بالذكاء الاصطناعي
                  </Button>

                  <CarReviewGenerator
                    brand={brands.find(b => b.id === form.brandId)?.nameAr}
                    model={models.find(m => m.id === form.modelId)?.nameAr}
                    year={form.year}
                    onReviewGenerated={(review) => updateForm('description', review.structured.summary)}
                  />

                  <ConditionEditor value={conditionDetails} onChange={setConditionDetails} />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>السابق</Button>
                    <Button type="button" onClick={() => setStep(3)}>التالي</Button>
                  </div>
                </div>
              )}

              {/* Step 3: Images & Video */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صورة الغلاف</label>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('coverInput')?.click()}>
                      {coverImage ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden">
                          <img src={URL.createObjectURL(coverImage)} alt="Cover" className="w-full h-full object-cover" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
                            className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">اضغط لاختيار صورة الغلاف</p>
                        </div>
                      )}
                      <input id="coverInput" type="file" accept="image/*" className="hidden"
                        onChange={e => setCoverImage(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      صور السيارة ({images.length}/20)
                    </label>
                    <div {...getRootProps()} className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer">
                      <input {...getInputProps()} />
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">اسحب وأفلت الصور هنا أو اضغط للاختيار</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP - حد أقصى 10MB لكل صورة</p>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                        {imagePreviews.map((preview, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img src={preview} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)}
                              className="absolute top-1 left-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                              <X className="w-3 h-3" />
                            </button>
                            {i === 0 && (
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-blue-500 text-white text-[10px]">غلاف</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">فيديو (اختياري)</label>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('videoInput')?.click()}>
                      {videoFile ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-green-500">
                          <Check className="w-4 h-4" />
                          {videoFile.name}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <Video className="w-5 h-5" />
                          إضافة فيديو (YouTube أو MP4)
                        </div>
                      )}
                      <input id="videoInput" type="file" accept="video/*" className="hidden"
                        onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                    </div>
                    <Input label="أو رابط فيديو YouTube" value={form.videoUrl}
                      onChange={e => updateForm('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>السابق</Button>
                    <Button type="button" onClick={() => setStep(4)}>التالي</Button>
                  </div>
                </div>
              )}

              {/* Step 4: Contact Info */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CitySelector value={form.cityId} onChange={v => updateForm('cityId', v)} error={fieldError('cityId')} />
                    <Input label="رقم الهاتف" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="07XXXXXXXX" error={fieldError('phone')} />
                    <Input label="رقم واتساب" value={form.whatsapp} onChange={e => updateForm('whatsapp', e.target.value)} placeholder="07XXXXXXXX" error={fieldError('whatsapp')} />
                    <Input label="رابط الفيديو" value={form.videoUrl} onChange={e => updateForm('videoUrl', e.target.value)} error={fieldError('videoUrl')} />
                  </div>

                  {/* Map Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 inline ml-1" />
                      موقع السيارة على الخريطة
                    </label>
                    <MapPicker
                      lat={form.locationLat ? parseFloat(form.locationLat) : null}
                      lng={form.locationLng ? parseFloat(form.locationLng) : null}
                      onChange={(lat, lng) => {
                        updateForm('locationLat', lat.toString());
                        updateForm('locationLng', lng.toString());
                      }}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={() => setStep(3)}>السابق</Button>
                    <Button type="submit" loading={loading} icon={<Plus className="w-4 h-4" />}>
                      إضافة السيارة
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
