import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class AddWardrobeItemDto {
  @ApiProperty({ example: '/uploads/shirt.jpg', description: 'URL of the uploaded clothing image' })
  @IsString()
  imageUrl!: string;

  @ApiProperty({ example: 'top', required: false, description: 'Optional category hint from user' })
  @IsOptional()
  @IsString()
  categoryHint?: string;

  @ApiProperty({ example: 'My favorite blue shirt', required: false, description: 'Optional user notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}





