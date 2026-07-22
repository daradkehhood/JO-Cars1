'use client'

import dynamic from 'next/dynamic'

const BugattiExperience = dynamic(() => import('@/components/bugatti/BugattiExperience'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm tracking-[0.3em] uppercase">Loading Experience</p>
      </div>
    </div>
  )
})

export default function BugattiPage() {
  return <BugattiExperience />
}