'use client';

import React from 'react';
import { Share2 } from 'lucide-react';

interface Props {
  title: string;
  price: number;
  year?: number;
  city?: string;
  carUrl?: string;
  className?: string;
}

export default function WhatsAppShareButton({ title, price, year, city, carUrl, className = '' }: Props) {
  const handleShare = () => {
    const url = carUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const message = `🚗 *إعلان سيارة مميز على JO Cars الأردن* 🇯🇴\n\n📌 *${title}*\n💰 *السعر:* ${price.toLocaleString()} دينار أردني\n📅 *الموديل:* ${year || ''}\n📍 *الموقع:* ${city || 'الأردن'}\n\n👇 للمزيد من التفاصيل والصور والتواصل مع البائع:\n${url}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/20 text-sm ${className}`}
    >
      <Share2 className="w-4 h-4" />
      <span>مشاركة عبر الواتساب</span>
    </button>
  );
}
