'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Pane, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { Wind, CloudRain, Droplets } from 'lucide-react';
import type { DivIcon, LatLngExpression, LatLngTuple } from 'leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import { WEATHER_CONDITION_MAP, type WeatherData } from '@/types';
import { getCityByName } from '@/lib/cities/utils';
import { stage } from '@/lib/ui/stage';

interface MapInnerProps {
  weatherData: WeatherData[];
  originCity?: string;
  selectedCity?: string | null;
  onSelectCity?: (cityName: string) => void;
  className?: string;
}

type WeatherPoint = WeatherData & {
  lat: number;
  lng: number;
  province?: string;
  distance?: number;
  trainTime?: string;
  driveTime?: string;
};

const DEFAULT_POSITION = { lat: 31.2304, lng: 121.4737 };
const DEFAULT_ZOOM = 7;
const PREVIEW_CITY_NAMES = ['上海', '杭州', '苏州', '嘉兴', '宁波'];

function getPoint(data: WeatherData): WeatherPoint {
  const fallback = getCityByName(data.city);
  return {
    ...data,
    lat: data.lat ?? fallback?.lat ?? DEFAULT_POSITION.lat,
    lng: data.lng ?? fallback?.lng ?? DEFAULT_POSITION.lng,
    province: data.province,
  };
}

function createPreviewPoints(): WeatherPoint[] {
  return PREVIEW_CITY_NAMES.map((name, index) => {
    const city = getCityByName(name);
    return {
      city: name,
      date: '2026-04-10',
      weather: (['sunny', 'sunny', 'cloudy', 'sunny', 'cloudy'][index] ?? 'sunny') as WeatherData['weather'],
      tempHigh: [24, 25, 22, 24, 23][index] ?? 24,
      tempLow: [15, 16, 14, 16, 17][index] ?? 15,
      rainProbability: [12, 10, 24, 14, 18][index] ?? 12,
      humidity: [58, 52, 66, 59, 60][index] ?? 58,
      windSpeed: [2, 3, 2, 2, 3][index] ?? 2,
      score: [88, 93, 76, 90, 82][index] ?? 82,
      weatherText: ['晴朗', '晴间多云', '多云', '晴朗', '通透多云'][index] ?? '晴朗',
      lat: city?.lat ?? DEFAULT_POSITION.lat + index * 0.32,
      lng: city?.lng ?? DEFAULT_POSITION.lng + index * 0.38,
      distance: [0, 176, 108, 92, 222][index] ?? 0,
      trainTime: ['本地', '58分钟', '32分钟', '28分钟', '1小时46分'][index] ?? '待估算',
      driveTime: ['本地', '2小时12分', '1小时45分', '1小时16分', '3小时08分'][index] ?? '待估算',
    };
  });
}

function getTone(score: number) {
  if (score >= 85) return 'tone-emerald';
  if (score >= 60) return 'tone-amber';
  return 'tone-rose';
}

function getTravelNarrative(distance?: number, trainTime?: string, driveTime?: string) {
  if (distance === undefined) return '以天气稳定度作为第一判断。';
  if (distance <= 120) return `轻量短逃，${driveTime ?? trainTime ?? '通勤轻'}。`;
  if (distance <= 260) return `周末刚好，${trainTime ?? driveTime ?? '当天可达'}。`;
  return `更适合完整周末，优先看${trainTime ? '高铁' : '出发时段'}。`;
}

function buildRoutePath(from: WeatherPoint, to: WeatherPoint): LatLngTuple[] {
  const midLat = (from.lat + to.lat) / 2 + Math.max(0.12, Math.abs(from.lng - to.lng) * 0.1);
  const midLng = (from.lng + to.lng) / 2;
  return [
    [from.lat, from.lng],
    [midLat, midLng],
    [to.lat, to.lng],
  ];
}

function buildCityIcon(point: WeatherPoint, isActive: boolean): DivIcon {
  const icon = WEATHER_CONDITION_MAP[point.weather]?.icon ?? '☀️';
  return divIcon({
    className: 'weather-city-pin-wrapper',
    iconSize: isActive ? [94, 44] : [80, 38],
    iconAnchor: isActive ? [47, 36] : [40, 31],
    html: `
      <div class="weather-city-pin ${isActive ? 'is-active' : ''} ${getTone(point.score)}">
        <span class="weather-city-pin__icon">${icon}</span>
        <span class="weather-city-pin__label">${point.city}</span>
      </div>
    `,
  });
}

function MapViewportController({ points, selectedCity }: { points: WeatherPoint[]; selectedCity?: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const selected = selectedCity ? points.find((item) => item.city === selectedCity) : null;
    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 8), {
        duration: 0.8,
      });
      return;
    }

    const bounds = latLngBounds(points.map((point) => [point.lat, point.lng] as LatLngTuple));
    map.fitBounds(bounds.pad(0.28), { animate: true, duration: 0.8, maxZoom: 8 });
  }, [map, points, selectedCity]);

  return null;
}

export default function MapInner({ weatherData, originCity, selectedCity, onSelectCity, className }: MapInnerProps) {
  const resultPoints = useMemo(() => weatherData.map(getPoint).sort((a, b) => b.score - a.score), [weatherData]);
  const previewPoints = useMemo(() => createPreviewPoints(), []);
  const visiblePoints = resultPoints.length > 0 ? resultPoints : previewPoints;
  const hasResults = resultPoints.length > 0;
  const [activeCity, setActiveCity] = useState<string | null>(visiblePoints[0]?.city ?? null);

  useEffect(() => {
    if (selectedCity && visiblePoints.some((item) => item.city === selectedCity)) {
      setActiveCity(selectedCity);
      return;
    }
    setActiveCity(visiblePoints[0]?.city ?? null);
  }, [selectedCity, visiblePoints]);

  const active = visiblePoints.find((item) => item.city === activeCity) ?? visiblePoints[0] ?? null;
  const otherPoints = active ? visiblePoints.filter((item) => item.city !== active.city) : [];
  const center: LatLngExpression = active ? [active.lat, active.lng] : [DEFAULT_POSITION.lat, DEFAULT_POSITION.lng];
  const displayOrigin = originCity ?? '上海';

  const handleSelect = (cityName: string) => {
    setActiveCity(cityName);
    onSelectCity?.(cityName);
  };

  return (
    <div className={`relative overflow-hidden bg-[#dfeaf4] dark:bg-slate-900 ${className || ''}`}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full weather-map-canvas"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />
        <MapViewportController points={visiblePoints} selectedCity={activeCity} />

        <Pane name="routes" style={{ zIndex: 430 }}>
          {active && otherPoints.map((point) => (
            <Polyline
              key={`route-${point.city}`}
              positions={buildRoutePath(active, point)}
              pathOptions={{
                color: '#7dd3fc',
                weight: active.city === point.city ? 4 : 3,
                opacity: 0.7,
                dashArray: '1 11',
                lineCap: 'round',
                className: 'leaflet-route-line',
              }}
            />
          ))}
        </Pane>

        <Pane name="halos" style={{ zIndex: 440 }}>
          {visiblePoints.map((point) => (
            <CircleMarker
              key={`halo-${point.city}`}
              center={[point.lat, point.lng]}
              radius={active?.city === point.city ? 20 : 14}
              pathOptions={{
                color: 'rgba(125,211,252,0.12)',
                fillColor: 'rgba(125,211,252,0.18)',
                fillOpacity: active?.city === point.city ? 0.3 : 0.14,
                weight: 1,
              }}
            />
          ))}
        </Pane>

        <Pane name="markers" style={{ zIndex: 460 }}>
          {visiblePoints.map((point) => (
            <Marker
              key={point.city}
              position={[point.lat, point.lng]}
              icon={buildCityIcon(point, active?.city === point.city)}
              eventHandlers={{ click: () => handleSelect(point.city) }}
            >
              <Tooltip direction="top" offset={[0, -12]} opacity={1} className="weather-city-tooltip">
                <div className="flex items-center gap-2">
                  <span>{WEATHER_CONDITION_MAP[point.weather]?.icon ?? '☀️'}</span>
                  <span>{point.city}</span>
                  <span className="text-white/70">{point.score}分</span>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </Pane>
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[420] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(191,219,254,0.08)_32%,rgba(15,23,42,0.12)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[421] h-[34%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.48),rgba(255,255,255,0.16)_30%,transparent_64%)]" />

      <div className="pointer-events-none absolute bottom-5 left-4 z-[500] flex flex-wrap gap-2 sm:left-6">
        {[
          { color: 'bg-emerald-400', label: '晴好' },
          { color: 'bg-amber-400', label: '可考虑' },
          { color: 'bg-rose-400', label: '谨慎' },
        ].map(({ color, label }) => (
          <div key={label} className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] panel-t2 ${stage.pill()}`}>
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Preview Focus / Focus City ── matches workspace glass theme ── */}
      <div className="pointer-events-none absolute bottom-5 right-4 z-[500] w-[min(28rem,calc(100%-2rem))] sm:right-6 sm:w-[22rem]">
        {active && (
          <div className={stage.subpanel('pointer-events-auto rounded-[28px] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] sm:p-5')}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-4xl flex-shrink-0">{WEATHER_CONDITION_MAP[active.weather]?.icon ?? '☀️'}</span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.20em] panel-t4">
                    {hasResults ? 'Focus City' : 'Preview Focus'}
                  </div>
                  <h4 className="text-xl font-semibold tracking-tight panel-t1 leading-tight mt-0.5">{active.city}</h4>
                  <p className="text-xs panel-t3 mt-0.5 truncate">
                    {hasResults
                      ? getTravelNarrative(active.distance, active.trainTime, active.driveTime)
                      : (active.weatherText ?? '预览模式')}
                  </p>
                </div>
              </div>

              <div className={`flex-shrink-0 rounded-2xl px-3 py-2 text-center ${
                active.score > 70
                  ? 'bg-emerald-100 dark:bg-emerald-500/20'
                  : active.score >= 40
                  ? 'bg-amber-100 dark:bg-amber-500/20'
                  : 'bg-red-100 dark:bg-rose-500/20'
              }`}>
                <div className="text-[9px] uppercase tracking-[0.18em] panel-t3">Score</div>
                <div className={`text-2xl font-bold tabular-nums leading-tight ${
                  active.score > 70 ? 'text-emerald-700 dark:text-emerald-300'
                  : active.score >= 40 ? 'text-amber-700 dark:text-amber-300'
                  : 'text-red-600 dark:text-rose-300'
                }`}>{active.score}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: '温度', value: `${active.tempHigh}°/${active.tempLow}°`, icon: null },
                { label: '降雨', value: `${active.rainProbability}%`, icon: <CloudRain className="h-3 w-3" /> },
                { label: '湿度', value: `${active.humidity}%`, icon: <Droplets className="h-3 w-3" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className={stage.subpanel('rounded-2xl px-2.5 py-2.5', 'soft')}>
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.16em] panel-t4 mb-1.5">
                    {icon}{label}
                  </div>
                  <div className="text-sm font-semibold tabular-nums panel-t1">{value}</div>
                </div>
              ))}
            </div>

            {/* Travel — real results only */}
            {hasResults && (active.trainTime ?? active.driveTime) && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs panel-t3">
                <Wind className="h-3.5 w-3.5 flex-shrink-0 text-sky-500 dark:text-sky-300" />
                {active.trainTime && <span>高铁 <strong className="panel-t1 font-semibold">{active.trainTime}</strong></span>}
                {active.trainTime && active.driveTime && <span className="panel-t4">·</span>}
                {active.driveTime && <span>自驾 <strong className="panel-t1 font-semibold">{active.driveTime}</strong></span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
