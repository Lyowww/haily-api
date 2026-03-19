import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadWardrobeItemDto {
  @ApiProperty({ example: 'Blue Linen Shirt', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'tops', required: false })
  @IsOptional()
  @IsString()
  categoryHint?: string;
}
