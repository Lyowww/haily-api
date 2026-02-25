import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Occasion, Season } from './generate-outfit.dto';

/** Body for POST /outfit/weekly/:dayIndex/regenerate – regenerate AI outfit for a single day (e.g. Friday). */
export class RegenerateDayDto {
  /** Monday of the week in ISO date (YYYY-MM-DD). Required. */
  @ApiProperty({ example: '2025-02-24', description: 'Monday of the selected week' })
  @IsString()
  weekStartDate!: string;

  @ApiPropertyOptional({ example: 40.1872 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 44.5152 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Europe/Yerevan' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Base64 encoded image of the user',
    example: 'data:image/jpeg;base64,...',
  })
  @IsOptional()
  @IsString()
  userImage?: string;

  @ApiPropertyOptional({ description: 'Preferred outfit style', example: 'casual' })
  @IsOptional()
  @IsString()
  preferredStyle?: string;

  @ApiPropertyOptional({ enum: Occasion })
  @IsOptional()
  @IsEnum(Occasion)
  occasion?: Occasion;

  @ApiPropertyOptional({ enum: Season })
  @IsOptional()
  @IsEnum(Season)
  season?: Season;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredColors?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeColors?: string[];
}
