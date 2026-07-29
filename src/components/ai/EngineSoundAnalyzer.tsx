'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Mic, Square, Upload, Loader2, Volume2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SoundAnalysis {
  isEngineSound: boolean;
  confidence: number;
  pattern: {
    id: string;
    nameAr: string;
    category: 'normal' | 'warning' | 'critical';
    description: string;
    possibleCauses: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedCost: string;
    recommendation: string;
  };
  report: string;
  recommendations: string[];
  audioFeatures?: {
    dominantFrequency: number;
    averageRms: number;
    peakFrequency: number;
    spectralCentroid: number;
    zeroCrossingRate: number;
    duration: number;
  };
}

interface EngineSoundAnalyzerProps {
  onAnalysisComplete?: (analysis: SoundAnalysis) => void;
  onError?: (error: string) => void;
  carInfo?: { brand?: string; model?: string; year?: number; kilometers?: number };
}

export default function EngineSoundAnalyzer({
  onAnalysisComplete,
  onError,
  carInfo,
}: EngineSoundAnalyzerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SoundAnalysis | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const analyzeAudioBuffer = useCallback(
    async (audioBuffer: AudioBuffer): Promise<SoundAnalysis> => {
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;

      // Extract audio features
      const dominantFrequency = extractDominantFrequency(channelData, sampleRate);
      const averageRms = calculateRMS(channelData);
      const peakFrequency = extractPeakFrequency(channelData, sampleRate);
      const zeroCrossingRate = calculateZeroCrossingRate(channelData);
      const spectralCentroid = calculateSpectralCentroid(channelData, sampleRate);

      const features = {
        dominantFrequency,
        averageRms,
        peakFrequency,
        spectralCentroid,
        zeroCrossingRate,
        duration,
      };

      // Send to API for pattern matching
      const response = await fetch('/api/ai/sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, carInfo }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحليل الصوت');
      }

      const result = await response.json();
      return { ...result, audioFeatures: features };
    },
    [carInfo]
  );

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAnalysis(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Set up Web Audio API for real-time analysis
      audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // MediaRecorder for capturing audio
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordingDuration < 1) {
          setError('التسجيل قصير جداً. سجّل لمدة ثانيتين على الأقل.');
          return;
        }
        await processRecording();
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start real-time audio level monitoring
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255);
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في الوصول للميكروفون';
      setError(msg);
      onError?.(msg);
    }
  }, [recordingDuration, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const processRecording = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const result = await analyzeAudioBuffer(audioBuffer);
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تحليل الصوت';
      setError(msg);
      onError?.(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeAudioBuffer, onAnalysisComplete, onError]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('audio/')) {
        setError('يرجى اختيار ملف صوتي');
        return;
      }

      setError(null);
      setAnalysis(null);
      setIsAnalyzing(true);

      try {
        const arrayBuffer = await file.arrayBuffer();

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 44100 });
        }

        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        const result = await analyzeAudioBuffer(audioBuffer);
        setAnalysis(result);
        onAnalysisComplete?.(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'فشل في تحليل الملف الصوتي';
        setError(msg);
        onError?.(msg);
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [analyzeAudioBuffer, onAnalysisComplete, onError]
  );

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'normal':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Volume2 className="w-4 h-4" />
        <span>تحليل صوت المحرك</span>
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-muted/30">
        {isRecording && (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full bg-red-500 animate-pulse"
            />
            <span className="text-sm font-mono">
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Audio Level Meter */}
        {isRecording && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
              style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
            />
          </div>
        )}

        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              <Mic className="w-4 h-4 ml-2" />
              سجّل صوت المحرك
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="danger"
              size="sm"
            >
              <Square className="w-4 h-4 ml-2" />
              إيقاف التسجيل
            </Button>
          )}

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isAnalyzing}
            variant="outline"
            size="sm"
          >
            <Upload className="w-4 h-4 ml-2" />
            رفع ملف صوتي
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground text-center">
          سجّل صوت المحرك لمدة 3-10 ثوانٍ أثناء العمل أو ارفع ملف MP3/WAV
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Analyzing */}
      {isAnalyzing && (
        <div className="flex items-center justify-center gap-2 p-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">جاري تحليل الصوت...</span>
        </div>
      )}

      {/* Results */}
      {analysis && !isAnalyzing && (
        <div className="space-y-3">
          {!analysis.isEngineSound ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">الصوت ليس صوت محرك</span>
              </div>
              <p className="text-sm text-yellow-700 whitespace-pre-line">{analysis.report}</p>
            </div>
          ) : (
            <>
              {/* Pattern Card */}
              <div className={`p-4 border rounded-lg ${categoryColor(analysis.pattern.category)}`}>
                <div className="flex items-center gap-2 mb-2">
                  {categoryIcon(analysis.pattern.category)}
                  <span className="font-medium">{analysis.pattern.nameAr}</span>
                  <span className="text-xs opacity-70">
                    (ثقة: {Math.round(analysis.confidence * 100)}%)
                  </span>
                </div>
                <p className="text-sm mb-2">{analysis.pattern.description}</p>
                <div className="text-xs opacity-70">
                  التكلفة التقديرية: {analysis.pattern.estimatedCost}
                </div>
              </div>

              {/* Possible Causes */}
              <div className="p-3 border rounded-lg bg-white/50">
                <h4 className="text-sm font-medium mb-2">الأسباب المحتملة:</h4>
                <ul className="text-sm space-y-1">
                  {analysis.pattern.possibleCauses.map((cause, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="p-3 border rounded-lg bg-blue-50 text-blue-800">
                <h4 className="text-sm font-medium mb-1">التوصية:</h4>
                <p className="text-sm">{analysis.pattern.recommendation}</p>
              </div>

              {/* Audio Features (debug info) */}
              {analysis.audioFeatures && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    معلومات التحليل الصوتي
                  </summary>
                  <div className="mt-2 p-2 bg-muted rounded font-mono text-[10px] space-y-1">
                    <div>التردد السائد: {analysis.audioFeatures.dominantFrequency.toFixed(1)} Hz</div>
                    <div>التردد الذروي: {analysis.audioFeatures.peakFrequency.toFixed(1)} Hz</div>
                    <div>ال:center الطيفي: {analysis.audioFeatures.spectralCentroid.toFixed(1)} Hz</div>
                    <div>متوسط RMS: {analysis.audioFeatures.averageRms.toFixed(4)}</div>
                    <div>معدل العبور الصفري: {analysis.audioFeatures.zeroCrossingRate.toFixed(4)}</div>
                    <div>المدة: {analysis.audioFeatures.duration.toFixed(1)} ثانية</div>
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Audio Feature Extraction Helpers ───

function calculateRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

function calculateZeroCrossingRate(data: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / data.length;
}

function extractDominantFrequency(data: Float32Array, sampleRate: number): number {
  const fftSize = 2048;
  const windowed = applyHanningWindow(data.slice(0, fftSize));
  const fft = realFFT(windowed);
  const magnitudes = fft.map((val) => Math.abs(val));
  const freqResolution = sampleRate / fftSize;

  let maxIndex = 0;
  let maxValue = 0;
  for (let i = 1; i < magnitudes.length / 2; i++) {
    if (magnitudes[i] > maxValue) {
      maxValue = magnitudes[i];
      maxIndex = i;
    }
  }

  return maxIndex * freqResolution;
}

function extractPeakFrequency(data: Float32Array, sampleRate: number): number {
  const fftSize = 2048;
  const windowed = applyHanningWindow(data.slice(0, fftSize));
  const fft = realFFT(windowed);
  const magnitudes = fft.map((val) => Math.abs(val));
  const freqResolution = sampleRate / fftSize;

  // Find peak using parabolic interpolation
  let maxIndex = 0;
  let maxValue = 0;
  for (let i = 2; i < magnitudes.length / 2 - 1; i++) {
    if (magnitudes[i] > maxValue) {
      maxValue = magnitudes[i];
      maxIndex = i;
    }
  }

  // Parabolic interpolation for sub-sample accuracy
  const alpha = magnitudes[maxIndex - 1];
  const beta = magnitudes[maxIndex];
  const gamma = magnitudes[maxIndex + 1];
  const p = (alpha - gamma) / (2 * (alpha - 2 * beta + gamma));
  const interpolatedIndex = maxIndex + (isNaN(p) ? 0 : p);

  return interpolatedIndex * freqResolution;
}

function calculateSpectralCentroid(data: Float32Array, sampleRate: number): number {
  const fftSize = 2048;
  const windowed = applyHanningWindow(data.slice(0, fftSize));
  const fft = realFFT(windowed);
  const magnitudes = fft.map((val) => Math.abs(val));
  const freqResolution = sampleRate / fftSize;

  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 1; i < magnitudes.length / 2; i++) {
    const freq = i * freqResolution;
    weightedSum += freq * magnitudes[i];
    magnitudeSum += magnitudes[i];
  }

  return magnitudeSum === 0 ? 0 : weightedSum / magnitudeSum;
}

function applyHanningWindow(data: Float32Array): Float32Array {
  const n = data.length;
  const windowed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    windowed[i] = data[i] * 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  return windowed;
}

function realFFT(data: Float32Array): Float32Array {
  // Simple DFT for small sizes (real-only input)
  const n = data.length;
  const result = new Float32Array(n);
  for (let k = 0; k < n / 2; k++) {
    let realPart = 0;
    let imagPart = 0;
    for (let t = 0; t < n; t++) {
      const angle = (-2 * Math.PI * k * t) / n;
      realPart += data[t] * Math.cos(angle);
      imagPart += data[t] * Math.sin(angle);
    }
    result[k] = Math.sqrt(realPart * realPart + imagPart * imagPart);
  }
  return result;
}
