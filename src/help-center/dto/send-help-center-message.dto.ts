import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendHelpCenterMessageDto {
  @ApiProperty({ example: 'Hi! I need help with my subscription.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}

