'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
  Zap, MapPin, Search, Phone, ShieldCheck, BatteryCharging,
  Clock, DollarSign, ExternalLink, Sparkles, Filter
} from 'lucide-react';
import Link from 'next/link';

interface ChargingStation {
  id: string;
  name: string;
  provider: string;
  city: string;
  address: string;
  plugTypes: string[];
  powerKw: number;
  fastCharging: boolean;
  status: 'ONLINE' | 'BUSY';
  mapUrl: string;
}

const STATIONS: ChargingStation[] = [
  {
    id: '1',
    name: 'محطة المناصير للشحن السريع - شارع مكة',
    provider: 'المناصير للأحفوريات والشحن',
    city: 'عمان',
    address: 'شارع مكة - بجانب مكة مول',
    plugTypes: ['GB/T (DC)', 'CCS2 (DC)', 'Type 2 (AC)'],
    powerKw: 120,
    fastCharging: true,
    status: 'ONLINE',
    mapUrl: 'https://maps.google.com',
  },
  {
    id: '2',
    name: 'محطة جو بترول الفائقة - الدوار السابع',
    provider: 'Jo Petrol EV',
    city: 'عمان',
    address: 'الدوار السابع - طريق المطار',
    plugTypes: ['GB/T (DC)', 'CCS2 (DC)'],
    powerKw: 160,
    fastCharging: true,
    status: 'ONLINE',
    mapUrl: 'https://maps.google.com',
  },
  {
    id: '3',
    name: 'محطة توتال إينرجيز - إربد شارع البتراء',
    provider: 'TotalEnergies Jordan',
    city: 'إربد',
    address: 'طريق جامعة العلوم والتكنولوجيا - شارع البتراء',
    plugTypes: ['GB/T (DC)', 'CCS2 (DC)', 'Type 2'],
    powerKw: 90,
    fastCharging: true,
    status: 'ONLINE',
    mapUrl: 'https://maps.google.com',
  },
  {
    id: '4',
    name: 'محطة شحن المنطقة الحرة - الزرقاء',
    provider: 'Free Zone Power',
    city: 'الزرقاء',
    address: 'شارع 16 - المنطقة الحرة الزرقاء',
    plugTypes: ['GB/T (DC)', 'CCS2 (DC)'],
    powerKw: 120,
    fastCharging: true,
    status: 'ONLINE',
    mapUrl: 'https://maps.google.com',
  },
  {
    id: '5',
    name: 'محطة شحن العقبة الساحلية - واحة أيلة',
    provider: 'Ayla Energy EV',
    city: 'العقبة',
    address: 'شارع الفنادق - واحة أيلة العقبة',
    plugTypes: ['CCS2 (DC)', 'Type 2 (AC)'],
    powerKw: 150,
    fastCharging: true,
    status: 'ONLINE',
    mapUrl: 'https://maps.google.com',
  },
];

export default function EvChargingJordanPage() {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredStations = STATIONS.filter(st => {
    const matchesCity = selectedCity === 'ALL' || st.city === selectedCity;
    const matchesSearch = !searchQuery || st.name.includes(searchQuery) || st.address.includes(searchQuery) || st.plugTypes.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      <Header />

      <main className="container-custom max-w-5xl mx-auto px-4 py-8 flex-1">
        {/* Banner */}
        <div className="card p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white mb-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
            <Zap className="w-4 h-4" /> طاقة المستقبل بالأردن ⚡
          </span>
          <h1 className="text-2xl sm:text-4xl font-black mb-2">دليل محطات شحن السيارات الكهربائية بالأردن</h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            استكشف محطات الشحن السريع الفائقة (DC Fast Charging) للسيارات الكهربائية (BYD, VW ID.4, Changan, Tesla) في عمان، إربد، الزرقاء، والعقبة.
          </p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالموقع أو نوع الشاحن GB/T..."
              className="input text-xs pr-10"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedCity('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              كل المدن
            </button>
            <button
              onClick={() => setSelectedCity('عمان')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === 'عمان' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              عمان
            </button>
            <button
              onClick={() => setSelectedCity('إربد')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === 'إربد' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              إربد
            </button>
            <button
              onClick={() => setSelectedCity('الزرقاء')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === 'الزرقاء' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              الزرقاء
            </button>
            <button
              onClick={() => setSelectedCity('العقبة')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === 'العقبة' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              العقبة
            </button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="space-y-4">
          {filteredStations.map(st => (
            <div
              key={st.id}
              className="card p-5 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{st.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      متاحة الآن 🟢
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {st.address}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {st.plugTypes.map((plug, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        ⚡ {plug}
                      </span>
                    ))}
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      قوة {st.powerKw} kW (شحن سريع)
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={st.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-emerald px-4 py-2 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
              >
                <ExternalLink className="w-4 h-4" /> فتح الخريطة والاتجاهات
              </a>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
