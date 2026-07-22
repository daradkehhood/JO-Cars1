import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    try {
      await login(email.trim(), password);
      router.back();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
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
            <Text className="text-gray-500 dark:text-gray-400 mb-8">مرحباً بعودتك! سجّل دخولك للمتابعة</Text>

            <Input
              label="البريد الإلكتروني"
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
            />

            <View>
              <Input
                label="كلمة المرور"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                icon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute left-3 top-[38px]">
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Button title="تسجيل الدخول" onPress={handleLogin} loading={isLoading} fullWidth size="lg" />

            <View className="flex-row items-center justify-center mt-6 gap-1">
              <Text className="text-gray-500 dark:text-gray-400">ليس لديك حساب؟</Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text className="text-blue-600 dark:text-blue-400 font-semibold">إنشاء حساب</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
