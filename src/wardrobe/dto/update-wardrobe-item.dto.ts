import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateWardrobeItemDto {
  @ApiProperty({ example: 'top', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'blue', required: false })
  @IsOptional()
  @IsString()
  colorFamily?: string;

  @ApiProperty({ example: ['casual', 'smart_casual'], required: false })
  @IsOptional()
  @IsArray()
  styleTags?: string[];

  @ApiProperty({ example: ['summer', 'spring_fall'], required: false })
  @IsOptional()
  @IsArray()
  seasonTags?: string[];

  @ApiProperty({ example: 'slim', required: false })
  @IsOptional()
  @IsString()
  fitTag?: string;

  @ApiProperty({ example: ['v-neck', 'cotton'], required: false })
  @IsOptional()
  @IsArray()
  extraTags?: string[];

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsOptional()
  @IsString()
  userNotes?: string;
}





