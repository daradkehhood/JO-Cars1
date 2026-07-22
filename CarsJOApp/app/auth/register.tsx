import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'DEALER'>('USER');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 8) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    try {
      await register({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password, role });
      router.back();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل إنشاء الحساب');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableOpacity onPress={() => router.back()} className="mx-4 mt-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View className="flex-1 px-8 justify-center">
            <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              <Text style={{ color: '#3B82F6' }}>JO</Text> Cars
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mb-6">إنشاء حساب جديد</Text>

            <View className="flex-row gap-3 mb-4">
              {[
                { value: 'USER', label: 'مستخدم', icon: 'person' },
                { value: 'DEALER', label: 'وسيط', icon: 'storefront' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setRole(opt.value as any)}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${role === opt.value ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <Ionicons name={opt.icon as any} size={18} color={role === opt.value ? '#3B82F6' : '#9CA3AF'} />
                  <Text className={`ml-2 font-medium ${role === opt.value ? 'text-blue-600' : 'text-gray-500'}`}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="الاسم" placeholder="الاسم الكامل" value={name} onChangeText={setName} icon={<Ionicons name="person-outline" size={20} color="#9CA3AF" />} />
            <Input label="البريد الإلكتروني" placeholder="example@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />} />
            <Input label="الهاتف (اختياري)" placeholder="07XXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon={<Ionicons name="call-outline" size={20} color="#9CA3AF" />} />

            <View>
              <Input label="كلمة المرور" placeholder="8 أحرف على الأقل" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} icon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute left-3 top-[38px]">
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Input label="تأكيد كلمة المرور" placeholder="أعد إدخال كلمة المرور" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry icon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />} />

            <Button title="إنشاء حساب" onPress={handleRegister} loading={isLoading} fullWidth size="lg" />

            <View className="flex-row items-center justify-center mt-6 mb-8 gap-1">
              <Text className="text-gray-500 dark:text-gray-400">لديك حساب بالفعل؟</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text className="text-blue-600 dark:text-blue-400 font-semibold">تسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
