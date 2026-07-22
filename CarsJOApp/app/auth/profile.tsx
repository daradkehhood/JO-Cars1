import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser, refreshProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [bio, setBio] = useState('');
  const [dealerName, setDealerName] = useState(user?.dealerName || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الاسم مطلوب'); return; }
    setLoading(true);
    try {
      await api.updateProfile({ name: name.trim(), phone: phone.trim() || undefined, whatsapp: whatsapp.trim() || undefined, bio: bio.trim() || undefined, dealerName: dealerName.trim() || undefined });
      await refreshProfile();
      Alert.alert('نجاح', 'تم تحديث الملف الشخصي', [{ text: 'حسناً', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل التحديث');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">تعديل الملف الشخصي</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-2">
            <Text className="text-white text-2xl font-bold">{user?.name?.charAt(0) || '?'}</Text>
          </View>
          <TouchableOpacity className="bg-blue-100 dark:bg-blue-500/20 px-3 py-1.5 rounded-lg">
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">تغيير الصورة</Text>
          </TouchableOpacity>
        </View>

        <Input label="الاسم" value={name} onChangeText={setName} icon={<Ionicons name="person-outline" size={20} color="#9CA3AF" />} />
        <Input label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon={<Ionicons name="call-outline" size={20} color="#9CA3AF" />} />
        <Input label="الواتساب" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" icon={<Ionicons name="logo-whatsapp" size={20} color="#9CA3AF" />} />
        <Input label="نبذة عنك" value={bio} onChangeText={setBio} multiline numberOfLines={3} textAlignVertical="top" />
        <Input label="اسم الوكالة" value={dealerName} onChangeText={setDealerName} icon={<Ionicons name="storefront-outline" size={20} color="#9CA3AF" />} />

        <Button title="حفظ التغييرات" onPress={handleSave} loading={loading} fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
