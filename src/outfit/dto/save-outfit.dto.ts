import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class SaveOutfitDto {
  @ApiProperty({ required: false, example: 'Work Dinner Look' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiProperty({ example: ['wardrobe-item-id-1', 'wardrobe-item-id-2'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @ApiProperty({
    required: false,
    example: 'This outfit balances your classic style preference with a mild evening forecast.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  weatherMatch?: boolean;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  styleMatch?: boolean;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  generationContext?: Record<string, any>;
}

