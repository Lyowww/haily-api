import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WardrobeItemDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  imageUrl!: string;
}

class WeatherDto {
  @ApiProperty()
  @IsNumber()
  temperature!: number;

  @ApiProperty()
  @IsString()
  condition!: string;
}

export class AnalyzeWardrobeDto {
  @ApiProperty({ type: [WardrobeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WardrobeItemDto)
  items!: WardrobeItemDto[];

  @ApiProperty({ type: WeatherDto })
  @ValidateNested()
  @Type(() => WeatherDto)
  weather!: WeatherDto;
}

