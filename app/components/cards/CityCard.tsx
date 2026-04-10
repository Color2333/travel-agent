'use client';

import { Train, Car, Droplets, Wind, MapPin } from 'lucide-react';
import { WEATHER_CONDITION_MAP, type City, type WeatherData } from '@/types';
import { cityCard } from '@/lib/ui/city-card';

interface CityCardProps {
  city: City;
  weather?: WeatherData;
  onClick?: () => void;
  isActive?: boolean;
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

export default function CityCard({ city, weather, onClick, isActive, isHighlighted, rank }: CityCardProps) {
  const conditionInfo = weather ? WEATHER_CONDITION_MAP[weather.weather] : null;
  const weatherIcon = conditionInfo?.icon ?? '🌡️';
  const weatherLabel = weather?.weatherText || conditionInfo?.label || '';

  const hasTransport = city.trainTime || city.driveTime || city.distance;

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cityCard.shell({ isActive, isHighlighted, clickable: Boolean(onClick) })}
    >
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400" />
      )}

      {isHighlighted && !isActive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-white/80 to-sky-200/90" />
      )}

      {isHighlighted && rank && rank <= 3 && (
        <div className="absolute top-3 right-3 z-10">
          <div className={cityCard.badge(isActive ? 'active' : 'default')}>
            <span>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
            <span>No.{rank}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="mb-3 flex items-start gap-2.5">
          <span className="text-2xl leading-none mt-0.5">{weatherIcon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-gray-900 leading-tight truncate">{city.name}</h3>
              {city.province && (
                <span className="hidden max-w-[5rem] truncate rounded-full bg-white/76 px-1.5 py-0.5 text-[10px] text-gray-500 shadow-sm sm:inline-block">
                  {city.province.replace('省', '').replace('自治区', '').replace('壮族', '')}
                </span>
              )}
            </div>
            {weather && (
              <p className="text-xs text-gray-500 mt-0.5">{weatherLabel}</p>
            )}
          </div>
        </div>

        <div className="mb-3 flex items-baseline gap-1">
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

        {weather && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-sky-50/90 px-2.5 py-1 text-xs text-sky-700">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="tabular-nums font-medium text-blue-700">{weather.rainProbability}%</span>
            </div>
            {weather.windSpeed > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-white/72 px-2.5 py-1 text-xs shadow-sm">
                <Wind className="w-3 h-3 text-gray-400" />
                <span className="tabular-nums font-medium text-gray-600">{weather.windSpeed}级</span>
              </div>
            )}
            {city.distance && (
              <div className="ml-auto flex items-center gap-1 rounded-full bg-white/72 px-2.5 py-1 text-xs shadow-sm">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="tabular-nums font-medium text-gray-600">{city.distance}km</span>
              </div>
            )}
          </div>
        )}

        {weather && <ScoreBar score={weather.score} />}

        {hasTransport && (
          <div className="mt-3 border-t border-white/55 pt-3">
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

            {city.distance && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-300 to-blue-400"
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
