'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, Trash2, Upload, Clock, Activity, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EngineSoundRecorderProps {
  carId: string;
  onRecordingComplete?: (recording: any) => void;
  onAnalysisComplete?: (analysis: any) => void;
}

type RecorderState = 'idle' | 'recording' | 'paused' | 'review' | 'uploading' | 'analyzing' | 'completed' | 'error';

export function EngineSoundRecorder({ 
  carId, 
  onRecordingComplete,
  onAnalysisComplete 
}: EngineSoundRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(17, 24, 39, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = state === 'recording' ? '#ef4444' : '#3b82f6';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, [state]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100);
      setState('recording');
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      drawWaveform();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('يرجى السماح بالوصول إلى الميكروفون');
      setState('error');
    }
  }, [drawWaveform]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState('review');
  }, []);

  const discardRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
    setError(null);
  }, []);

  const uploadRecording = useCallback(async () => {
    if (!audioBlob) return;

    setState('uploading');
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `engine-sound-${Date.now()}.webm`);
      formData.append('duration', duration.toString());

      const uploadRes = await fetch(`/api/cars/${carId}/sounds`, {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'فشل رفع التسجيل');
      }

      const recording = uploadData.data;
      onRecordingComplete?.(recording);

      setState('analyzing');

      const analyzeRes = await fetch(`/api/cars/${carId}/sounds/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId: recording.id })
      });

      const analyzeData = await analyzeRes.json();
      
      if (!analyzeData.success) {
        throw new Error(analyzeData.error || 'فشل تحليل الصوت');
      }

      onAnalysisComplete?.(analyzeData.data);
      setState('completed');
    } catch (err) {
      console.error('Error uploading/analyzing:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setState('error');
    } finally {
      setAnalyzing(false);
    }
  }, [audioBlob, duration, carId, onRecordingComplete, onAnalysisComplete]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">صوت المحرّك</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">سجّل صوت المحرّك وحلّله بالذكاء الاصطناعي</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-8"
          >
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              اقترب من المحرّك واضغط لبدء التسجيل
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              يُفضل تسجيل 10-30 ثانية أثناء تشغيل المحرّك
            </p>
            <button
              onClick={startRecording}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                <span>ابدأ التسجيل</span>
              </div>
            </button>
          </motion.div>
        )}

        {state === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-8"
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-red-500/20"
              />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Activity className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="mb-4">
              <div className="text-4xl font-mono font-bold text-red-500 mb-2">
                {formatDuration(duration)}
              </div>
              <p className="text-gray-500 dark:text-gray-400">جاري التسجيل...</p>
            </div>

            <canvas
              ref={canvasRef}
              width={300}
              height={80}
              className="mx-auto mb-6 rounded-xl"
            />

            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-lg hover:shadow-lg transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Square className="w-5 h-5" />
                <span>إيقاف التسجيل</span>
              </div>
            </button>
          </motion.div>
        )}

        {state === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-6"
          >
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayback}
                    className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 mr-0.5" />}
                  </button>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">التسجيل</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(duration)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={discardRecording}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={discardRecording}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                حذف وإعادة التسجيل
              </button>
              <button
                onClick={uploadRecording}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>تحليل بالذكاء الاصطناعي</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {(state === 'uploading' || state === 'analyzing') && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <div className="w-full h-full rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-500" />
            </motion.div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {state === 'uploading' ? 'جاري رفع التسجيل...' : 'جاري تحليل الصوت...'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {state === 'analyzing' 
                ? 'الذكاء الاصطناعي يحلل أصوات المحرّك' 
                : 'يرجى الانتظار'}
            </p>
          </motion.div>
        )}

        {state === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              تم التحليل بنجاح!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              يمكنك الآن الاطلاع على نتائج التحليل أدناه
            </p>
            <button
              onClick={() => {
                setState('idle');
                setDuration(0);
                setAudioBlob(null);
                setAudioUrl(null);
              }}
              className="px-6 py-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              تسجيل جديد
            </button>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              حدث خطأ
            </p>
            <p className="text-sm text-red-500 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => {
                setState('idle');
                setError(null);
                setDuration(0);
              }}
              className="px-6 py-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              حاول مرة أخرى
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
