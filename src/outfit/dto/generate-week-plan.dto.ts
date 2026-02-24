import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Occasion, Season } from './generate-outfit.dto';

/** Body for POST /outfit/weekly/generate – generate 7 outfits from wardrobe based on each day's weather. */
export class GenerateWeekPlanDto {
  /** Monday of the week in ISO date (YYYY-MM-DD). Required. */
  @ApiProperty({ example: '2025-02-24', description: 'Monday of the selected week' })
  @IsString()
  weekStartDate!: string;

  /** Optional. If omitted, location is taken from notification settings. */
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

  @ApiPropertyOptional({ enum: Occasion, description: 'Occasion for the outfits' })
  @IsOptional()
  @IsEnum(Occasion)
  occasion?: Occasion;

  @ApiPropertyOptional({ enum: Season, description: 'Season for appropriate clothing' })
  @IsOptional()
  @IsEnum(Season)
  season?: Season;

  @ApiPropertyOptional({ description: 'Preferred colors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredColors?: string[];

  @ApiPropertyOptional({ description: 'Colors to avoid', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeColors?: string[];
}
