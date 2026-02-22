import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationSettingsDto } from './dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get notification + weather settings for the current user' })
  async getSettings(@Request() req: any) {
    return this.notificationsService.getOrCreateSettings(req.user.userId);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update notification + weather settings for the current user' })
  async updateSettings(@Request() req: any, @Body() dto: UpdateNotificationSettingsDto) {
    return this.notificationsService.updateSettings(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  async list(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('take') take?: string,
  ) {
    return this.notificationsService.listNotifications(req.user.userId, {
      unreadOnly: unreadOnly === 'true',
      take: take ? Number(take) : undefined,
    });
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.userId, id);
  }

  @Post('run-weather-check')
  @ApiOperation({ summary: 'Run weather/outfit check immediately (debug)' })
  async runNow(@Request() req: any) {
    return this.notificationsService.runWeatherOutfitCheckForUser(req.user.userId, { force: true });
  }
}

