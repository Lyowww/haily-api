import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather';
import { UpdateNotificationSettingsDto } from './dto';
import { validateOutfitAgainstWeather } from './outfit-weather.validator';
import { getWeekStartDate } from '../outfit/outfit.service';
import { SeasonTag } from '../wardrobe/enums';
import { FirebasePushService } from './firebase-push.service';

function parseNotifyMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function getLocalParts(date: Date, timeZone: string): { dateKey: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(date);
  } catch {
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

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = get('year') ?? '1970';
  const month = get('month') ?? '01';
  const day = get('day') ?? '01';
  const hour = Number(get('hour') ?? '0');
  const minute = Number(get('minute') ?? '0');

  return {
    dateKey: `${year}-${month}-${day}`,
    minutes: hour * 60 + minute,
  };
}

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

type WardrobeItemRow = { id: string; category: string; seasonTags: string | null };

function isTop(category: string): boolean {
  const lower = category.toLowerCase();
  return ['top', 'tops', 'outerwear', 'jacket', 'jackets', 'coat', 'coats', 'shirt', 'tshirt', 't-shirt', 'blouse', 'sweater', 'hoodie', 'tank', 'polo'].some(
    (x) => lower.includes(x),
  );
}

function isBottom(category: string): boolean {
  const lower = category.toLowerCase();
  return ['bottom', 'bottoms', 'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings'].some((x) => lower.includes(x));
}

function isShoes(category: string): boolean {
  const lower = category.toLowerCase();
  return ['shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'].some((x) => lower.includes(x));
}

function isOuterwear(category: string): boolean {
  const lower = category.toLowerCase();
  return ['outerwear', 'jacket', 'jackets', 'coat', 'coats', 'blazer', 'cardigan', 'vest'].some((x) => lower.includes(x));
}

function parseSeasonTags(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function sortByWeatherSuitability<T extends { seasonTags: string | null }>(items: T[], wantWarm: boolean): T[] {
  return [...items].sort((a, b) => {
    const aTags = parseSeasonTags(a.seasonTags);
    const bTags = parseSeasonTags(b.seasonTags);
    const aWinter = aTags.includes(SeasonTag.WINTER) ? 1 : 0;
    const bWinter = bTags.includes(SeasonTag.WINTER) ? 1 : 0;
    const aSummer = aTags.includes(SeasonTag.SUMMER) ? 1 : 0;
    const bSummer = bTags.includes(SeasonTag.SUMMER) ? 1 : 0;
    if (wantWarm) return bWinter - aWinter || aSummer - bSummer;
    return bSummer - aSummer || aWinter - bWinter;
  });
}

function pickOneByDayIndex<T>(items: T[], dayIndex: number): T | null {
  if (items.length === 0) return null;
  const i = dayIndex % items.length;
  return items[i];
}

function pickWardrobeIdsForToday(
  wardrobeItems: WardrobeItemRow[],
  opts: { minTempC: number; maxTempC: number; condition: string; dayIndex: number },
): { wardrobeItemIds: string[]; avgTemp: number; condition: string } {
  const COLD_MAX_C = 12;
  const HOT_MIN_C = 24;

  const needCold = opts.maxTempC <= COLD_MAX_C;
  const wantWarm = needCold;

  const tops = sortByWeatherSuitability(
    wardrobeItems.filter((i) => isTop(i.category)),
    wantWarm,
  );
  const bottoms = sortByWeatherSuitability(
    wardrobeItems.filter((i) => isBottom(i.category)),
    wantWarm,
  );
  const shoes = sortByWeatherSuitability(
    wardrobeItems.filter((i) => isShoes(i.category)),
    wantWarm,
  );
  const outerwear = sortByWeatherSuitability(
    wardrobeItems.filter((i) => isOuterwear(i.category)),
    true,
  );

  const top = pickOneByDayIndex(tops, opts.dayIndex);
  const bottom = pickOneByDayIndex(bottoms, opts.dayIndex + 1);
  const shoesItem = pickOneByDayIndex(shoes, opts.dayIndex + 2);
  const coat = needCold ? pickOneByDayIndex(outerwear, opts.dayIndex) : null;

  const ids: string[] = [];
  if (top) ids.push((top as any).id);
  if (coat) ids.push((coat as any).id);
  if (bottom) ids.push((bottom as any).id);
  if (shoesItem) ids.push((shoesItem as any).id);

  const avgTemp = Math.round((opts.minTempC + opts.maxTempC) / 2);

  return {
    wardrobeItemIds: ids,
    avgTemp,
    condition: opts.condition,
  };
}

function pickMorningMessage(weatherDescription: string): string {
  const baseMessages = [
    'Good morning. Your outfit for today is ready.',
    'New day, new outfit picked just for you.',
    'You are going to look great today.',
    'A fresh outfit to match a fresh start today.',
  ];
  const withWeather = [
    `Good morning. Your outfit is ready for today’s ${weatherDescription}.`,
    `Rise and shine. We picked an outfit that fits today’s weather: ${weatherDescription}.`,
    `Morning. Your wardrobe and today’s weather are in harmony.`,
  ];

  const pool = weatherDescription ? baseMessages.concat(withWeather) : baseMessages;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private weatherService: WeatherService,
    private firebasePush: FirebasePushService,
  ) {}

  async getOrCreateSettings(userId: string) {
    const existing = await this.prisma.notificationSettings.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.notificationSettings.create({ data: { userId } });
  }

  async updateSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    const current = await this.getOrCreateSettings(userId);
    return this.prisma.notificationSettings.update({
      where: { id: current.id },
      data: {
        enabled: dto.enabled ?? undefined,
        expoPushToken: dto.expoPushToken ?? undefined,
        fcmToken: dto.fcmToken ?? undefined,
        deviceType: dto.deviceType ?? undefined,
        latitude: dto.latitude ?? undefined,
        longitude: dto.longitude ?? undefined,
        timezone: dto.timezone ?? undefined,
        notifyAtLocalTime: dto.notifyAtLocalTime ?? undefined,
        coldThresholdC: dto.coldThresholdC ?? undefined,
        hotThresholdC: dto.hotThresholdC ?? undefined,
        tempChangeThresholdC: dto.tempChangeThresholdC ?? undefined,
        notifyOnWeatherChange: dto.notifyOnWeatherChange ?? undefined,
        minHoursBetweenNotifs: dto.minHoursBetweenNotifs ?? undefined,
      },
    });
  }

  async listNotifications(userId: string, opts?: { unreadOnly?: boolean; take?: number }) {
    const take = Math.min(Math.max(opts?.take ?? 50, 1), 200);
    const where: any = { userId };
    if (opts?.unreadOnly) where.readAt = null;

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { notifications };
  }

  async markRead(userId: string, notificationId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!n || n.userId !== userId) return null;
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async runWeatherOutfitCheckForUser(userId: string, opts?: { force?: boolean }) {
    const settings = await this.getOrCreateSettings(userId);
    if (!settings.enabled) return { ok: true, skipped: 'disabled' as const };
    if (settings.latitude == null || settings.longitude == null) return { ok: true, skipped: 'missing_location' as const };

    // Rate-limit unless forced
    if (!opts?.force && settings.lastNotifiedAt && hoursSince(settings.lastNotifiedAt) < settings.minHoursBetweenNotifs) {
      return { ok: true, skipped: 'rate_limited' as const };
    }

    const weather = await this.weatherService.getTodaySummary({
      latitude: settings.latitude,
      longitude: settings.longitude,
      timezone: settings.timezone || 'auto',
    });

    // Ensure there is an outfit for "today" built from the wardrobe.
    // We align "today" with the user's timezone and normalize the date
    // to the same Monday-based weekStartDate used in outfit planning.
    const tzForOutfit = settings.timezone || 'UTC';
    const now = new Date();
    const { dateKey: localDateKey } = getLocalParts(now, tzForOutfit);
    const localMidnightUtc = new Date(`${localDateKey}T00:00:00.000Z`);
    const weekStartDate = getWeekStartDate(localMidnightUtc);
    const weekdayUtc = localMidnightUtc.getUTCDay(); // 0=Sun..6=Sat
    const dayIndexMonday0 = (weekdayUtc + 6) % 7; // 0=Mon..6=Sun

    let todayOutfit = await this.prisma.outfit.findFirst({
      where: {
        userId,
        weekStartDate,
        dayIndex: dayIndexMonday0,
      },
      include: {
        outfitItems: {
          include: {
            wardrobeItem: true,
          },
        },
      },
    });

    if (!todayOutfit) {
      const wardrobeItems = await this.prisma.wardrobeItem.findMany({
        where: { userId },
        select: {
          id: true,
          category: true,
          seasonTags: true,
        },
      });

      if (wardrobeItems.length > 0) {
        const picked = pickWardrobeIdsForToday(wardrobeItems, {
          minTempC: weather.today.minTempC,
          maxTempC: weather.today.maxTempC,
          condition: weather.today.condition,
          dayIndex: dayIndexMonday0,
        });

        if (picked.wardrobeItemIds.length > 0) {
          todayOutfit = await this.prisma.outfit.upsert({
            where: {
              userId_weekStartDate_dayIndex: {
                userId,
                weekStartDate,
                dayIndex: dayIndexMonday0,
              },
            },
            create: {
              userId,
              weekStartDate,
              dayIndex: dayIndexMonday0,
              status: 'ready',
              category: 'saved',
              weather: JSON.stringify({
                temperature: picked.avgTemp,
                condition: picked.condition,
                locationName: '',
              }),
              outfitItems: {
                create: picked.wardrobeItemIds.map((wardrobeItemId) => ({ wardrobeItemId })),
              },
            },
            update: {
              status: 'ready',
              category: 'saved',
              weather: JSON.stringify({
                temperature: picked.avgTemp,
                condition: picked.condition,
                locationName: '',
              }),
              outfitItems: {
                deleteMany: {},
                create: picked.wardrobeItemIds.map((wardrobeItemId) => ({ wardrobeItemId })),
              },
            },
            include: {
              outfitItems: {
                include: {
                  wardrobeItem: true,
                },
              },
            },
          });
        }
      }
    }

    const latestOutfit = todayOutfit
      ? todayOutfit
      : await this.prisma.outfit.findFirst({
          where: { userId, status: 'ready' },
          orderBy: { createdAt: 'desc' },
          include: {
            outfitItems: {
              include: {
                wardrobeItem: true,
              },
            },
          },
        });

    if (!latestOutfit) {
      return { ok: true, skipped: 'no_outfit' as const, weather };
    }

    const validation = validateOutfitAgainstWeather({
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
        wardrobeItems: latestOutfit.outfitItems.map((oi) => ({
          category: oi.wardrobeItem?.category,
          seasonTags: oi.wardrobeItem?.seasonTags,
        })),
      },
    });

    // Respect toggle: if we only detected temperature change, and the user disabled change-based notifications.
    if (!validation.ok && validation.reason === 'temperature_changed' && !settings.notifyOnWeatherChange) {
      return { ok: true, skipped: 'change_notifications_disabled' as const, weather, validation };
    }

    let title: string;
    let body: string;

    if (validation.ok) {
      const weatherDescription = `${weather.today.minTempC}–${weather.today.maxTempC}°C, ${weather.today.condition.toLowerCase()}`;
      title = 'Your daily outfit is ready';
      body = pickMorningMessage(weatherDescription);
    } else {
      title =
        validation.reason === 'too_cold_for_outfit'
          ? 'Your outfit may be too light today'
          : validation.reason === 'too_hot_for_outfit'
            ? 'Your outfit may be too warm today'
            : 'Weather changed — outfit check';

      body =
        validation.reason === 'too_cold_for_outfit'
          ? `It’s cold today (${weather.today.minTempC}–${weather.today.maxTempC}°C). Consider adding outerwear.`
          : validation.reason === 'too_hot_for_outfit'
            ? `It’s warm today (${weather.today.minTempC}–${weather.today.maxTempC}°C). Consider lighter layers.`
            : `Current temperature is ${weather.current.temperatureC}°C (today ${weather.today.minTempC}–${weather.today.maxTempC}°C).`;
    }

    const data = {
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

    const created = await this.prisma.notification.create({
      data: {
        userId,
        type: 'OUTFIT_WEATHER',
        title,
        body,
        data: JSON.stringify(data),
      },
    });

    // Try push via Firebase FCM (preferred) or Expo (fallback), best-effort
    let sent = false;
    if (settings.fcmToken && this.firebasePush.isConfigured) {
      sent = await this.firebasePush.sendToToken(settings.fcmToken, {
        title,
        body,
        data: { notificationId: created.id, ...data },
      });
    } else if (settings.expoPushToken) {
      sent = await this.trySendExpoPush(settings.expoPushToken, {
        title,
        body,
        data: { notificationId: created.id, ...data },
      });

      if (sent) {
        await this.prisma.notification.update({
          where: { id: created.id },
          data: { sentAt: new Date() },
        });
      }
    }

    await this.prisma.notificationSettings.update({
      where: { id: settings.id },
      data: { lastNotifiedAt: new Date() },
    });

    return { ok: true, created, sent, weather, validation };
  }

  async shouldRunDailyCheckNow(settings: {
    enabled: boolean;
    timezone: string;
    notifyAtLocalTime: string;
    lastNotifiedAt: Date | null;
  }): Promise<boolean> {
    if (!settings.enabled) return false;

    const tz = settings.timezone || 'UTC';
    const now = new Date();
    const { dateKey: todayKey, minutes: nowMinutes } = getLocalParts(now, tz);
    const notifyMinutes = parseNotifyMinutes(settings.notifyAtLocalTime);
    if (notifyMinutes == null) return false;

    // Allow a window after the target time (cron jitter-safe)
    const windowMinutes = 10;
    const withinWindow = nowMinutes >= notifyMinutes && nowMinutes <= notifyMinutes + windowMinutes;
    if (!withinWindow) return false;

    if (!settings.lastNotifiedAt) return true;
    const { dateKey: lastKey } = getLocalParts(settings.lastNotifiedAt, tz);
    return lastKey !== todayKey;
  }

  private async trySendExpoPush(
    expoPushToken: string,
    message: { title: string; body: string; data?: Record<string, any> },
  ): Promise<boolean> {
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
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
          data: message.data ?? {},
        }),
      });
      if (!res.ok) return false;
      const json: any = await res.json().catch(() => null);
      const status = json?.data?.status;
      return status === 'ok';
    } catch {
      return false;
    }
  }
}

