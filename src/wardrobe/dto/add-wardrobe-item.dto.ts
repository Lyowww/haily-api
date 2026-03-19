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
  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  minC!: number;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsInt()
  maxC!: number;
}

export class AddWardrobeItemDto {
  @ApiProperty({ example: 'White Oxford Shirt' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Whether this item is a user favorite.',
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiProperty({ example: 'tops' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'shirt', required: false })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({
    example: '/uploads/shirt.jpg',
    description: 'URL of the uploaded clothing image',
  })
  @IsString()
  imageUrl!: string;

  @ApiProperty({ example: 'Classic white shirt for work', required: false })
  @IsOptional()
  @IsString()
  aiDescription?: string;

  @ApiProperty({ example: ['spring', 'autumn'], required: false, type: [String] })
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

  @ApiProperty({ example: ['classic', 'cotton'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}





