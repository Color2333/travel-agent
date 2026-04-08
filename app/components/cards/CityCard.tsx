'use client'

import { WEATHER_CONDITION_MAP, type City, type WeatherData } from '@/types'

interface CityCardProps {
  city: City
  weather?: WeatherData
  onClick?: () => void
  isHighlighted?: boolean
}

export default function CityCard({ city, weather, onClick, isHighlighted }: CityCardProps) {
  const weatherIcon = weather ? WEATHER_CONDITION_MAP[weather.weather]?.icon : '🌡️'
  const weatherLabel = weather ? WEATHER_CONDITION_MAP[weather.weather]?.label : ''

  const getBorderColor = () => {
    if (!weather) return 'border-gray-200'
    if (weather.score > 70) return 'border-green-500'
    if (weather.score >= 40) return 'border-yellow-500'
    return 'border-red-500'
  }

  const getScoreIndicator = () => {
    if (!weather) return null
    const score = weather.score
    const colorClass =
      score > 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
    return (
      <div className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${colorClass}`} />
        <span className="text-xs text-gray-500">评分 {score}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`
        relative w-full overflow-hidden rounded-2xl border bg-white/80 p-4 text-left backdrop-blur-sm
        transition-all duration-200
        ${getBorderColor()}
        ${isHighlighted ? 'ring-2 ring-primary-500' : ''}
        ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''}
      `}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{weatherIcon}</span>
          <h3 className="font-bold text-lg">{city.name}</h3>
        </div>
        {weather && <div className="text-xs text-gray-500">{weatherLabel}</div>}
      </div>

      <div className="mb-3 flex items-baseline gap-1">
        {weather ? (
          <>
            <span className="tabular-nums text-xl font-semibold">
              {weather.tempHigh}°
            </span>
            <span className="text-gray-400">/</span>
            <span className="tabular-nums text-lg text-gray-500">{weather.tempLow}°</span>
          </>
        ) : (
          <span className="text-gray-400">暂无天气数据</span>
        )}
      </div>

      {weather && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs">
            <span className="text-blue-600">💧</span>
            <span className="tabular-nums text-blue-700">{weather.rainProbability}%</span>
          </div>
          {getScoreIndicator()}
        </div>
      )}

      {(city.distance || city.trainTime) && (
        <div className="flex flex-wrap gap-2 pt-2 text-xs text-gray-500">
          {city.distance && (
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span className="tabular-nums">{city.distance}km</span>
            </div>
          )}
          {city.trainTime && (
            <div className="flex items-center gap-1">
              <span>🚄</span>
              <span>{city.trainTime}</span>
            </div>
          )}
          {city.driveTime && (
            <div className="flex items-center gap-1">
              <span>🚗</span>
              <span>{city.driveTime}</span>
            </div>
          )}
        </div>
      )}
    </button>
  )
}
