import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try { const res = await api.request('/api/admin/categories'); setCategories(res.data || res || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !nameAr.trim()) { Alert.alert('خطأ', 'أدخل الاسم بالإنجليزية والعربية'); return; }
    setSubmitting(true);
    try {
      await api.request('/api/admin/categories', { method: 'POST', body: { name: name.trim(), nameAr: nameAr.trim() } });
      setName(''); setNameAr(''); setShowAdd(false);
      loadCategories();
    } catch (error: any) { Alert.alert('خطأ', error.message); }
    finally { setSubmitting(false); }
  };

  const deleteCategory = async (id: string) => {
    Alert.alert('تأكيد', 'هل تريد حذف هذا القسم؟', [
      { text: 'إلغاء' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try { await api.request(`/api/admin/categories/${id}`, { method: 'DELETE' }); loadCategories(); }
        catch (error: any) { Alert.alert('خطأ', error.message); }
      }}
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">الأقسام</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
          <Ionicons name={showAdd ? 'close' : 'add'} size={16} color="#fff" />
          <Text className="text-white text-sm font-medium">{showAdd ? 'إلغاء' : 'إضافة'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View className="mx-4 mb-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
          <TextInput value={name} onChangeText={setName} placeholder="الاسم (EN)" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-base text-gray-900 dark:text-white mb-2" style={{ fontSize: 16 }} />
          <TextInput value={nameAr} onChangeText={setNameAr} placeholder="الاسم (AR)" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-base text-gray-900 dark:text-white mb-3" style={{ fontSize: 16 }} />
          <TouchableOpacity onPress={handleAdd} disabled={submitting} className="bg-blue-600 py-3 rounded-xl items-center">
            <Text className="text-white font-semibold">{submitting ? 'جاري...' : 'إضافة'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCategories(); }} tintColor="#3B82F6" />}>
        {categories.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="grid-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد أقسام</Text>
          </View>
        ) : categories.map(cat => (
          <View key={cat.id} className="flex-row items-center bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 mb-2 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 items-center justify-center mr-3">
              <Ionicons name="grid" size={18} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 dark:text-white">{cat.nameAr}</Text>
              <Text className="text-xs text-gray-400">{cat.name}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteCategory(cat.id)} className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 items-center justify-center">
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
