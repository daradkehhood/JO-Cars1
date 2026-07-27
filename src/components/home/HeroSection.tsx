'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronDown, Settings, Car, Bike, Truck, LayoutGrid,
  MapPin, Heart, ArrowLeft, Shield, Headphones, Users, CircleDot
} from 'lucide-react';

const bodyTypes = [
  { id: 'all', label: 'الكل', icon: LayoutGrid },
  { id: 'cars', label: 'سيارات', icon: Car },
  { id: 'bikes', label: 'دراجات', icon: Bike },
  { id: 'suv', label: 'SUV', icon: Car },
  { id: 'trucks', label: 'شاحنات', icon: Truck },
];

export function HeroSection() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [activeBodyType, setActiveBodyType] = useState('all');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set('brandId', brand);
    if (model) params.set('modelId', model);
    if (priceMax) params.set('priceMax', priceMax);
    if (activeBodyType !== 'all') params.set('bodyType', activeBodyType);
    router.push(`/cars?${params.toString()}`);
  };

  const stats = [
    { icon: Users, value: '15,000+', label: 'سيارة معروضة' },
    { icon: Shield, value: 'موتوسيون', label: 'موثوقون' },
    { icon: Headphones, value: '24/7', label: 'دعم عملاء' },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0a0c14]">
      {/* Background glow effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="container-custom relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh] py-20">

          {/* Left side: Text + Search */}
          <div className="space-y-8">
            {/* Badge */}
            <div
              style={loaded ? { opacity: 1, transform: 'translateY(0)', transition: 'all 0.6s ease-out' } : { opacity: 0, transform: 'translateY(20px)' }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-sm"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">منصة بيع وشراء السيارات في الأردن</span>
            </div>

            {/* Heading */}
            <div
              style={loaded ? { opacity: 1, transform: 'translateY(0)', transition: 'all 0.7s ease-out 0.1s' } : { opacity: 0, transform: 'translateY(24px)' }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight">
                ابحث عن سيارتك
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
                  المثالية بـثـو
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p
              style={loaded ? { opacity: 1, transform: 'translateY(0)', transition: 'all 0.6s ease-out 0.2s' } : { opacity: 0, transform: 'translateY(20px)' }}
              className="text-gray-400 text-lg max-w-xl leading-relaxed"
            >
              اكتشف آلاف السيارات المعروضة من أصحاب موتوسيون وأفضل الأسعار في السوق.
            </p>

            {/* Search Form */}
            <div
              style={loaded ? { opacity: 1, transform: 'translateY(0)', transition: 'all 0.6s ease-out 0.3s' } : { opacity: 0, transform: 'translateY(20px)' }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-2xl"
            >
              {/* Body type tabs */}
              <div className="flex items-center gap-1 mb-5 pb-4 border-b border-white/10">
                {bodyTypes.map((type) => {
                  const Icon = type.icon;
                  const active = activeBodyType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveBodyType(type.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>

              {/* Search fields */}
              <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 text-right">الحد الأقصى للسعر</label>
                  <div className="relative">
                    <select
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm pl-8 pr-4 appearance-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    >
                      <option value="">أي سعر</option>
                      <option value="5000">5,000 دينار</option>
                      <option value="10000">10,000 دينار</option>
                      <option value="20000">20,000 دينار</option>
                      <option value="30000">30,000 دينار</option>
                      <option value="50000">50,000 دينار</option>
                      <option value="100000">100,000+ دينار</option>
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 text-right">الموديل</label>
                  <div className="relative">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm pl-8 pr-4 appearance-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    >
                      <option value="">اختر الموديل</option>
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 text-right">الماركة</label>
                  <div className="relative">
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm pl-8 pr-4 appearance-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    >
                      <option value="">اختر الماركة</option>
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </form>

              <button
                type="submit"
                onClick={handleSearch}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 active:scale-[0.98]"
              >
                <Search className="w-5 h-5" />
                ابحث الآن
              </button>
            </div>

            {/* Stats */}
            <div
              style={loaded ? { opacity: 1, transform: 'translateY(0)', transition: 'all 0.6s ease-out 0.4s' } : { opacity: 0, transform: 'translateY(20px)' }}
              className="flex items-center gap-8 pt-4"
            >
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{stat.value}</p>
                      <p className="text-gray-500 text-xs">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right side: Car display + Featured card */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Neon circle glow */}
            <div className="absolute w-[500px] h-[500px] rounded-full border-2 border-blue-500/30"
              style={{ boxShadow: '0 0 60px rgba(59, 130, 246, 0.2), inset 0 0 60px rgba(59, 130, 246, 0.1)' }}
            />
            <div className="absolute w-[450px] h-[450px] rounded-full border border-blue-400/10" />

            {/* Car placeholder - styled as a dark luxury car silhouette */}
            <div
              style={loaded ? { opacity: 1, transform: 'translateY(0) scale(1)', transition: 'all 1s ease-out 0.3s' } : { opacity: 0, transform: 'translateY(40px) scale(0.95)' }}
              className="relative z-10"
            >
              <div className="w-[420px] h-[240px] relative">
                {/* Car body shape using gradients */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[140px] bg-gradient-to-t from-gray-800/80 to-gray-700/40 rounded-[30px] rounded-b-[20px]" />
                <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-[70%] h-[80px] bg-gradient-to-t from-gray-700/60 to-gray-600/30 rounded-t-[40px]" />
                {/* Wheels */}
                <div className="absolute bottom-[-10px] left-[60px] w-[70px] h-[70px] rounded-full bg-gray-900 border-4 border-gray-700 flex items-center justify-center">
                  <div className="w-[30px] h-[30px] rounded-full bg-gray-600" />
                </div>
                <div className="absolute bottom-[-10px] right-[60px] w-[70px] h-[70px] rounded-full bg-gray-900 border-4 border-gray-700 flex items-center justify-center">
                  <div className="w-[30px] h-[30px] rounded-full bg-gray-600" />
                </div>
                {/* Headlights */}
                <div className="absolute bottom-[60px] right-[30px] w-4 h-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                <div className="absolute bottom-[60px] left-[30px] w-4 h-2 rounded-full bg-red-400/80 shadow-lg shadow-red-400/30" />
                {/* Reflection */}
                <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[80%] h-[20px] bg-blue-500/10 blur-xl rounded-full" />
              </div>
            </div>

            {/* Featured car card */}
            <div
              style={loaded ? { opacity: 1, transform: 'translateX(0)', transition: 'all 0.8s ease-out 0.6s' } : { opacity: 0, transform: 'translateX(30px)' }}
              className="absolute bottom-8 right-0 z-20 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-4 w-72"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-yellow-500 text-sm">🔥</span>
                <span className="text-yellow-400 text-xs font-bold">سيارة مميزة</span>
              </div>
              <p className="text-white font-bold text-lg">BMW M5 2023</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-blue-400 font-bold text-xl">38,500 <span className="text-sm font-normal text-gray-400">دينار</span></p>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => router.push('/cars')}
                className="flex items-center gap-1.5 text-blue-400 text-sm font-medium mt-3 hover:text-blue-300 transition-colors"
              >
                عرض التفاصيل
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={loaded ? { opacity: 1, transition: 'opacity 0.6s ease-out 0.8s' } : { opacity: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center animate-bounce">
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </section>
  );
}
