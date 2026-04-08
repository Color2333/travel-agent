'use client'

import dynamic from 'next/dynamic'
import type { WeatherData } from '@/types'

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100">
      <div className="text-center text-gray-500">
        <p>地图加载中...</p>
      </div>
    </div>
  ),
})

interface WeatherMapProps {
  weatherData: WeatherData[]
  originCity?: string
  className?: string
}

export default function WeatherMap({ weatherData, originCity, className }: WeatherMapProps) {
  return <MapInner weatherData={weatherData} originCity={originCity} className={className} />
}
