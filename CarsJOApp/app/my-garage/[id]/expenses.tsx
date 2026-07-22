import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { CarExpense } from '../../../types';
import { formatPrice } from '../../../lib/utils';
import Button from '../../../components/ui/Button';

export default function CarExpensesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [expenses, setExpenses] = useState<CarExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [type, setType] = useState('maintenance');
  const [submitting, setSubmitting] = useState(false);

  const loadExpenses = async () => {
    try { const res = await api.getGarageExpenses(id!); setExpenses(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (id) loadExpenses(); }, [id]);

  const handleAdd = async () => {
    if (!title.trim() || !cost) { Alert.alert('خطأ', 'أدخل العنوان والتكلفة'); return; }
    setSubmitting(true);
    try {
      await api.addExpense({ garageId: id, title: title.trim(), cost: Number(cost), type });
      setTitle(''); setCost(''); setShowAdd(false);
      loadExpenses();
    } catch (error: any) { Alert.alert('خطأ', error.message); }
    finally { setSubmitting(false); }
  };

  const total = expenses.reduce((sum, e) => sum + (e.cost || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">المصروفات</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
          <Ionicons name={showAdd ? 'close' : 'add'} size={16} color="#fff" />
          <Text className="text-white text-sm font-medium">{showAdd ? 'إلغاء' : 'إضافة'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View className="px-4 mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
          <TextInput value={title} onChangeText={setTitle} placeholder="عنوان المصروف" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-base text-gray-900 dark:text-white mb-2" style={{ fontSize: 16 }} />
          <TextInput value={cost} onChangeText={setCost} keyboardType="numeric" placeholder="التكلفة (د.أ)" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-base text-gray-900 dark:text-white mb-2" style={{ fontSize: 16 }} />
          <View className="flex-row gap-2 mb-2">
            {['maintenance', 'fuel', 'insurance', 'repair', 'other'].map(t => (
              <TouchableOpacity key={t} onPress={() => setType(t)} className={`px-2.5 py-1 rounded-full ${type === t ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <Text className={`text-xs ${type === t ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{t === 'maintenance' ? 'صيانة' : t === 'fuel' ? 'وقود' : t === 'insurance' ? 'تأمين' : t === 'repair' ? 'إصلاح' : 'أخرى'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button title="إضافة" onPress={handleAdd} loading={submitting} fullWidth size="sm" />
        </View>
      )}

      {total > 0 && (
        <View className="mx-4 mb-3 bg-emerald-600 rounded-xl p-3 flex-row items-center justify-between">
          <Text className="text-white/70 text-sm">الإجمالي</Text>
          <Text className="text-white text-xl font-extrabold">{formatPrice(total)}</Text>
        </View>
      )}

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExpenses(); }} tintColor="#3B82F6" />}>
        {expenses.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد مصروفات</Text>
          </View>
        ) : expenses.map(exp => (
          <View key={exp.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">{exp.title}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{exp.type} {exp.date ? `- ${new Date(exp.date).toLocaleDateString('ar-JO')}` : ''}</Text>
            </View>
            <Text className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(exp.cost)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
