import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ForumCategory } from '../../types';
import Button from '../../components/ui/Button';

export default function NewForumTopicScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    api.getForumCategories().then((res: any) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !selectedCategory) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      await api.createForumTopic({ title: title.trim(), content: content.trim(), categoryId: selectedCategory });
      Alert.alert('نجاح', 'تم إنشاء الموضوع بنجاح', [{ text: 'حسناً', onPress: () => router.back() }]);
    } catch (error: any) { Alert.alert('خطأ', error.message || 'فشل الإنشاء'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">موضوع جديد</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التصنيف *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-xl mr-2 ${selectedCategory === cat.id ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-sm font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{cat.nameAr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان الموضوع *</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="عنوان الموضوع" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-4" style={{ fontSize: 16 }} />

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المحتوى *</Text>
        <TextInput value={content} onChangeText={setContent} multiline textAlignVertical="top" placeholder="اكتب محتوى الموضوع..." placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white min-h-[200px] mb-6" style={{ fontSize: 16 }} />

        <Button title="نشر الموضوع" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
