import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';

export default function NewTicketScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [loading, setLoading] = useState(false);

  const categories = [
    { key: 'GENERAL', label: 'عام' },
    { key: 'ACCOUNT', label: 'الحساب' },
    { key: 'LISTING', label: 'إعلان' },
    { key: 'PAYMENT', label: 'دفع' },
    { key: 'BUG', label: 'خطأ' },
    { key: 'FEATURE', label: 'طلب ميزة' },
  ];

  const priorities = [
    { key: 'LOW', label: 'منخفضة', color: '#64748B' },
    { key: 'NORMAL', label: 'عادية', color: '#3B82F6' },
    { key: 'HIGH', label: 'عالية', color: '#F59E0B' },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      await api.createTicket({ subject: subject.trim(), message: message.trim(), category, priority });
      Alert.alert('نجاح', 'تم إرسال التذكرة بنجاح', [{ text: 'حسناً', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل إرسال التذكرة');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">تذكرة جديدة</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الموضوع</Text>
        <TextInput value={subject} onChangeText={setSubject} placeholder="موضوع التذكرة" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-4" style={{ fontSize: 16 }} />

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التصنيف</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {categories.map(c => (
            <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)} className={`px-3 py-1.5 rounded-full ${category === c.key ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-xs font-medium ${category === c.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الأولوية</Text>
        <View className="flex-row gap-2 mb-4">
          {priorities.map(p => (
            <TouchableOpacity key={p.key} onPress={() => setPriority(p.key)} className={`flex-1 py-2.5 rounded-xl items-center ${priority === p.key ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-sm font-medium ${priority === p.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الرسالة</Text>
        <TextInput value={message} onChangeText={setMessage} multiline textAlignVertical="top" placeholder="اكتب تفاصيل المشكلة..." placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white min-h-[150px] mb-6" style={{ fontSize: 16 }} />

        <Button title="إرسال التذكرة" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
