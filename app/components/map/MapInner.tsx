'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { WEATHER_CONDITION_MAP, type WeatherData } from '@/types'
import { CITY_DATABASE } from '@/lib/cities/data'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
})

interface MapInnerProps {
  weatherData: WeatherData[]
  originCity?: string
  className?: string
}

export default function MapInner({ weatherData, className }: MapInnerProps) {
  const getWeatherIcon = (weather: WeatherData) => {
    const condition = WEATHER_CONDITION_MAP[weather.weather]
    return condition?.icon || '🌡️'
  }

  const createWeatherIcon = (weather: WeatherData) => {
    const icon = getWeatherIcon(weather)
    return L.divIcon({
      html: `<div style="font-size: 24px; text-align: center;">${icon}</div>`,
      className: 'weather-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }

  const getCityPosition = (cityName: string): [number, number] => {
    const city = CITY_DATABASE[cityName]
    if (city) {
      return [city.lat, city.lng]
    }
    for (const city of Object.values(CITY_DATABASE)) {
      const nearby = city.nearby.find((n) => n.name === cityName)
      if (nearby) {
        return [nearby.lat, nearby.lng]
      }
    }
    return [31.2304, 121.4737]
  }

  return (
    <div className={`h-full w-full ${className || ''}`}>
      <MapContainer
        center={[31.2304, 121.4737]}
        zoom={8}
        scrollWheelZoom={true}
        className="h-full w-full rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {weatherData.map((data) => {
          const position = getCityPosition(data.city)
          return (
            <Marker key={data.city} icon={createWeatherIcon(data)} position={position}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">{data.city}</p>
                  <p>
                    {getWeatherIcon(data)} {WEATHER_CONDITION_MAP[data.weather]?.label}
                  </p>
                  <p className="tabular-nums">
                    {data.tempHigh}° / {data.tempLow}°
                  </p>
                  <p className="text-sm text-gray-500">降雨概率：{data.rainProbability}%</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
