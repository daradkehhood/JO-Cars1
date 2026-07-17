'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, MapPin, Calendar, Car, MessageCircle, Shield, Store, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { CarCard } from '@/components/cars/CarCard';

interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  dealerName: string | null;
  dealerLogo: string | null;
  dealerDescription: string | null;
  dealerAddress: string | null;
  rating: number;
  ratingCount: number;
  createdAt: string;
  role: string;
  _count: { cars: number; favorites: number; forumTopics: number; forumPosts: number };
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/users?id=${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data.user);
          setCars(data.data.cars);
          setRatings(data.data.recentRatings);
        } else {
          setError('المستخدم غير موجود');
        }
      })
      .catch(() => setError('حدث خطأ'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">{error || 'المستخدم غير موجود'}</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">العودة</button>
        </div>
      </div>
    );
  }

  const isDealer = !!profile.dealerName;

  return (
    <div className="min-h-[80vh] py-6">
      <div className="container-custom max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> العودة
        </button>

        {/* Profile Header */}
        <div className="card overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center overflow-hidden">
                {profile.image ? (
                  <img src={profile.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-500">{profile.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 text-center sm:text-right pb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                {isDealer && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                    <Store className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-500 font-medium">{profile.dealerName}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pb-1">
                <Link href={`/messages?userId=${profile.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  <MessageCircle className="w-4 h-4" /> تواصل
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Bio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="card p-5 md:col-span-2">
            {profile.bio && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-500 mb-2">نبذة عني</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}
            {isDealer && profile.dealerDescription && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-500 mb-2">عن المتجر</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.dealerDescription}</p>
              </div>
            )}
            {isDealer && profile.dealerAddress && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" /> {profile.dealerAddress}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
              <Calendar className="w-4 h-4" />
              عضو منذ {new Date(profile.createdAt).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long' })}
            </div>
          </div>

          <div className="card p-5">
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{profile.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-500">{profile.ratingCount} تقييم</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xl font-bold text-blue-500">{profile._count.cars}</p>
                  <p className="text-xs text-gray-500">إعلان</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xl font-bold text-green-500">{profile._count.forumPosts + profile._count.forumTopics}</p>
                  <p className="text-xs text-gray-500">منشور</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ratings */}
        {ratings.length > 0 && (
          <div className="card p-5 mt-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">آخر التقييمات</h3>
            <div className="space-y-3">
              {ratings.map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.rater?.image ? (
                      <img src={r.rater.image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      r.rater?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{r.rater?.name}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    {r.comment && <p className="text-sm text-gray-500 mt-1">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User's Cars */}
        {cars.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">إعلانات {profile.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
