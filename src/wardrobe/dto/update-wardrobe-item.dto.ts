import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class TemperatureRangeDto {
  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  minC!: number;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  maxC!: number;
}

export class UpdateWardrobeItemDto {
  @ApiProperty({ example: 'Navy Wool Coat', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether this item is marked as a user favorite.',
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiProperty({ example: 'outerwear', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'coat', required: false })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ example: 'Warm wool coat for cold-weather commutes.', required: false })
  @IsOptional()
  @IsString()
  aiDescription?: string;

  @ApiProperty({ example: ['winter'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  seasons?: string[];

  @ApiProperty({ required: false, type: TemperatureRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemperatureRangeDto)
  temperatureRange?: TemperatureRangeDto;

  @ApiProperty({ example: ['work', 'formal'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  occasions?: string[];

  @ApiProperty({ example: ['tailored', 'wool'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}





