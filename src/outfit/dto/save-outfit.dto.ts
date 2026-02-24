import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WeatherDataDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  temperature!: number;

  @ApiProperty({ example: 'Cold' })
  @IsString()
  condition!: string;

  @ApiProperty({ example: 'Yerevan, Armenia' })
  @IsString()
  locationName!: string;
}

export class SaveOutfitDto {
  @ApiProperty({ example: '/uploads/generated/outfit-123.png' })
  @IsString()
  imageUrl!: string;

  @ApiProperty({ example: 'Full body image of a person wearing a blue shirt and jeans...' })
  @IsString()
  prompt!: string;

  @ApiProperty({ type: WeatherDataDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WeatherDataDto)
  weather?: WeatherDataDto;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  wardrobeItemIds?: string[];

  /** Week start (Monday) in ISO date string. If omitted, uses current week. */
  @ApiPropertyOptional({ example: '2025-02-24' })
  @IsOptional()
  @IsString()
  weekStartDate?: string;

  /** Day in week: 0 = Monday, 6 = Sunday. If omitted, uses today. */
  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 6 })
  @IsOptional()
  @IsNumber()
  dayIndex?: number;
}

