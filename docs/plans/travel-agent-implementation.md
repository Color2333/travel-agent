# 出行决策Agent - 技术实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个可真正使用的出行决策Agent网页，帮助用户根据天气选择周边城市

**Architecture:** 基于Next.js 14 App Router的响应式全栈应用，采用Tool-use AI架构，支持多模型(OpenAI/GLM/通义千问/Claude)，使用Vercel Edge Runtime部署

**Tech Stack:** Next.js 14 + React + TypeScript + Tailwind CSS + Vercel AI SDK + Leaflet地图 + 和风天气API

---

## 项目架构

```
travel-agent/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 主页面（对话+地图+卡片）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式+Tailwind
│   ├── api/                      # API Routes (Edge Runtime)
│   │   ├── weather/route.ts      # 天气查询API
│   │   ├── cities/route.ts       # 周边城市API
│   │   └── agent/route.ts        # AI Agent流式API
│   └── components/               # React组件
│       ├── layout/               # 布局组件
│       │   ├── Header.tsx        # 顶部导航
│       │   └── SettingsModal.tsx # 设置弹窗
│       ├── chat/                 # 对话组件
│       │   ├── ChatContainer.tsx # 对话容器
│       │   ├── MessageBubble.tsx # 消息气泡
│       │   ├── ChatInput.tsx     # 输入框
│       │   └── TypingIndicator.tsx # 输入中动画
│       ├── map/                  # 地图组件
│       │   ├── WeatherMap.tsx    # 主地图组件
│       │   └── CityMarker.tsx    # 城市标记
│       └── cards/                # 卡片组件
│           ├── CityCard.tsx      # 城市卡片
│           ├── CityCardGrid.tsx  # 卡片网格
│           └── CityDetailDrawer.tsx # 详情抽屉
├── lib/                          # 工具函数
│   ├── ai/                       # AI相关
│   │   ├── types.ts              # AI类型定义
│   │   ├── providers/            # 模型适配器
│   │   │   ├── openai.ts
│   │   │   ├── zhipu.ts
│   │   │   ├── aliyun.ts
│   │   │   └── anthropic.ts
│   │   └── tools.ts              # Agent Tools定义
│   ├── weather/                  # 天气API
│   │   ├── api.ts                # 和风天气封装
│   │   └── cache.ts              # 天气缓存
│   ├── cities/                   # 城市数据
│   │   ├── data.ts               # 城市数据库
│   │   └── utils.ts              # 城市计算工具
│   ├── location.ts               # 地理位置
│   ├── dateParser.ts             # 日期解析
│   └── config.ts                 # 配置管理
├── types/                        # TypeScript类型
│   └── index.ts
├── public/                       # 静态资源
├── tests/                        # 测试文件
├── tailwind.config.ts
├── next.config.js
└── vercel.json                   # Vercel配置
```

---

## 开发任务清单

### Phase 1: 项目初始化与基础架构

#### Task 1.1: 初始化Next.js项目
**Files:**
- Create: 项目根目录

**Step 1: 创建项目**
```bash
npx create-next-app@14 travel-agent --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd travel-agent
```

**Step 2: 安装核心依赖**
```bash
npm install ai @ai-sdk/openai zod date-fns leaflet react-leaflet lucide-react
npm install -D @types/leaflet
```

**Step 3: 验证安装**
```bash
npm run dev
```
Expected: 开发服务器启动，访问 http://localhost:3000 看到默认页面

**Step 4: Commit**
```bash
git add .
git commit -m "init: initialize Next.js 14 project with TypeScript and Tailwind"
```

---

#### Task 1.2: 配置Tailwind和全局样式
**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Step 1: 更新Tailwind配置**
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        weather: {
          sunny: '#f59e0b',
          cloudy: '#6b7280',
          rainy: '#1e40af',
          good: '#22c55e',
          fair: '#eab308',
          bad: '#ef4444',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-soft': 'bounceSoft 0.5s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: 更新全局样式**
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 239, 246, 255;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
    to bottom,
    rgb(var(--background-start-rgb)),
    rgb(var(--background-end-rgb))
  );
  min-height: 100vh;
}

@layer utilities {
  .glass {
    @apply bg-white/70 backdrop-blur-md border border-white/20 shadow-lg;
  }
  
  .weather-good {
    @apply bg-green-500 text-white;
  }
  
  .weather-fair {
    @apply bg-yellow-500 text-white;
  }
  
  .weather-bad {
    @apply bg-red-500 text-white;
  }
}
```

**Step 3: 验证样式**
访问 http://localhost:3000，背景应为渐变蓝色

**Step 4: Commit**
```bash
git add tailwind.config.ts app/globals.css
git commit -m "style: configure Tailwind with custom colors and animations"
```

---

#### Task 1.3: 创建类型定义
**Files:**
- Create: `types/index.ts`

**Step 1: 定义核心类型**
```typescript
// types/index.ts

export interface City {
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  trainTime?: string;
  driveTime?: string;
}

export interface WeatherData {
  city: string;
  date: string;
  weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'overcast';
  tempHigh: number;
  tempLow: number;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  airQuality?: number;
  score: number; // 0-100 天气评分
}

export interface TransportInfo {
  train?: {
    duration: string;
    price: number;
    frequency: string;
  };
  driving?: {
    duration: string;
    distance: string;
    toll: number;
  };
}

export interface CityDetail extends City {
  weather?: WeatherData;
  transport?: TransportInfo;
  recommendation?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  referencedCities?: string[];
}

export interface AIConfig {
  provider: 'openai' | 'zhipu' | 'aliyun' | 'anthropic';
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export type DateQuery = 
  | { type: 'relative'; value: 'this-saturday' | 'this-sunday' | 'tomorrow' | 'day-after-tomorrow' }
  | { type: 'absolute'; value: string }; // YYYY-MM-DD
```

**Step 2: Commit**
```bash
git add types/index.ts
git commit -m "types: define core data types for cities, weather, and chat"
```

---

### Phase 2: 数据层 - 城市和天气

#### Task 2.1: 创建城市数据库
**Files:**
- Create: `lib/cities/data.ts`
- Create: `lib/cities/utils.ts`

**Step 1: 实现城市数据**
```typescript
// lib/cities/data.ts
import { City } from '@/types';

export const CITY_DATABASE: Record<string, City & { nearby: City[] }> = {
  '上海': {
    name: '上海',
    lat: 31.2304,
    lng: 121.4737,
    nearby: [
      { name: '杭州', lat: 30.2741, lng: 120.1551, distance: 160, trainTime: '1小时', driveTime: '2.5小时' },
      { name: '苏州', lat: 31.2989, lng: 120.5853, distance: 100, trainTime: '30分钟', driveTime: '1.5小时' },
      { name: '无锡', lat: 31.4912, lng: 120.3119, distance: 120, trainTime: '45分钟', driveTime: '2小时' },
      { name: '嘉兴', lat: 30.7470, lng: 120.7555, distance: 90, trainTime: '30分钟', driveTime: '1.5小时' },
      { name: '宁波', lat: 29.8683, lng: 121.5440, distance: 220, trainTime: '2小时', driveTime: '3小时' },
      { name: '南京', lat: 32.0603, lng: 118.7969, distance: 300, trainTime: '1.5小时', driveTime: '4小时' },
      { name: '扬州', lat: 32.3942, lng: 119.4127, distance: 280, trainTime: '2小时', driveTime: '3.5小时' },
      { name: '绍兴', lat: 30.0023, lng: 120.5790, distance: 200, trainTime: '1.5小时', driveTime: '2.5小时' },
      { name: '舟山', lat: 30.0447, lng: 122.1699, distance: 280, trainTime: '3小时', driveTime: '4小时' },
    ]
  },
  // 其他城市可以后续添加
};
```

**Step 2: 实现城市工具函数**
```typescript
// lib/cities/utils.ts
import { City } from '@/types';
import { CITY_DATABASE } from './data';

export function getNearbyCities(cityName: string, maxDistance: number = 300): City[] {
  const city = CITY_DATABASE[cityName];
  if (!city) {
    throw new Error(`City not found: ${cityName}`);
  }
  
  return city.nearby.filter(c => (c.distance || 0) <= maxDistance);
}

export function getCityByName(name: string): City | undefined {
  // 检查是否是主要城市
  if (CITY_DATABASE[name]) {
    const { nearby, ...city } = CITY_DATABASE[name];
    return city;
  }
  
  // 在nearby中搜索
  for (const mainCity of Object.values(CITY_DATABASE)) {
    const found = mainCity.nearby.find(c => c.name === name);
    if (found) return found;
  }
  
  return undefined;
}

export function getAllMainCities(): string[] {
  return Object.keys(CITY_DATABASE);
}
```

**Step 3: Commit**
```bash
git add lib/cities/
git commit -m "data: add city database with Shanghai and nearby cities"
```

---

#### Task 2.2: 实现天气API封装
**Files:**
- Create: `lib/weather/api.ts`
- Create: `lib/weather/cache.ts`

**Step 1: 实现天气API**
```typescript
// lib/weather/api.ts
import { WeatherData } from '@/types';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
const WEATHER_API_BASE = 'https://devapi.qweather.com/v7';

export async function fetchWeather(city: string, date: string): Promise<WeatherData> {
  // 1. 获取城市ID（简化处理，实际应该查询城市ID）
  const locationResponse = await fetch(
    `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(city)}&key=${WEATHER_API_KEY}`
  );
  const locationData = await locationResponse.json();
  
  if (locationData.code !== '200' || !locationData.location?.[0]) {
    throw new Error(`City not found: ${city}`);
  }
  
  const cityId = locationData.location[0].id;
  
  // 2. 获取7天天气预报
  const forecastResponse = await fetch(
    `${WEATHER_API_BASE}/weather/7d?location=${cityId}&key=${WEATHER_API_KEY}`
  );
  const forecastData = await forecastResponse.json();
  
  if (forecastData.code !== '200') {
    throw new Error(`Weather API error: ${forecastData.code}`);
  }
  
  // 3. 找到对应日期的天气
  const targetDate = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
  const dayForecast = forecastData.daily.find((d: any) => d.fxDate.replace(/-/g, '') === targetDate);
  
  if (!dayForecast) {
    throw new Error(`No forecast available for date: ${date}`);
  }
  
  // 4. 转换为我们的格式
  const weather = mapWeatherCondition(dayForecast.textDay);
  const score = calculateWeatherScore(weather, parseInt(dayForecast.humidity), parseInt(dayForecast.precip || '0'));
  
  return {
    city,
    date,
    weather,
    tempHigh: parseInt(dayForecast.tempMax),
    tempLow: parseInt(dayForecast.tempMin),
    rainProbability: parseInt(dayForecast.precip || '0'),
    humidity: parseInt(dayForecast.humidity),
    windSpeed: parseInt(dayForecast.windSpeedDay),
    score,
  };
}

function mapWeatherCondition(condition: string): WeatherData['weather'] {
  const sunny = ['晴', '少云'];
  const cloudy = ['多云', '晴间多云'];
  const rainy = ['雨', '小雨', '中雨', '大雨', '暴雨', '阵雨', '雷阵雨'];
  const snowy = ['雪', '小雪', '中雪', '大雪', '暴雪'];
  
  if (sunny.some(c => condition.includes(c))) return 'sunny';
  if (cloudy.some(c => condition.includes(c))) return 'cloudy';
  if (rainy.some(c => condition.includes(c))) return 'rainy';
  if (snowy.some(c => condition.includes(c))) return 'snowy';
  return 'overcast';
}

function calculateWeatherScore(
  weather: WeatherData['weather'],
  humidity: number,
  precipitation: number
): number {
  let score = 100;
  
  // 天气状况扣分
  if (weather === 'rainy') score -= 50;
  else if (weather === 'snowy') score -= 40;
  else if (weather === 'overcast') score -= 20;
  else if (weather === 'cloudy') score -= 10;
  
  // 湿度扣分（超过70%不舒适）
  if (humidity > 70) score -= 15;
  else if (humidity > 60) score -= 5;
  
  // 降雨概率扣分
  score -= precipitation * 0.5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

**Step 2: 实现缓存**
```typescript
// lib/weather/cache.ts
import { WeatherData } from '@/types';

const CACHE_DURATION = 60 * 60 * 1000; // 1小时

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

export class WeatherCache {
  private cache: Map<string, CacheEntry> = new Map();
  
  getKey(city: string, date: string): string {
    return `${city}_${date}`;
  }
  
  get(city: string, date: string): WeatherData | null {
    const key = this.getKey(city, date);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(city: string, date: string, data: WeatherData): void {
    const key = this.getKey(city, date);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// 单例实例
export const weatherCache = new WeatherCache();
```

**Step 3: Commit**
```bash
git add lib/weather/
git commit -m "feat: implement weather API with caching"
```

---

#### Task 2.3: 创建天气查询API Route
**Files:**
- Create: `app/api/weather/route.ts`

**Step 1: 实现API**
```typescript
// app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/weather/api';
import { weatherCache } from '@/lib/weather/cache';
import { z } from 'zod';

const requestSchema = z.object({
  city: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const date = searchParams.get('date');
    
    if (!city || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: city, date' },
        { status: 400 }
      );
    }
    
    // 验证参数
    const validation = requestSchema.safeParse({ city, date });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error },
        { status: 400 }
      );
    }
    
    // 检查缓存
    const cached = weatherCache.get(city, date);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }
    
    // 获取天气
    const weather = await fetchWeather(city, date);
    
    // 缓存结果
    weatherCache.set(city, date, weather);
    
    return NextResponse.json(weather);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather', message: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**Step 2: 创建城市列表API**
```typescript
// app/api/cities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNearbyCities } from '@/lib/cities/utils';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || '上海';
    const maxDistance = parseInt(searchParams.get('maxDistance') || '300');
    
    const cities = getNearbyCities(city, maxDistance);
    
    return NextResponse.json({
      origin: city,
      cities,
      count: cities.length,
    });
  } catch (error) {
    console.error('Cities API error:', error);
    return NextResponse.json(
      { error: 'Failed to get cities', message: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**Step 3: 测试API**
```bash
# 启动开发服务器
npm run dev

# 测试城市API
curl "http://localhost:3000/api/cities?city=上海"

# 测试天气API（需要WEATHER_API_KEY环境变量）
curl "http://localhost:3000/api/weather?city=杭州&date=2026-04-12"
```

**Step 4: Commit**
```bash
git add app/components/layout/Header.tsx
git commit -m "ui: add Header component with settings button"
```

---

#### Task 3.2: 创建设置弹窗组件
**Files:**
- Create: `app/components/layout/SettingsModal.tsx`

**Step 1: 实现SettingsModal**
```typescript
// app/components/layout/SettingsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AIConfig } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
  { id: 'zhipu', name: '智谱AI', models: ['glm-4', 'glm-3-turbo'] },
  { id: 'aliyun', name: '通义千问', models: ['qwen-max', 'qwen-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet'] },
] as const;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
  });
  
  useEffect(() => {
    // 从localStorage加载配置
    const saved = localStorage.getItem('ai_config');
    if (saved) {
      setConfig({ ...config, ...JSON.parse(saved) });
    }
  }, []);
  
  const handleSave = () => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    onClose();
  };
  
  if (!isOpen) return null;
  
  const selectedProvider = PROVIDERS.find(p => p.id === config.provider);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">AI 设置</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* 提供商选择 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              AI 提供商
            </label>
            <select
              value={config.provider}
              onChange={(e) => {
                const provider = e.target.value as AIConfig['provider'];
                const models = PROVIDERS.find(p => p.id === provider)?.models || [];
                setConfig({ ...config, provider, model: models[0] });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          {/* 模型选择 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              模型
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {selectedProvider?.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          {/* API Key */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              API Key 仅存储在本地浏览器中
            </p>
          </div>
          
          {/* Temperature */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>保守 (0)</span>
              <span>平衡 (0.5)</span>
              <span>创造 (1)</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add app/components/layout/SettingsModal.tsx
git commit -m "ui: add SettingsModal with multi-provider support"
```

---

### Phase 4: AI Agent集成

#### Task 4.1: 创建AI Tools
**Files:**
- Create: `lib/ai/tools.ts`

**Step 1: 实现Tools**
```typescript
// lib/ai/tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { getNearbyCities } from '@/lib/cities/utils';
import { fetchWeather } from '@/lib/weather/api';
import { weatherCache } from '@/lib/weather/cache';

export const tools = {
  get_location: tool({
    description: '获取用户当前城市位置',
    parameters: z.object({}),
    execute: async () => {
      // 在实际实现中，这需要前端传入位置
      // 这里返回默认值
      return { city: '上海', lat: 31.2304, lng: 121.4737 };
    },
  }),
  
  parse_date: tool({
    description: '解析用户输入的自然语言日期',
    parameters: z.object({
      query: z.string().describe('如"这周六"、"明天"、"2026-04-12"'),
    }),
    execute: async ({ query }) => {
      // 简化的日期解析
      const now = new Date();
      let targetDate = new Date();
      
      if (query.includes('这周六')) {
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilSaturday);
      } else if (query.includes('这周日')) {
        const daysUntilSunday = (7 - now.getDay() + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilSunday);
      } else if (query.includes('明天')) {
        targetDate.setDate(now.getDate() + 1);
      } else if (query.includes('后天')) {
        targetDate.setDate(now.getDate() + 2);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(query)) {
        targetDate = new Date(query);
      }
      
      return {
        date: targetDate.toISOString().split('T')[0],
        display: targetDate.toLocaleDateString('zh-CN', { 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        }),
      };
    },
  }),
  
  get_nearby_cities: tool({
    description: '获取指定城市周边的可达城市',
    parameters: z.object({
      city: z.string().describe('出发城市名'),
      maxDistance: z.number().optional().describe('最大距离（公里），默认300'),
    }),
    execute: async ({ city, maxDistance = 300 }) => {
      try {
        const cities = getNearbyCities(city, maxDistance);
        return { cities, count: cities.length };
      } catch (error) {
        return { error: (error as Error).message, cities: [] };
      }
    },
  }),
  
  get_weather: tool({
    description: '查询指定城市指定日期的天气',
    parameters: z.object({
      city: z.string().describe('城市名'),
      date: z.string().describe('日期（YYYY-MM-DD）'),
    }),
    execute: async ({ city, date }) => {
      try {
        // 检查缓存
        const cached = weatherCache.get(city, date);
        if (cached) {
          return { ...cached, cached: true };
        }
        
        const weather = await fetchWeather(city, date);
        weatherCache.set(city, date, weather);
        return weather;
      } catch (error) {
        return { error: (error as Error).message };
      }
    },
  }),
};
```

**Step 2: Commit**
```bash
git add lib/ai/tools.ts
git commit -m "feat: implement AI tools for location, date parsing, cities, and weather"
```

---

#### Task 4.2: 创建Agent API Route
**Files:**
- Create: `app/api/agent/route.ts`

**Step 1: 实现流式Agent API**
```typescript
// app/api/agent/route.ts
import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { tools } from '@/lib/ai/tools';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, config } = await req.json();
    
    // TODO: 根据config.provider选择不同的模型
    // 这里先用OpenAI作为示例
    
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: convertToCoreMessages(messages),
      tools,
      system: `你是一个专业的出行决策助手。帮助用户根据天气选择周边城市。

你可以使用以下工具：
1. get_location - 获取当前位置
2. parse_date - 解析日期
3. get_nearby_cities - 获取周边城市
4. get_weather - 查询天气

工作流程：
1. 先获取用户位置和日期
2. 查询周边城市
3. 并行查询所有城市的天气
4. 综合天气、交通等因素推荐最佳城市

请用友好、简洁的中文回答。推荐时给出具体理由。`,
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 2000,
    });
    
    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Agent API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request', message: (error as Error).message }),
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**
```bash
git add app/api/agent/route.ts
git commit -m "feat: add streaming Agent API with tool use"
```

---

### Phase 5: 核心页面和组件

#### Task 5.1: 创建主页面布局
**Files:**
- Modify: `app/page.tsx`

**Step 1: 实现主页面**
```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/layout/SettingsModal';
import { ChatContainer } from './components/chat/ChatContainer';
import { WeatherMap } from './components/map/WeatherMap';
import { CityCardGrid } from './components/cards/CityCardGrid';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />
      
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* 左侧对话区 */}
          <div className="space-y-4">
            <ChatContainer 
              onWeatherUpdate={setWeatherData}
            />
          </div>
          
          {/* 右侧内容区 */}
          <div className="space-y-4">
            {/* 地图 */}
            <WeatherMap 
              weatherData={weatherData}
              className="h-[400px] rounded-2xl"
            />
            
            {/* 城市卡片 */}
            <CityCardGrid 
              weatherData={weatherData}
            />
          </div>
        </div>
      </main>
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add app/page.tsx
git commit -m "feat: implement main page layout with chat, map, and cards"
```

---

（后续Task 5.2-5.4将实现ChatContainer、WeatherMap、CityCardGrid组件，Task 6为Vercel部署配置，Task 7为测试和优化）

---

#### Task 5.2: 创建聊天组件
**Files:**
- Create: `app/components/chat/ChatContainer.tsx`
- Create: `app/components/chat/MessageBubble.tsx`
- Create: `app/components/chat/ChatInput.tsx`

**Step 1: ChatContainer实现**
```typescript
// app/components/chat/ChatContainer.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatContainerProps {
  onWeatherUpdate: (data: any[]) => void;
}

export function ChatContainer({ onWeatherUpdate }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_config');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/agent',
    body: { config },
  });
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="glass flex h-[600px] flex-col rounded-2xl">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-medium mb-2">👋 嗨！想去哪里玩？</p>
            <p className="text-sm">告诉我时间和地点，我帮你查天气</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="animate-pulse">🤔</div>
            <span>正在思考...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
```

**Step 2: MessageBubble和ChatInput**
```typescript
// app/components/chat/MessageBubble.tsx
export function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
        isUser ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200'
      }`}>
        <span className="mr-2">{isUser ? '👤' : '🤖'}</span>
        {message.content}
      </div>
    </div>
  );
}

// app/components/chat/ChatInput.tsx
export function ChatInput({ input, onChange, onSubmit, isLoading }: any) {
  return (
    <form onSubmit={onSubmit} className="border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={onChange}
          placeholder="输入消息..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
        />
        <button type="submit" disabled={isLoading} className="bg-primary-600 text-white px-4 py-2 rounded-lg">
          发送
        </button>
      </div>
    </form>
  );
}
```

**Step 3: Commit**
```bash
git add app/components/chat/
git commit -m "ui: add chat components with streaming support"
```

---

### Phase 6: Vercel部署

#### Task 6.1: 配置部署
**Files:**
- Create: `.env.local.example`
- Create: `vercel.json`

**Step 1: 环境变量模板**
```
# .env.local.example
WEATHER_API_KEY=your_qweather_api_key
OPENAI_API_KEY=sk-your_key
```

**Step 2: Vercel配置**
```json
{
  "functions": {
    "app/api/agent/route.ts": {
      "maxDuration": 30
    }
  }
}
```

**Step 3: Commit和部署**
```bash
git add .env.local.example vercel.json
git commit -m "config: add deployment configuration"

# 部署
npx vercel --prod
```

---

## 验收标准

- [ ] 页面加载正常，显示天气对比
- [ ] Agent对话可用，流式响应
- [ ] 5秒内给出结果
- [ ] Vercel部署成功

---

**计划完成！选择执行方式：**

1. **Subagent-Driven** - 本会话逐个Task执行
2. **Parallel Session** - 新会话批量执行

**你选择哪种？**

