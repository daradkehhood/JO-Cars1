'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CarGrid } from '@/components/cars/CarGrid';
import {
  Phone, MessageCircle, Share2, Flag, Heart, MapPin, Fuel, Gauge,
  Calendar, Settings, Star, ChevronLeft, ChevronRight, Maximize2,
  Shield, CheckCircle, AlertTriangle, BarChart3, Bot, Sparkles, Eye,
  Clock, Building2, Palette, DoorOpen, Cpu, Bike, Loader2, GitCompare, ChevronDown,
  RotateCcw, Trash2, Crown, Send, Car as CarIcon, X
} from 'lucide-react';
import { formatPrice, formatDistance, getFuelTypeLabel, getTransmissionLabel, getDrivetrainLabel, getConditionLabel, formatDate } from '@/lib/utils';
import { AuctionSection } from '@/components/auctions/AuctionSection';
import { CarHistorySection } from '@/components/cars/CarHistorySection';
import { AiAnalysisContent } from '@/components/cars/AiAnalysisContent';
import { CustomsCalculator } from '@/components/cars/CustomsCalculator';
import { ConditionDetails } from '@/components/cars/ConditionDetails';
import { EngineSoundSection } from '@/components/cars/EngineSoundSection';
import { useAuth } from '@/hooks/useAuth';
import { useCompareStore } from '@/store';
import { ReportModal } from '@/components/cars/ReportModal';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { PriceFairnessIndicator } from '@/components/cars/PriceFairnessIndicator';
import { SocialProof } from '@/components/cars/SocialProof';
import { StarRating } from '@/components/ratings/StarRating';
import { RatingModal } from '@/components/ratings/RatingModal';
import type { Car } from '@/types';
import { CarComments } from '@/components/cars/CarComments';
import { CarReviewGenerator } from '@/components/cars/CarReviewGenerator';
import { CarPriceAnalysis } from '@/components/cars/CarPriceAnalysis';
import toast from 'react-hot-toast';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { addCar, removeCar, isInCompare } = useCompareStore();
  const [car, setCar] = useState<Car | null>(null);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [carTags, setCarTags] = useState<{ id: string; nameAr: string; slug: string; icon: string; color: string }[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const carId = params.id;
    setLoading(true);
    const viewed = JSON.parse(localStorage.getItem('viewedCars') || '[]');
    const alreadyViewed = viewed.includes(carId);
    if (!alreadyViewed) {
      viewed.push(carId);
      localStorage.setItem('viewedCars', JSON.stringify(viewed));
    }
    fetch(`/api/cars/${carId}${alreadyViewed ? '' : '?trackView=true'}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setCar(data.data);
          setIsSaved(data.data.isFavorited || false);
          document.title = `${data.data.brand?.nameAr || ''} ${data.data.model?.nameAr || ''} ${data.data.year} | JO Cars`;
        } else {
          toast.error('السيارة غير موجودة');
          router.push('/cars');
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); toast.error('حدث خطأ في تحميل البيانات'); });
  }, [params.id, router]);

  useEffect(() => {
    if (car) {
      fetch(`/api/cars?brandId=${car.brandId}&limit=4&exclude=${car.id}`)
        .then(r => r.json())
        .then(data => setSimilarCars(data.data || []))
        .catch(() => {});
      fetch(`/api/car-tags?carId=${car.id}`)
        .then(r => r.json())
        .then(data => { if (data.success) setCarTags(data.data || []); })
        .catch(() => {});
    }
  }, [car]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${car?.brand?.nameAr} ${car?.model?.nameAr}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط');
    }
  };

  const handleMarkSold = async () => {
    if (!confirm('تأكيد بيع السيارة؟ يمكنك إعادة تفعيلها لاحقاً من صفحة سياراتي.')) return;
    try {
      const res = await fetch(`/api/cars/${car!.id}/sold`, { method: 'POST' });
      const d = await res.json();
      if (d.success) { toast.success('تم تحديد السيارة كمباعة'); setCar({ ...car!, status: 'SOLD', soldAt: new Date().toISOString() }); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleReactivate = async () => {
    try {
      const res = await fetch(`/api/cars/${car!.id}/reactivate`, { method: 'POST' });
      const d = await res.json();
      if (d.success) { toast.success('تم إعادة تفعيل الإعلان'); setCar({ ...car!, status: 'APPROVED', soldAt: null }); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleDeleteAd = async () => {
    if (!confirm('هل أنت متأكد من حذف الإعلان؟ يمكن استعادته من قبل الإدارة.')) return;
    try {
      const res = await fetch(`/api/cars/${car!.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { toast.success('تم حذف الإعلان'); router.push('/my-cars'); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!car) return null;

  const allImages = car.images?.length > 0 ? car.images : (car.coverImage ? [{ url: car.coverImage }] : []);
  const inCompare = isInCompare(car.id);

  const specItems = [
    { icon: Calendar, label: 'سنة الصنع', value: car.year },
    { icon: Gauge, label: 'عدد الكيلومترات', value: formatDistance(car.kilometers) },
    { icon: Fuel, label: 'نوع الوقود', value: getFuelTypeLabel(car.fuelType) },
    { icon: Settings, label: 'ناقل الحركة', value: getTransmissionLabel(car.transmission) },
    { icon: Palette, label: 'اللون', value: car.color },
    { icon: DoorOpen, label: 'عدد الأبواب', value: car.doors },
    { icon: Cpu, label: 'سعة المحرك', value: car.engineCapacity ? `${car.engineCapacity} CC` : 'غير محدد' },
    { icon: Bike, label: 'الدفع', value: getDrivetrainLabel(car.drivetrain) },
    { icon: MapPin, label: 'المحافظة', value: car.city?.nameAr || 'غير محدد' },
    { icon: Building2, label: 'الشركة', value: car.brand?.nameAr },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom">
        {/* Image Gallery */}
        <div className="relative h-[70vh] min-h-[400px] rounded-3xl overflow-hidden mb-8 mt-4 group cursor-pointer" onClick={() => { setLightboxIndex(currentImage); setLightboxOpen(true); }}>
          {allImages.length > 0 ? (
            <>
              <Image
                src={allImages[currentImage]?.url || '/images/placeholder-car.svg'}
                alt={`${car.brand?.nameAr} ${car.model?.nameAr}`}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

              <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>اضغط للعرض بالكامل</span>
                </div>
              </div>

              {allImages.length > 1 && (
                <>
                  <button onClick={() => setCurrentImage(prev => (prev - 1 + allImages.length) % allImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentImage(prev => (prev + 1) % allImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                {allImages.slice(0, 5).map((_, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'w-6 bg-white' : 'bg-white/50'}`} />
                ))}
                {allImages.length > 5 && (
                  <span className="text-white/70 text-xs">+{allImages.length - 5}</span>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <p className="text-gray-400">لا توجد صور</p>
            </div>
          )}

          {car.featured && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                <Shield className="w-3.5 h-3.5" />
                مميزة
              </span>
            </div>
          )}
          {car.refCode && (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs font-mono font-bold backdrop-blur-sm border border-white/10">
                {car.refCode}
              </span>
            </div>
          )}

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2 max-w-[60%] overflow-x-auto scrollbar-hide">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setCurrentImage(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentImage ? 'border-white shadow-lg' : 'border-transparent opacity-60 hover:opacity-80'
                  }`}>
                  <Image src={img.url || '/images/placeholder-car.svg'} alt="" width={64} height={48}
                    className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Price */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {car.brand?.nameAr} {car.model?.nameAr} {car.year}
                    </h1>
                    <p className="text-gray-500 mt-1">{car.trim || `${car.brand?.nameEn} ${car.model?.nameEn}`}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {car.views || 0} مشاهدة</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatDate(car.createdAt)}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {car.city?.nameAr}</span>
                      {car.refCode && (
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-gray-400">رقم: {car.refCode}</span>
                      )}
                    </div>

                    {/* Social Proof */}
                    <SocialProof carId={car.id} totalViews={car.views || 0} totalSaves={car.saves || 0} />
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(car.price)}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <PriceFairnessIndicator price={car.price} fairPriceEstimate={(car as any).fairPriceEstimate ?? null} size="md" />
                      {car.isNegotiable && <span className="text-sm text-blue-500">قابل للتفاوض</span>}
                    </div>
                    <span className="block text-xs text-gray-400 mt-1">{getConditionLabel(car.condition)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button icon={<Phone className="w-4 h-4" />} onClick={() => window.location.href = `tel:${car.phone}`}>
                    {car.phone}
                  </Button>
                  {car.whatsapp && (
                    <Button variant="secondary" icon={<MessageCircle className="w-4 h-4" />}
                      onClick={() => window.open(`https://wa.me/${car.whatsapp}`, '_blank')}>
                      واتساب
                    </Button>
                  )}
                  <Button variant="ghost" icon={<Share2 className="w-4 h-4" />} onClick={handleShare}>مشاركة</Button>
                  <Button variant="ghost" icon={<Flag className="w-4 h-4" />} onClick={() => setReportOpen(true)}>إبلاغ</Button>
                  <Link href={`/cars/${car.slug || car.id}/report`} target="_blank">
                    <Button variant="ghost" icon={<BarChart3 className="w-4 h-4" />}>تقرير السيارة</Button>
                  </Link>
                  <Button variant="ghost"
                    icon={inCompare ? <CheckCircle className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
                    onClick={() => {
                      if (inCompare) { removeCar(car.id); toast.success('تم إزالة السيارة من المقارنة'); }
                      else { addCar(car); toast.success('تم إضافة السيارة للمقارنة'); }
                    }}>
                    {inCompare ? 'في المقارنة' : 'مقارنة'}
                  </Button>
                  <Button variant="ghost"
                    icon={<Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />}
                    onClick={async () => {
                      const prev = isSaved;
                      setIsSaved(!isSaved);
                      try {
                        const res = await fetch('/api/cars/favorites', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ carId: car.id }),
                        });
                        const data = await res.json();
                        if (!data.success) setIsSaved(prev);
                      } catch { setIsSaved(prev); }
                    }}>
                    {isSaved ? 'تم الحفظ' : 'حفظ'}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Tags */}
          {carTags.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap gap-2">
                {carTags.map(tag => (
                  <span key={tag.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg"
                    style={{ backgroundColor: tag.color }}>
                    {tag.nameAr}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Analysis Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => setShowAI(!showAI)}
                className="w-full card p-4 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">تحليل الذكاء الاصطناعي</p>
                    <p className="text-sm text-gray-500">تقدير السعر، تقييم الحالة، واكتشاف العيوب</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAI ? 'rotate-180' : ''}`} />
              </button>

              {showAI && (
                <AiAnalysisContent carId={car.id} />
              )}
            </motion.div>

            {/* Customs Calculator */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CustomsCalculator year={car.year} engineCapacity={car.engineCapacity ?? null} price={car.price} />
            </motion.div>

            {/* AI Price Analysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CarPriceAnalysis
                brand={car.brand?.nameAr || car.brand?.nameEn || ''}
                model={car.model?.nameAr || car.model?.nameEn || ''}
                year={car.year}
                trim={car.trim || undefined}
                kilometers={car.kilometers}
                condition={car.condition}
                fuelType={car.fuelType}
                transmission={car.transmission}
                bodyType={car.bodyType || undefined}
                engineCapacity={car.engineCapacity?.toString() || undefined}
                cylinders={car.cylinders?.toString() || undefined}
                drivetrain={car.drivetrain}
                color={car.color || undefined}
                ownerCount={car.ownerCount || undefined}
                isDamaged={car.isDamaged}
                isPaintOriginal={car.isPaintOriginal}
                hasWarranty={car.hasWarranty}
                hasServiceHistory={car.hasServiceHistory}
                currentPrice={car.price}
                compact
              />
            </motion.div>

            {/* Car History (Carfax) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CarHistorySection vin={car.vin} carId={car.id} />
            </motion.div>

            {/* Engine Sound Analysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <EngineSoundSection carId={car.id} carOwnerId={car.user.id} currentUserId={currentUser?.id} currentUserRole={currentUser?.role} />
            </motion.div>

            {/* Specs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">المواصفات الكاملة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.value || 'غير محدد'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Condition Details */}
            {car.conditionDetails && (() => {
              try {
                const parsed = typeof car.conditionDetails === 'string' ? JSON.parse(car.conditionDetails) : car.conditionDetails;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ConditionDetails items={parsed} />
                  </motion.div>;
                }
              } catch {}
              return null;
            })()}

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">الوصف</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {car.aiDescription || car.description}
                </p>
                {car.aiDescription && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-blue-500">
                    <Sparkles className="w-3 h-3" />
                    تم تحسين الوصف بالذكاء الاصطناعي
                  </div>
                )}
              </div>
            </motion.div>

            {/* Video */}
            {car.videoUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">الفيديو</h2>
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <iframe src={car.videoUrl} className="w-full h-full" allowFullScreen />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3D Model */}
            {car.model3dStatus === 'completed' && car.model3dUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">نموذج ثلاثي الأبعاد</h2>
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <model-viewer src={car.model3dUrl} auto-rotate camera-controls
                      class="w-full h-full" loading="lazy" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {car.user?.name?.charAt(0) || 'U'}
                </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{car.user?.dealerName || car.user?.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <BadgeDisplay badges={(car.user as any)?.badges} />
                      {car.user?.dealerName && <p className="text-xs text-gray-500">تاجر معتمد</p>}
                    </div>
                  </div>
              </div>

              {car.user?.rating && car.user.rating > 0 && (
                <div className="mb-4">
                  <StarRating rating={car.user.rating} count={car.user.ratingCount} size="md" />
                </div>
              )}

              <div className="space-y-2">
                <Button className="w-full" icon={<Phone className="w-4 h-4" />}
                  onClick={() => window.location.href = `tel:${car.phone}`}>
                  {car.phone}
                </Button>
                {car.whatsapp && (
                  <Button className="w-full" variant="secondary"
                    icon={<MessageCircle className="w-4 h-4" />}
                    onClick={() => window.open(`https://wa.me/${(car.whatsapp || '').replace(/^0/, '962')}`, '_blank')}>
                    واتساب
                  </Button>
                )}
                <Button className="w-full" variant="ghost" icon={<MessageCircle className="w-4 h-4" />}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ carId: car.id, sellerId: car.user.id }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        router.push(`/messages?conversationId=${data.data.conversation.id}`);
                      } else {
                        toast.error('فشل بدء المحادثة');
                      }
                    } catch {
                      toast.error('حدث خطأ');
                    }
                  }}>
                  إرسال رسالة
                </Button>

                <Button className="w-full" icon={<CarIcon className="w-4 h-4" />}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          carId: car.id,
                          sellerId: car.user.id,
                          content: `مرحباً، أرغب في حجز موعد لاختبار قيادة السيارة (${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}). يرجى إعلامي بالأوقات المتاحة للمعاينة والقيادة. شكراً.`,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success('تم إرسال طلب اختبار القيادة');
                        router.push(`/messages?conversationId=${data.data.conversation.id}`);
                      } else {
                        toast.error('فشل إرسال الطلب');
                      }
                    } catch {
                      toast.error('حدث خطأ');
                    }
                  }}>
                  اختبار قيادة
                </Button>
              </div>

              {car.status === 'SOLD' && currentUser && currentUser.id !== car.user.id && (
                <button onClick={() => setRatingOpen(true)}
                  className="w-full mt-2 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all flex items-center justify-center gap-2">
                  <Star className="w-4 h-4" /> تقييم البائع
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Link href={`/dealers/${car.user.id}`}
                  className="flex items-center justify-between text-sm text-blue-500 hover:text-blue-600 transition-colors">
                  <span>جميع سيارات {car.user?.dealerName || car.user?.name}</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Auction for non-owner */}
            {car.status === 'ACTIVE' && (!currentUser || currentUser.id !== car.user.id) && (
              <AuctionSection carId={car.id} carUserId={car.user.id} />
            )}

            {/* Owner Controls */}
            {currentUser && currentUser.id === car.user.id && (
              <div className="card p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">التحكم بالإعلان</h3>
                {/* Auction management */}
                <AuctionSection carId={car.id} carUserId={car.user.id} isOwner />
                <button onClick={async () => {
                  try {
                    const res = await fetch('/api/premium-requests', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ carId: car.id, type: 'FEATURE' }),
                    });
                    const d = await res.json();
                    if (d.success) toast.success('تم إرسال طلب التمييز. سيتم مراجعته من قبل الإدارة.');
                    else toast.error(d.error || 'فشل');
                  } catch { toast.error('حدث خطأ'); }
                }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4" /> طلب تمييز الإعلان
                </button>
                {car.status !== 'SOLD' ? (
                  <button onClick={handleMarkSold}
                    className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> تم بيع السيارة
                  </button>
                ) : (
                  <button onClick={handleReactivate}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> إعادة تفعيل الإعلان
                  </button>
                )}
              </div>
            )}

            {/* Admin Controls */}
            {currentUser && currentUser.role === 'ADMIN' && (
              <div className="card p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">التحكم الإداري</h3>
                <button onClick={handleDeleteAd}
                  className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> حذف الإعلان
                </button>
              </div>
            )}

            {/* Stats Card */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">إحصائيات</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{car.views || 0}</p>
                  <p className="text-xs text-gray-500">مشاهدة</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{car.saves || 0}</p>
                  <p className="text-xs text-gray-500">حفظ</p>
                </div>
              </div>
            </div>

            {/* Location */}
            {car.locationLat && car.locationLng && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">الموقع</h3>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${car.locationLat},${car.locationLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    اتجاهات
                  </a>
                </div>
                <div className="h-56 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${car.locationLng - 0.015}%2C${car.locationLat - 0.01}%2C${car.locationLng + 0.015}%2C${car.locationLat + 0.01}&layer=mapnik&marker=${car.locationLat}%2C${car.locationLng}`}
                    className="w-full h-full border-0" loading="lazy"
                    title="موقع السيارة"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{car.locationLat?.toFixed(4)}, {car.locationLng?.toFixed(4)}</span>
                  <a
                    href={`https://www.google.com/maps?q=${car.locationLat},${car.locationLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    فتح في Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Generator */}
        <section className="mt-12">
          <CarReviewGenerator
            brand={car.brand?.nameAr}
            model={car.model?.nameAr}
            year={car.year}
          />
        </section>

        {/* Comments */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">التعليقات</h2>
          <CarComments carId={car.id} currentUser={currentUser} />
        </section>

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">سيارات مشابهة</h2>
            <CarGrid cars={similarCars} columns={4} />
          </section>
        )}
      </div>
      <ReportModal carId={car.id}
        carTitle={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`}
        isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      <RatingModal
        isOpen={ratingOpen}
        onClose={() => setRatingOpen(false)}
        targetUserId={car.user.id}
        carId={car.id}
        carName={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`} />

      {lightboxOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col" onClick={() => setLightboxOpen(false)}>
          <div className="flex items-center justify-between p-4 text-white">
            <button onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <span className="text-sm font-medium">{lightboxIndex + 1} / {allImages.length}</span>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0"
            onClick={(e) => e.stopPropagation()}>
            {allImages.length > 1 && (
              <button onClick={() => setLightboxIndex(prev => (prev - 1 + allImages.length) % allImages.length)}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="relative w-full h-full max-w-5xl max-h-full">
              <Image
                src={allImages[lightboxIndex]?.url || '/images/placeholder-car.svg'}
                alt={`${car.brand?.nameAr} ${car.model?.nameAr} - صورة ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {allImages.length > 1 && (
              <button onClick={() => setLightboxIndex(prev => (prev + 1) % allImages.length)}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex justify-center gap-2 p-4 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}>
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setLightboxIndex(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightboxIndex ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-50 hover:opacity-75'
                  }`}>
                  <Image src={img.url || '/images/placeholder-car.svg'} alt="" width={64} height={48}
                    className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
