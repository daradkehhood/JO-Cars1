'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CarGrid } from '@/components/cars/CarGrid';
import { Heart } from 'lucide-react';
import type { Car } from '@/types';

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetch('/api/cars/favorites')
      .then(r => r.json())
      .then(data => { setCars(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[80vh] py-8">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">المفضلة</h1>
            <p className="text-gray-500 text-sm">السيارات التي حفظتها</p>
          </div>
        </div>
        <CarGrid cars={cars} loading={loading} emptyMessage="لم تقم بحفظ أي سيارة في المفضلة بعد" />
      </div>
    </div>
  );
}
