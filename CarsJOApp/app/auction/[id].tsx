import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Auction } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/shared/Loading';

export default function AuctionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);

  useEffect(() => {
    if (id) {
      api.request(`/api/auctions/${id}`).then((res: any) => { setAuction(res.data || res); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  const handleBid = async () => {
    if (!bidAmount || !auction) return;
    const amount = parseFloat(bidAmount);
    if (amount < auction.currentPrice + auction.minBidIncrement) {
      Alert.alert('خطأ', `الحد الأدنى للمزايدة هو ${formatPrice(auction.currentPrice + auction.minBidIncrement)}`);
      return;
    }
    setBidding(true);
    try {
      await api.request(`/api/auctions/${id}/bid`, { method: 'POST', body: { amount } });
      setAuction(prev => prev ? { ...prev, currentPrice: amount } : prev);
      setBidAmount('');
      Alert.alert('نجاح', 'تم تقديم المزايدة بنجاح');
    } catch (error: any) { Alert.alert('خطأ', error.message || 'فشل المزايدة'); }
    finally { setBidding(false); }
  };

  if (loading) return <LoadingScreen />;
  if (!auction) return <View className="flex-1 items-center justify-center"><Text>المزاد غير موجود</Text></View>;

  const isActive = auction.status === 'ACTIVE';
  const isOwner = user?.id === auction.sellerId;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل المزاد</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">{auction.car?.brand?.nameAr} {auction.car?.model?.nameAr} {auction.car?.year}</Text>
        
        <View className="flex-row items-center gap-2 mb-4">
          <View className={`px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Text className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-gray-500'}`}>{isActive ? 'نشط' : 'منتهي'}</Text>
          </View>
        </View>

        <View className="bg-blue-600 rounded-2xl p-5 mb-4">
          <Text className="text-white/70 text-sm">السعر الحالي</Text>
          <Text className="text-white text-3xl font-extrabold">{formatPrice(auction.currentPrice)}</Text>
          <View className="flex-row justify-between mt-3">
            <View><Text className="text-white/70 text-xs">الحد الأدنى للزايدة</Text><Text className="text-white font-bold text-sm">{formatPrice(auction.minBidIncrement)}</Text></View>
            <View><Text className="text-white/70 text-xs">عدد المزايدات</Text><Text className="text-white font-bold text-sm">{auction._count?.bids || 0}</Text></View>
          </View>
        </View>

        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between mb-2"><Text className="text-gray-500">تاريخ البداية</Text><Text className="text-gray-900 dark:text-white font-medium">{formatDate(auction.startDate)}</Text></View>
          <View className="flex-row justify-between"><Text className="text-gray-500">تاريخ النهاية</Text><Text className="text-gray-900 dark:text-white font-medium">{formatDate(auction.endDate)}</Text></View>
        </View>

        {isActive && !isOwner && isAuthenticated && (
          <View className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">قدم مزايدتك</Text>
            <View className="flex-row gap-2 mb-3">
              {[auction.minBidIncrement, auction.minBidIncrement * 2, auction.minBidIncrement * 5].map((amt, i) => (
                <TouchableOpacity key={i} onPress={() => setBidAmount(String(auction.currentPrice + amt))} className="flex-1 bg-blue-50 dark:bg-blue-500/10 py-2 rounded-xl items-center">
                  <Text className="text-blue-600 text-xs font-medium">+{formatPrice(amt)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2">
              <TextInput value={bidAmount} onChangeText={setBidAmount} keyboardType="numeric" placeholder="المبلغ" placeholderTextColor="#9CA3AF" className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
              <Button title="مزايدة" onPress={handleBid} loading={bidding} size="sm" />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
