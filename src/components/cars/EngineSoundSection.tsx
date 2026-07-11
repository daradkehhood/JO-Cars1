'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Plus, X } from 'lucide-react';
import { EngineSoundRecorder } from './EngineSoundRecorder';
import { SoundAnalysisPlayer } from './SoundAnalysisPlayer';
import { cn } from '@/lib/utils';

interface SoundRecording {
  id: string;
  url: string;
  duration: number;
  status: string;
  createdAt: string;
  analysis: any | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface EngineSoundSectionProps {
  carId: string;
  carOwnerId: string;
  currentUserId?: string;
}

export function EngineSoundSection({ carId, carOwnerId, currentUserId }: EngineSoundSectionProps) {
  const isOwner = currentUserId === carOwnerId;
  const [recordings, setRecordings] = useState<SoundRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);

  useEffect(() => {
    fetchRecordings();
  }, [carId]);

  const fetchRecordings = async () => {
    try {
      const res = await fetch(`/api/cars/${carId}/sounds`);
      const data = await res.json();
      if (data.success) {
        setRecordings(data.data);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = (recording: SoundRecording) => {
    setRecordings(prev => [recording, ...prev]);
    setShowRecorder(false);
  };

  const handleAnalysisComplete = (analysis: any) => {
    setRecordings(prev => prev.map(r => 
      r.id === analysis.recordingId 
        ? { ...r, analysis, status: 'completed' }
        : r
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التسجيل؟')) return;

    try {
      const res = await fetch(`/api/cars/${carId}/sounds/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setRecordings(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">تحليل صوت المحرّك</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {recordings.length > 0 
                ? `${recordings.length} تسجيل متاح`
                : 'سجّل صوت المحرّك لتحليله'}
            </p>
          </div>
        </div>
        
        {!showRecorder && isOwner && (
          <button
            onClick={() => setShowRecorder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل جديد</span>
          </button>
        )}
      </div>

      {showRecorder && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <EngineSoundRecorder
            carId={carId}
            onRecordingComplete={handleRecordingComplete}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </motion.div>
      )}

      {!loading && recordings.length === 0 && !showRecorder && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isOwner 
              ? 'لا توجد تسجيلات بعد'
              : 'صاحب الإعلان لم يسجل صوت المحرّك بعد'}
          </p>
          {isOwner && (
            <button
              onClick={() => setShowRecorder(true)}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              سجّل أول تسجيل
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {recordings.map((recording) => (
          <SoundAnalysisPlayer
            key={recording.id}
            recording={recording}
            onDelete={isOwner ? handleDelete : undefined}
            isOwner={isOwner}
          />
        ))}
      </div>
    </div>
  );
}
