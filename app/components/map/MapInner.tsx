'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Pane, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { Compass, Sparkles, Wind, CloudRain, MapPin } from 'lucide-react';
import type { DivIcon, LatLngExpression, LatLngTuple } from 'leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import { WEATHER_CONDITION_MAP, type WeatherData } from '@/types';
import { getCityByName } from '@/lib/cities/utils';

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
  const topThree = visiblePoints.slice(0, 3);
  const center: LatLngExpression = active ? [active.lat, active.lng] : [DEFAULT_POSITION.lat, DEFAULT_POSITION.lng];
  const displayOrigin = originCity ?? '上海';
  const sideActions = hasResults
    ? topThree.map((point) => ({
        label: point.city,
        meta: `${point.score}分 · ${point.tempHigh}° / ${point.tempLow}°`,
        actionable: true,
        onClick: () => handleSelect(point.city),
      }))
    : [
        { label: '这周六上海出发', meta: '直接进入真实天气结果', actionable: false, onClick: undefined },
        { label: '明天周边哪里不下雨', meta: '偏保守决策问法', actionable: false, onClick: undefined },
        { label: '下周日适合去哪玩', meta: '偏探索型问法', actionable: false, onClick: undefined },
      ];

  const handleSelect = (cityName: string) => {
    setActiveCity(cityName);
    onSelectCity?.(cityName);
  };

  return (
    <div className={`relative overflow-hidden rounded-[32px] border border-white/55 bg-[#dfeaf4] shadow-[0_30px_80px_rgba(148,163,184,0.24)] ${className || ''}`}>
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
              <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={active?.city === point.city} className="weather-city-tooltip">
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

      <div className="pointer-events-none absolute inset-0 z-[420] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.5),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(191,219,254,0.18)_38%,rgba(15,23,42,0.22)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[421] h-[42%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.62),rgba(255,255,255,0.24)_34%,transparent_66%)]" />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] flex items-start justify-between gap-3 sm:inset-x-6">
        <div className="pointer-events-auto rounded-[28px] border border-white/45 bg-white/28 px-4 py-3 text-slate-900 shadow-[0_16px_50px_rgba(255,255,255,0.22)] backdrop-blur-[22px] sm:px-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/26 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700/90">
            <Sparkles className="h-3.5 w-3.5" />
            {hasResults ? 'Travel Weather' : 'Weather Stage'}
          </div>
          <h3 className="mt-3 text-[clamp(1.3rem,2vw,1.85rem)] font-semibold tracking-tight text-white drop-shadow-[0_8px_20px_rgba(15,23,42,0.22)]">
            {hasResults ? `${displayOrigin} 出发天气地图` : '查询前就该有地图'}
          </h3>
          <p className="mt-1 max-w-[36rem] text-sm leading-6 text-slate-800/78">
            {hasResults
              ? '真实城市坐标、天气节点和路线层已经叠在同一张地图上。'
              : '先感受地图氛围、城市层级和路线走向，再让 AI 给你结果。'}
          </p>
        </div>

        <div className="pointer-events-auto hidden gap-2 sm:flex">
          <span className="rounded-full border border-white/45 bg-white/22 px-4 py-2 text-sm text-white backdrop-blur-xl shadow-[0_10px_30px_rgba(255,255,255,0.16)]">
            {visiblePoints.length} 个城市节点
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute left-4 top-28 z-[500] flex flex-wrap gap-2 sm:left-6">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/42 bg-white/22 px-3 py-1.5 text-xs text-white backdrop-blur-xl">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          稳定晴好
        </div>
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/42 bg-white/22 px-3 py-1.5 text-xs text-white backdrop-blur-xl">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          可考虑
        </div>
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/42 bg-white/22 px-3 py-1.5 text-xs text-white backdrop-blur-xl">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          谨慎
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] sm:inset-x-4 sm:bottom-4">
        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="pointer-events-auto rounded-[30px] border border-white/45 bg-white/22 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-[24px] sm:p-5">
            {active && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/74">
                      {hasResults ? 'Focus City' : 'Preview Focus'}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-4xl">{WEATHER_CONDITION_MAP[active.weather]?.icon ?? '☀️'}</span>
                      <div>
                        <h4 className="text-3xl font-semibold tracking-tight text-white">{active.city}</h4>
                        <p className="mt-1 text-sm text-slate-100/74">
                          {hasResults ? getTravelNarrative(active.distance, active.trainTime, active.driveTime) : 'Apple Weather 风格预览态'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/35 bg-white/18 px-3 py-2 text-center text-white backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/64">Score</div>
                    <div className="mt-1 text-xl font-semibold">{active.score}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/14 px-3 py-3 text-white backdrop-blur-md">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/60">Temp</div>
                    <div className="mt-2 text-lg font-semibold">{active.tempHigh}° / {active.tempLow}°</div>
                  </div>
                  <div className="rounded-2xl bg-white/14 px-3 py-3 text-white backdrop-blur-md">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                      <CloudRain className="h-3.5 w-3.5" />
                      Rain
                    </div>
                    <div className="mt-2 text-lg font-semibold">{active.rainProbability}%</div>
                  </div>
                  <div className="rounded-2xl bg-white/14 px-3 py-3 text-white backdrop-blur-md">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                      <Wind className="h-3.5 w-3.5" />
                      Travel
                    </div>
                    <div className="mt-2 text-sm font-semibold">{active.trainTime ?? active.driveTime ?? '待估算'}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pointer-events-auto rounded-[30px] border border-white/42 bg-white/18 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-[24px] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/70">
                  {hasResults ? 'Top Picks' : 'Try Asking'}
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {hasResults ? '从地图直接切换候选城市' : `预览中心：${displayOrigin}`}
                </div>
              </div>
              <Compass className="h-5 w-5 text-white/72" />
            </div>

            <div className="mt-3 space-y-2">
              {sideActions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/26 bg-white/12 px-3 py-3 text-left text-white transition-colors hover:bg-white/18"
                >
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="mt-1 text-xs text-white/66">{item.meta}</div>
                  </div>
                  {item.actionable ? <MapPin className="h-4 w-4 text-white/70" /> : <span className="text-white/50">→</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
