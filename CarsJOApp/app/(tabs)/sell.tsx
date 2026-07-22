import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function SellScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const options = [
    { icon: 'car-sport', title: 'بيع سيارة', desc: 'أضف إعلان سيارة جديد', route: '/cars/add', color: '#3B82F6' },
    { icon: 'key', title: 'بيع لوحة', desc: 'أضف لوحة للبيع', route: '/plates/add', color: '#8B5CF6' },
    { icon: 'construct', title: 'خدمة صيانة', desc: 'أضف خدمة صيانة', route: '/maintenance/add', color: '#10B981' },
    { icon: 'search', title: 'أبحث عن سيارة', desc: 'نشر إعلان بحث', route: '/wanted/add', color: '#F59E0B' },
    { icon: 'cog', title: 'قطع غيار', desc: 'بيع قطع غيار', route: '/parts/add', color: '#EF4444' },
  ];

  const tools = [
    { icon: 'git-compare', title: 'مقارنة سيارات', route: '/cars/compare', color: '#8B5CF6' },
    { icon: 'calculator', title: 'حاسبة التمويل', route: '/financing', color: '#10B981' },
    { icon: 'trending-down', title: 'قيمة إعادة البيع', route: '/resale-value', color: '#F59E0B' },
    { icon: 'chatbubbles', title: 'المساعد الذكي', route: '/ai', color: '#3B82F6' },
    { icon: 'compass', title: 'باحث السيارات', route: '/car-finder', color: '#EC4899' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">بيع وأدوات</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">أضف إعلانك أو استخدم الأدوات المساعدة</Text>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">أضف إعلان جديد</Text>
          {options.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (!isAuthenticated) { router.push('/auth/login'); return; }
                router.push(item.route as any);
              }}
              className="flex-row items-center bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: item.color + '15' }}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white">{item.title}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-4 mt-6">
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">أدوات مساعدة</Text>
          <View className="flex-row flex-wrap gap-3">
            {tools.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => router.push(item.route as any)}
                className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 items-center"
                style={{ width: '47%' }}
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: item.color + '15' }}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text className="text-sm font-semibold text-gray-900 dark:text-white text-center">{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
