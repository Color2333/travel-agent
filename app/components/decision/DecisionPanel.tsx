'use client';

import { CalendarDays, CheckCircle2, CloudRain, Compass, MessageSquarePlus, Sparkles, TriangleAlert } from 'lucide-react';
import { formatDateDisplay } from '@/lib/ai/date';
import type { TripPlanResult, WeatherData } from '@/types';
import { stage } from '@/lib/ui/stage';

interface DecisionPanelProps {
  tripPlan: TripPlanResult | null;
  selectedCity?: string | null;
  weatherData: WeatherData[];
  onAskFollowUp?: (prompt: string) => void;
}

function buildFollowUpPrompts(plan: TripPlanResult, selectedCity: string | null, currentCity?: WeatherData) {
  const city = selectedCity ?? plan.topRecommendation?.city ?? plan.cities[0]?.city;
  const score = currentCity?.score ?? plan.topRecommendation?.score;
  const origin = plan.origin;
  const dateLabel = formatDateDisplay(plan.date);

  return [
    {
      label: '解释最佳选择',
      prompt: `基于你刚才给我的结果，为什么 ${city} 是 ${origin}${dateLabel} 出发的更优选择？请从天气、通勤成本和出行风险三方面解释。`,
    },
    {
      label: '比较前两名',
      prompt: '请比较这次推荐里的前两名城市，告诉我各自更适合什么类型的行程，并给一个明确建议。',
    },
    {
      label: '保守方案',
      prompt: '如果我想要更保守、更稳妥的出行决策，请从当前结果里给我一个最不容易踩雷的方案，并说明原因。',
    },
    {
      label: '生成行动建议',
      prompt: `请根据当前结果，给我一份简短的出发建议：什么时候出门、带什么、最需要注意什么。目标城市是 ${city}${score !== undefined ? `，当前评分 ${score} 分` : ''}。`,
    },
  ];
}

function PanelPlaceholder() {
  return (
    <div className="px-3 py-3 sm:px-4">
      <div className={stage.subpanel('rounded-[28px] p-5 text-white')}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 text-sky-100">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">决策面板</h3>
            <p className="mt-1 text-sm leading-6 text-white/64">
              这里会展示上一轮查询的出发城市、日期、最佳选择和后续追问入口。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DecisionPanel({ tripPlan, selectedCity, weatherData, onAskFollowUp }: DecisionPanelProps) {
  if (!tripPlan) {
    return <PanelPlaceholder />;
  }

  const currentCity = weatherData.find((item) => item.city === selectedCity) ?? weatherData[0];
  const followUps = buildFollowUpPrompts(tripPlan, selectedCity ?? null, currentCity);

  return (
    <div className="space-y-4 px-3 py-3 text-white sm:px-4">
      <div className={stage.subpanel('rounded-[28px] p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100')}>
              <Sparkles className="h-3.5 w-3.5" />
              Decision Brief
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
              {tripPlan.origin} 出发，{formatDateDisplay(tripPlan.date)} 怎么选
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/68">
              {tripPlan.summary ?? '已拿到一轮结构化结果，可以继续比较、缩小范围或让 AI 直接给最终建议。'}
            </p>
          </div>

          <div className={stage.pill('rounded-2xl px-3 py-2 text-right')}>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/46">候选城市</div>
            <div className="mt-1 text-2xl font-semibold text-white">{tripPlan.cities.length}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={stage.subpanel('rounded-[24px] p-4')}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/16 text-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/76">最佳落点</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {tripPlan.topRecommendation?.city ?? currentCity?.city ?? '待确认'}
                </div>
                <p className="mt-1 text-sm leading-6 text-white/66">
                  {tripPlan.topRecommendation?.reason ?? '这一轮结果中综合评分最高，适合作为默认决策起点。'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-300/12 px-3 py-1 font-medium text-emerald-50">
                评分 {tripPlan.topRecommendation?.score ?? currentCity?.score ?? '--'}
              </span>
              {tripPlan.topRecommendation?.weather && (
                <span className="rounded-full bg-white/12 px-3 py-1 font-medium text-white/82">
                  {tripPlan.topRecommendation.weather}
                </span>
              )}
              {tripPlan.topRecommendation?.trainTime && (
                <span className="rounded-full bg-sky-300/12 px-3 py-1 font-medium text-sky-100">
                  通勤 {tripPlan.topRecommendation.trainTime}
                </span>
              )}
            </div>
          </div>

          <div className={stage.subpanel('rounded-[24px] p-4')}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/52">
              <CalendarDays className="h-3.5 w-3.5" />
              当前聚焦
            </div>
            <div className="mt-3 text-lg font-semibold text-white">{currentCity?.city ?? '未选中城市'}</div>
            <p className="mt-1 text-sm text-white/64">
              {currentCity
                ? `${currentCity.weatherText} · ${currentCity.tempHigh}° / ${currentCity.tempLow}° · 降雨 ${currentCity.rainProbability}%`
                : '点击地图或卡片后，这里会同步展示当前正在比较的城市。'}
            </p>
            {tripPlan.failedCities && tripPlan.failedCities.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-300/12 px-3 py-2 text-xs leading-5 text-amber-50/92">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>有 {tripPlan.failedCities.length} 个城市天气获取失败，当前建议基于成功返回的候选城市。</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {tripPlan.goodOptions && tripPlan.goodOptions.length > 0 && (
        <div className={stage.subpanel('rounded-[24px] p-4')}>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/52">优先候选</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tripPlan.goodOptions.slice(0, 4).map((option) => (
              <button
                key={option.city}
                type="button"
                onClick={() => onAskFollowUp?.(`请重点分析 ${option.city}，告诉我它相对其他候选城市最值得去和最需要担心的地方。`)}
                className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/16"
              >
                {option.city} · {option.score}分
              </button>
            ))}
          </div>
        </div>
      )}

      {tripPlan.avoidCities && tripPlan.avoidCities.length > 0 && (
        <div className={stage.subpanel('rounded-[24px] p-4')}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-100/84">
            <CloudRain className="h-3.5 w-3.5" />
            谨慎选择
          </div>
          <p className="mt-2 text-sm text-rose-50/88">
            {tripPlan.avoidCities.slice(0, 2).map((item) => `${item.city}：${item.reason}`).join('；')}
          </p>
        </div>
      )}

      <div className={stage.subpanel('rounded-[24px] p-4')}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/52">
          <MessageSquarePlus className="h-3.5 w-3.5" />
          继续追问
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {followUps.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onAskFollowUp?.(item.prompt)}
              className={stage.actionCard('px-4 py-3 text-left')}
            >
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="mt-1 text-xs leading-5 text-white/52">{item.prompt}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
