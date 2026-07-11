'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, Wrench, MapPin, Loader2, Search, ChevronDown, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { City, MaintenanceService } from '@/types';

const categoryLabels: Record<string, string> = {
  OIL_CHANGE: 'تغيير زيت',
  TIRES: 'بنشر وإطارات',
  BODYWORK: 'سمكرة ودهان',
  MECHANIC: 'ميكانيك',
  ELECTRICAL: 'كهرباء سيارات',
  AC: 'تكييف',
  DETAILING: 'تلميع وتنظيف',
  OTHER: 'أخرى',
};

const categoryIcons: Record<string, string> = {
  OIL_CHANGE: '🛢️',
  TIRES: '⚙️',
  BODYWORK: '🔧',
  MECHANIC: '🔩',
  ELECTRICAL: '⚡',
  AC: '❄️',
  DETAILING: '✨',
  OTHER: '🔧',
};

function CitySelector({ cities, selected, onSelect }: { cities: City[]; selected: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCity = cities.find(c => c.id === selected);
  const filtered = cities.filter(c => c.nameAr.includes(search));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(!open); setSearch(''); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500 flex items-center justify-between text-right">
        <span className={selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}>{selectedCity?.nameAr || 'كل المدن'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
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
              <button type="button" onClick={() => { onSelect(''); setOpen(false); }}
                className={`w-full px-4 py-2 text-right text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${!selected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                كل المدن
              </button>
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
              ) : (
                filtered.map(c => (
                  <button key={c.id} type="button" onClick={() => { onSelect(c.id); setOpen(false); }}
                    className={`w-full px-4 py-2 text-right text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selected === c.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {c.nameAr}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MaintenancePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetch('/api/admin/cities?active=true').then(r => r.json()).then(d => {
      if (d.success) setCities(d.data);
    });
    loadServices();
  }, []);

  useEffect(() => { loadServices(); }, [selectedCity, selectedCategory]);

  const loadServices = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCity) params.set('cityId', selectedCity);
    if (selectedCategory) params.set('category', selectedCategory);
    const res = await fetch(`/api/maintenance?${params}`);
    const d = await res.json();
    if (d.success) setServices(d.data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Wrench className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold">خدمات الصيانة والإصلاح</h1>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">المدينة</label>
              <CitySelector cities={cities} selected={selectedCity} onSelect={setSelectedCity} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">التصنيف</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500">
                <option value="">كل الخدمات</option>
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{categoryIcons[k]} {v}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <Wrench className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">لا توجد خدمات متاحة</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{categoryIcons[s.category] || '🔧'}</span>
                  {(s.user as any)?.name && (
                    <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {s.user?.name}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">{s.title}</h3>
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                  {categoryLabels[s.category] || s.category}
                </span>
                {s.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{s.description}</p>}
                {s.price && <p className="text-lg font-bold text-blue-600 mb-3">{formatPrice(s.price)}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <MapPin className="w-3 h-3" />
                  <span>{s.city?.nameAr || ''}{s.province?.nameAr ? ` - ${s.province.nameAr}` : ''}</span>
                </div>
                <div className="flex gap-2">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
                      <Phone className="w-4 h-4" /> اتصال
                    </a>
                  )}
                  {s.whatsapp && (
                    <a href={`https://wa.me/${s.whatsapp.replace(/^0|\D/g, '')}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600">
                      <MessageCircle className="w-4 h-4" /> واتساب
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
