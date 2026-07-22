import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { formatPrice, formatDate } from '../../lib/utils';

interface AdminStats {
  totalUsers: number;
  totalCars: number;
  totalOrders: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeAuctions: number;
  totalForumTopics: number;
  activeListings: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { router.replace('/'); return; }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.request('/api/admin/dashboard');
      setStats(res.data || res);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const statCards = stats ? [
    { label: 'المستخدمون', value: stats.totalUsers?.toLocaleString() || '0', icon: 'people' as const, color: 'bg-blue-600', route: '/admin/users' },
    { label: 'الإعلانات', value: stats.totalCars?.toLocaleString() || '0', icon: 'car' as const, color: 'bg-emerald-600', route: '/admin/cars' },
    { label: 'الطلبات', value: stats.totalOrders?.toLocaleString() || '0', icon: 'cart' as const, color: 'bg-amber-600', route: '/admin/orders' },
    { label: 'الإيرادات', value: formatPrice(stats.totalRevenue || 0), icon: 'cash' as const, color: 'bg-purple-600', route: '/admin/orders' },
    { label: 'بانتظار الموافقة', value: String(stats.pendingApprovals || 0), icon: 'hourglass' as const, color: 'bg-orange-600', route: '/admin/pending' },
    { label: 'المزادات النشطة', value: String(stats.activeAuctions || 0), icon: 'hammer' as const, color: 'bg-red-600', route: '/admin/auctions' },
    { label: 'مواضيع المنتدى', value: String(stats.totalForumTopics || 0), icon: 'chatbubbles' as const, color: 'bg-teal-600', route: '/admin/forum' },
    { label: 'الإعلانات النشطة', value: String(stats.activeListings || 0), icon: 'megaphone' as const, color: 'bg-cyan-600', route: '/admin/cars' },
  ] : [];

  const quickActions = [
    { label: 'إدارة المستخدمين', icon: 'people' as const, route: '/admin/users' },
    { label: 'إدارة الإعلانات', icon: 'car' as const, route: '/admin/cars' },
    { label: 'الموافقة على الإعلانات', icon: 'checkmark-circle' as const, route: '/admin/pending' },
    { label: 'إدارة المزادات', icon: 'hammer' as const, route: '/admin/auctions' },
    { label: 'إدارة المنتدى', icon: 'chatbubbles' as const, route: '/admin/forum' },
    { label: 'إدارة الطلبات', icon: 'cart' as const, route: '/admin/orders' },
    { label: 'التقارير', icon: 'stats-chart' as const, route: '/admin/reports' },
    { label: 'إعدادات الموقع', icon: 'settings' as const, route: '/admin/settings' },
    { label: 'الأخبار والمقالات', icon: 'newspaper' as const, route: '/admin/news' },
    { label: 'إدارة الأقسام', icon: 'grid' as const, route: '/admin/categories' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">لوحة التحكم</Text>
        <View className="flex-1" />
        <View className="bg-red-100 dark:bg-red-500/20 px-2.5 py-1 rounded-full">
          <Text className="text-red-600 dark:text-red-400 text-xs font-bold">ADMIN</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-gray-500 mb-4">مرحباً {user?.name || 'Admin'}</Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {statCards.map((card, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(card.route as any)} className="w-[48%] bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 shadow-sm">
              <View className={`w-9 h-9 rounded-xl ${card.color} items-center justify-center mb-2`}>
                <Ionicons name={card.icon} size={18} color="#fff" />
              </View>
              <Text className="text-lg font-extrabold text-gray-900 dark:text-white">{card.value}</Text>
              <Text className="text-xs text-gray-500">{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">إجراءات سريعة</Text>
        {quickActions.map((action, i) => (
          <TouchableOpacity key={i} onPress={() => router.push(action.route as any)} className="flex-row items-center bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 mb-2 shadow-sm" activeOpacity={0.7}>
            <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 items-center justify-center mr-3">
              <Ionicons name={action.icon} size={20} color="#3B82F6" />
            </View>
            <Text className="flex-1 text-base font-semibold text-gray-900 dark:text-white">{action.label}</Text>
            <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
