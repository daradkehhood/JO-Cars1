'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, Clock, User, Calendar,
  CheckCircle, AlertTriangle, XCircle, Info,
  ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface SoundAnalysis {
  id: string;
  overallScore: number;
  engineHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  engineScore: number;
  transmissionScore: number | null;
  exhaustScore: number | null;
  beltScore: number | null;
  bearingScore: number | null;
  anomalyScore: number;
  anomalyDetected: boolean;
  anomalyDetails: string | null;
  estimatedRepairCost: number | null;
  diagnosis: string;
  recommendations: string;
  comparisonResult: string | null;
  referenceMatch: string | null;
  analyzedAt: string;
}

interface SoundRecording {
  id: string;
  url: string;
  duration: number;
  status: string;
  createdAt: string;
  analysis: SoundAnalysis | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface SoundAnalysisPlayerProps {
  recording: SoundRecording;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

const healthConfig = {
  excellent: { color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/10', icon: CheckCircle, label: 'ممتاز' },
  good: { color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10', icon: CheckCircle, label: 'جيد' },
  fair: { color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/10', icon: AlertTriangle, label: 'مقبول' },
  poor: { color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10', icon: AlertTriangle, label: 'ضعيف' },
  critical: { color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10', icon: XCircle, label: 'حرج' },
};

export function SoundAnalysisPlayer({ recording, onDelete, isOwner }: SoundAnalysisPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const analysis = recording.analysis;
  const health = analysis ? healthConfig[analysis.engineHealth] : null;

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
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isPlaying 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-0.5" />}
            </button>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">صوت المحرّك</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(recording.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {recording.user.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(recording.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(recording.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <audio
          ref={audioRef}
          src={recording.url}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>

      {analysis && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", health?.bg)}>
                <span className={cn("text-2xl font-bold", health?.color)}>
                  {analysis.overallScore}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">التقييم العام</p>
                <p className={cn("font-bold", health?.color)}>{health?.label}</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
            >
              <span>{showDetails ? 'إخفاء' : 'التفاصيل'}</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <ScoreBar label="المحرّك" score={analysis.engineScore} />
            {analysis.transmissionScore !== null && (
              <ScoreBar label="ناقل الحركة" score={analysis.transmissionScore} />
            )}
            {analysis.exhaustScore !== null && (
              <ScoreBar label="العادم" score={analysis.exhaustScore} />
            )}
            {analysis.beltScore !== null && (
              <ScoreBar label="الحزام" score={analysis.beltScore} />
            )}
            {analysis.bearingScore !== null && (
              <ScoreBar label="المحامل" score={analysis.bearingScore} />
            )}
          </div>

          {analysis.anomalyDetected && (
            <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">تم اكتشاف شذوذ</p>
                  {analysis.anomalyDetails && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{analysis.anomalyDetails}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      التشخيص
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {analysis.diagnosis}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">التوصيات</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {analysis.recommendations}
                    </p>
                  </div>

                  {analysis.comparisonResult && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {analysis.comparisonResult}
                      </p>
                    </div>
                  )}

                  {analysis.estimatedRepairCost !== null && analysis.estimatedRepairCost > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">تكلفة الإصلاح المقدرة</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {analysis.estimatedRepairCost} د.أ
                      </p>
                    </div>
                  )}

                  {analysis.referenceMatch && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      <p>المقارنة مع: {analysis.referenceMatch}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {recording.status === 'analyzing' && (
        <div className="p-4">
          <div className="flex items-center gap-3 text-blue-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="text-sm">جاري التحليل...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className={cn("text-xs font-medium", getScoreColor(score))}>{score}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn("h-full rounded-full", getBarColor(score))}
        />
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}
