export interface City {
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  trainTime?: string;
  driveTime?: string;
  qweatherId?: string;
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'overcast';

export interface WeatherData {
  city: string;
  date: string;
  weather: WeatherCondition;
  tempHigh: number;
  tempLow: number;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  airQuality?: number;
  score: number;
  weatherIcon?: string;
  weatherText?: string;
  textNight?: string;
  weatherNight?: WeatherCondition;
  windDirDay?: string;
  windScaleDay?: string;
  vis?: number;
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
  pressure?: number;
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
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  referencedCities?: string[];
}

export type AIProvider = 'openai' | 'zhipu';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export type DateQuery =
  | { type: 'relative'; value: 'this-saturday' | 'this-sunday' | 'tomorrow' | 'day-after-tomorrow' }
  | { type: 'absolute'; value: string };

export interface NearbyCitiesResponse {
  origin: string;
  cities: City[];
  count: number;
}

export interface WeatherAPIResponse {
  weather?: WeatherData;
  error?: string;
  cached?: boolean;
}

export const WEATHER_CONDITION_MAP: Record<WeatherCondition, { label: string; icon: string; color: string }> = {
  sunny: { label: '晴天', icon: '☀️', color: '#f59e0b' },
  cloudy: { label: '多云', icon: '⛅', color: '#6b7280' },
  rainy: { label: '雨天', icon: '🌧️', color: '#1e40af' },
  snowy: { label: '雪天', icon: '❄️', color: '#93c5fd' },
  overcast: { label: '阴天', icon: '☁️', color: '#9ca3af' },
};
