import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum Occasion {
  CASUAL = 'casual',
  FORMAL = 'formal',
  BUSINESS = 'business',
  DATE = 'date',
  PARTY = 'party',
  SPORT = 'sport',
  TRAVEL = 'travel',
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

export class GenerateOutfitDto {
  @ApiProperty({
    description: 'Base64 encoded image of the user',
    example: 'data:image/jpeg;base64,...',
  })
  @IsString()
  userImage!: string;

  @ApiPropertyOptional({
    description: 'Preferred outfit style',
    example: 'casual',
  })
  @IsString()
  @IsOptional()
  preferredStyle?: string;

  @ApiPropertyOptional({
    enum: Occasion,
    description: 'The occasion for the outfit',
    example: Occasion.CASUAL,
  })
  @IsEnum(Occasion)
  @IsOptional()
  occasion?: Occasion;

  @ApiPropertyOptional({
    enum: Season,
    description: 'Current season for appropriate clothing',
    example: Season.SUMMER,
  })
  @IsEnum(Season)
  @IsOptional()
  season?: Season;

  @ApiPropertyOptional({
    description: 'Preferred colors for the outfit',
    example: ['blue', 'white', 'black'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredColors?: string[];

  @ApiPropertyOptional({
    description: 'Colors to avoid in the outfit',
    example: ['yellow', 'orange'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeColors?: string[];
}

