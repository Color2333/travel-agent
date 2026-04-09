'use client';

import { MapPin } from 'lucide-react';
import { getCityByName } from '@/lib/cities/utils';
import { WEATHER_CONDITION_MAP, type City, type WeatherData } from '@/types';
import CityCard from './CityCard';

// At runtime, WeatherData from planTrip includes transport fields merged in.
// We use this intersection to avoid any[] casts while preserving type safety.
type WeatherDataWithTransport = WeatherData & Partial<Pick<City, 'distance' | 'trainTime' | 'driveTime' | 'trainPrice' | 'drivePrice' | 'province'>>;

interface CityCardGridProps {
  weatherData: WeatherData[];
  onCityClick?: (cityName: string) => void;
}

export default function CityCardGrid({ weatherData, onCityClick }: CityCardGridProps) {
  const sortedWeatherData = [...weatherData].sort((a, b) => b.score - a.score) as WeatherDataWithTransport[];

  if (sortedWeatherData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-56 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40">
        <MapPin className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm sm:text-base">开始对话查询天气吧</p>
        <p className="text-gray-400 text-xs mt-1">输入出发地和时间获取推荐</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-200">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">推荐目的地</h3>
            <p className="text-xs text-gray-500">找到 {sortedWeatherData.length} 个城市</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sortedWeatherData.map((data, index) => {
          // Build city object: coords from DB, transport from planTrip result (fixes transport data loss bug)
          const dbCity = getCityByName(data.city);
          const city: City = {
            name: data.city,
            lat: dbCity?.lat ?? 31.2304,
            lng: dbCity?.lng ?? 121.4737,
            qweatherId: dbCity?.qweatherId,
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
            <CityCard
              key={data.city}
              city={city}
              weather={weather}
              onClick={() => onCityClick?.(data.city)}
              isHighlighted={index < 3}
              rank={index + 1}
            />
          );
        })}
      </div>
    </div>
  );
}
