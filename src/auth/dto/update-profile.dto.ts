import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User sex (used for sizing/fit heuristics)',
    enum: ['male', 'female'],
    example: 'male',
  })
  @IsOptional()
  @IsIn(['male', 'female'])
  sex?: 'male' | 'female';

  @ApiPropertyOptional({
    description: 'User age in years',
    example: 28,
    minimum: 5,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    description: 'User height in centimeters',
    example: 175,
    minimum: 80,
    maximum: 250,
  })
  @IsOptional()
  @IsInt()
  @Min(80)
  @Max(250)
  heightCm?: number;
}

