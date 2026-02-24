import { Injectable } from '@nestjs/common';

export interface WeatherTodaySummary {
  timezone: string;
  nowIso: string;
  current: {
    temperatureC: number;
    weatherCode: number;
    condition: string;
  };
  today: {
    minTempC: number;
    maxTempC: number;
    weatherCode: number;
    condition: string;
  };
}

export interface DayWeather {
  dayIndex: number;
  date: string;
  minTempC: number;
  maxTempC: number;
  condition: string;
}

function weatherCodeToCondition(code: number): string {
  // Open-Meteo WMO interpretation (compressed to app-friendly buckets)
  if (code === 0) return 'clear';
  if ([1, 2, 3].includes(code)) return 'cloudy';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([80, 81, 82].includes(code)) return 'showers';
  if ([95, 96, 99].includes(code)) return 'thunderstorm';
  return 'unknown';
}

@Injectable()
export class WeatherService {
  async getTodaySummary(params: {
    latitude: number;
    longitude: number;
    timezone?: string;
  }): Promise<WeatherTodaySummary> {
    const timezone = (params.timezone && params.timezone.trim().length > 0) ? params.timezone : 'auto';

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(params.latitude));
    url.searchParams.set('longitude', String(params.longitude));
    url.searchParams.set('timezone', timezone);
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('precipitation_unit', 'mm');
    url.searchParams.set('current', 'temperature_2m,weather_code');
    url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,weather_code');
    url.searchParams.set('forecast_days', '1');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'accept': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Open-Meteo error (${res.status}): ${text || res.statusText}`);
    }

    const json: any = await res.json();

    const currentTemp = Number(json?.current?.temperature_2m);
    const currentCode = Number(json?.current?.weather_code);
    const nowIso = String(json?.current?.time ?? new Date().toISOString());
    const resolvedTz = String(json?.timezone ?? timezone);

    const minTemp = Number(json?.daily?.temperature_2m_min?.[0]);
    const maxTemp = Number(json?.daily?.temperature_2m_max?.[0]);
    const dailyCode = Number(json?.daily?.weather_code?.[0]);

    if (!Number.isFinite(currentTemp) || !Number.isFinite(currentCode)) {
      throw new Error('Open-Meteo response missing current weather fields');
    }
    if (!Number.isFinite(minTemp) || !Number.isFinite(maxTemp) || !Number.isFinite(dailyCode)) {
      throw new Error('Open-Meteo response missing daily weather fields');
    }

    return {
      timezone: resolvedTz,
      nowIso,
      current: {
        temperatureC: currentTemp,
        weatherCode: currentCode,
        condition: weatherCodeToCondition(currentCode),
      },
      today: {
        minTempC: minTemp,
        maxTempC: maxTemp,
        weatherCode: dailyCode,
        condition: weatherCodeToCondition(dailyCode),
      },
    };
  }

  /**
   * Fetch 7-day weather for the selected week (Monday–Sunday).
   * Uses Open-Meteo 16-day forecast and maps to the requested week dates.
   * Days outside the forecast range get fallback mild weather.
   */
  async getWeekForecast(params: {
    latitude: number;
    longitude: number;
    timezone?: string;
    weekStartDate: string;
  }): Promise<DayWeather[]> {
    const tz = (params.timezone?.trim().length) ? params.timezone : 'auto';
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(params.latitude));
    url.searchParams.set('longitude', String(params.longitude));
    url.searchParams.set('timezone', tz);
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,weather_code');
    url.searchParams.set('forecast_days', '16');

    const res = await fetch(url.toString(), { method: 'GET', headers: { accept: 'application/json' } });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Open-Meteo error (${res.status}): ${text || res.statusText}`);
    }
    const json: any = await res.json();
    const times: string[] = json?.daily?.time ?? [];
    const minTemps: number[] = json?.daily?.temperature_2m_min ?? [];
    const maxTemps: number[] = json?.daily?.temperature_2m_max ?? [];
    const codes: number[] = json?.daily?.weather_code ?? [];

    const weekStart = new Date(params.weekStartDate + 'T12:00:00.000Z');
    const dayWeather: DayWeather[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const d = new Date(weekStart);
      d.setUTCDate(d.getUTCDate() + dayIndex);
      const dateStr = d.toISOString().slice(0, 10);
      const i = times.indexOf(dateStr);
      if (i >= 0 && Number.isFinite(minTemps[i]) && Number.isFinite(maxTemps[i])) {
        dayWeather.push({
          dayIndex,
          date: dateStr,
          minTempC: minTemps[i],
          maxTempC: maxTemps[i],
          condition: weatherCodeToCondition(Number(codes[i]) ?? 0),
        });
      } else {
        dayWeather.push({
          dayIndex,
          date: dateStr,
          minTempC: 15,
          maxTempC: 22,
          condition: 'clear',
        });
      }
    }
    return dayWeather;
  }
}

