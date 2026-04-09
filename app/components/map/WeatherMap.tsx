'use client'

import dynamic from 'next/dynamic'
import type { WeatherData } from '@/types'

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/50 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(29,78,216,0.78)_46%,rgba(125,211,252,0.5)_100%)]">
      <div className="absolute left-[8%] top-[12%] h-36 w-36 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="absolute right-[10%] bottom-[14%] h-40 w-40 rounded-full bg-indigo-300/15 blur-3xl" />
      <div className="relative text-center text-white/85">
        <p className="text-lg font-semibold">态势图加载中</p>
        <p className="mt-2 text-sm text-white/60">正在整理城市分布和天气重点</p>
      </div>
    </div>
  ),
})

interface WeatherMapProps {
  weatherData: WeatherData[]
  originCity?: string
  selectedCity?: string | null
  onSelectCity?: (cityName: string) => void
  className?: string
}

export default function WeatherMap({ weatherData, originCity, selectedCity, onSelectCity, className }: WeatherMapProps) {
  return (
    <MapInner
      weatherData={weatherData}
      originCity={originCity}
      selectedCity={selectedCity}
      onSelectCity={onSelectCity}
      className={className}
    />
  )
}
