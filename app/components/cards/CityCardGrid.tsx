'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { getCityByName } from '@/lib/cities/utils';
import { WEATHER_CONDITION_MAP, type City, type WeatherData } from '@/types';
import { stage } from '@/lib/ui/stage';
import CityCard from './CityCard';

// At runtime, WeatherData from planTrip includes transport fields merged in.
// We use this intersection to avoid any[] casts while preserving type safety.
type WeatherDataWithTransport = WeatherData & Partial<Pick<City, 'distance' | 'trainTime' | 'driveTime' | 'trainPrice' | 'drivePrice' | 'province'>>;

interface CityCardGridProps {
  weatherData: WeatherData[];
  selectedCity?: string | null;
  onCityClick?: (cityName: string) => void;
}

export default function CityCardGrid({ weatherData, selectedCity, onCityClick }: CityCardGridProps) {
  const sortedWeatherData = [...weatherData].sort((a, b) => b.score - a.score) as WeatherDataWithTransport[];
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedCity) return;

    const target = itemRefs.current[selectedCity];
    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [selectedCity]);

  if (sortedWeatherData.length === 0) {
    return (
      <div className={stage.emptyState('text-white', 'md')}>
        <MapPin className="mb-3 h-12 w-12 text-white/48" />
        <p className="text-sm text-white sm:text-base">开始对话查询天气吧</p>
        <p className="mt-1 text-xs text-white/64">输入出发地和时间获取推荐</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={stage.subpanel('flex h-8 w-8 items-center justify-center rounded-xl shadow-[0_10px_24px_rgba(255,255,255,0.1)]', 'soft')}>
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">推荐目的地</h3>
            <p className="text-xs text-white/60">找到 {sortedWeatherData.length} 个城市</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {sortedWeatherData.map((data, index) => {
          // Prefer dynamic coords from planTrip/QWeather; fall back to local DB only when needed.
          const dbCity = getCityByName(data.city);
          const city: City = {
            name: data.city,
            lat: data.lat ?? dbCity?.lat ?? 31.2304,
            lng: data.lng ?? dbCity?.lng ?? 121.4737,
            qweatherId: data.qweatherId ?? dbCity?.qweatherId,
            distance: data.distance,
            trainTime: data.trainTime,
            driveTime: data.driveTime,
            trainPrice: data.trainPrice,
            drivePrice: data.drivePrice,
            province: data.province,
          };

          const weather: WeatherData = {
            ...data,
            weatherIcon: WEATHER_CONDITION_MAP[data.weather]?.icon,
            weatherText: data.weatherText || WEATHER_CONDITION_MAP[data.weather]?.label,
          };

          return (
            <div
              key={data.city}
              ref={(node) => {
                itemRefs.current[data.city] = node;
              }}
            >
              <CityCard
                city={city}
                weather={weather}
                onClick={() => onCityClick?.(data.city)}
                isActive={selectedCity === data.city}
                isHighlighted={index < 3}
                rank={index + 1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
