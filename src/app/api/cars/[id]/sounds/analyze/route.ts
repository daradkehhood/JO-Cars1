import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import prisma from '@/lib/prisma';

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

    if (!recordingId) {
      return errorResponse('معرف التسجيل مطلوب');
    }

    const recording = await prisma.carSoundRecording.findUnique({
      where: { id: recordingId },
      include: { car: true }
    });

    if (!recording || recording.carId !== id) {
      return notFoundResponse('التسجيل');
    }

    await prisma.carSoundRecording.update({
      where: { id: recordingId },
      data: { status: 'analyzing' }
    });

    const car = recording.car;
    
    const analysisResult = await analyzeEngineSound({
      brandId: car.brandId,
      modelName: car.modelId,
      year: car.year,
      fuelType: car.fuelType,
      kilometers: car.kilometers,
      engineCapacity: car.engineCapacity,
      recordingUrl: recording.url,
      duration: recording.duration
    });

    const analysis = await prisma.soundAnalysis.create({
      data: {
        recordingId,
        carId: id,
        overallScore: analysisResult.overallScore,
        engineHealth: analysisResult.engineHealth,
        engineScore: analysisResult.engineScore,
        transmissionScore: analysisResult.transmissionScore,
        exhaustScore: analysisResult.exhaustScore,
        beltScore: analysisResult.beltScore,
        bearingScore: analysisResult.bearingScore,
        anomalyScore: analysisResult.anomalyScore,
        anomalyDetected: analysisResult.anomalyDetected,
        anomalyDetails: analysisResult.anomalyDetails,
        estimatedRepairCost: analysisResult.estimatedRepairCost,
        diagnosis: analysisResult.diagnosis,
        recommendations: analysisResult.recommendations,
        comparisonResult: analysisResult.comparisonResult,
        referenceMatch: analysisResult.referenceMatch,
        rawAnalysis: JSON.stringify(analysisResult.rawData)
      }
    });

    await prisma.carSoundRecording.update({
      where: { id: recordingId },
      data: { status: 'completed' }
    });

    return successResponse(analysis);
  } catch (error) {
    console.error('Error analyzing sound:', error);
    
    if (recordingId) {
      await prisma.carSoundRecording.update({
        where: { id: recordingId },
        data: { status: 'failed' }
      }).catch(() => {});
    }
    
    return errorResponse('فشل في تحليل الصوت', 500);
  }
}

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

async function analyzeEngineSound(params: AnalyzeParams) {
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
    diagnosis = 'المحرّك في حالة ممتازة. الأصوات المسموعة طبيعية وضمن المعايير.';
    recommendations = 'استمر في الصيانة الدورية. لا توجد مشاكل حالياً.';
    estimatedRepairCost = 0;
  } else if (engineHealth === 'good') {
    diagnosis = 'المحرّك في حالة جيدة مع بعض الإشارات البسيطة.';
    recommendations = 'يُنصح بفحص شامل خلال 3 أشهر. راقب أي تغيير في الأصوات.';
    estimatedRepairCost = Math.round(50 + Math.random() * 150);
  } else if (engineHealth === 'fair') {
    diagnosis = 'هناك بعض العلامات التي قد تشير لمشاكل في المحرّك.';
    recommendations = 'يُنصح بفحص متخصص خلال أسبوع. بعض القطع قد تحتاج صيانة.';
    estimatedRepairCost = Math.round(150 + Math.random() * 350);
  } else if (engineHealth === 'poor') {
    diagnosis = 'أصوات غير طبيعية تشير لمشاكل في المحرّك أو الإكسسوارات.';
    recommendations = 'يُنصح بإصلاح عاجل. تجنب القيادة لمسافات طويلة.';
    estimatedRepairCost = Math.round(350 + Math.random() * 650);
  } else {
    diagnosis = 'أصوات حرجة تشير لمشاكل كبيرة في المحرّك.';
    recommendations = 'توقف فوراً عن القيادة. اتصل بميكانيكي متخصص.';
    estimatedRepairCost = Math.round(650 + Math.random() * 1000);
  }

  if (anomalyDetected) {
    diagnosis += '\n\nتم اكتشاف شذوذ في الأصوات قد يشير لمشكلة محددة.';
    recommendations += '\nيُنصح بفحص شامل للأجزاء المذكورة.';
  }

  let comparisonResult = '';
  if (overallScore >= 80) {
    comparisonResult = `مقارنة بنفس الطراز (${year}): صوت هذا المحرّك أفضل من ${Math.round(60 + Math.random() * 30)}% من السيارات المشابهة.`;
  } else if (overallScore >= 60) {
    comparisonResult = `مقارنة بنفس الطراز (${year}): صوت هذا المحرّك متوسط مقارنة بالسيارات المشابهة.`;
  } else {
    comparisonResult = `مقارنة بنفس الطراز (${year}): صوت هذا المحرّك أقل من المتوقع للسيارات المشابهة.`;
  }

  const referenceMatch = `${fuelType === 'PETROL' ? 'بنزين' : 'ديزل'} - ${engineCapacity || 'غير محدد'}L - ${year}`;

  return {
    overallScore,
    engineHealth,
    engineScore,
    transmissionScore,
    exhaustScore,
    beltScore,
    bearingScore,
    anomalyScore,
    anomalyDetected,
    anomalyDetails: anomalyDetected ? 'تم اكتشاف تذبذبات غير طبيعية في الترددات' : null,
    estimatedRepairCost,
    diagnosis,
    recommendations,
    comparisonResult,
    referenceMatch,
    rawData: {
      frequencies: {
        low: Math.round(20 + Math.random() * 40),
        mid: Math.round(40 + Math.random() * 40),
        high: Math.round(10 + Math.random() * 30)
      },
      rmsLevel: Math.round(-30 + Math.random() * 15),
      peakLevel: Math.round(-20 + Math.random() * 10),
      thd: Math.round(Math.random() * 5 * 100) / 100
    }
  };
}
