import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Client dinner' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '2026-03-21T19:00:00.000Z' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'work', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}
