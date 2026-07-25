# خطة تطوير نظام تقييم سعر ذكي واقعي عبر OpenAI

## نتائج الفحص الأولي (مفاجأة حرجة)

**الموقع لا يحتوي أي ذكاء اصطناعي حقيقي إطلاقاً.** كل "AI module" في `src/ai/` يستدعي `callAI()` التي هي **stub ترجع نصاً فارغاً**، فينتقل كل module لجداول ثابتة (`JORDAN_PRICES`, `MODEL_ADJUSTMENTS`). على Railway: `ENABLE_AI_FEATURES=false` و **لا يوجد `OPENAI_API_KEY`**، و `src/ai/providers/` **فارغة تماماً**.

## 🔒 تنبيه أمني
المفتاح OpenAI الذي شاركته يجب **إعادة توليده فوراً** في `https://platform.openai.com/api-keys` (لأنه ظهر في جلسة نصية). سأضيفه إلى Railway variables، لكن أنت مسؤول عن تدويره لاحقاً.

## خطوات التنفيذ

### 1) تثبيت SDK وإعدادا
- `npm install openai` (الـ SDK الرسمي)
- إضافة `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4o-mini` إلى `.env.example` للتوثيق (placeholder فقط، لا يُلتزم في git)

### 2) بناء `src/ai/providers/openai.ts` — مزود حقيقي
`OpenAIProvider` يغلّف عميل OpenAI الرسمي، يدعم:
- **chat completions** (نص فقط)
- **vision** (chat completions مع `image_url` blocks من Cloudinary)
- **web search tool** (لـ gpt-4o و gpt-4o-mini مفعّل عبر `tools: [{type: 'web_search'}]` ليتصل فعلياً بالإنترنت)
- timeout (30s) + retry مرّة عند فشل شبكة

### 3) إعادة كتابة `src/ai/base.ts`
- `callAI(prompt, systemPrompt?)` → يستدعي `this.provider.chat(...)`
- تحسين `parseJSON`: يرفع الأسوار markdown (` ```json ... ``` `) ويستخرج `{...}` من نص عام عبر regex عند فشل JSON.parse
- إنشاء `this.provider = new OpenAIProvider(config)` في constructor

### 4) إعادة كتابة `src/ai/price-estimator.ts` — تقييم واقعي بـ web search
`process()` الجديد:
1. التحقق من input.
2. **استدعاء OpenAI مع web_search** وprompt عربي يطلب البحث في `jo.opensooq.com`, `jo-cars.com`, `q8.show`, `autotrader.jo` عن نفس الموديل والسنة ونطاق الكيلومترات، وإرجاع JSON: `{ similarListings: [{site, url, price, year, km}], fairPrice, minPrice, maxPrice, confidence, reasoning, marketFactors }`.
3. **في التوازي**: `getDbSimilarPrices()` من قاعدة بيانات JO Cars المحلية.
4. **خوارزمية خلطة (blending)**:
   - web ≥3 إعلانات: 50% web + 30% DB + 20% heuristic
   - web 1–2: 30% web + 40% DB + 30% heuristic
   - فشل web: heuristic الحالي (لا كسر الموقع)
5. إرجاع `PriceOutput` بالشكل المتوقع في الـ UI

### 5) إعادة كتابة `src/ai/condition-scorer.ts` و `src/ai/damage-detector.ts` — تحليل صور بالـ vision
استدعاء `provider.chat({ images: carImageUrls, prompt: '...صور الخارج/الداخل/المقاعد/المحرك...' })`،prompt عربي يطلب JSON:
- `exteriorCondition`, `interiorCondition`, `engineBayCondition` (0-100)
- `damageItems`: [{ part, severity, description }]
- `overallScore`, `reasoning`
في غياب الصور/الـ API، نُرجع الدرجة الحالية المسطّحة.

### 6) ربط الـ AI في `src/app/api/ai/analysis/[id]/route.ts`
- استدعاء `priceEstimator.process()` للحصول على تقييم ذكي
- استدعاء `conditionScorer.process({ images })` للحصول على تحليل صور
- استبدال `webEstimate`/`conditionScore`/`damages` بنتائج الـ AI الفعلية
- الحفاظ على fallback الـ heuristic عند فشل OpenAI

### 7) ربط `src/app/api/ai/price-estimate/route.ts`
تمرير الـ data المُحسّن إلى `priceEstimator` وإرجاع النتيجة الذكية.

### 8) إعدادا Railway variables
- `railway variables set OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4o-mini ENABLE_AI_FEATURES=true`
- إعادة نشر

### 9) التحقق عبر الموقع
- البحث عن سيارة، الدخول على تفاصيلها، التحقق من ظهور:
  - سعر عادل، نطاق min/max، **مصادر سوق حقيقية مع روابط OpenSooq** في "مصادر البيانات"
  - تحليل صور "حالة الدهان: جيد جداً، خدوش بسيطة على الباب الأمامي..." بدلاً من "لا توجد عيوب مذكورة"
  - confidence عالٍ (≥80) عند نجاح web search

### 10) البناء + النشر
- `npm run build` للتحقق من أنواع TypeScript
- `git add && git commit && git push origin main`
- `railway up --service jo-cars` و تحقق من الحالة Online

## ملاحظات
- **أمان**: المفتاح من `process.env` فقط، لا يُلتزم في git.
- **أداء**: web search قد يأخذ 10–20 ثانية — الـ loading state موجود مسبقاً في الـ UI.
- **تكلفة**: gpt-4o-mini رخيص جداً (~$0.15 / million tokens). ~20-30 إعلان/يوم = بضعة دولارات شهرياً.
- **لا كسر fallback**: لو OpenAI متعطّل، الموقع يرجّع للـ heuristic الحالي.

## الملفات التي ستتغير
- `package.json` — إضافة `openai`
- `src/ai/base.ts` — rewired `callAI` + `parseJSON`
- `src/ai/providers/openai.ts` — جديد
- `src/ai/price-estimator.ts` — web search + blending
- `src/ai/condition-scorer.ts` — إعادة كتابة بـ vision
- `src/ai/damage-detector.ts` — إعادة كتابة بـ vision
- `src/app/api/ai/analysis/[id]/route.ts` — ربط الـ AI الحقيقي
- `src/app/api/ai/price-estimate/route.ts` — ربط محسّن
- `.env.example` — توثيق OPENAI_API_KEY

## مواقع أردنية سيستهدفها الـ web search فعلياً
عبر أداة `web_search` في gpt-4o/gpt-4o-mini، يطلب النموذج فعلياً صفحات مثل:
- `jo.opensooq.com` (السوق المفتوح الأردن)
- `jo-cars.com`
- `q8.show` (سيارات الأردن)
- `autotrader.jo`
- صفحات Facebook Marketplace الأردنية

وسيعيد JSON يحتوي على روابط حقيقية لكل إعلان مماثل، وأسعار مسجّلة وقت الطلب — تقييم سعر **واقعي حقيقي**.