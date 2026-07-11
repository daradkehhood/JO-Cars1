'use client';

import { useMemo } from 'react';
import { useCompareStore } from '@/store';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, BarChart3, Fuel, Gauge, Calendar, Settings, Cpu, Bike, Palette, DoorOpen, Star, Shield, CheckCircle, XCircle, Trophy, TrendingDown, TrendingUp, DollarSign, Award, ChevronLeft } from 'lucide-react';
import { formatPrice, formatDistance, formatNumber, getFuelTypeLabel, getTransmissionLabel, getDrivetrainLabel, getConditionLabel, getBodyTypeLabel } from '@/lib/utils';
import type { Car } from '@/types';

function estimateFuelConsumption(car: Car): string {
  const cc = car.engineCapacity || 0;
  if (car.fuelType === 'ELECTRIC') return '15-20 kWh/100km';
  let base = 0;
  if (cc < 1000) base = 5.5;
  else if (cc < 1500) base = 6.5;
  else if (cc < 2000) base = 8;
  else if (cc < 3000) base = 10.5;
  else base = 13.5;
  if (car.fuelType === 'DIESEL') base *= 0.8;
  if (car.fuelType === 'HYBRID' || car.fuelType === 'PLUGIN_HYBRID') base *= 0.6;
  return `${base.toFixed(1)} لتر/100كم`;
}

function calcScore(car: Car, allCars: Car[]): number {
  let score = 0;
  const prices = allCars.map(c => c.price);
  const kms = allCars.map(c => c.kilometers);
  const years = allCars.map(c => c.year);
  const owners = allCars.map(c => c.ownerCount || 1);

  const norm = (val: number, min: number, max: number, invert = false): number => {
    if (max === min) return 0.5;
    const n = (val - min) / (max - min);
    return invert ? 1 - n : n;
  };

  score += norm(car.price, Math.min(...prices), Math.max(...prices), true) * 30;
  score += norm(car.kilometers, Math.min(...kms), Math.max(...kms), true) * 20;
  score += norm(car.year, Math.min(...years), Math.max(...years)) * 20;
  score += norm(car.ownerCount || 1, Math.min(...owners), Math.max(...owners), true) * 10;

  const condOrder = ['NEEDS_INSPECTION', 'NEEDS_MAINTENANCE', 'FAIR', 'GOOD', 'VERY_GOOD', 'EXCELLENT'];
  const condIdx = condOrder.indexOf(car.condition);
  if (condIdx >= 0) score += (condIdx / (condOrder.length - 1)) * 10;

  if (car.hasWarranty) score += 3;
  if (car.hasServiceHistory) score += 3;
  if (!car.isDamaged) score += 2;
  if (car.isPaintOriginal) score += 1;
  if (car.isNegotiable) score += 1;

  return Math.round(score);
}

const CONDITION_ORDER = ['NEEDS_INSPECTION', 'NEEDS_MAINTENANCE', 'FAIR', 'GOOD', 'VERY_GOOD', 'EXCELLENT'];

export default function ComparePage() {
  const { cars, removeCar, clearAll } = useCompareStore();

  const results = useMemo(() => {
    if (cars.length < 2) return { scores: [], winner: null, priceDiff: [] };
    const scores = cars.map(c => ({ carId: c.id, score: calcScore(c, cars) }));
    const maxScore = Math.max(...scores.map(s => s.score));
    const winner = cars.find(c => c.id === scores.find(s => s.score === maxScore)?.carId) || null;

    const minPrice = Math.min(...cars.map(c => c.price));
    const priceDiff = cars.map(c => ({ carId: c.id, diff: c.price - minPrice }));

    return { scores, winner, priceDiff };
  }, [cars]);

  if (cars.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد سيارات للمقارنة</h2>
          <p className="text-gray-500 mb-6">أضف سيارتين على الأقل للمقارنة من صفحة السيارة</p>
          <Link href="/cars" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all">تصفح السيارات</Link>
        </div>
      </div>
    );
  }

  const specs: { label: string; key: string; render: (c: Car) => string | JSX.Element }[] = [
    { label: 'السعر', key: 'price', render: (c) => {
      const diff = results.priceDiff.find(d => d.carId === c.id);
      const isCheapest = diff && diff.diff === 0;
      return (
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg font-bold">{formatPrice(c.price)}</span>
          {isCheapest && <Award className="w-4 h-4 text-green-500" />}
        </div>
      );
    }},
    { label: 'فرق السعر', key: 'diff', render: (c) => {
      const diff = results.priceDiff.find(d => d.carId === c.id);
      if (!diff || diff.diff === 0) return <span className="text-green-500 font-medium">الأقل سعراً</span>;
      return <span className="text-red-500">+{formatPrice(diff.diff)}</span>;
    }},
    { label: 'المسافة', key: 'km', render: (c) => formatDistance(c.kilometers) },
    { label: 'سنة الصنع', key: 'year', render: (c) => String(c.year) },
    { label: 'الحالة', key: 'cond', render: (c) => getConditionLabel(c.condition) },
    { label: 'الوقود', key: 'fuel', render: (c) => getFuelTypeLabel(c.fuelType) },
    { label: 'استهلاك الوقود', key: 'cons', render: (c) => estimateFuelConsumption(c) },
    { label: 'الحركة', key: 'trans', render: (c) => getTransmissionLabel(c.transmission) },
    { label: 'المحرك', key: 'engine', render: (c) => c.engineCapacity ? `${c.engineCapacity} CC` : '-' },
    { label: 'الأسطوانات', key: 'cyl', render: (c) => c.cylinders ? `${c.cylinders} سلندر` : '-' },
    { label: 'الدفع', key: 'drive', render: (c) => getDrivetrainLabel(c.drivetrain) },
    { label: 'نوع الهيكل', key: 'body', render: (c) => c.bodyType ? getBodyTypeLabel(c.bodyType) : '-' },
    { label: 'اللون', key: 'color', render: (c) => c.color || '-' },
    { label: 'الأبواب', key: 'doors', render: (c) => `${c.doors} أبواب` },
    { label: 'عدد الملاك', key: 'owners', render: (c) => String(c.ownerCount || 1) },
    { label: 'قابل للتفاوض', key: 'nego', render: (c) => c.isNegotiable ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" /> },
    { label: 'ضمان', key: 'warr', render: (c) => c.hasWarranty ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" /> },
    { label: 'سجل صيانة', key: 'shist', render: (c) => c.hasServiceHistory ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" /> },
    { label: 'حوادث', key: 'damage', render: (c) => c.isDamaged ? <span className="text-red-500">نعم</span> : <span className="text-green-500">لا</span> },
    { label: 'دهان أصلي', key: 'paint', render: (c) => c.isPaintOriginal ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" /> },
    { label: 'نقطة التقييم', key: 'score', render: (c) => {
      const s = results.scores.find(s => s.carId === c.id);
      return <span className="font-bold text-lg">{s?.score || 0}</span>;
    }},
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مقارنة السيارات</h1>
              <p className="text-gray-500 text-sm">مقارنة {cars.length} سيارات</p>
            </div>
          </div>
          <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            مسح الكل
          </button>
        </div>

        {/* Winner Banner */}
        {results.winner && cars.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-2xl p-6 mb-8 text-white text-center shadow-xl shadow-amber-500/20">
            <Trophy className="w-10 h-10 mx-auto mb-2" />
            <h2 className="text-xl font-bold">السيارة الموصى بها</h2>
            <p className="text-2xl font-black mt-1">{results.winner.brand?.nameAr} {results.winner.model?.nameAr} {results.winner.year}</p>
            <p className="text-amber-100 text-sm mt-1">
              بناءً على السعر، الممشى، سنة الصنع، الحالة، والمواصفات
            </p>
          </motion.div>
        )}

        {/* Car Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" style={cars.length >= 3 ? { gridTemplateColumns: `repeat(${cars.length}, 1fr)` } : {}}>
          {cars.map((car) => {
            const s = results.scores.find(s => s.carId === car.id);
            const isWinner = results.winner?.id === car.id;
            return (
              <motion.div key={car.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`card p-4 text-center relative ${isWinner ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/10' : ''}`}>
                <button onClick={() => removeCar(car.id)}
                  className="absolute top-2 left-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 z-10">
                  <X className="w-4 h-4" />
                </button>
                {isWinner && (
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg z-10">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                )}
                <Link href={`/cars/${car.slug || car.id}`}>
                  <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800">
                    {car.images?.[0] && (
                      <img src={car.images[0].url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{car.brand?.nameAr} {car.model?.nameAr}</h3>
                  <p className="text-lg font-bold text-blue-500 mt-1">{formatPrice(car.price)}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{car.year}</span>
                    <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3" />{formatDistance(car.kilometers)}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Specs Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <tbody>
              {specs.map((spec, i) => (
                <motion.tr key={spec.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="py-3 pl-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {spec.label}
                  </td>
                  {cars.map(car => {
                    const isWinner = results.winner?.id === car.id;
                    const bestPrice = results.priceDiff.find(d => d.carId === car.id)?.diff === 0;
                    const isBest = spec.key === 'price' ? bestPrice : isWinner;
                    return (
                      <td key={car.id} className={`px-3 py-3 text-center text-gray-600 dark:text-gray-400 ${isWinner && spec.key === 'score' ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                        <div className="flex items-center justify-center gap-1">
                          {isBest && spec.key === 'price' && <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                          {spec.render(car)}
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Winner Explanation */}
        {results.winner && cars.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-10 card p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              لماذا {results.winner.brand?.nameAr} {results.winner.model?.nameAr} هي الأفضل؟
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {results.scores.sort((a, b) => b.score - a.score).map((s, i) => {
                const car = cars.find(c => c.id === s.carId);
                if (!car) return null;
                const isW = i === 0;
                const diff = i > 0 ? s.score - results.scores[0].score : 0;
                return (
                  <div key={s.carId} className={`p-4 rounded-xl ${isW ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <p className="font-semibold text-gray-900 dark:text-white">{car.brand?.nameAr} {car.model?.nameAr}</p>
                    <p className="text-2xl font-black mt-1">{s.score}</p>
                    <p className="text-xs text-gray-500">نقطة</p>
                    {!isW && <p className="text-xs text-red-500 mt-1">أقل بـ {Math.abs(diff)} نقاط من الأفضل</p>}
                    {isW && <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><Trophy className="w-3 h-3" />الخيار الأفضل</p>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="text-center mt-8">
          <Link href="/cars" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium">
            <ChevronLeft className="w-4 h-4" /> العودة للتصفح
          </Link>
        </div>
      </div>
    </div>
  );
}
