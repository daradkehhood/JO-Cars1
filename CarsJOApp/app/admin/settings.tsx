import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';

interface SiteSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  auctionEnabled: boolean;
  marketplaceEnabled: boolean;
  forumEnabled: boolean;
  newsEnabled: boolean;
  adsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'JO Cars', maintenanceMode: false, registrationEnabled: true,
    auctionEnabled: true, marketplaceEnabled: true, forumEnabled: true,
    newsEnabled: true, adsEnabled: true, pushNotificationsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.request('/api/admin/settings').then((res: any) => {
      if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.request('/api/admin/settings', { method: 'POST', body: settings });
      Alert.alert('نجاح', 'تم حفظ الإعدادات');
    } catch (error: any) { Alert.alert('خطأ', error.message); }
    finally { setSaving(false); }
  };

  const toggleSetting = (key: keyof SiteSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const settingItems = [
    { key: 'maintenanceMode' as const, label: 'وضع الصيانة', desc: 'تعطيل الموقع مؤقتاً', icon: 'construct' as const, color: 'text-orange-500' },
    { key: 'registrationEnabled' as const, label: ' التسجيل مفعل', desc: 'السماح بالتسجيل الجديد', icon: 'person-add' as const, color: 'text-blue-500' },
    { key: 'auctionEnabled' as const, label: 'المزادات مفعلة', desc: 'تشغيل نظام المزادات', icon: 'hammer' as const, color: 'text-purple-500' },
    { key: 'marketplaceEnabled' as const, label: 'السوق مفعل', desc: 'تشغيل سوق قطع الغيار', icon: 'cart' as const, color: 'text-green-500' },
    { key: 'forumEnabled' as const, label: 'المنتدى مفعل', desc: 'تشغيل منتدى النقاش', icon: 'chatbubbles' as const, color: 'text-teal-500' },
    { key: 'newsEnabled' as const, label: 'الأخبار مفعلة', desc: 'نشر المقالات والأخبار', icon: 'newspaper' as const, color: 'text-cyan-500' },
    { key: 'adsEnabled' as const, label: 'الإعلانات المدفوعة', desc: 'عرض الإعلانات', icon: 'megaphone' as const, color: 'text-amber-500' },
    { key: 'pushNotificationsEnabled' as const, label: 'الإشعارات الفورية', desc: 'إرسال إشعارات للمستخدمين', icon: 'notifications' as const, color: 'text-red-500' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إعدادات الموقع</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false}>
        {settingItems.map(item => (
          <View key={item.key} className="flex-row items-center bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3.5 mb-2 shadow-sm">
            <Ionicons name={item.icon} size={20} color={item.color.includes('orange') ? '#F97316' : item.color.includes('blue') ? '#3B82F6' : item.color.includes('purple') ? '#A855F7' : item.color.includes('green') ? '#22C55E' : item.color.includes('teal') ? '#14B8A6' : item.color.includes('cyan') ? '#06B6D4' : item.color.includes('amber') ? '#F59E0B' : '#EF4444'} />
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-900 dark:text-white">{item.label}</Text>
              <Text className="text-xs text-gray-500">{item.desc}</Text>
            </View>
            <Switch value={settings[item.key] as boolean} onValueChange={() => toggleSetting(item.key)} trackColor={{ true: '#3B82F6', false: '#D1D5DB' }} />
          </View>
        ))}

        <View className="mt-4 mb-8">
          <Button title={saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'} onPress={handleSave} loading={saving} fullWidth size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
