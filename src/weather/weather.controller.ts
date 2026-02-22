import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WeatherService } from './weather.service';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get today weather summary for coordinates' })
  @ApiQuery({ name: 'latitude', required: true, type: Number, example: 40.1872 })
  @ApiQuery({ name: 'longitude', required: true, type: Number, example: 44.5152 })
  @ApiQuery({ name: 'timezone', required: false, type: String, example: 'auto' })
  @ApiResponse({ status: 200, description: 'Weather summary for today' })
  async getToday(
    @Query('latitude') latitudeRaw: string,
    @Query('longitude') longitudeRaw: string,
    @Query('timezone') timezone?: string,
  ) {
    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('latitude and longitude must be valid numbers');
    }
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('longitude must be between -180 and 180');
    }

    return this.weatherService.getTodaySummary({
      latitude,
      longitude,
      timezone,
    });
  }
}

