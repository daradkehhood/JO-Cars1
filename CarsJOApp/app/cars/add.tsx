import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { Brand, CarModel, City } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const FUEL_TYPES = ['BENZINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'GAS'];
const TRANSMISSION_TYPES = ['MANUAL', 'AUTOMATIC', 'CVT'];
const BODY_TYPES = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'TRUCK', 'VAN', 'WAGON', 'CONVERTIBLE', 'MINIVAN'];
const CONDITIONS = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'];

const LABELS: Record<string, string> = {
  BENZINE: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد', ELECTRIC: 'كهرباء', GAS: 'غاز',
  MANUAL: 'يدوي', AUTOMATIC: 'أوتوماتيك', CVT: 'CVT',
  SEDAN: 'سيدان', SUV: 'دفع رباعي', HATCHBACK: 'هاتشباك', COUPE: 'كوبيه', TRUCK: 'شاحنة', VAN: 'فان', WAGON: 'wagon', CONVERTIBLE: 'كابريوليه', MINIVAN: 'ميني فان',
  EXCELLENT: 'ممتاز', VERY_GOOD: 'جيد جداً', GOOD: 'جيد', FAIR: 'مقبول', POOR: 'ضعيف',
};

export default function AddCarScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [price, setPrice] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [fuelType, setFuelType] = useState('BENZINE');
  const [transmission, setTransmission] = useState('AUTOMATIC');
  const [color, setColor] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [condition, setCondition] = useState('');
  const [cityId, setCityId] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    Promise.all([api.getBrands(), api.getCities()]).then(([b, c]: any) => {
      setBrands(b.data || []);
      setCities(c.data || []);
    });
  }, []);

  useEffect(() => {
    if (brandId) {
      api.getModels(brandId).then((r: any) => setModels(r.data || [])).catch(() => setModels([]));
    }
  }, [brandId]);

  const handleSubmit = async () => {
    if (!brandId || !modelId || !year || !price || !kilometers || !cityId) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    try {
      await api.createCar({
        brandId, modelId, year: Number(year), price: Number(price),
        kilometers: Number(kilometers), fuelType, transmission, color,
        bodyType: bodyType || undefined, condition: condition || undefined,
        cityId, phone, description, isNegotiable,
      });
      Alert.alert('نجاح', 'تم إضافة الإعلان بنجاح!', [{ text: 'حسناً', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل إضافة الإعلان');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name={step > 1 ? 'arrow-forward' : 'close'} size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إضافة سيارة</Text>
        <Text className="text-sm text-gray-400 mr-auto">{step}/3</Text>
      </View>

      <View className="flex-row px-4 gap-2 mb-4">
        {[1, 2, 3].map(s => (
          <View key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-4">معلومات السيارة</Text>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العلامة التجارية *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {brands.map(b => (
                <TouchableOpacity key={b.id} onPress={() => { setBrandId(b.id); setModelId(''); }} className={`px-4 py-2 rounded-xl mr-2 ${brandId === b.id ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Text className={`text-sm font-medium ${brandId === b.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{b.nameAr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {brandId && (
              <>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الموديل *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  {models.map(m => (
                    <TouchableOpacity key={m.id} onPress={() => setModelId(m.id)} className={`px-4 py-2 rounded-xl mr-2 ${modelId === m.id ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Text className={`text-sm font-medium ${modelId === m.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{m.nameAr}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Input label="السنة *" value={year} onChangeText={setYear} keyboardType="numeric" placeholder="2024" />
            <Input label="السعر (د.أ) *" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="15000" />
            <Input label="الكيلومترات *" value={kilometers} onChangeText={setKilometers} keyboardType="numeric" placeholder="50000" />
            <Input label="اللون" value={color} onChangeText={setColor} placeholder="أبيض" />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-4">المواصفات</Text>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الوقود</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {FUEL_TYPES.map(ft => (
                <TouchableOpacity key={ft} onPress={() => setFuelType(ft)} className={`px-4 py-2 rounded-xl mr-2 ${fuelType === ft ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Text className={`text-sm font-medium ${fuelType === ft ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{LABELS[ft]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ناقل الحركة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {TRANSMISSION_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setTransmission(t)} className={`px-4 py-2 rounded-xl mr-2 ${transmission === t ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Text className={`text-sm font-medium ${transmission === t ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الهيكل</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {BODY_TYPES.map(bt => (
                <TouchableOpacity key={bt} onPress={() => setBodyType(bt)} className={`px-4 py-2 rounded-xl mr-2 ${bodyType === bt ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Text className={`text-sm font-medium ${bodyType === bt ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{LABELS[bt]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحالة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {CONDITIONS.map(c => (
                <TouchableOpacity key={c} onPress={() => setCondition(c)} className={`px-4 py-2 rounded-xl mr-2 ${condition === c ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Text className={`text-sm font-medium ${condition === c ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{LABELS[c]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => setIsNegotiable(!isNegotiable)} className="flex-row items-center gap-3 mb-4 py-2">
              <View className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${isNegotiable ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                {isNegotiable && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text className="text-base text-gray-900 dark:text-white">قابل للتفاوض</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-4">الموقع والتواصل</Text>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المدينة *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {cities.map(c => (
                <TouchableOpacity key={c.id} onPress={() => setCityId(c.id)} className={`px-4 py-2 rounded-xl mr-2 ${cityId === c.id ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Text className={`text-sm font-medium ${cityId === c.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{c.nameAr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input label="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="07XXXXXXXX" />
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الوصف</Text>
              <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" placeholder="اكتب وصفاً تفصيلياً للسيارة..." placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white min-h-[120px]" style={{ fontSize: 16 }} />
            </View>

            <Button title={loading ? 'جاري الإضافة...' : 'نشر الإعلان'} onPress={handleSubmit} loading={loading} fullWidth size="lg" />
            <View className="h-8" />
          </View>
        )}
      </ScrollView>

      {step < 3 && (
        <View className="px-4 py-3">
          <Button title="التالي" onPress={() => setStep(step + 1)} fullWidth size="lg" />
        </View>
      )}
    </SafeAreaView>
  );
}
