import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UploadWardrobeItemDto {
  @ApiProperty({ example: 'Blue Linen Shirt', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Whether this uploaded item should be marked as favorite immediately.',
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiProperty({ example: 'tops', required: false })
  @IsOptional()
  @IsString()
  categoryHint?: string;
}
