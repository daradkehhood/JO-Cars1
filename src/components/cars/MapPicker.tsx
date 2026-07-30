'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, Crosshair, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type L from 'leaflet';

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

const DEFAULT_LAT = 31.963;
const DEFAULT_LNG = 35.93;

export function MapPicker({ lat, lng, onChange, className }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullMap, setShowFullMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const currentLat = selectedPos?.lat ?? DEFAULT_LAT;
  const currentLng = selectedPos?.lng ?? DEFAULT_LNG;

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      const leaflet = await import('leaflet');

      // Fix default marker icon paths for bundled builds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = leaflet.map(mapContainerRef.current!, {
        center: [currentLat, currentLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      leaflet.control.zoom({ position: 'topright' }).addTo(map);

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add initial marker if position exists
      if (lat && lng) {
        const initMarker = leaflet.marker([lat, lng], { draggable: true }).addTo(map);
        initMarker.on('dragend', () => {
          const pos = initMarker.getLatLng();
          setSelectedPos({ lat: pos.lat, lng: pos.lng });
          onChange(pos.lat, pos.lng);
        });
        markerRef.current = initMarker;
      }

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          const clickMarker = leaflet.marker(e.latlng, { draggable: true }).addTo(map);
          clickMarker.on('dragend', () => {
            const pos = clickMarker.getLatLng();
            setSelectedPos({ lat: pos.lat, lng: pos.lng });
            onChange(pos.lat, pos.lng);
          });
          markerRef.current = clickMarker;
        }
        setSelectedPos({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
      });

      mapRef.current = map;
      setMapReady(true);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map center when showFullMap changes
  useEffect(() => {
    if (mapRef.current && mapReady) {
      mapRef.current.invalidateSize();
    }
  }, [showFullMap, mapReady]);

  // Update marker position from external state
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (lat && lng) {
      setSelectedPos({ lat, lng });
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      mapRef.current.setView([lat, lng], 14);
    }
  }, [lat, lng, mapReady]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setSelectedPos({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 14);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const L = require('leaflet') as any;
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          } else {
            const m = L.marker([newLat, newLng], { draggable: true }).addTo(mapRef.current);
            m.on('dragend', () => {
              const p = m.getLatLng();
              setSelectedPos({ lat: p.lat, lng: p.lng });
              onChange(p.lat, p.lng);
            });
            markerRef.current = m;
          }
        }
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
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setSelectedPos({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 14);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const L = require('leaflet') as any;
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          } else {
            const m = L.marker([newLat, newLng], { draggable: true }).addTo(mapRef.current);
            m.on('dragend', () => {
              const p = m.getLatLng();
              setSelectedPos({ lat: p.lat, lng: p.lng });
              onChange(p.lat, p.lng);
            });
            markerRef.current = m;
          }
        }
      }
    } catch {}
    setLoading(false);
  }, [searchQuery, onChange]);

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
        className={cn(
          'relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800',
          showFullMap ? 'h-80' : 'h-48'
        )}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full"
        />

        {/* Coordinates Badge */}
        {selectedPos && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg z-[1000] backdrop-blur-sm">
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
              if (markerRef.current && mapRef.current) {
                mapRef.current.removeLayer(markerRef.current);
                markerRef.current = null;
              }
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
                setSelectedPos(p => ({ ...p, lat: v, lng: p?.lng ?? DEFAULT_LNG }));
                onChange(v, selectedPos?.lng ?? DEFAULT_LNG);
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
                setSelectedPos(p => ({ ...p, lat: p?.lat ?? DEFAULT_LAT, lng: v }));
                onChange(selectedPos?.lat ?? DEFAULT_LAT, v);
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
