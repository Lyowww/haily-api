import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Occasion, Season } from './generate-outfit.dto';

/** Body for POST /outfit/weekly/generate – generate outfit suggestions for all 7 days of the selected week. */
export class GenerateWeekPlanDto {
  /** Monday of the week in ISO date (YYYY-MM-DD). Required. */
  @ApiProperty({ example: '2025-02-24', description: 'Monday of the selected week' })
  @IsString()
  weekStartDate!: string;

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
