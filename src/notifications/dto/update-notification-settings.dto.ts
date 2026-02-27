import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsOptional()
  @IsString()
  expoPushToken?: string;

  @ApiPropertyOptional({ example: 'fcm_token_string_here' })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ example: 'ios', description: 'Device platform: ios | android | web' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ example: 40.1811 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 44.5136 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Asia/Yerevan' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Local time (HH:mm) when daily weather-outfit check runs' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  notifyAtLocalTime?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(-40)
  @Max(40)
  coldThresholdC?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(60)
  hotThresholdC?: number;

  @ApiPropertyOptional({ example: 5, description: 'Trigger notification if current temp differs from outfit temp by >= this value' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  tempChangeThresholdC?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyOnWeatherChange?: boolean;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(72)
  minHoursBetweenNotifs?: number;
}

