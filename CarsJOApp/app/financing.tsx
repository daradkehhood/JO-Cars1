import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatPrice } from '../lib/utils';
import Button from '../components/ui/Button';

export default function FinancingScreen() {
  const router = useRouter();
  const [carPrice, setCarPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [loanYears, setLoanYears] = useState('5');
  const [interestRate, setInterestRate] = useState('6');
  const [result, setResult] = useState<{ monthly: number; total: number; interest: number } | null>(null);

  const calculate = () => {
    const price = parseFloat(carPrice);
    const down = parseFloat(downPayment) || 0;
    const years = parseInt(loanYears);
    const rate = parseFloat(interestRate) / 100;
    if (!price || !years) return;
    const loanAmount = price - down;
    const monthlyRate = rate / 12;
    const months = years * 12;
    const monthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const total = monthly * months;
    setResult({ monthly: Math.round(monthly * 1000) / 1000, total: Math.round(total * 1000) / 1000, interest: Math.round((total - loanAmount) * 1000) / 1000 });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">حاسبة التمويل</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">سعر السيارة (د.أ)</Text>
          <TextInput value={carPrice} onChangeText={setCarPrice} keyboardType="numeric" placeholder="20000" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-3" style={{ fontSize: 16 }} />
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الدفعة الأولى (د.أ)</Text>
          <TextInput value={downPayment} onChangeText={setDownPayment} keyboardType="numeric" placeholder="5000" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-3" style={{ fontSize: 16 }} />
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">مدة القرض</Text>
          <View className="flex-row gap-2 mb-3">
            {['3', '5', '7', '10'].map(y => (
              <TouchableOpacity key={y} onPress={() => setLoanYears(y)} className={`flex-1 py-2.5 rounded-xl ${loanYears === y ? 'bg-blue-600' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
                <Text className={`text-center text-sm font-medium ${loanYears === y ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{y} سنوات</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نسبة الفائدة (%)</Text>
          <TextInput value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" placeholder="6" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
        </View>

        <Button title="احسب" onPress={calculate} fullWidth size="lg" />

        {result && (
          <View className="mt-6 bg-blue-600 rounded-2xl p-5">
            <Text className="text-white/70 text-sm mb-1">القسط الشهري</Text>
            <Text className="text-white text-3xl font-extrabold mb-4">{formatPrice(result.monthly)}</Text>
            <View className="flex-row justify-between">
              <View><Text className="text-white/70 text-xs">إجمالي المبلغ</Text><Text className="text-white font-bold">{formatPrice(result.total)}</Text></View>
              <View><Text className="text-white/70 text-xs">أجمالي الفائدة</Text><Text className="text-white font-bold">{formatPrice(result.interest)}</Text></View>
            </View>
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
