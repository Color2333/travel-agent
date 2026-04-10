'use client';

import React, { useEffect, useState } from 'react';
import {
  Droplets,
  Wind,
  Eye,
  Sun,
  Sunrise,
  Sunset,
  Gauge,
  Train,
  Car,
} from 'lucide-react';
import { formatDateDisplay } from '@/lib/ai/date';
import { WEATHER_CONDITION_MAP, type TripPlanResult, type WeatherData } from '@/types';

interface DecisionPanelProps {
  tripPlan: TripPlanResult | null;
  selectedCity?: string | null;
  weatherData: WeatherData[];
  onAskFollowUp?: (prompt: string) => void;
}

// WeatherData extended with transport fields (set by CityCardGrid pipeline)
type WeatherDataWithTransport = WeatherData & {
  distance?: number;
  trainTime?: string;
  driveTime?: string;
  trainPrice?: string;
  drivePrice?: string;
  province?: string;
};

function useForecast(cityId: string | undefined, cityName: string) {
  const [forecast, setForecast] = useState<WeatherData[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cityId) { setForecast(null); return; }
    setLoading(true);
    fetch(`/api/weather/forecast?cityId=${encodeURIComponent(cityId)}&cityName=${encodeURIComponent(cityName)}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setForecast(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cityId, cityName]);

  return { forecast, loading };
}

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

function weekday(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return '周' + WEEKDAY[d.getDay()];
}

function mmdd(dateStr: string) {
  return dateStr.slice(5).replace('-', '/');
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score > 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
    score >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300';
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${color}`}>
      {score}
    </span>
  );
}

function MetricPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white/70 px-2.5 py-1.5 dark:border-white/8 dark:bg-white/[0.05]">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-sky-500 dark:text-sky-300" />
      <div className="min-w-0">
        <p className="text-[9px] panel-t3 leading-none">{label}</p>
        <p className="text-[12px] font-semibold panel-t1 leading-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function DecisionPanel({ tripPlan, selectedCity, weatherData }: DecisionPanelProps) {
  if (!tripPlan) return null;

  const cityData = (weatherData as WeatherDataWithTransport[]).find((item) => item.city === selectedCity)
    ?? (weatherData as WeatherDataWithTransport[])[0];

  const { forecast, loading } = useForecast(cityData?.qweatherId, cityData?.city ?? '');

  const conditionInfo = cityData ? WEATHER_CONDITION_MAP[cityData.weather] : null;
  const weatherIcon = cityData?.weatherIcon ?? conditionInfo?.icon ?? '🌡️';
  const top = tripPlan.topRecommendation;

  return (
    <div className="px-3.5 pt-3 pb-2 sm:px-4 animate-slide-up space-y-2.5">

      {/* ── Trip header strip ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-sky-500 dark:text-sky-300/70">出行计划</p>
          <p className="mt-0.5 text-sm font-semibold panel-t1">
            {tripPlan.origin} → {formatDateDisplay(tripPlan.date)}
          </p>
        </div>
        {top && (
          <div className="text-right">
            <p className="text-[10px] panel-t3">最优推荐</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">{top.city}</p>
          </div>
        )}
      </div>

      {/* ── Selected city deep-dive ───────────────────── */}
      {cityData && (
        <div className="rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/70 to-white/50 dark:border-white/10 dark:bg-white/[0.04] overflow-hidden">

          {/* City hero row */}
          <div className="flex items-center gap-3 px-3.5 pt-3 pb-2.5 border-b border-sky-100/60 dark:border-white/8">
            <span className="text-3xl leading-none">{weatherIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold panel-t1">{cityData.city}</span>
                {cityData.province && (
                  <span className="text-[10px] panel-t3">
                    {cityData.province.replace('省','').replace('自治区','').replace('壮族','').replace('维吾尔','')}
                  </span>
                )}
              </div>
              <p className="text-xs panel-t2 mt-0.5">{cityData.weatherText ?? conditionInfo?.label}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold panel-t1 tabular-nums leading-tight">
                {cityData.tempHigh}°<span className="text-sm font-normal panel-t3">/{cityData.tempLow}°</span>
              </p>
              <ScoreBadge score={cityData.score} />
            </div>
          </div>

          {/* 7-day forecast strip */}
          <div className="px-3 py-2.5 border-b border-sky-100/60 dark:border-white/8">
            <p className="text-[10px] panel-t3 mb-2 uppercase tracking-[0.14em]">7 天天气</p>
            {loading ? (
              <div className="flex gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 h-16 rounded-xl bg-slate-100/70 dark:bg-white/8 animate-pulse" />
                ))}
              </div>
            ) : forecast ? (
              <div className="flex gap-1">
                {forecast.map((day, i) => {
                  const icon = WEATHER_CONDITION_MAP[day.weather]?.icon ?? '🌡️';
                  const isTarget = day.date === tripPlan.date;
                  return (
                    <div
                      key={day.date}
                      className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 transition-colors ${
                        isTarget
                          ? 'bg-sky-100/80 dark:bg-sky-500/20 ring-1 ring-sky-300/60 dark:ring-sky-400/40'
                          : 'hover:bg-white/60 dark:hover:bg-white/8'
                      }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="text-[9px] panel-t3 leading-none">{i === 0 ? '今' : weekday(day.date)}</span>
                      <span className="text-[9px] panel-t4 leading-none">{mmdd(day.date)}</span>
                      <span className="text-base leading-none my-0.5">{icon}</span>
                      <span className="text-[10px] font-semibold panel-t1 tabular-nums leading-none">{day.tempHigh}°</span>
                      <span className="text-[9px] panel-t3 tabular-nums leading-none">{day.tempLow}°</span>
                      <div className={`mt-0.5 h-1 w-4 rounded-full ${
                        day.score > 70 ? 'bg-emerald-400' : day.score >= 40 ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] panel-t3 py-2 text-center">暂无预报数据</p>
            )}
          </div>

          {/* Metric grid */}
          <div className="px-3 py-2.5 border-b border-sky-100/60 dark:border-white/8">
            <div className="grid grid-cols-3 gap-1.5">
              <MetricPill icon={Droplets} label="湿度" value={`${cityData.humidity}%`} />
              <MetricPill icon={Droplets} label="降雨概率" value={`${cityData.rainProbability}%`} />
              {cityData.windScaleDay ? (
                <MetricPill icon={Wind} label={cityData.windDirDay ?? '风力'} value={`${cityData.windScaleDay}级`} />
              ) : (
                <MetricPill icon={Wind} label="风速" value={`${cityData.windSpeed}km/h`} />
              )}
              {cityData.vis ? <MetricPill icon={Eye} label="能见度" value={`${cityData.vis}km`} /> : null}
              {cityData.uvIndex ? <MetricPill icon={Sun} label="紫外线" value={String(cityData.uvIndex)} /> : null}
              {cityData.pressure ? <MetricPill icon={Gauge} label="气压" value={`${cityData.pressure}hPa`} /> : null}
            </div>
          </div>

          {/* Sunrise / sunset + transport */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 flex-wrap">
            {cityData.sunrise && (
              <div className="flex items-center gap-1 text-[11px] panel-t2">
                <Sunrise className="h-3 w-3 text-amber-400" />
                <span>{cityData.sunrise}</span>
              </div>
            )}
            {cityData.sunset && (
              <div className="flex items-center gap-1 text-[11px] panel-t2">
                <Sunset className="h-3 w-3 text-orange-400" />
                <span>{cityData.sunset}</span>
              </div>
            )}
            {cityData.trainTime && (
              <div className="flex items-center gap-1 text-[11px] panel-t2 ml-auto">
                <Train className="h-3 w-3 text-sky-500" />
                <span>{cityData.trainTime}</span>
                {cityData.trainPrice && <span className="panel-t3">{cityData.trainPrice}</span>}
              </div>
            )}
            {!cityData.trainTime && cityData.driveTime && (
              <div className="flex items-center gap-1 text-[11px] panel-t2 ml-auto">
                <Car className="h-3 w-3 text-slate-400" />
                <span>{cityData.driveTime}</span>
              </div>
            )}
            {!cityData.trainTime && !cityData.driveTime && cityData.distance && (
              <span className="text-[11px] panel-t3 ml-auto">{cityData.distance} km</span>
            )}
          </div>
        </div>
      )}

      {/* ── Failed cities warning ─────────────────────── */}
      {tripPlan.failedCities && tripPlan.failedCities.length > 0 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-300/70 px-0.5">
          {tripPlan.failedCities.length} 个城市天气获取失败，结果基于剩余城市
        </p>
      )}
    </div>
  );
}
