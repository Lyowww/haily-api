import { WardrobeCategory, SeasonTag } from '../wardrobe/enums';

export type WeatherNeed = 'cold' | 'mild' | 'hot';

export interface OutfitWeatherValidationInput {
  // From Open-Meteo
  weather: {
    currentTempC: number;
    todayMinTempC: number;
    todayMaxTempC: number;
    condition: string;
  };

  // From user settings
  thresholds: {
    coldThresholdC: number;
    hotThresholdC: number;
    tempChangeThresholdC: number;
  };

  // From outfit record
  outfit: {
    savedWeatherJson?: string | null;
    wardrobeItems?: Array<{
      category?: string | null;
      seasonTags?: string | null; // JSON array string
    }>;
  };
}

export interface OutfitWeatherValidationResult {
  need: WeatherNeed;
  ok: boolean;
  reason?:
    | 'too_cold_for_outfit'
    | 'too_hot_for_outfit'
    | 'temperature_changed'
    | 'missing_outfit_context';
  details: {
    warmthScore: number;
    currentTempC: number;
    todayMinTempC: number;
    todayMaxTempC: number;
    outfitTempC?: number;
  };
}

function parseSeasonTags(seasonTagsJson?: string | null): string[] {
  if (!seasonTagsJson) return [];
  try {
    const parsed = JSON.parse(seasonTagsJson);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function computeWarmthScore(items: OutfitWeatherValidationInput['outfit']['wardrobeItems']): number {
  if (!items || items.length === 0) return 0;

  let score = 0;
  for (const item of items) {
    const category = String(item.category ?? '').toLowerCase();
    const seasons = parseSeasonTags(item.seasonTags);

    if (category === WardrobeCategory.OUTERWEAR) score += 2;
    if (seasons.includes(SeasonTag.WINTER)) score += 1;
    if (seasons.includes(SeasonTag.SUMMER)) score -= 1;
  }
  return score;
}

function computeNeed(params: {
  todayMinTempC: number;
  todayMaxTempC: number;
  coldThresholdC: number;
  hotThresholdC: number;
}): WeatherNeed {
  if (params.todayMinTempC <= params.coldThresholdC) return 'cold';
  if (params.todayMaxTempC >= params.hotThresholdC) return 'hot';
  return 'mild';
}

export function validateOutfitAgainstWeather(
  input: OutfitWeatherValidationInput,
): OutfitWeatherValidationResult {
  const warmthScore = computeWarmthScore(input.outfit.wardrobeItems);
  const need = computeNeed({
    todayMinTempC: input.weather.todayMinTempC,
    todayMaxTempC: input.weather.todayMaxTempC,
    coldThresholdC: input.thresholds.coldThresholdC,
    hotThresholdC: input.thresholds.hotThresholdC,
  });

  let outfitTempC: number | undefined;
  if (input.outfit.savedWeatherJson) {
    try {
      const parsed = JSON.parse(input.outfit.savedWeatherJson);
      const t = Number(parsed?.temperature);
      if (Number.isFinite(t)) outfitTempC = t;
    } catch {
      // ignore
    }
  }

  // If we have no wardrobe items AND no saved outfit weather, we can't validate.
  const hasWardrobeContext = (input.outfit.wardrobeItems?.length ?? 0) > 0;
  const hasSavedTemp = typeof outfitTempC === 'number';
  if (!hasWardrobeContext && !hasSavedTemp) {
    return {
      need,
      ok: true,
      reason: 'missing_outfit_context',
      details: {
        warmthScore,
        currentTempC: input.weather.currentTempC,
        todayMinTempC: input.weather.todayMinTempC,
        todayMaxTempC: input.weather.todayMaxTempC,
      },
    };
  }

  // Primary: category mismatch (warmthScore heuristic)
  const coldReady = warmthScore >= 2;
  if (need === 'cold' && !coldReady) {
    return {
      need,
      ok: false,
      reason: 'too_cold_for_outfit',
      details: {
        warmthScore,
        currentTempC: input.weather.currentTempC,
        todayMinTempC: input.weather.todayMinTempC,
        todayMaxTempC: input.weather.todayMaxTempC,
        outfitTempC,
      },
    };
  }
  if (need === 'hot' && coldReady) {
    return {
      need,
      ok: false,
      reason: 'too_hot_for_outfit',
      details: {
        warmthScore,
        currentTempC: input.weather.currentTempC,
        todayMinTempC: input.weather.todayMinTempC,
        todayMaxTempC: input.weather.todayMaxTempC,
        outfitTempC,
      },
    };
  }

  // Secondary: temperature changed a lot since the outfit was generated/saved.
  if (hasSavedTemp) {
    const delta = Math.abs(input.weather.currentTempC - outfitTempC!);
    if (delta >= input.thresholds.tempChangeThresholdC) {
      return {
        need,
        ok: false,
        reason: 'temperature_changed',
        details: {
          warmthScore,
          currentTempC: input.weather.currentTempC,
          todayMinTempC: input.weather.todayMinTempC,
          todayMaxTempC: input.weather.todayMaxTempC,
          outfitTempC,
        },
      };
    }
  }

  return {
    need,
    ok: true,
    details: {
      warmthScore,
      currentTempC: input.weather.currentTempC,
      todayMinTempC: input.weather.todayMinTempC,
      todayMaxTempC: input.weather.todayMaxTempC,
      outfitTempC,
    },
  };
}

