'use client';

import { MapPin } from 'lucide-react';
import { CITY_DATABASE } from '@/lib/cities/data';
import { WEATHER_CONDITION_MAP, type WeatherData } from '@/types';
import CityCard from './CityCard';

interface CityCardGridProps {
  weatherData: WeatherData[];
  onCityClick?: (cityName: string) => void;
}

export default function CityCardGrid({ weatherData, onCityClick }: CityCardGridProps) {
  const sortedWeatherData = [...weatherData].sort((a, b) => b.score - a.score);

  if (sortedWeatherData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-56 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40">
        <MapPin className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm sm:text-base">开始对话查询天气吧</p>
        <p className="text-gray-400 text-xs mt-1">输入出发地和时间获取推荐</p>
      </div>
    );
  }

  const getCityFromDatabase = (cityName: string) => {
    const direct = CITY_DATABASE[cityName];
    if (direct) {
      return { name: direct.name, lat: direct.lat, lng: direct.lng };
    }
    for (const city of Object.values(CITY_DATABASE)) {
      const nearby = city.nearby.find((n) => n.name === cityName);
      if (nearby) {
        return nearby;
      }
    }
    return { name: cityName, lat: 31.2304, lng: 121.4737 };
  };

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
          const city = getCityFromDatabase(data.city);
          const weather: WeatherData = {
            ...data,
            weatherIcon: WEATHER_CONDITION_MAP[data.weather]?.icon,
            weatherText: WEATHER_CONDITION_MAP[data.weather]?.label,
          };
          const isTopThree = index < 3;
          return (
            <CityCard
              key={data.city}
              city={city}
              weather={weather}
              onClick={() => onCityClick?.(data.city)}
              isHighlighted={isTopThree}
              rank={index + 1}
            />
          );
        })}
      </div>
    </div>
  );
}
