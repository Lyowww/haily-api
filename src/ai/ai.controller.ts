import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { SubscriptionCheck } from '../billing/subscription-check.decorator';
import { BillingService } from '../billing/billing.service';
import { AnalyzeWardrobeDto } from './dto/analyze-wardrobe.dto';
import { IsString, IsArray, IsOptional, ValidateNested, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class ClothingItemDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  imageUrl!: string;
}

class WeatherDto {
  @ApiProperty()
  @IsNumber()
  temperature!: number;

  @ApiProperty()
  @IsString()
  condition!: string;
}

class UserProfileDto {
  @ApiProperty({ required: false, enum: ['male', 'female'] })
  @IsOptional()
  @IsIn(['male', 'female'])
  sex?: 'male' | 'female';

  @ApiProperty({ required: false, example: 28 })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({ required: false, example: 178 })
  @IsOptional()
  @IsNumber()
  heightCm?: number;
}

class GenerateOutfitDto {
  @ApiProperty({ example: '/uploads/user-photo.jpg' })
  @IsString()
  userPhotoUrl!: string;

  @ApiProperty({ required: false, description: 'Base64-encoded user photo. Use when URL returns 404 (e.g. Vercel ephemeral uploads).' })
  @IsOptional()
  @IsString()
  userPhotoBase64?: string;

  @ApiProperty({ type: UserProfileDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileDto)
  user?: UserProfileDto;

  @ApiProperty({ type: [ClothingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClothingItemDto)
  clothingItems!: ClothingItemDto[];

  @ApiProperty({ type: WeatherDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeatherDto)
  weather?: WeatherDto;

  @ApiProperty({ required: false, example: 'Event: Wedding Guest. User request: elegant and minimalist.' })
  @IsOptional()
  @IsString()
  stylePrompt?: string;
}

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly billingService: BillingService,
  ) {}

  @Post('generate-outfit')
  @UseGuards(SubscriptionGuard)
  @SubscriptionCheck('aiAndVirtualTryon')
  @ApiOperation({ summary: 'Generate AI outfit image (virtual try-on)' })
  @ApiResponse({
    status: 200,
    description: 'Outfit image generated successfully',
    schema: {
      example: {
        imageUrl: 'https://example.com/generated-outfit.png',
        prompt: 'The prompt used for generation',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Subscription required or limit reached' })
  async generateOutfit(@Request() req: any, @Body() dto: GenerateOutfitDto) {
    const result = await this.aiService.generateOutfitImage(dto);
    const userId = req.user?.id ?? req.user?.userId;
    if (userId) {
      await this.billingService.incrementAiGenerations(userId);
      await this.billingService.incrementVirtualTryon(userId);
    }
    return result;
  }

  @Post('analyze-wardrobe')
  @ApiOperation({ summary: 'Analyze wardrobe completeness based on weather' })
  @ApiResponse({
    status: 200,
    description: 'Wardrobe analysis completed',
    schema: {
      example: {
        isComplete: false,
        missingItems: ['jacket'],
        recommendations: ["It's 2°C outside. You'll need a warm jacket for cold weather."],
      },
    },
  })
  async analyzeWardrobe(@Body() dto: AnalyzeWardrobeDto) {
    return this.aiService.analyzeWardrobe(dto);
  }
}

