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
      <div className="px-3.5 py-3 sm:px-4">
        <div className={stage.emptyState('text-white', 'md')}>
          <MapPin className="mb-3 h-12 w-12 text-white/48" />
          <p className="text-sm panel-t1 sm:text-base">开始对话查询天气吧</p>
          <p className="mt-1 text-xs panel-t3">输入出发地和时间获取推荐</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3.5 py-3 sm:px-4">
      <div className="mb-3 flex items-center justify-between animate-slide-up">
        <div>
          <h3 className="text-[13px] font-semibold panel-t1">推荐目的地</h3>
          <p className="text-[11px] panel-t3">{sortedWeatherData.length} 个城市 · 按评分排序</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
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
              className="animate-card-enter"
              style={{ animationDelay: `${Math.min(index * 65, 390)}ms` }}
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
