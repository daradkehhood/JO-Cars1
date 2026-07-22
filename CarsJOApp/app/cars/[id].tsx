import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Car } from '../../types';
import { formatPrice, formatDistance, getFuelLabel, getTransmissionLabel, getBodyTypeLabel, getConditionLabel, getConditionColor, formatDate } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useCompareStore } from '../../store/compareStore';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/shared/Loading';
import StarRating from '../../components/shared/StarRating';

const { width } = Dimensions.get('window');

export default function CarDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { addCar: addToCompare, removeCar: removeFromCompare, isInCompare } = useCompareStore();
  const inCompare = car ? isInCompare(car.id) : false;

  useEffect(() => {
    if (id) loadCar();
  }, [id]);

  const loadCar = async () => {
    try {
      const res = await api.getCar(id!);
      setCar(res.data || res);
      setIsFavorited(false);
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحميل تفاصيل السيارة');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    try {
      await api.toggleFavorite(id!);
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCompare = async () => {
    if (!car) return;
    if (inCompare) {
      await removeFromCompare(car.id);
    } else {
      await addToCompare(car);
    }
  };

  const handleShare = () => {
    if (car) {
      Share.share({
        message: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year} - ${formatPrice(car.price)}\n JO Cars`,
      });
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (car?.phone) {
      Alert.alert('التواصل', `الهاتف: ${car.phone}`, [
        { text: 'إلغاء' },
        { text: 'اتصال', onPress: () => {} },
        car.whatsapp ? { text: 'واتساب', onPress: () => {} } : null,
      ].filter(Boolean) as any);
    }
  };

  const handleMessage = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (!car) return;
    try {
      const res = await api.createConversation({ carId: car.id, sellerId: car.user?.id });
      router.push({ pathname: '/messages/chat', params: { id: res.data?.id || res.id } });
    } catch (error) {
      Alert.alert('خطأ', 'فشل إنشاء المحادثة');
    }
  };

  if (loading) return <LoadingScreen />;
  if (!car) return <View className="flex-1 items-center justify-center"><Text>السيارة غير موجودة</Text></View>;

  const images = car.images?.length ? car.images.map(i => i.url) : car.coverImage ? [car.coverImage] : [];
  const title = `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`;
  const isOwner = user?.id === car.user?.id;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="relative">
          {images.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }} scrollEventThrottle={16}>
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={{ width, height: 300 }} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View className="h-[300px] bg-gray-200 dark:bg-gray-800 items-center justify-center">
              <Ionicons name="car-sport" size={64} color="#D1D5DB" />
            </View>
          )}

          <View className="absolute top-3 right-3 flex-row gap-2">
            <TouchableOpacity onPress={handleShare} className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFavorite} className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
              <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={20} color={isFavorited ? '#EF4444' : '#fff'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.back()} className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/40 items-center justify-center">
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {images.length > 1 && (
            <View className="absolute bottom-3 self-center flex-row gap-1.5">
              {images.map((_, i) => (
                <View key={i} className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-blue-600' : 'bg-white/50'}`} />
              ))}
            </View>
          )}

          {car.featured && (
            <View className="absolute top-3 right-16 bg-amber-500 flex-row items-center px-2 py-1 rounded-lg gap-1">
              <Ionicons name="star" size={12} color="#fff" />
              <Text className="text-white text-xs font-bold">مميز</Text>
            </View>
          )}
        </View>

        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1">{title}</Text>
            <View className="bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded-lg">
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">{car.refCode}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text className="text-gray-500 dark:text-gray-400">{car.city?.nameAr || 'غير محدد'}</Text>
          </View>

          <Text className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-4">{formatPrice(car.price)}</Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {[
              { icon: 'water', label: getFuelLabel(car.fuelType) },
              { icon: 'speedometer', label: formatDistance(car.kilometers) },
              { icon: 'calendar', label: car.year.toString() },
              { icon: 'cog', label: getTransmissionLabel(car.transmission) },
              ...(car.bodyType ? [{ icon: 'car', label: getBodyTypeLabel(car.bodyType) }] : []),
              ...(car.condition ? [{ icon: 'checkmark-circle', label: getConditionLabel(car.condition) }] : []),
            ].map((spec, i) => (
              <View key={i} className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl">
                <Ionicons name={spec.icon as any} size={14} color="#6B7280" />
                <Text className="text-sm text-gray-700 dark:text-gray-300">{spec.label}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {car.isNegotiable && <View className="bg-green-100 dark:bg-green-500/20 px-3 py-1.5 rounded-full"><Text className="text-green-700 dark:text-green-400 text-xs font-medium">قابل للتفاوض</Text></View>}
            {car.hasWarranty && <View className="bg-blue-100 dark:bg-blue-500/20 px-3 py-1.5 rounded-full"><Text className="text-blue-700 dark:text-blue-400 text-xs font-medium">ضمان</Text></View>}
            {car.hasServiceHistory && <View className="bg-purple-100 dark:bg-purple-500/20 px-3 py-1.5 rounded-full"><Text className="text-purple-700 dark:text-purple-400 text-xs font-medium">سجل صيانة</Text></View>}
            {car.isPaintOriginal && <View className="bg-amber-100 dark:bg-amber-500/20 px-3 py-1.5 rounded-full"><Text className="text-amber-700 dark:text-amber-400 text-xs font-medium">دهان أصلي</Text></View>}
          </View>

          {car.description && (
            <View className="mb-4">
              <Text className="text-base font-bold text-gray-900 dark:text-white mb-2">الوصف</Text>
              <Text className="text-gray-600 dark:text-gray-400 leading-6">{car.description}</Text>
            </View>
          )}

          {car.user && (
            <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
              <Text className="text-sm font-bold text-gray-900 dark:text-white mb-2">المعلن</Text>
              <TouchableOpacity onPress={() => car.user && router.push(`/profile/${car.user.id}`)} className="flex-row items-center" activeOpacity={0.7}>
                <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center mr-3">
                  <Text className="text-white font-bold">{car.user.name.charAt(0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">{car.user.name}</Text>
                  {car.user.rating && car.user.rating > 0 && (
                    <StarRating rating={car.user.rating} size={14} showValue />
                  )}
                </View>
                <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center justify-between text-gray-400 mb-4">
            <Text className="text-xs text-gray-400">{car.views} مشاهدة</Text>
            <Text className="text-xs text-gray-400">{formatDate(car.createdAt)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-4 py-3 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <View className="flex-row gap-3">
          <Button title="مقارنة" onPress={handleCompare} variant={inCompare ? 'danger' : 'secondary'} size="sm" icon={<Ionicons name="git-compare" size={16} color={inCompare ? '#fff' : '#6B7280'} />} style={{ flex: 1 }} />
          {!isOwner && (
            <>
              <Button title="رسالة" onPress={handleMessage} variant="secondary" size="sm" icon={<Ionicons name="chatbubble" size={16} color="#6B7280" />} style={{ flex: 1 }} />
              <Button title="اتصال" onPress={handleContact} size="sm" style={{ flex: 1 }} />
            </>
          )}
          {isOwner && (
            <Button title="تعديل" onPress={() => router.push({ pathname: '/cars/add', params: { edit: car.id } })} size="sm" style={{ flex: 2 }} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
