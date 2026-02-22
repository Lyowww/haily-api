import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run() {
    const settings = await this.prisma.notificationSettings.findMany({
      where: { enabled: true, latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        userId: true,
        enabled: true,
        timezone: true,
        notifyAtLocalTime: true,
        lastNotifiedAt: true,
      },
      take: 5000,
    });

    for (const s of settings) {
      const shouldRun = await this.notificationsService.shouldRunDailyCheckNow({
        enabled: s.enabled,
        timezone: s.timezone,
        notifyAtLocalTime: s.notifyAtLocalTime,
        lastNotifiedAt: s.lastNotifiedAt,
      });
      if (!shouldRun) continue;

      // Best-effort: do not throw and break the whole scheduler loop
      try {
        await this.notificationsService.runWeatherOutfitCheckForUser(s.userId);
      } catch {
        // ignore
      }
    }
  }
}

