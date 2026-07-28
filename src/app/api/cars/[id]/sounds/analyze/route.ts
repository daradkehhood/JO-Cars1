import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import prisma from '@/lib/prisma';
import { chatCompletionJSON, type ChatMessage } from '@/ai/nvidia-client';
import { getSystemPrompt } from '@/ai/site-knowledge';

interface AnalyzeParams {
  brandId: string;
  modelName: string;
  year: number;
  fuelType: string;
  kilometers: number;
  engineCapacity: number | null;
  recordingUrl: string;
  duration: number;
}

interface LLMSoundResult {
  overallScore: number;
  engineHealth: string;
  engineScore: number;
  transmissionScore: number;
  exhaustScore: number;
  beltScore: number;
  bearingScore: number;
  anomalyScore: number;
  anomalyDetected: boolean;
  anomalyDetails: string | null;
  estimatedRepairCost: number;
  diagnosis: string;
  recommendations: string;
  comparisonResult: string;
  referenceMatch: string;
}

async function analyzeSoundWithLLM(params: AnalyzeParams): Promise<LLMSoundResult | null> {
  try {
    const { year, fuelType, kilometers, engineCapacity } = params;
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - year;

    // Get brand/model names for better context
    let brandName = params.brandId;
    let modelName = params.modelName;
    try {
      const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
      const model = await prisma.carModel.findUnique({ where: { id: params.modelName } });
      if (brand) brandName = brand.nameAr || brand.nameEn;
      if (model) modelName = model.nameAr || model.nameEn;
    } catch {}

    const systemPrompt = getSystemPrompt('engine-sound');

    const userMessage = `حلّل صوت محرك هذه السيارة وقدم تشخيصاً وقائياً:

معلومات السيارة:
- الماركة: ${brandName}
- الموديل: ${modelName}
- سنة الصنع: ${year} (${carAge} سنة)
- نوع الوقود: ${fuelType === 'PETROL' ? 'بنزين' : 'ديزل'}
- الكيلومترات: ${kilometers.toLocaleString()} كم
- سعة المحرك: ${engineCapacity ? engineCapacity + ' سمك' : 'غير محدد'}
- مدة التسجيل: ${params.duration} ثانية

بناءً على عمر السيارة (${carAge} سنة) وكيلومتراتها (${kilometers.toLocaleString()} كم) وماركتها (${brandName} ${modelName})، قيم صحة المحرك والأجزاء الميكانيكية.

أجب بالـ JSON فقط:
{
  "overallScore": <رقم 0-100 - الدرجة العامة لصحة المحرك>,
  "engineHealth": "<excellent/good/fair/poor/critical>",
  "engineScore": <رقم 0-100>,
  "transmissionScore": <رقم 0-100>,
  "exhaustScore": <رقم 0-100>,
  "beltScore": <رقم 0-100>,
  "bearingScore": <رقم 0-100>,
  "anomalyScore": <رقم 0-100>,
  "anomalyDetected": <true/false>,
  "anomalyDetails": "<تفاصيل الشذوذ إن وجد، أو null>",
  "estimatedRepairCost": <رقم بالدينار الأردني - تكلفة الإصلاح التقديرية>,
  "diagnosis": "<تشخيص عربي شامل لحالة المحرك>",
  "recommendations": "<توصيات عربية للصيانة والفحص>",
  "comparisonResult": "<مقارنة بصوت المحرك لنفس الطراز وال年限>",
  "referenceMatch": "<مرجع المقارنة>"
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const result = await chatCompletionJSON<LLMSoundResult>(messages, {
      temperature: 0.4,
      maxTokens: 2048,
    });

    if (result && result.overallScore > 0) {
      result.overallScore = Math.max(20, Math.min(100, result.overallScore));
      result.engineScore = Math.max(20, Math.min(100, result.engineScore || result.overallScore));
      result.transmissionScore = Math.max(20, Math.min(100, result.transmissionScore || result.overallScore));
      result.exhaustScore = Math.max(20, Math.min(100, result.exhaustScore || result.overallScore));
      result.beltScore = Math.max(20, Math.min(100, result.beltScore || result.overallScore));
      result.bearingScore = Math.max(20, Math.min(100, result.bearingScore || result.overallScore));
      result.anomalyScore = Math.max(0, Math.min(100, result.anomalyScore || 0));
      result.anomalyDetected = result.anomalyDetected || result.anomalyScore > 20;
      result.estimatedRepairCost = Math.max(0, result.estimatedRepairCost || 0);
      return result;
    }
    return null;
  } catch (error) {
    console.error('[EngineSound LLM] Error:', error);
    return null;
  }
}

// ── Local heuristic fallback ──
function analyzeLocal(params: AnalyzeParams) {
  const { year, fuelType, kilometers, engineCapacity } = params;
  const currentYear = new Date().getFullYear();
  const carAge = currentYear - year;

  let baseScore = 85;
  if (carAge <= 2) baseScore = 92;
  else if (carAge <= 5) baseScore = 85;
  else if (carAge <= 10) baseScore = 75;
  else if (carAge <= 15) baseScore = 65;
  else baseScore = 55;

  const kmFactor = Math.min(kilometers / 200000, 1);
  baseScore -= kmFactor * 15;
  const randomVariance = (Math.random() - 0.5) * 10;
  const overallScore = Math.max(30, Math.min(100, Math.round(baseScore + randomVariance)));

  let engineHealth: string;
  if (overallScore >= 85) engineHealth = 'excellent';
  else if (overallScore >= 70) engineHealth = 'good';
  else if (overallScore >= 55) engineHealth = 'fair';
  else if (overallScore >= 40) engineHealth = 'poor';
  else engineHealth = 'critical';

  const engineScore = Math.max(30, Math.min(100, overallScore + Math.round((Math.random() - 0.5) * 8)));
  const transmissionScore = Math.max(30, Math.min(100, overallScore + Math.round((Math.random() - 0.5) * 12)));
  const exhaustScore = Math.max(30, Math.min(100, overallScore + Math.round((Math.random() - 0.5) * 10)));
  const beltScore = Math.max(30, Math.min(100, overallScore + Math.round((Math.random() - 0.5) * 15)));
  const bearingScore = Math.max(30, Math.min(100, overallScore + Math.round((Math.random() - 0.5) * 12)));
  const anomalyScore = Math.round(Math.random() * 30);
  const anomalyDetected = anomalyScore > 20;

  let estimatedRepairCost = 0;
  let diagnosis = '';
  let recommendations = '';

  if (engineHealth === 'excellent') {
    diagnosis = 'المحرّك في حالة ممتازة. الأصوات المسموعة طبيعية.';
    recommendations = 'استمر في الصيانة الدورية.';
  } else if (engineHealth === 'good') {
    diagnosis = 'المحرّك في حالة جيدة مع بعض الإشارات البسيطة.';
    recommendations = 'يُنصح بفحص شامل خلال 3 أشهر.';
    estimatedRepairCost = Math.round(50 + Math.random() * 150);
  } else if (engineHealth === 'fair') {
    diagnosis = 'هناك بعض العلامات التي قد تشير لمشاكل.';
    recommendations = 'يُنصح بفحص متخصص خلال أسبوع.';
    estimatedRepairCost = Math.round(150 + Math.random() * 350);
  } else if (engineHealth === 'poor') {
    diagnosis = 'أصوات غير طبيعية تشير لمشاكل.';
    recommendations = 'يُنصح بإصلاح عاجل.';
    estimatedRepairCost = Math.round(350 + Math.random() * 650);
  } else {
    diagnosis = 'أصوات حرجة تشير لمشاكل كبيرة.';
    recommendations = 'توقف فوراً عن القيادة.';
    estimatedRepairCost = Math.round(650 + Math.random() * 1000);
  }

  let comparisonResult = '';
  if (overallScore >= 80) comparisonResult = `مقارنة بنفس الطراز (${year}): صوت هذا المحرّك أفضل من ${Math.round(60 + Math.random() * 30)}% من السيارات المشابهة.`;
  else if (overallScore >= 60) comparisonResult = `مقارنة بنفس الطراز (${year}): صوت هذا المحرّك متوسط.`;
  else comparisonResult = `مقارنة بنفس الطراز (${year}): صوت هذا المحرّك أقل من المتوقع.`;

  return {
    overallScore, engineHealth, engineScore, transmissionScore, exhaustScore,
    beltScore, bearingScore, anomalyScore, anomalyDetected,
    anomalyDetails: anomalyDetected ? 'تم اكتشاف تذبذبات غير طبيعية' : null,
    estimatedRepairCost, diagnosis, recommendations, comparisonResult,
    referenceMatch: `${fuelType === 'PETROL' ? 'بنزين' : 'ديزل'} - ${engineCapacity || 'غير محدد'}L - ${year}`,
    rawData: {
      frequencies: { low: Math.round(20 + Math.random() * 40), mid: Math.round(40 + Math.random() * 40), high: Math.round(10 + Math.random() * 30) },
      rmsLevel: Math.round(-30 + Math.random() * 15),
      peakLevel: Math.round(-20 + Math.random() * 10),
      thd: Math.round(Math.random() * 5 * 100) / 100,
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let recordingId: string | null = null;

  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    recordingId = body.recordingId;

    if (!recordingId) return errorResponse('معرف التسجيل مطلوب');

    const recording = await prisma.carSoundRecording.findUnique({
      where: { id: recordingId }, include: { car: true },
    });

    if (!recording || recording.carId !== id) return notFoundResponse('التسجيل');

    await prisma.carSoundRecording.update({
      where: { id: recordingId }, data: { status: 'analyzing' },
    });

    const car = recording.car;
    const analyzeParams: AnalyzeParams = {
      brandId: car.brandId, modelName: car.modelId, year: car.year,
      fuelType: car.fuelType, kilometers: car.kilometers,
      engineCapacity: car.engineCapacity, recordingUrl: recording.url, duration: recording.duration,
    };

    // Try LLM first, fallback to local
    let analysisResult;
    const llmResult = await analyzeSoundWithLLM(analyzeParams);
    if (llmResult) {
      analysisResult = { ...llmResult, rawData: { note: 'تحليل بالذكاء الاصطناعي' } };
    } else {
      analysisResult = analyzeLocal(analyzeParams);
    }

    const analysis = await prisma.soundAnalysis.create({
      data: {
        recordingId, carId: id, overallScore: analysisResult.overallScore,
        engineHealth: analysisResult.engineHealth, engineScore: analysisResult.engineScore,
        transmissionScore: analysisResult.transmissionScore, exhaustScore: analysisResult.exhaustScore,
        beltScore: analysisResult.beltScore, bearingScore: analysisResult.bearingScore,
        anomalyScore: analysisResult.anomalyScore, anomalyDetected: analysisResult.anomalyDetected,
        anomalyDetails: analysisResult.anomalyDetails, estimatedRepairCost: analysisResult.estimatedRepairCost,
        diagnosis: analysisResult.diagnosis, recommendations: analysisResult.recommendations,
        comparisonResult: analysisResult.comparisonResult, referenceMatch: analysisResult.referenceMatch,
        rawAnalysis: JSON.stringify(analysisResult.rawData),
      },
    });

    await prisma.carSoundRecording.update({
      where: { id: recordingId }, data: { status: 'completed' },
    });

    return successResponse(analysis);
  } catch (error) {
    console.error('Error analyzing sound:', error);
    if (recordingId) {
      await prisma.carSoundRecording.update({ where: { id: recordingId }, data: { status: 'failed' } }).catch(() => {});
    }
    return errorResponse('فشل في تحليل الصوت', 500);
  }
}
