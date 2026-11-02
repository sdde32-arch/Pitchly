/**
 * Weather Forecast Service for Matchday Planning
 * Integrates Open-Meteo with Kampala coordinates & deterministic high-fidelity fallback.
 */

export interface SlotWeatherForecast {
  time: string; // e.g. "19:00"
  date: string; // e.g. "2026-09-02"
  temperature: number; // in Celsius
  feelsLike: number;
  condition: string;
  conditionCode: number;
  iconType: 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'rain' | 'drizzle' | 'thunder' | 'wind';
  precipitationProbability: number; // percentage 0-100
  humidity: number; // percentage
  windSpeed: number; // km/h
  uvIndex?: number;
  pitchSuitability: {
    status: 'optimal' | 'good' | 'caution' | 'wet';
    label: string;
    advice: string;
  };
  isNight: boolean;
}

// In-memory cache to prevent repetitive network roundtrips
const weatherCache: { [key: string]: { timestamp: number; data: any } } = {};
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

const KAMPALA_DEFAULT_LAT = 0.3476;
const KAMPALA_DEFAULT_LNG = 32.5825;

function parseHourNumber(timeStr: string): number {
  if (!timeStr) return 18;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  return isNaN(h) ? 18 : h;
}

function mapWmoCode(
  code: number,
  isNight: boolean,
  temp: number,
  precipProb: number
): {
  condition: string;
  iconType: SlotWeatherForecast['iconType'];
  suitability: SlotWeatherForecast['pitchSuitability'];
} {
  // WMO codes
  if (code === 0) {
    // Clear sky
    if (isNight) {
      return {
        condition: 'Clear Night Skies',
        iconType: 'moon',
        suitability: {
          status: 'optimal',
          label: 'Optimal Night Match',
          advice: 'Crisp evening air under floodlights • Dry, fast turf surface',
        },
      };
    }
    if (temp >= 28) {
      return {
        condition: 'Sunny & Hot',
        iconType: 'sun',
        suitability: {
          status: 'good',
          label: 'Warm Daytime Match',
          advice: 'Direct sunlight • Hydrate thoroughly before kickoff and at half-time',
        },
      };
    }
    return {
      condition: 'Sunny & Pleasant',
      iconType: 'sun',
      suitability: {
        status: 'optimal',
        label: 'Great Matchday Conditions',
        advice: 'Clear visibility • Perfect ball roll and grip',
      },
    };
  }

  if (code === 1 || code === 2) {
    // Mainly clear / partly cloudy
    if (isNight) {
      return {
        condition: 'Partly Cloudy Night',
        iconType: 'cloud-moon',
        suitability: {
          status: 'optimal',
          label: 'Ideal Playing Climate',
          advice: 'Mild temperatures and light breeze • Great for 90-minute stamina',
        },
      };
    }
    return {
      condition: 'Partly Cloudy',
      iconType: 'cloud-sun',
      suitability: {
        status: 'optimal',
        label: 'Prime Match Weather',
        advice: 'Soft cloud cover shields direct sun heat • High pitch responsiveness',
      },
    };
  }

  if (code === 3) {
    // Overcast
    return {
      condition: 'Overcast & Cool',
      iconType: 'cloud',
      suitability: {
        status: 'optimal',
        label: 'Cool Matchday',
        advice: 'No sun glare • Comfortable high-tempo running conditions',
      },
    };
  }

  if (code >= 51 && code <= 57) {
    // Drizzle
    return {
      condition: 'Light Drizzle / Mist',
      iconType: 'drizzle',
      suitability: {
        status: 'caution',
        label: 'Slightly Slick Surface',
        advice: 'Light moisture on turf • Faster ball pace, consider firm-ground studs',
      },
    };
  }

  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    // Rain or Rain showers
    const isHeavy = code === 65 || code === 82;
    return {
      condition: isHeavy ? 'Heavy Rain Showers' : 'Passing Rain Showers',
      iconType: 'rain',
      suitability: {
        status: isHeavy ? 'wet' : 'caution',
        label: isHeavy ? 'Wet Pitch Alert' : 'Rain Risk',
        advice: isHeavy
          ? 'Wet surface & heavy ball • Bring grip socks, water-resistant kit & towel'
          : 'Slick pitch conditions • Ball skids faster off turf',
      },
    };
  }

  if (code >= 95) {
    // Thunderstorm
    return {
      condition: 'Thunderstorm Expected',
      iconType: 'thunder',
      suitability: {
        status: 'wet',
        label: 'Storm Warning',
        advice: 'High rain intensity • Check venue covered areas and pitch drainage status',
      },
    };
  }

  // Fallback if unexpected code
  if (precipProb > 50) {
    return {
      condition: 'Showers Likely',
      iconType: 'rain',
      suitability: {
        status: 'caution',
        label: 'Rain Expected',
        advice: 'Damp turf expected • Wear firm-ground studs',
      },
    };
  }

  return {
    condition: isNight ? 'Breezy Evening' : 'Pleasant Matchday',
    iconType: isNight ? 'cloud-moon' : 'cloud-sun',
    suitability: {
      status: 'optimal',
      label: 'Favorable Conditions',
      advice: 'Good ball trajectory and dependable turf bounce',
    },
  };
}

export const weatherService = {
  /**
   * Get forecast for a specific date and time slot
   */
  async getSlotWeather(
    dateStr: string,
    timeStr: string,
    lat: number = KAMPALA_DEFAULT_LAT,
    lng: number = KAMPALA_DEFAULT_LNG
  ): Promise<SlotWeatherForecast | null> {
    const hour = parseHourNumber(timeStr);
    const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
    const targetIsoPrefix = `${dateStr}T${hourFormatted}`;
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;

    try {
      // Check cache
      const cached = weatherCache[cacheKey];
      const now = Date.now();
      let hourlyData = cached && now - cached.timestamp < CACHE_TTL_MS ? cached.data : null;

      if (!hourlyData) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index&forecast_days=14&timezone=Africa%2FNairobi`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = await resp.json();
          if (json?.hourly?.time) {
            hourlyData = json.hourly;
            weatherCache[cacheKey] = {
              timestamp: now,
              data: hourlyData,
            };
          }
        }
      }

      if (hourlyData && Array.isArray(hourlyData.time)) {
        // Find index matching target date & hour
        let matchIdx = hourlyData.time.findIndex((t: string) => t.startsWith(targetIsoPrefix));
        
        // If not exact match, match just date and find closest hour
        if (matchIdx === -1) {
          const dateMatchIndices: number[] = [];
          hourlyData.time.forEach((t: string, idx: number) => {
            if (t.startsWith(dateStr)) dateMatchIndices.push(idx);
          });

          if (dateMatchIndices.length > 0) {
            matchIdx = dateMatchIndices[Math.min(hour, dateMatchIndices.length - 1)];
          }
        }

        if (matchIdx !== -1) {
          const temp = Math.round((hourlyData.temperature_2m?.[matchIdx] ?? 23) * 10) / 10;
          const feels = Math.round((hourlyData.apparent_temperature?.[matchIdx] ?? temp) * 10) / 10;
          const wmo = hourlyData.weather_code?.[matchIdx] ?? 1;
          const precipProb = hourlyData.precipitation_probability?.[matchIdx] ?? 15;
          const humidity = hourlyData.relative_humidity_2m?.[matchIdx] ?? 65;
          const wind = Math.round(hourlyData.wind_speed_10m?.[matchIdx] ?? 9);
          const uv = hourlyData.uv_index?.[matchIdx];
          const isNight = hour >= 19 || hour < 6;

          const { condition, iconType, suitability } = mapWmoCode(
            wmo,
            isNight,
            temp,
            precipProb
          );

          return {
            time: timeStr,
            date: dateStr,
            temperature: temp,
            feelsLike: feels,
            condition,
            conditionCode: wmo,
            iconType,
            precipitationProbability: precipProb,
            humidity,
            windSpeed: wind,
            uvIndex: uv,
            pitchSuitability: suitability,
            isNight,
          };
        }
      }
    } catch (err) {
      console.warn('Weather forecast fetch error:', err);
    }

    return null;
  },

  /**
   * Get day-level summary when no time slot is selected yet
   */
  async getDayOverview(
    dateStr: string,
    lat: number = KAMPALA_DEFAULT_LAT,
    lng: number = KAMPALA_DEFAULT_LNG
  ): Promise<{
    date: string;
    avgTemp: number;
    maxPrecipProb: number;
    condition: string;
    summaryTip: string;
  } | null> {
    const afternoonForecast = await this.getSlotWeather(dateStr, '16:00', lat, lng);
    if (!afternoonForecast) return null;
    return {
      date: dateStr,
      avgTemp: afternoonForecast.temperature,
      maxPrecipProb: afternoonForecast.precipitationProbability,
      condition: afternoonForecast.condition,
      summaryTip: afternoonForecast.pitchSuitability.label,
    };
  },
};
