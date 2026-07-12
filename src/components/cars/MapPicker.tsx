'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, Navigation, Crosshair, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export function MapPicker({ lat, lng, onChange, className }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullMap, setShowFullMap] = useState(false);

  useEffect(() => {
    if (lat && lng) setSelectedPos({ lat, lng });
  }, [lat, lng]);

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const currentLat = selectedPos?.lat ?? 31.963;
    const currentLng = selectedPos?.lng ?? 35.930;
    const zoom = 14;

    const latDelta = ((y - centerY) / rect.height) * (0.02 / Math.pow(2, zoom - 14));
    const lngDelta = ((x - centerX) / rect.width) * (0.02 / Math.pow(2, zoom - 14));

    const newLat = currentLat - latDelta;
    const newLng = currentLng + lngDelta;

    setSelectedPos({ lat: newLat, lng: newLng });
    onChange(newLat, newLng);
  }, [selectedPos, onChange]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setSelectedPos({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
        setLoading(false);
      },
      () => {
        setLoading(false);
        alert('فشل تحديد الموقع. تأكد من تفعيل خدمات الموقع.');
      }
    );
  }, [onChange]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Jordan')}&limit=1`,
        { headers: { 'User-Agent': 'JOCars/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat: newLat, lon: newLng } = data[0];
        setSelectedPos({ lat: parseFloat(newLat), lng: parseFloat(newLng) });
        onChange(parseFloat(newLat), parseFloat(newLng));
      }
    } catch {}
    setLoading(false);
  }, [searchQuery, onChange]);

  const currentLat = selectedPos?.lat ?? 31.963;
  const currentLng = selectedPos?.lng ?? 35.930;
  const zoom = showFullMap ? 13 : 14;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="ابحث عن موقع (مثال: عمان، دبي)"
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          بحث
        </button>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <Crosshair className={cn('w-4 h-4', loading && 'animate-spin')} />
          موقعي
        </button>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className={cn(
          'relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-crosshair bg-gray-100 dark:bg-gray-800',
          showFullMap ? 'h-80' : 'h-48'
        )}
      >
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - 0.015}%2C${currentLat - 0.01}%2C${currentLng + 0.015}%2C${currentLat + 0.01}&layer=mapnik&marker=${currentLat}%2C${currentLng}`}
          className="w-full h-full border-0 pointer-events-none"
          loading="lazy"
          title="خريطة الموقع"
        />

        {/* Center Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10">
          <div className="relative">
            <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" fill="currentColor" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/20 rounded-full blur-sm" />
          </div>
        </div>

        {/* Coordinates Badge */}
        {selectedPos && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg z-10 backdrop-blur-sm">
            {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFullMap(!showFullMap)}
          className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <MapPin className="w-4 h-4" />
          {showFullMap ? 'تصغير الخريطة' : 'توسيع الخريطة'}
        </button>
        {selectedPos && (
          <button
            type="button"
            onClick={() => {
              setSelectedPos(null);
              onChange(0, 0);
            }}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            حذف الموقع
          </button>
        )}
      </div>

      {/* Manual Input (Optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">خط العرض (اختياري)</label>
          <input
            type="number"
            step="any"
            value={selectedPos?.lat?.toFixed(6) ?? ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) {
                setSelectedPos(p => ({ ...p, lat: v, lng: p?.lng ?? 35.93 }));
                onChange(v, selectedPos?.lng ?? 35.93);
              }
            }}
            placeholder="31.963"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">خط الطول (اختياري)</label>
          <input
            type="number"
            step="any"
            value={selectedPos?.lng?.toFixed(6) ?? ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) {
                setSelectedPos(p => ({ ...p, lat: p?.lat ?? 31.963, lng: v }));
                onChange(selectedPos?.lat ?? 31.963, v);
              }
            }}
            placeholder="35.930"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        اضغط على الخريطة لتحديد الموقع، أو استخدم زر &quot;موقعي&quot; لتحديد موقعك الحالي
      </p>
    </div>
  );
}
