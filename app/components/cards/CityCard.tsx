'use client';

import { Droplets, Train, Car } from 'lucide-react';
import { WEATHER_CONDITION_MAP, type City, type WeatherData } from '@/types';

interface CityCardProps {
  city: City;
  weather?: WeatherData;
  onClick?: () => void;
  isActive?: boolean;
  isHighlighted?: boolean;
  rank?: number;
}

export default function CityCard({ city, weather, onClick, isActive, isHighlighted, rank }: CityCardProps) {
  const conditionInfo = weather ? WEATHER_CONDITION_MAP[weather.weather] : null;
  const weatherIcon = conditionInfo?.icon ?? '🌡️';
  const weatherLabel = weather?.weatherText || conditionInfo?.label || '';
  const shortProvince = city.province
    ?.replace('省', '').replace('自治区', '').replace('壮族', '').replace('维吾尔', '') ?? '';

  const scoreBg =
    !weather ? '' :
    weather.score > 70
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
      : weather.score >= 40
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
      : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300';

  const shellClass = [
    'city-card-shell group relative w-full overflow-hidden rounded-[18px] text-left',
    'transition-all duration-200',
    onClick ? 'cursor-pointer' : '',
    isActive
      ? 'border-sky-300 ring-2 ring-sky-300/40 ring-offset-0 shadow-[0_8px_24px_rgba(14,165,233,0.20)]'
      : isHighlighted
      ? 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
      : 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
  ].join(' ');

  return (
    <button type="button" onClick={onClick} className={shellClass}>
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-300 to-blue-400" />
      )}

      <div className="px-3.5 py-2.5">
        {/* Main row */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none flex-shrink-0">{weatherIcon}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[14px] panel-t1 leading-tight">{city.name}</span>
              {shortProvince && (
                <span className="text-[10px] panel-t3 truncate">{shortProvince}</span>
              )}
            </div>
            <p className="text-[11px] panel-t2 leading-tight mt-0.5 truncate">{weatherLabel}</p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            {weather && (
              <div className="text-right">
                <p className="font-bold text-[14px] panel-t1 tabular-nums leading-tight">
                  {weather.tempHigh}°
                  <span className="text-[12px] font-normal panel-t3">/{weather.tempLow}°</span>
                </p>
                <span className={`inline-block text-[11px] font-bold rounded-full px-2 py-px tabular-nums mt-0.5 ${scoreBg}`}>
                  {weather.score}
                </span>
              </div>
            )}
            {rank && rank <= 3 && (
              <span className="text-[16px] leading-none">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
            )}
          </div>
        </div>

        {/* Detail row */}
        {weather && (
          <div className="flex items-center gap-3 mt-2 ml-[34px] text-[10px] panel-t3">
            <span className="flex items-center gap-0.5">
              <Droplets className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
              {weather.rainProbability}%
            </span>
            {weather.windSpeed > 0 && <span>{weather.windSpeed}级</span>}
            {city.trainTime ? (
              <span className="flex items-center gap-0.5">
                <Train className="w-2.5 h-2.5 flex-shrink-0" />
                {city.trainTime}
                {city.trainPrice && (
                  <span className="panel-t4 ml-0.5">{city.trainPrice}</span>
                )}
              </span>
            ) : city.driveTime ? (
              <span className="flex items-center gap-0.5">
                <Car className="w-2.5 h-2.5 flex-shrink-0" />
                {city.driveTime}
              </span>
            ) : city.distance ? (
              <span>{city.distance}km</span>
            ) : null}
          </div>
        )}
      </div>
    </button>
  );
}
