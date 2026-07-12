export interface PersonalityDimensions {
  energy: number;
  style: number;
  adventure: number;
  social: number;
  pace: number;
}

export interface PersonalityType {
  typeAr: string;
  typeEn: string;
  description: string;
  emoji: string;
  color: string;
  bodyTypes: string[];
  preferredBrands: string[];
  preferredFuel: string[];
  priceRange: { min: number; max: number };
  recommendedCars: RecommendedCar[];
}

export interface RecommendedCar {
  brand: string;
  model: string;
  yearRange: string;
  priceRange: string;
  reason: string;
  category: string;
}

const questions = [
  {
    id: 'q1',
    text: 'إيش نوع الطقس اللي تحبه؟',
    options: [
      { label: '☀️ مشمس ودافئ', value: 'A' },
      { label: '🌧️ ممطر ورومانسي', value: 'B' },
      { label: '❄️ بارد ومشوق', value: 'C' },
    ],
  },
  {
    id: 'q2',
    text: 'كيف تشرب قهوتك؟',
    options: [
      { label: '☕ قهوة عربية تقليدية', value: 'A' },
      { label: '🥛 لاتيه حلو وحلات', value: 'B' },
      { label: '💪 اسبريسو قوي وسريع', value: 'C' },
    ],
  },
  {
    id: 'q3',
    text: 'إيش أغنية حياتك؟',
    options: [
      { label: '🎵 أغنية هادية وعميقة', value: 'A' },
      { label: '🎸 أغنية حماسية وصاخبة', value: 'B' },
      { label: '🎹 أغنية كلاسيكية أنيقة', value: 'C' },
    ],
  },
  {
    id: 'q4',
    text: 'لو سافرت، وين تروح؟',
    options: [
      { label: '🏔️ بر وصحراء ومغامرة', value: 'A' },
      { label: '🏖️ شاطئ وهدوء واسترخاء', value: 'B' },
      { label: '🏙️ مدينة كبيرة وفخمة', value: 'C' },
    ],
  },
  {
    id: 'q5',
    text: 'كيف تنظّم يومك؟',
    options: [
      { label: '📋 كل شي مخطط ومرتب', value: 'A' },
      { label: '🎲 عشوائي وتفاجئ نفسي', value: 'B' },
      { label: '👥 مع الأهل والأصدقاء', value: 'C' },
    ],
  },
];

const scoringMatrix: Record<string, Record<string, PersonalityDimensions>> = {
  q1: {
    A: { energy: -0.3, style: 0.1, adventure: 0.2, social: 0.0, pace: 0.1 },
    B: { energy: -0.1, style: 0.3, adventure: -0.2, social: 0.2, pace: -0.1 },
    C: { energy: 0.4, style: 0.0, adventure: 0.4, social: 0.1, pace: 0.3 },
  },
  q2: {
    A: { energy: -0.2, style: -0.3, adventure: 0.1, social: 0.3, pace: -0.2 },
    B: { energy: 0.1, style: 0.4, adventure: -0.1, social: 0.1, pace: 0.0 },
    C: { energy: 0.4, style: 0.1, adventure: 0.2, social: -0.2, pace: 0.4 },
  },
  q3: {
    A: { energy: -0.4, style: 0.2, adventure: -0.3, social: 0.0, pace: -0.3 },
    B: { energy: 0.5, style: -0.1, adventure: 0.5, social: 0.2, pace: 0.4 },
    C: { energy: 0.0, style: 0.5, adventure: 0.0, social: 0.1, pace: 0.1 },
  },
  q4: {
    A: { energy: 0.3, style: -0.2, adventure: 0.5, social: -0.2, pace: 0.2 },
    B: { energy: -0.3, style: 0.2, adventure: -0.4, social: 0.3, pace: -0.3 },
    C: { energy: 0.2, style: 0.4, adventure: 0.1, social: 0.2, pace: 0.3 },
  },
  q5: {
    A: { energy: -0.1, style: 0.2, adventure: -0.2, social: -0.1, pace: -0.2 },
    B: { energy: 0.3, style: 0.0, adventure: 0.4, social: 0.0, pace: 0.3 },
    C: { energy: 0.1, style: 0.1, adventure: -0.1, social: 0.5, pace: 0.0 },
  },
};

const personalityTypes: PersonalityType[] = [
  {
    typeAr: 'المغامر',
    typeEn: 'Adventurer',
    description: 'أنت شخص يحب المغامرات والتحديات! تفضل السيارات القوية اللي تقدر توديك لأي مكان. ما تخاف من الطرق الوعرة وتبي سيارة تعكس حبّك للحرية والاستكشاف.',
    emoji: '🏔️',
    color: '#f59e0b',
    bodyTypes: ['SUV', 'PICKUP', 'CROSSOVER'],
    preferredBrands: ['toyota', 'jeep', 'land-rover', 'ford', 'nissan'],
    preferredFuel: ['DIESEL', 'PETROL'],
    priceRange: { min: 8000, max: 45000 },
    recommendedCars: [
      { brand: 'Toyota', model: 'Land Cruiser', yearRange: '2018-2024', priceRange: '25,000-45,000 د.أ', reason: 'ملك الطرق الوعرة، موثوقية لا تُضاهى', category: 'SUV فاخر' },
      { brand: 'Toyota', model: 'Fortuner', yearRange: '2019-2024', priceRange: '18,000-28,000 د.أ', reason: 'مثالي للمغامرات العائلية', category: 'SUV متوسط' },
      { brand: 'Jeep', model: 'Wrangler', yearRange: '2018-2024', priceRange: '22,000-38,000 د.أ', reason: 'أسطورة المغامرات البرية', category: 'SUV رياضي' },
      { brand: 'Ford', model: 'Ranger', yearRange: '2019-2024', priceRange: '15,000-25,000 د.أ', reason: 'بيك أب قوي لجميع المهمات', category: 'بيك أب' },
      { brand: 'Nissan', model: 'Patrol', yearRange: '2017-2024', priceRange: '20,000-40,000 د.أ', reason: 'قوة وإمكانيات off-road ممتازة', category: 'SUV كبير' },
      { brand: 'Toyota', model: 'Hilux', yearRange: '2018-2024', priceRange: '14,000-22,000 د.أ', reason: 'الخيار الأول للعمل والمغامرة', category: 'بيك أب' },
    ],
  },
  {
    typeAr: 'الأنيق',
    typeEn: 'Elegant',
    description: 'أنت شخص يقدّر الأناقة والتفاصيل! تحب الشياكة والفخامة، وتبي سيارة تعكس ذوقك الرفيع. التصميم الداخلي والخارجي مهمين عندك مثل الأداء.',
    emoji: '🎩',
    color: '#6366f1',
    bodyTypes: ['SEDAN', 'COUPE'],
    preferredBrands: ['mercedes-bmw', 'audi', 'lexus', 'bmw', 'mercedes-benz'],
    preferredFuel: ['PETROL', 'HYBRID'],
    priceRange: { min: 15000, max: 50000 },
    recommendedCars: [
      { brand: 'Mercedes-Benz', model: 'C-Class', yearRange: '2019-2024', priceRange: '18,000-32,000 د.أ', reason: 'أناقة ألمانية خالصة', category: 'سيدان فاخر' },
      { brand: 'BMW', model: '3 Series', yearRange: '2019-2024', priceRange: '17,000-30,000 د.أ', reason: 'متعة القيادة والأناقة', category: 'سيدان رياضية' },
      { brand: 'Lexus', model: 'ES', yearRange: '2019-2024', priceRange: '16,000-28,000 د.أ', reason: 'فخامة يابانية هادئة', category: 'سيدان فاخر' },
      { brand: 'Audi', model: 'A4', yearRange: '2019-2024', priceRange: '16,000-28,000 د.أ', reason: 'تصميم أنيق وتقنية متطورة', category: 'سيدان فاخر' },
      { brand: 'Mercedes-Benz', model: 'E-Class', yearRange: '2017-2023', priceRange: '15,000-30,000 د.أ', reason: 'كلاسيكية الفخامة', category: 'سيدان فاخرة' },
      { brand: 'BMW', model: '5 Series', yearRange: '2017-2023', priceRange: '15,000-30,000 د.أ', reason: 'أناقة وقوة', category: 'سيدان فاخرة' },
    ],
  },
  {
    typeAr: 'العملي',
    typeEn: 'Practical',
    description: 'أنت شخص واقعي وعملي! تبي سيارة موثوقة واقتصادية تخدمك يومياً بدون مشاكل. الجودة والاستهلاك المنخفض أهم شي عندك.',
    emoji: '🔧',
    color: '#10b981',
    bodyTypes: ['SEDAN', 'HATCHBACK', 'WAGON'],
    preferredBrands: ['toyota', 'honda', 'hyundai', 'kia', 'mazda'],
    preferredFuel: ['PETROL', 'HYBRID'],
    priceRange: { min: 5000, max: 18000 },
    recommendedCars: [
      { brand: 'Toyota', model: 'Corolla', yearRange: '2019-2024', priceRange: '9,000-15,000 د.أ', reason: 'السيدان الأكثر موثوقية في العالم', category: 'سيدان اقتصادية' },
      { brand: 'Honda', model: 'Civic', yearRange: '2019-2024', priceRange: '10,000-16,000 د.أ', reason: 'متعة قيادة واقتصادية', category: 'سيدان رياضية' },
      { brand: 'Hyundai', model: 'Elantra', yearRange: '2020-2024', priceRange: '8,000-13,000 د.أ', reason: 'قيمة ممتازة مقابل السعر', category: 'سيدان اقتصادية' },
      { brand: 'Kia', model: 'Cerato', yearRange: '2020-2024', priceRange: '7,500-12,000 د.أ', reason: 'تصميم جميل وسعر مناسب', category: 'سيدان اقتصادية' },
      { brand: 'Toyota', model: 'Yaris', yearRange: '2020-2024', priceRange: '6,000-10,000 د.أ', reason: 'الخيار الأذكى للتنقل اليومي', category: 'هاتشباك' },
      { brand: 'Mazda', model: '3', yearRange: '2019-2024', priceRange: '9,000-15,000 د.أ', reason: 'تصميم أنيق وجودة عالية', category: 'سيدان/هاتشباك' },
    ],
  },
  {
    typeAr: 'العائلي',
    typeEn: 'Family',
    description: 'أنت شخص عائلي يحب راحة أهله! تبي سيارة واسعة وآمنة تسع الكل. الأمان والراحة أهم شي عندك، مع مساحة كافية للشنط والعائلة.',
    emoji: '👨‍👩‍👧‍👦',
    color: '#3b82f6',
    bodyTypes: ['SUV', 'MINIVAN', 'CROSSOVER'],
    preferredBrands: ['toyota', 'hyundai', 'kia', 'nissan', 'honda'],
    preferredFuel: ['PETROL', 'DIESEL'],
    priceRange: { min: 10000, max: 30000 },
    recommendedCars: [
      { brand: 'Toyota', model: 'Highlander', yearRange: '2018-2024', priceRange: '18,000-30,000 د.أ', reason: 'الخيار العائلي المثالي', category: 'SUV عائلي كبير' },
      { brand: 'Hyundai', model: 'Tucson', yearRange: '2021-2024', priceRange: '14,000-22,000 د.أ', reason: 'تصميم حديث ومساحة واسعة', category: 'SUV متوسط' },
      { brand: 'Kia', model: 'Sorento', yearRange: '2020-2024', priceRange: '15,000-24,000 د.أ', reason: '7 مقاعد وراحة ممتازة', category: 'SUV عائلي' },
      { brand: 'Nissan', model: 'X-Trail', yearRange: '2019-2024', priceRange: '13,000-21,000 د.أ', reason: 'عملي وواسع ومريح', category: 'SUV عائلي' },
      { brand: 'Hyundai', model: 'Palisade', yearRange: '2020-2024', priceRange: '20,000-32,000 د.أ', reason: 'فخامة عائلية بسعر معقول', category: 'SUV فاخر' },
      { brand: 'Kia', model: 'Carnival', yearRange: '2021-2024', priceRange: '16,000-24,000 د.أ', reason: 'ميني فان واسع للعائلة الكبيرة', category: 'ميني فان' },
    ],
  },
  {
    typeAr: 'الرياضي',
    typeEn: 'Sporty',
    description: 'أنت شخص يحب السرعة والإثارة! تبي سيارة سريعة وقوية تعطيك متعة القيادة. الأداء والمحرك أهم شي عندك.',
    emoji: '🏎️',
    color: '#ef4444',
    bodyTypes: ['COUPE', 'SEDAN'],
    preferredBrands: ['bmw', 'mercedes-benz', 'porsche', 'audi', 'ford'],
    preferredFuel: ['PETROL'],
    priceRange: { min: 15000, max: 60000 },
    recommendedCars: [
      { brand: 'BMW', model: 'M340i', yearRange: '2020-2024', priceRange: '28,000-40,000 د.أ', reason: 'أداء رياضي خالص', category: 'سيدان رياضية' },
      { brand: 'Mercedes-Benz', model: 'AMG C43', yearRange: '2019-2024', priceRange: '30,000-45,000 د.أ', reason: 'قوة وصوت AMG الأسطوري', category: 'سيدان رياضية' },
      { brand: 'Ford', model: 'Mustang', yearRange: '2018-2024', priceRange: '18,000-35,000 د.أ', reason: 'أيقونة الرياضية الأمريكية', category: 'كوبيه رياضية' },
      { brand: 'BMW', model: 'M4', yearRange: '2021-2024', priceRange: '35,000-55,000 د.أ', reason: 'تصميم جريء وأداء خرافي', category: 'كوبيه رياضية' },
      { brand: 'Audi', model: 'S4', yearRange: '2018-2024', priceRange: '22,000-38,000 د.أ', reason: 'توازن مثالي بين الأناقة والأداء', category: 'سيدان رياضية' },
      { brand: 'Mercedes-Benz', model: 'CLA 45', yearRange: '2020-2024', priceRange: '25,000-38,000 د.أ', reason: 'compact لكن قوي بشكل مجنون', category: 'كوبيه رياضية' },
    ],
  },
  {
    typeAr: 'المجتهد',
    typeEn: 'Ambitious',
    description: 'أنت شخص طموح يحب الظهور بالشكل الأفضل! تبي سيارة تعكس نجاحك وstatusك. الفخامة والتقنية المتطورة مهمة عندك.',
    emoji: '💼',
    color: '#8b5cf6',
    bodyTypes: ['SEDAN', 'COUPE', 'SUV'],
    preferredBrands: ['mercedes-bmw', 'bmw', 'audi', 'lexus', 'porsche'],
    preferredFuel: ['PETROL', 'HYBRID'],
    priceRange: { min: 20000, max: 70000 },
    recommendedCars: [
      { brand: 'BMW', model: 'X5', yearRange: '2019-2024', priceRange: '30,000-55,000 د.أ', reason: 'SUV فاخر يعكس الطموح', category: 'SUV فاخر' },
      { brand: 'Mercedes-Benz', model: 'GLE', yearRange: '2019-2024', priceRange: '30,000-55,000 د.أ', reason: 'فخامة وتقنية بأعلى مستوى', category: 'SUV فاخر' },
      { brand: 'Lexus', model: 'RX', yearRange: '2019-2024', priceRange: '22,000-40,000 د.أ', reason: 'فخامة هادئة وموثوقة', category: 'SUV فاخر' },
      { brand: 'BMW', model: '7 Series', yearRange: '2016-2023', priceRange: '18,000-40,000 د.أ', reason: 'قمة الفخامة الألمانية', category: 'سيدان فاخرة' },
      { brand: 'Mercedes-Benz', model: 'S-Class', yearRange: '2015-2023', priceRange: '20,000-50,000 د.أ', reason: 'ملك السيارات الفاخرة', category: 'سيدان فاخرة' },
      { brand: 'Audi', model: 'Q7', yearRange: '2018-2024', priceRange: '25,000-45,000 د.أ', reason: '技术和 فخامة في حزمة واحدة', category: 'SUV فاخر' },
    ],
  },
  {
    typeAr: 'الهادئ',
    typeEn: 'Calm',
    description: 'أنت شخص هادئ يقدّر الراحة والبساطة! تبي سيارة مريحة و هادية، تفضل الهايبرد أو الكهربائية. الهدوء وال economy أهم شي عندك.',
    emoji: '😌',
    color: '#06b6d4',
    bodyTypes: ['SEDAN', 'HATCHBACK', 'CROSSOVER'],
    preferredBrands: ['toyota', 'honda', 'hyundai', 'tesla'],
    preferredFuel: ['HYBRID', 'ELECTRIC', 'PETROL'],
    priceRange: { min: 8000, max: 25000 },
    recommendedCars: [
      { brand: 'Toyota', model: 'Camry Hybrid', yearRange: '2019-2024', priceRange: '13,000-22,000 د.أ', reason: 'هايبرد هادئ واقتصادي', category: 'سيدان هايبرد' },
      { brand: 'Toyota', model: 'Prius', yearRange: '2019-2024', priceRange: '10,000-16,000 د.أ', reason: 'الأيقونة الاقتصادية', category: 'هايبرد' },
      { brand: 'Honda', model: 'Accord Hybrid', yearRange: '2020-2024', priceRange: '14,000-22,000 د.أ', reason: 'راحة واقتصادية ممتازة', category: 'سيدان هايبرد' },
      { brand: 'Hyundai', model: 'Sonata Hybrid', yearRange: '2020-2024', priceRange: '12,000-19,000 د.أ', reason: 'تصميم جميل وهيدريو', category: 'سيدان هايبرد' },
      { brand: 'Toyota', model: 'RAV4 Hybrid', yearRange: '2020-2024', priceRange: '16,000-24,000 د.أ', reason: 'SUV هايبرد عملي وهادئ', category: 'SUV هايبرد' },
      { brand: 'Hyundai', model: 'Ioniq', yearRange: '2020-2024', priceRange: '11,000-17,000 د.أ', reason: '未来انية وهادئة', category: 'هايبرد/كهرباء' },
    ],
  },
];

export function getQuestions() {
  return questions;
}

export function calculatePersonality(answers: string[]): PersonalityDimensions {
  const dims: PersonalityDimensions = { energy: 0, style: 0, adventure: 0, social: 0, pace: 0 };

  const qIds = ['q1', 'q2', 'q3', 'q4', 'q5'];
  answers.forEach((answer, i) => {
    const qId = qIds[i];
    const scores = scoringMatrix[qId]?.[answer];
    if (scores) {
      dims.energy += scores.energy;
      dims.style += scores.style;
      dims.adventure += scores.adventure;
      dims.social += scores.social;
      dims.pace += scores.pace;
    }
  });

  return dims;
}

export function getPersonalityType(dims: PersonalityDimensions): PersonalityType {
  let bestType = personalityTypes[0];
  let bestScore = -Infinity;

  for (const pt of personalityTypes) {
    let score = 0;
    if (pt.typeEn === 'Adventurer') score = dims.adventure * 2 + dims.energy * 1.5;
    else if (pt.typeEn === 'Elegant') score = dims.style * 2 + dims.pace * 0.5;
    else if (pt.typeEn === 'Practical') score = -dims.style * 1.5 + (-dims.pace) * 1 + (-dims.adventure) * 0.5;
    else if (pt.typeEn === 'Family') score = dims.social * 2 + (-dims.adventure) * 0.5;
    else if (pt.typeEn === 'Sporty') score = dims.energy * 2 + dims.pace * 2 + dims.adventure * 0.5;
    else if (pt.typeEn === 'Ambitious') score = dims.style * 1.5 + dims.pace * 1.5;
    else if (pt.typeEn === 'Calm') score = (-dims.energy) * 2 + (-dims.pace) * 1.5;

    if (score > bestScore) {
      bestScore = score;
      bestType = pt;
    }
  }

  return bestType;
}
