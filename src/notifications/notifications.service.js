"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
var common_1 = require("@nestjs/common");
var outfit_weather_validator_1 = require("./outfit-weather.validator");
function parseNotifyMinutes(hhmm) {
    var m = /^(\d{2}):(\d{2})$/.exec(hhmm);
    if (!m)
        return null;
    var hh = Number(m[1]);
    var mm = Number(m[2]);
    if (!Number.isInteger(hh) || !Number.isInteger(mm))
        return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59)
        return null;
    return hh * 60 + mm;
}
function getLocalParts(date, timeZone) {
    var _a, _b, _c, _d, _e;
    var parts;
    try {
        parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).formatToParts(date);
    }
    catch (_f) {
        // Invalid/unknown timezone string: fall back to UTC.
        parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).formatToParts(date);
    }
    var get = function (type) { var _a; return (_a = parts.find(function (p) { return p.type === type; })) === null || _a === void 0 ? void 0 : _a.value; };
    var year = (_a = get('year')) !== null && _a !== void 0 ? _a : '1970';
    var month = (_b = get('month')) !== null && _b !== void 0 ? _b : '01';
    var day = (_c = get('day')) !== null && _c !== void 0 ? _c : '01';
    var hour = Number((_d = get('hour')) !== null && _d !== void 0 ? _d : '0');
    var minute = Number((_e = get('minute')) !== null && _e !== void 0 ? _e : '0');
    return {
        dateKey: "".concat(year, "-").concat(month, "-").concat(day),
        minutes: hour * 60 + minute,
    };
}
function hoursSince(date) {
    return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}
var NotificationsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var NotificationsService = _classThis = /** @class */ (function () {
        function NotificationsService_1(prisma, weatherService) {
            this.prisma = prisma;
            this.weatherService = weatherService;
        }
        NotificationsService_1.prototype.getOrCreateSettings = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var existing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.notificationSettings.findUnique({ where: { userId: userId } })];
                        case 1:
                            existing = _a.sent();
                            if (existing)
                                return [2 /*return*/, existing];
                            return [2 /*return*/, this.prisma.notificationSettings.create({ data: { userId: userId } })];
                    }
                });
            });
        };
        NotificationsService_1.prototype.updateSettings = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var current;
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                return __generator(this, function (_m) {
                    switch (_m.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateSettings(userId)];
                        case 1:
                            current = _m.sent();
                            return [2 /*return*/, this.prisma.notificationSettings.update({
                                    where: { id: current.id },
                                    data: {
                                        enabled: (_a = dto.enabled) !== null && _a !== void 0 ? _a : undefined,
                                        expoPushToken: (_b = dto.expoPushToken) !== null && _b !== void 0 ? _b : undefined,
                                        latitude: (_c = dto.latitude) !== null && _c !== void 0 ? _c : undefined,
                                        longitude: (_d = dto.longitude) !== null && _d !== void 0 ? _d : undefined,
                                        timezone: (_e = dto.timezone) !== null && _e !== void 0 ? _e : undefined,
                                        notifyAtLocalTime: (_f = dto.notifyAtLocalTime) !== null && _f !== void 0 ? _f : undefined,
                                        coldThresholdC: (_g = dto.coldThresholdC) !== null && _g !== void 0 ? _g : undefined,
                                        hotThresholdC: (_h = dto.hotThresholdC) !== null && _h !== void 0 ? _h : undefined,
                                        tempChangeThresholdC: (_j = dto.tempChangeThresholdC) !== null && _j !== void 0 ? _j : undefined,
                                        notifyOnWeatherChange: (_k = dto.notifyOnWeatherChange) !== null && _k !== void 0 ? _k : undefined,
                                        minHoursBetweenNotifs: (_l = dto.minHoursBetweenNotifs) !== null && _l !== void 0 ? _l : undefined,
                                    },
                                })];
                    }
                });
            });
        };
        NotificationsService_1.prototype.listNotifications = function (userId, opts) {
            return __awaiter(this, void 0, void 0, function () {
                var take, where, notifications;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            take = Math.min(Math.max((_a = opts === null || opts === void 0 ? void 0 : opts.take) !== null && _a !== void 0 ? _a : 50, 1), 200);
                            where = { userId: userId };
                            if (opts === null || opts === void 0 ? void 0 : opts.unreadOnly)
                                where.readAt = null;
                            return [4 /*yield*/, this.prisma.notification.findMany({
                                    where: where,
                                    orderBy: { createdAt: 'desc' },
                                    take: take,
                                })];
                        case 1:
                            notifications = _b.sent();
                            return [2 /*return*/, { notifications: notifications }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.markRead = function (userId, notificationId) {
            return __awaiter(this, void 0, void 0, function () {
                var n;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.notification.findUnique({ where: { id: notificationId } })];
                        case 1:
                            n = _a.sent();
                            if (!n || n.userId !== userId)
                                return [2 /*return*/, null];
                            return [2 /*return*/, this.prisma.notification.update({
                                    where: { id: notificationId },
                                    data: { readAt: new Date() },
                                })];
                    }
                });
            });
        };
        NotificationsService_1.prototype.runWeatherOutfitCheckForUser = function (userId, opts) {
            return __awaiter(this, void 0, void 0, function () {
                var settings, weather, latestOutfit, validation, title, body, data, created, sent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateSettings(userId)];
                        case 1:
                            settings = _a.sent();
                            if (!settings.enabled)
                                return [2 /*return*/, { ok: true, skipped: 'disabled' }];
                            if (settings.latitude == null || settings.longitude == null)
                                return [2 /*return*/, { ok: true, skipped: 'missing_location' }];
                            // Rate-limit unless forced
                            if (!(opts === null || opts === void 0 ? void 0 : opts.force) && settings.lastNotifiedAt && hoursSince(settings.lastNotifiedAt) < settings.minHoursBetweenNotifs) {
                                return [2 /*return*/, { ok: true, skipped: 'rate_limited' }];
                            }
                            return [4 /*yield*/, this.weatherService.getTodaySummary({
                                    latitude: settings.latitude,
                                    longitude: settings.longitude,
                                    timezone: settings.timezone || 'auto',
                                })];
                        case 2:
                            weather = _a.sent();
                            return [4 /*yield*/, this.prisma.outfit.findFirst({
                                    where: { userId: userId, status: 'ready' },
                                    orderBy: { createdAt: 'desc' },
                                    include: {
                                        outfitItems: {
                                            include: {
                                                wardrobeItem: true,
                                            },
                                        },
                                    },
                                })];
                        case 3:
                            latestOutfit = _a.sent();
                            if (!latestOutfit) {
                                return [2 /*return*/, { ok: true, skipped: 'no_outfit', weather: weather }];
                            }
                            validation = (0, outfit_weather_validator_1.validateOutfitAgainstWeather)({
                                weather: {
                                    currentTempC: weather.current.temperatureC,
                                    todayMinTempC: weather.today.minTempC,
                                    todayMaxTempC: weather.today.maxTempC,
                                    condition: weather.today.condition,
                                },
                                thresholds: {
                                    coldThresholdC: settings.coldThresholdC,
                                    hotThresholdC: settings.hotThresholdC,
                                    tempChangeThresholdC: settings.tempChangeThresholdC,
                                },
                                outfit: {
                                    savedWeatherJson: latestOutfit.weather,
                                    wardrobeItems: latestOutfit.outfitItems.map(function (oi) {
                                        var _a, _b;
                                        return ({
                                            category: (_a = oi.wardrobeItem) === null || _a === void 0 ? void 0 : _a.category,
                                            seasonTags: (_b = oi.wardrobeItem) === null || _b === void 0 ? void 0 : _b.seasonTags,
                                        });
                                    }),
                                },
                            });
                            // Respect toggle: if we only detected temperature change, and the user disabled change-based notifications.
                            if (!validation.ok && validation.reason === 'temperature_changed' && !settings.notifyOnWeatherChange) {
                                return [2 /*return*/, { ok: true, skipped: 'change_notifications_disabled', weather: weather, validation: validation }];
                            }
                            if (validation.ok) {
                                return [2 /*return*/, { ok: true, weather: weather, validation: validation }];
                            }
                            title = validation.reason === 'too_cold_for_outfit'
                                ? 'Your outfit may be too light today'
                                : validation.reason === 'too_hot_for_outfit'
                                    ? 'Your outfit may be too warm today'
                                    : 'Weather changed — outfit check';
                            body = validation.reason === 'too_cold_for_outfit'
                                ? "It\u2019s cold today (".concat(weather.today.minTempC, "\u2013").concat(weather.today.maxTempC, "\u00B0C). Consider adding outerwear.")
                                : validation.reason === 'too_hot_for_outfit'
                                    ? "It\u2019s warm today (".concat(weather.today.minTempC, "\u2013").concat(weather.today.maxTempC, "\u00B0C). Consider lighter layers.")
                                    : "Current temperature is ".concat(weather.current.temperatureC, "\u00B0C (today ").concat(weather.today.minTempC, "\u2013").concat(weather.today.maxTempC, "\u00B0C).");
                            data = {
                                reason: validation.reason,
                                need: validation.need,
                                outfitId: latestOutfit.id,
                                weather: {
                                    currentTempC: weather.current.temperatureC,
                                    todayMinTempC: weather.today.minTempC,
                                    todayMaxTempC: weather.today.maxTempC,
                                    condition: weather.today.condition,
                                },
                            };
                            return [4 /*yield*/, this.prisma.notification.create({
                                    data: {
                                        userId: userId,
                                        type: 'OUTFIT_WEATHER',
                                        title: title,
                                        body: body,
                                        data: JSON.stringify(data),
                                    },
                                })];
                        case 4:
                            created = _a.sent();
                            sent = false;
                            if (!settings.expoPushToken) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.trySendExpoPush(settings.expoPushToken, {
                                    title: title,
                                    body: body,
                                    data: __assign({ notificationId: created.id }, data),
                                })];
                        case 5:
                            sent = _a.sent();
                            if (!sent) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.prisma.notification.update({
                                    where: { id: created.id },
                                    data: { sentAt: new Date() },
                                })];
                        case 6:
                            _a.sent();
                            _a.label = 7;
                        case 7: return [4 /*yield*/, this.prisma.notificationSettings.update({
                                where: { id: settings.id },
                                data: { lastNotifiedAt: new Date() },
                            })];
                        case 8:
                            _a.sent();
                            return [2 /*return*/, { ok: true, created: created, sent: sent, weather: weather, validation: validation }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.shouldRunDailyCheckNow = function (settings) {
            return __awaiter(this, void 0, void 0, function () {
                var tz, now, _a, todayKey, nowMinutes, notifyMinutes, windowMinutes, withinWindow, lastKey;
                return __generator(this, function (_b) {
                    if (!settings.enabled)
                        return [2 /*return*/, false];
                    tz = settings.timezone || 'UTC';
                    now = new Date();
                    _a = getLocalParts(now, tz), todayKey = _a.dateKey, nowMinutes = _a.minutes;
                    notifyMinutes = parseNotifyMinutes(settings.notifyAtLocalTime);
                    if (notifyMinutes == null)
                        return [2 /*return*/, false];
                    windowMinutes = 10;
                    withinWindow = nowMinutes >= notifyMinutes && nowMinutes <= notifyMinutes + windowMinutes;
                    if (!withinWindow)
                        return [2 /*return*/, false];
                    if (!settings.lastNotifiedAt)
                        return [2 /*return*/, true];
                    lastKey = getLocalParts(settings.lastNotifiedAt, tz).dateKey;
                    return [2 /*return*/, lastKey !== todayKey];
                });
            });
        };
        NotificationsService_1.prototype.trySendExpoPush = function (expoPushToken, message) {
            return __awaiter(this, void 0, void 0, function () {
                var res, json, status_1, _a;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _d.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, fetch('https://exp.host/--/api/v2/push/send', {
                                    method: 'POST',
                                    headers: {
                                        'accept': 'application/json',
                                        'accept-encoding': 'gzip, deflate',
                                        'content-type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        to: expoPushToken,
                                        sound: 'default',
                                        title: message.title,
                                        body: message.body,
                                        data: (_b = message.data) !== null && _b !== void 0 ? _b : {},
                                    }),
                                })];
                        case 1:
                            res = _d.sent();
                            if (!res.ok)
                                return [2 /*return*/, false];
                            return [4 /*yield*/, res.json().catch(function () { return null; })];
                        case 2:
                            json = _d.sent();
                            status_1 = (_c = json === null || json === void 0 ? void 0 : json.data) === null || _c === void 0 ? void 0 : _c.status;
                            return [2 /*return*/, status_1 === 'ok'];
                        case 3:
                            _a = _d.sent();
                            return [2 /*return*/, false];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return NotificationsService_1;
    }());
    __setFunctionName(_classThis, "NotificationsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationsService = _classThis;
}();
exports.NotificationsService = NotificationsService;
