'use client'

import { CITY_DATABASE } from '@/lib/cities/data'
import { WEATHER_CONDITION_MAP, type WeatherData } from '@/types'
import CityCard from './CityCard'

interface CityCardGridProps {
  weatherData: WeatherData[]
  onCityClick?: (cityName: string) => void
}

export default function CityCardGrid({ weatherData, onCityClick }: CityCardGridProps) {
  const sortedWeatherData = [...weatherData].sort((a, b) => b.score - a.score)

  if (sortedWeatherData.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-gray-50">
        <p className="text-gray-500">开始对话查询天气吧</p>
      </div>
    )
  }

  const getCityFromDatabase = (cityName: string) => {
    const direct = CITY_DATABASE[cityName]
    if (direct) {
      return { name: direct.name, lat: direct.lat, lng: direct.lng }
    }
    for (const city of Object.values(CITY_DATABASE)) {
      const nearby = city.nearby.find((n) => n.name === cityName)
      if (nearby) {
        return nearby
      }
    }
    return { name: cityName, lat: 31.2304, lng: 121.4737 }
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">找到 {sortedWeatherData.length} 个城市</div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {sortedWeatherData.map((data, index) => {
          const city = getCityFromDatabase(data.city)
          const weather: WeatherData = {
            ...data,
            weatherIcon: WEATHER_CONDITION_MAP[data.weather]?.icon,
            weatherText: WEATHER_CONDITION_MAP[data.weather]?.label,
          }
          return (
            <CityCard
              key={data.city}
              city={city}
              weather={weather}
              onClick={() => onCityClick?.(data.city)}
              isHighlighted={index < 3}
            />
          )
        })}
      </div>
    </div>
  )
}
