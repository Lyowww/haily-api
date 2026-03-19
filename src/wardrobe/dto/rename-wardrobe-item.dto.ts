import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RenameWardrobeItemDto {
  @ApiProperty({ example: 'Black Oversized Blazer' })
  @IsString()
  name!: string;
}
