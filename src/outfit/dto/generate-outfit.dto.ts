import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateOutfitDto {
  @ApiProperty({ required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiProperty({
    required: false,
    example: 'Dinner with friends at a rooftop bar',
  })
  @IsOptional()
  @IsString()
  customEventText?: string;

  @ApiProperty({
    required: false,
    enum: ['today', 'tomorrow'],
    example: 'today',
  })
  @IsOptional()
  @IsIn(['today', 'tomorrow'])
  date?: 'today' | 'tomorrow';

  @ApiProperty({
    required: false,
    enum: ['neutral', 'prefer'],
    example: 'prefer',
    description:
      'How generation should treat favorite wardrobe items. "prefer" biases toward favorites when they still fit the weather/event, while "neutral" gives no special weight.',
  })
  @IsOptional()
  @IsIn(['neutral', 'prefer'])
  favoritesMode?: 'neutral' | 'prefer';
}

