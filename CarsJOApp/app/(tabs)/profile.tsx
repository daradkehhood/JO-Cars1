import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../lib/utils';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, refreshProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, []);

  const menuItems = isAuthenticated ? [
    ...(user?.isAdmin ? [{ icon: 'shield-checkmark', title: 'لوحة التحكم', route: '/admin', color: '#EF4444' }] : []),
    { icon: 'car-sport', title: 'إعلاناتي', route: '/my-cars', color: '#3B82F6' },
    { icon: 'hammer', title: 'مزاداتي', route: '/my-auctions', color: '#F59E0B' },
    { icon: 'cash', title: 'زايداتي', route: '/my-bids', color: '#8B5CF6' },
    { icon: 'heart', title: 'المفضلة', route: '/favorites', color: '#EF4444' },
    { icon: 'notifications', title: 'الإشعارات', route: '/notifications', color: '#F59E0B' },
    { icon: 'alert-circle', title: 'تنبيهات الأسعار', route: '/price-alerts', color: '#8B5CF6' },
    { icon: 'search', title: 'طلبات البحث', route: '/my-wants', color: '#10B981' },
    { icon: 'key', title: 'لوحاتي', route: '/my-plates', color: '#EC4899' },
    { icon: 'cog', title: 'كراجي', route: '/my-garage', color: '#06B6D4' },
    { icon: 'construct', title: 'خدماتي', route: '/my-services', color: '#F97316' },
    { icon: 'calendar', title: 'التذكيرات', route: '/my-reminders', color: '#14B8A6' },
    { icon: 'document-text', title: 'تذاكر الدعم', route: '/tickets', color: '#6366F1' },
    { icon: 'chatbubbles', title: 'المنتدى', route: '/forum', color: '#84CC16' },
    { icon: 'newspaper', title: 'الأخبار', route: '/news', color: '#64748B' },
    { icon: 'settings', title: 'الإعدادات', route: '/settings', color: '#64748B' },
  ] : [
    { icon: 'log-in', title: 'تسجيل الدخول', route: '/auth/login', color: '#3B82F6' },
    { icon: 'person-add', title: 'إنشاء حساب', route: '/auth/register', color: '#10B981' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">حسابي</Text>
        </View>

        <TouchableOpacity onPress={() => isAuthenticated ? router.push('/auth/profile') : router.push('/auth/login')} className="mx-4 mt-4 flex-row items-center bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm" activeOpacity={0.7}>
          <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center mr-3">
            {user?.image ? (
              <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xl font-bold">{user ? getInitials(user.name) : ''}</Text>
              </View>
            ) : (
              <Text className="text-white text-xl font-bold">{user ? getInitials(user.name) : '👤'}</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">{user?.name || 'زائر'}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'سجّل دخولك للمتابعة'}</Text>
            {user?.role && (
              <View className="flex-row items-center gap-1 mt-1">
                <View className={`w-2 h-2 rounded-full ${user.role === 'ADMIN' ? 'bg-red-500' : user.role === 'DEALER' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <Text className="text-xs text-gray-400">{user.role === 'ADMIN' ? 'مدير' : user.role === 'DEALER' ? 'وسيط' : 'مستخدم'}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="px-4 mt-6">
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(item.route as any)}
              className="flex-row items-center py-3.5 border-b border-gray-100 dark:border-gray-800"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: item.color + '15' }}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text className="flex-1 text-base font-medium text-gray-900 dark:text-white">{item.title}</Text>
              <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {isAuthenticated && (
          <TouchableOpacity onPress={logout} className="mx-4 mt-6 mb-8 py-3.5 bg-red-50 dark:bg-red-500/10 rounded-xl items-center" activeOpacity={0.7}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text className="text-red-600 dark:text-red-400 font-semibold">تسجيل الخروج</Text>
            </View>
          </TouchableOpacity>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
