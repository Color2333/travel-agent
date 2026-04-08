'use client';

import { Train, Droplets, Gauge } from 'lucide-react';
import { WEATHER_CONDITION_MAP, type City, type WeatherData } from '@/types';

interface CityCardProps {
  city: City;
  weather?: WeatherData;
  onClick?: () => void;
  isHighlighted?: boolean;
  rank?: number;
}

export default function CityCard({ city, weather, onClick, isHighlighted, rank }: CityCardProps) {
  const weatherIcon = weather ? WEATHER_CONDITION_MAP[weather.weather]?.icon : '🌡️';
  const weatherLabel = weather ? WEATHER_CONDITION_MAP[weather.weather]?.label : '';

  const getScoreColor = () => {
    if (!weather) return 'bg-gray-400';
    if (weather.score > 70) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (weather.score >= 40) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getScoreBgColor = () => {
    if (!weather) return 'bg-gray-50';
    if (weather.score > 70) return 'bg-green-50 text-green-700';
    if (weather.score >= 40) return 'bg-yellow-50 text-yellow-700';
    return 'bg-red-50 text-red-700';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`
        group relative w-full overflow-hidden rounded-2xl border bg-white text-left
        transition-all duration-300 ease-out
        ${isHighlighted ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-blue-50/50' : 'border-gray-200/80'}
        ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-100' : ''}
      `}
    >
      {isHighlighted && rank && rank <= 3 && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500 text-white text-xs font-medium shadow-md">
            <span>⭐</span>
            <span>推荐</span>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-[28px] leading-none">{weatherIcon}</span>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">{city.name}</h3>
              {weather && <p className="text-xs text-gray-500 mt-0.5">{weatherLabel}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-3">
          {weather ? (
            <>
              <span className="tabular-nums text-2xl sm:text-[28px] font-bold text-gray-900">
                {weather.tempHigh}°
              </span>
              <span className="text-gray-300 text-lg">/</span>
              <span className="tabular-nums text-lg sm:text-xl text-gray-500">{weather.tempLow}°</span>
            </>
          ) : (
            <span className="text-gray-400 text-sm">暂无天气数据</span>
          )}
        </div>

        {weather && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-xs">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              <span className="tabular-nums font-medium text-blue-700">{weather.rainProbability}%</span>
            </div>
            {weather.humidity !== undefined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs">
                <Gauge className="w-3.5 h-3.5 text-gray-500" />
                <span className="tabular-nums font-medium text-gray-600">{weather.humidity}%</span>
              </div>
            )}
          </div>
        )}

        {weather && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${getScoreColor()}`} />
              <span className="text-xs text-gray-500">出行评分</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getScoreBgColor()}`}>
                {weather.score}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getScoreColor()}`}
                style={{ width: `${weather.score}%` }}
              />
            </div>
          </div>
        )}

        {(city.distance || city.trainTime) && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {city.trainTime && (
              <div className="flex items-center gap-1.5">
                <Train className="w-3.5 h-3.5 text-gray-400" />
                <span>{city.trainTime}</span>
              </div>
            )}
            {city.driveTime && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">🚗</span>
                <span>{city.driveTime}</span>
              </div>
            )}
            {city.distance && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">📍</span>
                <span className="tabular-nums">{city.distance}km</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/5 to-transparent pointer-events-none" />
      )}
    </button>
  );
}
