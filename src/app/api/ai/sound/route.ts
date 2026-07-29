import { NextRequest, NextResponse } from 'next/server';
import { identifySoundPattern, generateDiagnosis } from '@/ai/engine-sound-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { features, carInfo } = body;

    if (!features || typeof features.dominantFrequency !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid audio features' },
        { status: 400 }
      );
    }

    const analysis = generateDiagnosis(features, carInfo);

    return NextResponse.json({
      isEngineSound: analysis.isEngineSound,
      confidence: analysis.confidence,
      pattern: analysis.pattern,
      report: analysis.report,
      recommendations: analysis.recommendations,
      audioFeatures: features,
    });
  } catch (error) {
    console.error('Sound analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
