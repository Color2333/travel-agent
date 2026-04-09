'use client';

import { Train, Car, Droplets, Wind, MapPin } from 'lucide-react';
import { WEATHER_CONDITION_MAP, type City, type WeatherData } from '@/types';

interface CityCardProps {
  city: City;
  weather?: WeatherData;
  onClick?: () => void;
  isHighlighted?: boolean;
  rank?: number;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score > 70 ? 'from-emerald-400 to-emerald-500' :
    score >= 40 ? 'from-amber-400 to-amber-500' :
    'from-red-400 to-red-500';
  const bg =
    score > 70 ? 'text-emerald-700 bg-emerald-50' :
    score >= 40 ? 'text-amber-700 bg-amber-50' :
    'text-red-700 bg-red-50';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">出行评分</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${bg}`}>
          {score}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function TransportRow({
  icon,
  label,
  time,
  price,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
  price?: string;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${accentClass}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-gray-700 tabular-nums">{time}</span>
          {price && (
            <span className="text-[10px] text-gray-400 tabular-nums truncate">{price}</span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 leading-none">{label}</span>
      </div>
    </div>
  );
}

export default function CityCard({ city, weather, onClick, isHighlighted, rank }: CityCardProps) {
  const conditionInfo = weather ? WEATHER_CONDITION_MAP[weather.weather] : null;
  const weatherIcon = conditionInfo?.icon ?? '🌡️';
  const weatherLabel = weather?.weatherText || conditionInfo?.label || '';

  const hasTransport = city.trainTime || city.driveTime || city.distance;

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`
        group relative w-full overflow-hidden rounded-2xl border bg-white text-left
        transition-all duration-300 ease-out
        ${isHighlighted
          ? 'border-primary-200 ring-2 ring-primary-400 ring-offset-2 ring-offset-blue-50/50 shadow-md shadow-primary-100'
          : 'border-gray-200/80 hover:border-gray-300'
        }
        ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60' : ''}
      `}
    >
      {/* Top gradient accent for highlighted cards */}
      {isHighlighted && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-500" />
      )}

      {/* Rank badge */}
      {isHighlighted && rank && rank <= 3 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-semibold shadow-sm">
            <span>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
            <span>No.{rank}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* City name + weather icon */}
        <div className="flex items-start gap-2.5 mb-3">
          <span className="text-2xl leading-none mt-0.5">{weatherIcon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-gray-900 leading-tight truncate">{city.name}</h3>
              {city.province && (
                <span className="hidden sm:inline-block text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full truncate max-w-[5rem]">
                  {city.province.replace('省', '').replace('自治区', '').replace('壮族', '')}
                </span>
              )}
            </div>
            {weather && (
              <p className="text-xs text-gray-500 mt-0.5">{weatherLabel}</p>
            )}
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-baseline gap-1 mb-3">
          {weather ? (
            <>
              <span className="tabular-nums text-2xl font-bold text-gray-900">{weather.tempHigh}°</span>
              <span className="text-gray-300">/</span>
              <span className="tabular-nums text-base text-gray-500">{weather.tempLow}°</span>
              <span className="text-xs text-gray-400 ml-1">C</span>
            </>
          ) : (
            <span className="text-gray-400 text-sm">暂无天气数据</span>
          )}
        </div>

        {/* Weather stats */}
        {weather && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-xs">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="tabular-nums font-medium text-blue-700">{weather.rainProbability}%</span>
            </div>
            {weather.windSpeed > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-xs">
                <Wind className="w-3 h-3 text-gray-400" />
                <span className="tabular-nums font-medium text-gray-600">{weather.windSpeed}级</span>
              </div>
            )}
            {city.distance && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-xs ml-auto">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="tabular-nums font-medium text-gray-600">{city.distance}km</span>
              </div>
            )}
          </div>
        )}

        {/* Score bar */}
        {weather && <ScoreBar score={weather.score} />}

        {/* Transport section */}
        {hasTransport && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              {city.trainTime && (
                <TransportRow
                  icon={<Train className="w-3.5 h-3.5 text-blue-600" />}
                  label="高铁"
                  time={city.trainTime}
                  price={city.trainPrice}
                  accentClass="bg-blue-50"
                />
              )}
              {city.driveTime && (
                <TransportRow
                  icon={<Car className="w-3.5 h-3.5 text-orange-600" />}
                  label="自驾"
                  time={city.driveTime}
                  price={city.drivePrice}
                  accentClass="bg-orange-50"
                />
              )}
            </div>

            {/* Distance bar */}
            {city.distance && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-300 to-blue-400 rounded-full"
                    style={{ width: `${Math.min(100, (city.distance / 1000) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 tabular-nums flex-shrink-0">1000km</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
