'use client';

import React from 'react';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
} from 'lucide-react';

interface ForecastDay {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  icon?: string;
  precipitation_chance?: number;
}

interface WeatherCardProps {
  city?: string;
  location?: string;
  country?: string;
  temperature?: number;
  feels_like?: number;
  condition?: string;
  condition_text?: string;
  description?: string;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: string;
  visibility?: number;
  visibility_unit?: string;
  pressure?: number;
  uv_index?: number;
  sunrise?: string;
  sunset?: string;
  forecast?: ForecastDay[];
  unit?: 'F' | 'C';
  temp_unit?: string;
  wind_unit?: string;
  icon?: string;
  success?: boolean;
  error?: string;
  [key: string]: any;
}

type ConditionTheme = {
  Icon: React.ElementType;
  bg: string;
  accent: string;
  accentMuted: string;
};

const conditionConfig: Record<string, ConditionTheme> = {
  sunny:         { Icon: Sun,            bg: 'linear-gradient(160deg, #f59e0b 0%, #d97706 100%)', accent: '#fffbeb', accentMuted: 'rgba(255,251,235,0.55)' },
  clear:         { Icon: Sun,            bg: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)', accent: '#fcd34d', accentMuted: 'rgba(252,211,77,0.5)' },
  cloudy:        { Icon: Cloud,          bg: 'linear-gradient(160deg, #1e293b 0%, #334155 100%)', accent: '#cbd5e1', accentMuted: 'rgba(203,213,225,0.45)' },
  partly_cloudy: { Icon: CloudSun,       bg: 'linear-gradient(160deg, #0f172a 0%, #334155 100%)', accent: '#93c5fd', accentMuted: 'rgba(147,197,253,0.45)' },
  rainy:         { Icon: CloudRain,      bg: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)', accent: '#93c5fd', accentMuted: 'rgba(147,197,253,0.45)' },
  rain:          { Icon: CloudRain,      bg: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)', accent: '#93c5fd', accentMuted: 'rgba(147,197,253,0.45)' },
  snow:          { Icon: CloudSnow,      bg: 'linear-gradient(160deg, #475569 0%, #94a3b8 100%)', accent: '#f1f5f9', accentMuted: 'rgba(241,245,249,0.5)' },
  thunderstorm:  { Icon: CloudLightning, bg: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)', accent: '#c4b5fd', accentMuted: 'rgba(196,181,253,0.45)' },
  windy:         { Icon: Wind,           bg: 'linear-gradient(160deg, #134e4a 0%, #115e59 100%)', accent: '#99f6e4', accentMuted: 'rgba(153,246,228,0.45)' },
};

const getTheme = (condition: string | undefined | null): ConditionTheme => {
  if (!condition) return conditionConfig.cloudy;
  const key = condition.toLowerCase().replace(/\s+/g, '_');
  return conditionConfig[key] || conditionConfig.cloudy;
};

const getForecastIcon = (condition: string | undefined | null, size = 18) => {
  const { Icon } = getTheme(condition);
  return <Icon size={size} strokeWidth={1.5} />;
};

/* ---- UV label helper ---- */
const uvLabel = (uv: number) => {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
};

export function WeatherCard(props: WeatherCardProps) {
  const city = props.city || props.location || 'Unknown';
  const country = props.country || '';
  const temperature = props.temperature ?? 0;
  const feels_like = props.feels_like;
  const condition = props.condition || props.condition_text || 'cloudy';
  const description = props.description || props.condition_text || '';
  const humidity = props.humidity;
  const wind_speed = props.wind_speed;
  const wind_direction = props.wind_direction || '';
  const visibility = props.visibility;
  const uv_index = props.uv_index;
  const sunrise = props.sunrise;
  const sunset = props.sunset;
  const forecast = props.forecast || [];
  const unit = (props.unit || (props.temp_unit?.includes('C') ? 'C' : 'F')) as 'F' | 'C';

  if (props.success === false && props.error) {
    return (
      <div className="max-w-md rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
        <strong>Weather Error:</strong> {props.error}
      </div>
    );
  }

  const theme = getTheme(condition);
  const { Icon: CondIcon } = theme;

  /* Collect stat items so we can render them in a clean grid */
  const stats: { icon: React.ReactNode; value: string; label: string }[] = [];
  if (humidity !== undefined)
    stats.push({ icon: <Droplets size={15} strokeWidth={1.5} />, value: `${humidity}%`, label: 'Humidity' });
  if (wind_speed !== undefined)
    stats.push({ icon: <Wind size={15} strokeWidth={1.5} />, value: `${wind_speed} mph`, label: `Wind ${wind_direction}`.trim() });
  if (visibility !== undefined)
    stats.push({ icon: <Eye size={15} strokeWidth={1.5} />, value: `${visibility} mi`, label: 'Visibility' });
  if (uv_index !== undefined)
    stats.push({ icon: <Sun size={15} strokeWidth={1.5} />, value: `${uv_index}`, label: `UV ${uvLabel(uv_index)}` });
  if (sunrise)
    stats.push({ icon: <Sunrise size={15} strokeWidth={1.5} />, value: sunrise, label: 'Sunrise' });
  if (sunset)
    stats.push({ icon: <Sunset size={15} strokeWidth={1.5} />, value: sunset, label: 'Sunset' });

  return (
    <div
      className="relative max-w-md overflow-hidden rounded-2xl text-white select-none"
      style={{ background: theme.bg, boxShadow: '0 2px 24px rgba(0,0,0,0.25)' }}
    >
      {/* ---- Decorative background icon ---- */}
      <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.06]">
        <CondIcon size={200} strokeWidth={0.8} />
      </div>

      {/* ---- Hero section ---- */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-6 pb-5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.accentMuted }}>
            {country ? `${city}, ${country}` : city}
          </span>

          <div className="flex items-end gap-1.5 mt-2">
            <span className="text-6xl font-extralight leading-none tracking-tighter tabular-nums">
              {Math.round(temperature)}
            </span>
            <span className="mb-2 text-2xl font-light" style={{ color: theme.accentMuted }}>
              {'°'}{unit}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm font-medium capitalize" style={{ color: theme.accent }}>{condition}</span>
            {description && description.toLowerCase() !== condition.toLowerCase() && (
              <>
                <span className="text-[10px]" style={{ color: theme.accentMuted }}>{'/'}</span>
                <span className="text-xs capitalize" style={{ color: theme.accentMuted }}>{description}</span>
              </>
            )}
          </div>

          {feels_like !== undefined && (
            <span className="mt-0.5 text-xs" style={{ color: theme.accentMuted }}>
              Feels like {Math.round(feels_like)}{'\u00B0'}{unit}
            </span>
          )}
        </div>

        <CondIcon size={48} strokeWidth={1.2} color={theme.accent} className="mt-1 shrink-0 opacity-90" />
      </div>

      {/* ---- Stats row ---- */}
      {stats.length > 0 && (
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 py-3"
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <span style={{ color: theme.accent }} className="opacity-80">{s.icon}</span>
              <span className="text-sm font-semibold leading-none">{s.value}</span>
              <span className="text-[10px] uppercase tracking-wide" style={{ color: theme.accentMuted }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ---- Forecast ---- */}
      {forecast.length > 0 && (
        <div className="px-6 pt-4 pb-5">
          <span
            className="mb-3 block text-[10px] font-bold uppercase tracking-widest"
            style={{ color: theme.accentMuted }}
          >
            {forecast.length}-Day Forecast
          </span>

          <div className="flex gap-1">
            {forecast.map((day, i) => {
              const isToday = i === 0;
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5 transition-colors"
                  style={{
                    background: isToday ? 'rgba(255,255,255,0.1)' : 'transparent',
                  }}
                >
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: isToday ? '#fff' : theme.accentMuted }}
                  >
                    {day.day}
                  </span>
                  <span style={{ color: isToday ? theme.accent : 'rgba(255,255,255,0.7)' }}>
                    {getForecastIcon(day.condition)}
                  </span>
                  <span className="text-sm font-semibold leading-none">{Math.round(day.high)}{'\u00B0'}</span>
                  <span className="text-[11px] leading-none" style={{ color: theme.accentMuted }}>
                    {Math.round(day.low)}{'\u00B0'}
                  </span>
                  {day.precipitation_chance !== undefined && day.precipitation_chance > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: '#93c5fd' }}>
                      <Droplets size={8} strokeWidth={1.5} />
                      {day.precipitation_chance}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherCard;
