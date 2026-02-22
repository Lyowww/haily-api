import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather';
import { UpdateNotificationSettingsDto } from './dto';
import { validateOutfitAgainstWeather } from './outfit-weather.validator';

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

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private weatherService: WeatherService,
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

    const latestOutfit = await this.prisma.outfit.findFirst({
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

    if (validation.ok) {
      return { ok: true, weather, validation };
    }

    const title =
      validation.reason === 'too_cold_for_outfit'
        ? 'Your outfit may be too light today'
        : validation.reason === 'too_hot_for_outfit'
          ? 'Your outfit may be too warm today'
          : 'Weather changed — outfit check';

    const body =
      validation.reason === 'too_cold_for_outfit'
        ? `It’s cold today (${weather.today.minTempC}–${weather.today.maxTempC}°C). Consider adding outerwear.`
        : validation.reason === 'too_hot_for_outfit'
          ? `It’s warm today (${weather.today.minTempC}–${weather.today.maxTempC}°C). Consider lighter layers.`
          : `Current temperature is ${weather.current.temperatureC}°C (today ${weather.today.minTempC}–${weather.today.maxTempC}°C).`;

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

    // Try push (best-effort)
    let sent = false;
    if (settings.expoPushToken) {
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

