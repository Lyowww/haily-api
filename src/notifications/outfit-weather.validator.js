"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOutfitAgainstWeather = validateOutfitAgainstWeather;
var enums_1 = require("../wardrobe/enums");
function parseSeasonTags(seasonTagsJson) {
    if (!seasonTagsJson)
        return [];
    try {
        var parsed = JSON.parse(seasonTagsJson);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    catch (_a) {
        return [];
    }
}
function computeWarmthScore(items) {
    var _a;
    if (!items || items.length === 0)
        return 0;
    var score = 0;
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        var category = String((_a = item.category) !== null && _a !== void 0 ? _a : '').toLowerCase();
        var seasons = parseSeasonTags(item.seasonTags);
        if (category === enums_1.WardrobeCategory.OUTERWEAR)
            score += 2;
        if (seasons.includes(enums_1.SeasonTag.WINTER))
            score += 1;
        if (seasons.includes(enums_1.SeasonTag.SUMMER))
            score -= 1;
    }
    return score;
}
function computeNeed(params) {
    if (params.todayMinTempC <= params.coldThresholdC)
        return 'cold';
    if (params.todayMaxTempC >= params.hotThresholdC)
        return 'hot';
    return 'mild';
}
function validateOutfitAgainstWeather(input) {
    var _a, _b;
    var warmthScore = computeWarmthScore(input.outfit.wardrobeItems);
    var need = computeNeed({
        todayMinTempC: input.weather.todayMinTempC,
        todayMaxTempC: input.weather.todayMaxTempC,
        coldThresholdC: input.thresholds.coldThresholdC,
        hotThresholdC: input.thresholds.hotThresholdC,
    });
    var outfitTempC;
    if (input.outfit.savedWeatherJson) {
        try {
            var parsed = JSON.parse(input.outfit.savedWeatherJson);
            var t = Number(parsed === null || parsed === void 0 ? void 0 : parsed.temperature);
            if (Number.isFinite(t))
                outfitTempC = t;
        }
        catch (_c) {
            // ignore
        }
    }
    // If we have no wardrobe items AND no saved outfit weather, we can't validate.
    var hasWardrobeContext = ((_b = (_a = input.outfit.wardrobeItems) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
    var hasSavedTemp = typeof outfitTempC === 'number';
    if (!hasWardrobeContext && !hasSavedTemp) {
        return {
            need: need,
            ok: true,
            reason: 'missing_outfit_context',
            details: {
                warmthScore: warmthScore,
                currentTempC: input.weather.currentTempC,
                todayMinTempC: input.weather.todayMinTempC,
                todayMaxTempC: input.weather.todayMaxTempC,
            },
        };
    }
    // Primary: category mismatch (warmthScore heuristic)
    var coldReady = warmthScore >= 2;
    if (need === 'cold' && !coldReady) {
        return {
            need: need,
            ok: false,
            reason: 'too_cold_for_outfit',
            details: {
                warmthScore: warmthScore,
                currentTempC: input.weather.currentTempC,
                todayMinTempC: input.weather.todayMinTempC,
                todayMaxTempC: input.weather.todayMaxTempC,
                outfitTempC: outfitTempC,
            },
        };
    }
    if (need === 'hot' && coldReady) {
        return {
            need: need,
            ok: false,
            reason: 'too_hot_for_outfit',
            details: {
                warmthScore: warmthScore,
                currentTempC: input.weather.currentTempC,
                todayMinTempC: input.weather.todayMinTempC,
                todayMaxTempC: input.weather.todayMaxTempC,
                outfitTempC: outfitTempC,
            },
        };
    }
    // Secondary: temperature changed a lot since the outfit was generated/saved.
    if (hasSavedTemp) {
        var delta = Math.abs(input.weather.currentTempC - outfitTempC);
        if (delta >= input.thresholds.tempChangeThresholdC) {
            return {
                need: need,
                ok: false,
                reason: 'temperature_changed',
                details: {
                    warmthScore: warmthScore,
                    currentTempC: input.weather.currentTempC,
                    todayMinTempC: input.weather.todayMinTempC,
                    todayMaxTempC: input.weather.todayMaxTempC,
                    outfitTempC: outfitTempC,
                },
            };
        }
    }
    return {
        need: need,
        ok: true,
        details: {
            warmthScore: warmthScore,
            currentTempC: input.weather.currentTempC,
            todayMinTempC: input.weather.todayMinTempC,
            todayMaxTempC: input.weather.todayMaxTempC,
            outfitTempC: outfitTempC,
        },
    };
}
