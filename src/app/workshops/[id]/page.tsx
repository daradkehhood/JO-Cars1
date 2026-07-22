'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Upload,
  Calendar,
  Flag,
  Image as ImageIcon,
  ThumbsUp,
  Wrench,
  X,
  Eye,
  Users,
  Award,
} from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
  reviewCount: number;
  viewCount: number;
  priceRange: string | null;
  provinceId: string | null;
  cityId: string | null;
  services: { id: string; name: string; category: string | null }[];
  brands: { id: string; brand: string; workshopId: string }[];
  isVerified: boolean;
  workingHours: string | null;
  workingDays: string | null;
  yearsOfExperience: number | null;
  employeeCount: number | null;
  recommendPercent: number;
  prices: WorkshopPrice[];
  reviews: WorkshopReview[];
  ads: WorkshopAd[];
  user: { id: string; name: string; image: string | null; phone: string | null; whatsapp: string | null } | null;
}

interface WorkshopPrice {
  id: string;
  serviceName: string;
  minPrice: number;
  maxPrice: number;
}

interface WorkshopReview {
  id: string;
  user: { id: string; name: string; image: string | null };
  carMake: string;
  carModel: string;
  carYear: number | null;
  repairType: string;
  price: number | null;
  duration: string | null;
  description: string;
  beforeImage: string | null;
  afterImage: string | null;
  qualityRating: number;
  priceRating: number;
  speedRating: number;
  serviceRating: number;
  cleanlinessRating: number;
  punctualityRating: number;
  partsRating: number;
  recommend: boolean;
  workshopReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface WorkshopAd {
  id: string;
  title: string;
  description: string;
  images: string;
  status: string;
}

export default function WorkshopDetailPage() {
  const params = useParams();
  const workshopId = params.id as string;

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    carMake: '',
    carModel: '',
    carYear: '',
    repairType: '',
    price: '',
    duration: '',
    description: '',
    qualityRating: 5,
    priceRating: 5,
    speedRating: 5,
    serviceRating: 5,
    cleanlinessRating: 5,
    punctualityRating: 5,
    partsRating: 5,
    recommend: true,
    beforeImage: null as File | null,
    afterImage: null as File | null,
  });

  const [bookForm, setBookForm] = useState({
    date: '',
    time: '',
    serviceType: '',
    carMake: '',
    carModel: '',
    description: '',
  });
  const [bookStatus, setBookStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [reportForm, setReportForm] = useState({
    reason: '',
    description: '',
  });
  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const fetchWorkshop = useCallback(async () => {
    try {
      const res = await fetch(`/api/workshops/${workshopId}`);
      const data = await res.json();
      setWorkshop(data.data);
    } catch {
      setWorkshop(null);
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchWorkshop();
  }, [fetchWorkshop]);

  const submitReview = async () => {
    const formData = new FormData();
    formData.append('rating', reviewForm.rating.toString());
    formData.append('carMake', reviewForm.carMake);
    formData.append('carModel', reviewForm.carModel);
    if (reviewForm.carYear) formData.append('carYear', reviewForm.carYear);
    formData.append('repairType', reviewForm.repairType);
    if (reviewForm.price) formData.append('price', reviewForm.price);
    formData.append('duration', reviewForm.duration);
    formData.append('description', reviewForm.description);
    formData.append('qualityRating', reviewForm.qualityRating.toString());
    formData.append('priceRating', reviewForm.priceRating.toString());
    formData.append('speedRating', reviewForm.speedRating.toString());
    formData.append('serviceRating', reviewForm.serviceRating.toString());
    formData.append('cleanlinessRating', reviewForm.cleanlinessRating.toString());
    formData.append('punctualityRating', reviewForm.punctualityRating.toString());
    formData.append('partsRating', reviewForm.partsRating.toString());
    formData.append('recommend', reviewForm.recommend.toString());
    if (reviewForm.beforeImage) formData.append('beforeImage', reviewForm.beforeImage);
    if (reviewForm.afterImage) formData.append('afterImage', reviewForm.afterImage);

    try {
      await fetch(`/api/workshops/${workshopId}/reviews`, {
        method: 'POST',
        body: formData,
      });
      setShowReviewForm(false);
      fetchWorkshop();
    } catch {}
  };

  const submitBooking = async () => {
    setBookStatus('loading');
    try {
      const res = await fetch(`/api/workshops/${workshopId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm),
      });
      if (res.ok) {
        setBookStatus('success');
        setBookForm({ date: '', time: '', serviceType: '', carMake: '', carModel: '', description: '' });
        setTimeout(() => { setBookStatus('idle'); setShowBookForm(false); }, 2000);
      } else {
        setBookStatus('error');
        setTimeout(() => setBookStatus('idle'), 3000);
      }
    } catch {
      setBookStatus('error');
      setTimeout(() => setBookStatus('idle'), 3000);
    }
  };

  const submitReport = async () => {
    setReportStatus('loading');
    try {
      const res = await fetch(`/api/workshops/${workshopId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reportForm, type: 'workshop' }),
      });
      if (res.ok) {
        setReportStatus('success');
        setReportForm({ reason: '', description: '' });
        setTimeout(() => { setReportStatus('idle'); setShowReport(false); }, 2000);
      } else {
        setReportStatus('error');
        setTimeout(() => setReportStatus('idle'), 3000);
      }
    } catch {
      setReportStatus('error');
      setTimeout(() => setReportStatus('idle'), 3000);
    }
  };

  const submitReply = async (reviewId: string) => {
    try {
      await fetch(`/api/workshops/${workshopId}/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      setReplyingTo(null);
      setReplyText('');
      fetchWorkshop();
    } catch {}
  };

  const parseAdImages = (imagesStr: string): string[] => {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getRatingBreakdown = (reviews: WorkshopReview[]) => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce(
      (acc, r) => ({
        quality: acc.quality + r.qualityRating,
        price: acc.price + r.priceRating,
        speed: acc.speed + r.speedRating,
        service: acc.service + r.serviceRating,
        cleanliness: acc.cleanliness + r.cleanlinessRating,
        punctuality: acc.punctuality + r.punctualityRating,
        parts: acc.parts + r.partsRating,
      }),
      { quality: 0, price: 0, speed: 0, service: 0, cleanliness: 0, punctuality: 0, parts: 0 }
    );
    const count = reviews.length;
    return {
      quality: sum.quality / count,
      price: sum.price / count,
      speed: sum.speed / count,
      service: sum.service / count,
      cleanliness: sum.cleanliness / count,
      punctuality: sum.punctuality / count,
      parts: sum.parts / count,
    };
  };

  const ratingLabels: Record<string, string> = {
    quality: 'الجودة',
    price: 'السعر',
    speed: 'سرعة التنفيذ',
    service: 'الخدمة',
    cleanliness: 'النظافة',
    punctuality: 'الالتزام بالمواعيد',
    parts: 'قطع الغيار',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#1a1a2e' }}>
        <XCircle className="w-20 h-20 text-gray-600 mb-4" />
        <h2 className="text-xl text-white font-semibold mb-2">الورشة غير موجودة</h2>
        <p className="text-gray-400">لم يتم العثور على هذه الورشة</p>
      </div>
    );
  }

  const ratingBreakdown = getRatingBreakdown(workshop.reviews);

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      {/* Cover Image */}
      <div className="relative h-64 md:h-96 w-full">
        {workshop.coverImage ? (
          <Image src={workshop.coverImage} alt={workshop.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#0f3460] to-[#1a1a2e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/50 to-transparent" />
        <div className="absolute bottom-6 right-6 md:right-10">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl border-4 border-[#1a1a2e] overflow-hidden bg-[#16213e] shadow-xl flex items-center justify-center">
            {workshop.logo ? (
              <Image src={workshop.logo} alt={workshop.name} width={112} height={112} className="object-cover" />
            ) : (
              <Wrench className="w-10 h-10 text-[#0084ff]" />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl pb-20">
        {/* Workshop Header Info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{workshop.name}</h1>
            {workshop.isVerified && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#0084ff]/20 text-[#0084ff] text-xs rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                موثّق
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(workshop.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
              ))}
              <span className="text-white font-semibold mr-1">{workshop.rating.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">({workshop.reviewCount} تقييم)</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Eye className="w-4 h-4" />
              <span>{workshop.viewCount} مشاهدة</span>
            </div>
            {workshop.priceRange && (
              <span className="px-3 py-1 bg-[#0f3460] text-gray-300 text-xs rounded-full">
                {workshop.priceRange === 'budget' ? 'اقتصادي' : workshop.priceRange === 'moderate' ? 'متوسط' : workshop.priceRange === 'expensive' ? 'مرتفع' : workshop.priceRange}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{workshop.address || 'العنوان غير محدد'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {workshop.description && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-3">عن الورشة</h2>
                <p className="text-gray-300 leading-relaxed">{workshop.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workshop.yearsOfExperience != null && (
                <div className="rounded-xl border border-gray-700 bg-[#16213e] p-4 text-center">
                  <Award className="w-6 h-6 text-[#0084ff] mx-auto mb-2" />
                  <p className="text-white font-bold text-lg">{workshop.yearsOfExperience}</p>
                  <p className="text-gray-400 text-xs">سنة خبرة</p>
                </div>
              )}
              {workshop.employeeCount != null && (
                <div className="rounded-xl border border-gray-700 bg-[#16213e] p-4 text-center">
                  <Users className="w-6 h-6 text-[#0084ff] mx-auto mb-2" />
                  <p className="text-white font-bold text-lg">{workshop.employeeCount}</p>
                  <p className="text-gray-400 text-xs">موظف</p>
                </div>
              )}
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-4 text-center">
                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-bold text-lg">{workshop.rating.toFixed(1)}</p>
                <p className="text-gray-400 text-xs">التقييم</p>
              </div>
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-4 text-center">
                <ThumbsUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-white font-bold text-lg">{workshop.recommendPercent}%</p>
                <p className="text-gray-400 text-xs">يوصون</p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0084ff]" />
                أوقات العمل
              </h2>
              {workshop.workingHours ? (
                <p className="text-gray-300">{workshop.workingHours}</p>
              ) : (
                <p className="text-gray-500">غير محدد</p>
              )}
              {workshop.workingDays && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-2">أيام العمل:</p>
                  <div className="flex flex-wrap gap-2">
                    {workshop.workingDays.split(',').map((day, i) => (
                      <span key={i} className="px-3 py-1 bg-[#0f3460] text-gray-300 text-sm rounded-lg">{day.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            {workshop.services.length > 0 && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#0084ff]" />
                  الخدمات
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {workshop.services.map((service) => (
                    <div key={service.id} className="flex items-center gap-2 px-4 py-3 bg-[#0f3460] rounded-lg">
                      <CheckCircle className="w-4 h-4 text-[#0084ff] shrink-0" />
                      <span className="text-gray-200 text-sm">{service.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brands */}
            {workshop.brands.length > 0 && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">الماركات</h2>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {workshop.brands.map((brand) => (
                    <div key={brand.id} className="flex flex-col items-center gap-2 px-3 py-4 bg-[#0f3460] rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                        <span className="text-[#0084ff] text-xs font-bold">{brand.brand.charAt(0)}</span>
                      </div>
                      <span className="text-gray-300 text-xs text-center">{brand.brand}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prices */}
            {workshop.prices.length > 0 && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">الأسعار التقريبية</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">الخدمة</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">السعر الأدنى</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">السعر الأعلى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workshop.prices.map((price) => (
                        <tr key={price.id} className="border-b border-gray-700/50 hover:bg-[#0f3460]/50">
                          <td className="py-3 px-4 text-white">{price.serviceName}</td>
                          <td className="py-3 px-4 text-green-400 font-medium">{price.minPrice} د.أ</td>
                          <td className="py-3 px-4 text-green-400 font-medium">{price.maxPrice} د.أ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">التقييمات</h2>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-[#0084ff] text-white rounded-lg text-sm hover:bg-[#006cd9] transition-colors"
                >
                  اكتب تقييم
                </button>
              </div>

              {/* Overall Rating */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="text-center md:text-right">
                  <div className="text-5xl font-bold text-white mb-2">{workshop.rating.toFixed(1)}</div>
                  <div className="flex items-center justify-center md:justify-start gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(workshop.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm">{workshop.reviewCount} تقييم</p>
                  <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-400" />
                    <span className="text-white text-sm">{workshop.recommendPercent}% يوصون</span>
                  </div>
                </div>

                {ratingBreakdown && (
                  <div className="flex-1 space-y-2">
                    {Object.entries(ratingBreakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-32 text-right">{ratingLabels[key]}</span>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0084ff] rounded-full"
                            style={{ width: `${((value || 0) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm w-8">{(value || 0).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {workshop.reviews.map((review) => (
                  <div key={review.id} className="border-t border-gray-700 pt-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#0f3460] flex items-center justify-center shrink-0">
                        {review.user.image ? (
                          <Image src={review.user.image} alt="" width={40} height={40} className="rounded-full object-cover" />
                        ) : (
                          <span className="text-[#0084ff] font-bold text-sm">{review.user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{review.user.name}</span>
                          <span className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString('ar-JO')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{review.carMake} {review.carModel}</span>
                          {review.carYear && <span>({review.carYear})</span>}
                          <span>•</span>
                          <span>{review.repairType}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const avg = (review.qualityRating + review.priceRating + review.speedRating + review.serviceRating + review.cleanlinessRating + review.punctualityRating + review.partsRating) / 7;
                            return <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />;
                          })}
                          {review.recommend && (
                            <span className="text-green-400 text-xs mr-2 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              يوصي
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{review.description}</p>
                    {(review.price != null || review.duration) && (
                      <div className="flex gap-4 text-sm text-gray-400 mb-3">
                        {review.price != null && <span>السعر: {review.price} د.أ</span>}
                        {review.duration && <span>المدة: {review.duration}</span>}
                      </div>
                    )}
                    {/* Review Images */}
                    {(review.beforeImage || review.afterImage) && (
                      <div className="flex gap-4 mb-3">
                        {review.beforeImage && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">قبل:</p>
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                              <Image src={review.beforeImage} alt="" fill className="object-cover" />
                            </div>
                          </div>
                        )}
                        {review.afterImage && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">بعد:</p>
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                              <Image src={review.afterImage} alt="" fill className="object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Workshop Reply */}
                    {review.workshopReply && (
                      <div className="bg-[#0f3460] rounded-lg p-4 mt-3 mr-6">
                        <p className="text-xs text-[#0084ff] mb-1 font-medium">رد الورشة:</p>
                        <p className="text-gray-300 text-sm">{review.workshopReply}</p>
                      </div>
                    )}
                    {/* Reply Button */}
                    <button
                      onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                      className="text-[#0084ff] text-sm mt-2 hover:underline"
                    >
                      رد على هذا التقييم
                    </button>
                    {replyingTo === review.id && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="اكتب ردك..."
                          className="flex-1 px-4 py-2 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                        />
                        <button onClick={() => submitReply(review.id)} className="px-4 py-2 bg-[#0084ff] text-white rounded-lg text-sm">إرسال</button>
                        <button onClick={() => setReplyingTo(null)} className="px-4 py-2 border border-gray-700 text-gray-400 rounded-lg text-sm">إلغاء</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ads Section */}
            {workshop.ads.length > 0 && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">إعلانات الورشة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workshop.ads.map((ad) => {
                    const adImages = parseAdImages(ad.images);
                    return (
                      <div key={ad.id} className="rounded-lg border border-gray-700 bg-[#0f3460] overflow-hidden">
                        {adImages.length > 0 && (
                          <div className="relative h-40">
                            <Image src={adImages[0]} alt={ad.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-white font-semibold mb-1">{ad.title}</h3>
                          <p className="text-gray-400 text-sm">{ad.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">التواصل</h2>
              <div className="space-y-3">
                {workshop.phone && (
                  <a href={`tel:${workshop.phone}`} className="flex items-center gap-3 p-3 bg-[#0f3460] rounded-lg hover:bg-[#0f3460]/80 transition-colors">
                    <Phone className="w-5 h-5 text-[#0084ff]" />
                    <span className="text-white text-sm" dir="ltr">{workshop.phone}</span>
                  </a>
                )}
                {workshop.whatsapp && (
                  <a href={`https://wa.me/${workshop.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[#0f3460] rounded-lg hover:bg-[#0f3460]/80 transition-colors">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white text-sm" dir="ltr">{workshop.whatsapp}</span>
                  </a>
                )}
                {workshop.email && (
                  <a href={`mailto:${workshop.email}`} className="flex items-center gap-3 p-3 bg-[#0f3460] rounded-lg hover:bg-[#0f3460]/80 transition-colors">
                    <Mail className="w-5 h-5 text-[#0084ff]" />
                    <span className="text-white text-sm">{workshop.email}</span>
                  </a>
                )}
                {workshop.website && (
                  <a href={workshop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[#0f3460] rounded-lg hover:bg-[#0f3460]/80 transition-colors">
                    <Globe className="w-5 h-5 text-[#0084ff]" />
                    <span className="text-white text-sm">{workshop.website}</span>
                  </a>
                )}
                {workshop.lat != null && workshop.lng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${workshop.lat},${workshop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-[#0f3460] rounded-lg hover:bg-[#0f3460]/80 transition-colors"
                  >
                    <MapPin className="w-5 h-5 text-[#0084ff]" />
                    <span className="text-white text-sm">عرض على الخريطة</span>
                  </a>
                )}
              </div>
            </div>

            {/* Book Appointment */}
            <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0084ff]" />
                حجز موعد
              </h2>
              {!showBookForm ? (
                <button
                  onClick={() => setShowBookForm(true)}
                  className="w-full py-3 bg-[#0084ff] text-white rounded-lg font-medium hover:bg-[#006cd9] transition-colors"
                >
                  احجز موعداً
                </button>
              ) : bookStatus === 'success' ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-medium">تم إرسال طلب الحجز بنجاح!</p>
                  <p className="text-gray-400 text-sm mt-1">سيتلقى صاحب الورشة إشعاراً بطلب الحجز</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="date"
                    value={bookForm.date}
                    onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                  <input
                    type="time"
                    value={bookForm.time}
                    onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                  <select
                    value={bookForm.serviceType}
                    onChange={(e) => setBookForm({ ...bookForm, serviceType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="">اختر الخدمة</option>
                    {workshop.services.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={bookForm.carMake}
                      onChange={(e) => setBookForm({ ...bookForm, carMake: e.target.value })}
                      placeholder="ماركة السيارة"
                      className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                    />
                    <input
                      type="text"
                      value={bookForm.carModel}
                      onChange={(e) => setBookForm({ ...bookForm, carModel: e.target.value })}
                      placeholder="موديل السيارة"
                      className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                    />
                  </div>
                  <textarea
                    value={bookForm.description}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    placeholder="وصف المشكلة..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                  />
                  {bookStatus === 'error' && (
                    <p className="text-red-400 text-sm">حدث خطأ، تأكد من ملء جميع الحقول المطلوبة</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={submitBooking}
                      disabled={bookStatus === 'loading' || !bookForm.date || !bookForm.time || !bookForm.serviceType}
                      className="flex-1 py-2.5 bg-[#0084ff] text-white rounded-lg text-sm font-medium hover:bg-[#006cd9] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {bookStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                      تأكيد الحجز
                    </button>
                    <button onClick={() => { setShowBookForm(false); setBookStatus('idle'); }} className="px-4 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Report */}
            <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
              {!showReport ? (
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  الإبلاغ عن الورشة
                </button>
              ) : reportStatus === 'success' ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-medium text-sm">تم إرسال البلاغ بنجاح!</p>
                  <p className="text-gray-400 text-xs mt-1">شكراً على إبلاغك، سنراجع البلاغ قريباً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    الإبلاغ عن الورشة
                  </p>
                  <select
                    value={reportForm.reason}
                    onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="">اختر السبب</option>
                    <option value="fake">معلومات كاذبة</option>
                    <option value="scam">نصب/احتيال</option>
                    <option value="quality">جودة سيئة</option>
                    <option value="other">أخرى</option>
                  </select>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    placeholder="تفاصيل البلاغ..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                  />
                  {reportStatus === 'error' && (
                    <p className="text-red-400 text-sm">حدث خطأ، تأكد من اختيار السبب</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={submitReport}
                      disabled={reportStatus === 'loading' || !reportForm.reason}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {reportStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                      إرسال البلاغ
                    </button>
                    <button onClick={() => { setShowReport(false); setReportStatus('idle'); }} className="px-4 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowReviewForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">اكتب تقييمك</h3>
                <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">التقييم العام</label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}>
                        <Star className={`w-8 h-8 ${i < reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} hover:text-yellow-400 transition-colors`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Ratings */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(ratingLabels).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">{label}</label>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setReviewForm({ ...reviewForm, [`${key}Rating`]: i + 1 } as any)}
                          >
                            <Star className={`w-4 h-4 ${i < (reviewForm as any)[`${key}Rating`] ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} hover:text-yellow-400`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Car Info */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={reviewForm.carMake}
                    onChange={(e) => setReviewForm({ ...reviewForm, carMake: e.target.value })}
                    placeholder="ماركة السيارة"
                    className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                  <input
                    type="text"
                    value={reviewForm.carModel}
                    onChange={(e) => setReviewForm({ ...reviewForm, carModel: e.target.value })}
                    placeholder="موديل السيارة"
                    className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={reviewForm.carYear}
                    onChange={(e) => setReviewForm({ ...reviewForm, carYear: e.target.value })}
                    placeholder="سنة الصنع"
                    className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                  <input
                    type="text"
                    value={reviewForm.repairType}
                    onChange={(e) => setReviewForm({ ...reviewForm, repairType: e.target.value })}
                    placeholder="نوع الإصلاح"
                    className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={reviewForm.price}
                    onChange={(e) => setReviewForm({ ...reviewForm, price: e.target.value })}
                    placeholder="السعر (د.أ)"
                    className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                  <input
                    type="text"
                    value={reviewForm.duration}
                    onChange={(e) => setReviewForm({ ...reviewForm, duration: e.target.value })}
                    placeholder="المدة"
                    className="px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                </div>

                <textarea
                  value={reviewForm.description}
                  onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                  placeholder="اكتب تجربتك..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                />

                {/* Before/After Images */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 py-4 border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#0084ff] transition-colors">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400 text-xs">صورة قبل</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => setReviewForm({ ...reviewForm, beforeImage: e.target.files?.[0] || null })} />
                  </label>
                  <label className="flex items-center justify-center gap-2 py-4 border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#0084ff] transition-colors">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400 text-xs">صورة بعد</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => setReviewForm({ ...reviewForm, afterImage: e.target.files?.[0] || null })} />
                  </label>
                </div>

                {/* Recommend */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewForm.recommend}
                    onChange={(e) => setReviewForm({ ...reviewForm, recommend: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0f3460] text-[#0084ff] focus:ring-[#0084ff]"
                  />
                  <span className="text-gray-300 text-sm">هل أنصح بالورشة؟</span>
                </label>

                <button
                  onClick={submitReview}
                  className="w-full py-3 bg-[#0084ff] text-white rounded-lg font-medium hover:bg-[#006cd9] transition-colors"
                >
                  إرسال التقييم
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
