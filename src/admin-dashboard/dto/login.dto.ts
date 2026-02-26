import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'your-admin-password' })
  @IsString()
  @MinLength(1)
  password!: string;
}
