import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">الإعدادات</Text>
      </View>

      <ScrollView className="flex-1 px-4 mt-4">
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">الحساب</Text>
          {isAuthenticated ? [
            { icon: 'person', title: 'تعديل الملف الشخصي', route: '/auth/profile', color: '#3B82F6' },
            { icon: 'lock-closed', title: 'تغيير كلمة المرور', route: '/settings/change-password', color: '#F59E0B' },
          ].map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(item.route as any)} className="flex-row items-center py-3.5 border-b border-gray-100 dark:border-gray-800" activeOpacity={0.7}>
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: item.color + '15' }}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text className="flex-1 text-base font-medium text-gray-900 dark:text-white">{item.title}</Text>
              <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )) : (
            <TouchableOpacity onPress={() => router.push('/auth/login')} className="flex-row items-center py-3.5 border-b border-gray-100 dark:border-gray-800" activeOpacity={0.7}>
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-blue-100"><Ionicons name="log-in" size={20} color="#3B82F6" /></View>
              <Text className="flex-1 text-base font-medium text-blue-600">تسجيل الدخول</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">التفضيلات</Text>
          <View className="flex-row items-center justify-between py-3.5 border-b border-gray-100 dark:border-gray-800">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-green-100"><Ionicons name="notifications" size={20} color="#10B981" /></View>
              <Text className="text-base font-medium text-gray-900 dark:text-white">إشعارات</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#E5E7EB', true: '#93C5FD' }} thumbColor={notifications ? '#3B82F6' : '#F3F4F6'} />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">عن التطبيق</Text>
          <View className="py-3.5 border-b border-gray-100 dark:border-gray-800">
            <Text className="text-base text-gray-900 dark:text-white">JO Cars</Text>
            <Text className="text-sm text-gray-400 mt-1">الإصدار 1.0.0</Text>
          </View>
        </View>

        {isAuthenticated && (
          <TouchableOpacity onPress={handleLogout} className="py-3.5 mb-8 items-center" activeOpacity={0.7}>
            <Text className="text-red-600 dark:text-red-400 font-semibold">تسجيل الخروج</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
