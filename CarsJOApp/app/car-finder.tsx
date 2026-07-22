import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import Button from '../components/ui/Button';

const STEPS = [
  { question: 'كم المسافة التي تقطعها يومياً؟', options: [
    { label: 'أقل من 20 كم', value: 'short' },
    { label: '20-50 كم', value: 'medium' },
    { label: 'أكثر من 50 كم', value: 'long' },
  ]},
  { question: 'كم عدد الركاب عادةً؟', options: [
    { label: '1-2', value: 'couple' },
    { label: '3-4', value: 'family_small' },
    { label: '5+', value: 'family_large' },
  ]},
  { question: 'ما ميزانيتك التقريبية؟', options: [
    { label: 'أقل من 5,000', value: 'budget' },
    { label: '5,000 - 15,000', value: 'mid' },
    { label: 'أكثر من 15,000', value: 'premium' },
  ]},
  { question: 'الأهم: القوة أم التوفير؟', options: [
    { label: 'القوة والأداء', value: 'power' },
    { label: 'توفير الوقود', value: 'economy' },
    { label: 'التوازن', value: 'balanced' },
  ]},
  { question: 'نوع الوقود المفضل؟', options: [
    { label: 'بنزين', value: 'BENZINE' },
    { label: 'ديزل', value: 'DIESEL' },
    { label: 'هايبرد/كهرباء', value: 'HYBRID' },
  ]},
];

export default function CarFinderScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleAnswer = async (value: string) => {
    const newAnswers = { ...answers, [STEPS[step].options[0].value.split('_')[0]]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const res = await api.carFinder(newAnswers);
        setResults(res.data || res.recommendations || []);
        setStep(STEPS.length);
      } catch (error) {
        Alert.alert('خطأ', 'حدث خطأ أثناء البحث');
      } finally { setLoading(false); }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name={step > 0 ? 'arrow-forward' : 'close'} size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">باحث السيارات</Text>
      </View>

      {step < STEPS.length && (
        <>
          <View className="flex-row px-4 gap-1 mb-4 mt-2">
            {STEPS.map((_, i) => (
              <View key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </View>
          <View className="flex-1 px-6 justify-center">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">{STEPS[step].question}</Text>
            {STEPS[step].options.map((opt) => (
              <TouchableOpacity key={opt.value} onPress={() => handleAnswer(opt.value)} className="bg-white dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-3 items-center" activeOpacity={0.7}>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step === STEPS.length && (
        <View className="flex-1 px-4 pt-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">النتائج</Text>
          {loading ? (
            <View className="items-center py-16"><Text className="text-gray-500 animate-pulse">جاري البحث...</Text></View>
          ) : results.length === 0 ? (
            <View className="items-center py-16"><Text className="text-gray-500">لم نجد نتائج مطابقة</Text></View>
          ) : results.map((r: any, i: number) => (
            <TouchableOpacity key={i} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3" activeOpacity={0.7}>
              <Text className="text-base font-bold text-gray-900 dark:text-white">{r.brand} {r.model}</Text>
              <Text className="text-sm text-gray-500 mt-1">{r.reason || r.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
