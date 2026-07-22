import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { User } from '../../types';
import { getInitials } from '../../lib/utils';
import StarRating from '../../components/shared/StarRating';
import LoadingScreen from '../../components/shared/Loading';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getProfile().then((res: any) => { setProfile(res.user || res.data || res); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!profile) return <View className="flex-1 items-center justify-center"><Text>المستخدم غير موجود</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">الملف الشخصي</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">{getInitials(profile.name)}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</Text>
          {profile.dealerName && <Text className="text-sm text-gray-500 mt-1">{profile.dealerName}</Text>}
          {profile.rating && profile.rating > 0 && (
            <View className="mt-2"><StarRating rating={profile.rating} size={18} showValue /></View>
          )}
          <View className="flex-row items-center gap-2 mt-2">
            <View className={`w-2 h-2 rounded-full ${profile.role === 'ADMIN' ? 'bg-red-500' : profile.role === 'DEALER' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <Text className="text-sm text-gray-400">{profile.role === 'ADMIN' ? 'مدير' : profile.role === 'DEALER' ? 'وسيط' : 'مستخدم'}</Text>
          </View>
        </View>

        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
          <Text className="text-sm font-bold text-gray-900 dark:text-white mb-2">معلومات الاتصال</Text>
          {profile.phone && (
            <View className="flex-row items-center gap-2 py-1">
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 dark:text-gray-400">{profile.phone}</Text>
            </View>
          )}
          {profile.email && (
            <View className="flex-row items-center gap-2 py-1">
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 dark:text-gray-400">{profile.email}</Text>
            </View>
          )}
          {profile.dealerAddress && (
            <View className="flex-row items-center gap-2 py-1">
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 dark:text-gray-400">{profile.dealerAddress}</Text>
            </View>
          )}
        </View>

        {profile.bio && (
          <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
            <Text className="text-sm font-bold text-gray-900 dark:text-white mb-2">نبذة</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">{profile.bio}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
