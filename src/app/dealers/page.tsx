'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, Phone, MapPin, ChevronLeft, Search } from 'lucide-react';
import type { User } from '@/types';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { StarRating } from '@/components/ratings/StarRating';

export default function DealersPage() {
  const [dealers, setDealers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dealers')
      .then(r => r.json())
      .then(data => { setDealers(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الوكلاء والمعارض</h1>
          <p className="text-gray-500 mt-2">تصفح الوكلاء والمعارض المعتمدين</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealers.map((dealer, i) => (
              <motion.div key={dealer.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/dealers/${dealer.id}`} className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {dealer.dealerName?.charAt(0) || dealer.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                          {dealer.dealerName || dealer.name}
                        </h3>
                        <BadgeDisplay badges={dealer.badges} />
                        {dealer.rating > 0 && (
                          <div className="mt-1">
                            <StarRating rating={dealer.rating} count={dealer.ratingCount} size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {dealer.dealerAddress && (
                    <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {dealer.dealerAddress}
                    </div>
                  )}
                  {dealer.phone && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                      <Phone className="w-3.5 h-3.5" />
                      {dealer.phone}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
