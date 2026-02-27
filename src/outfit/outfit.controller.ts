import { Controller, Post, Body, Get, Param, Query, Delete, Put, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ParseIntPipe } from '@nestjs/common/pipes';
import { OutfitService } from './outfit.service';
import { GenerateOutfitDto, SaveOutfitDto, GetWeekPlanQueryDto, GenerateWeekPlanDto, RegenerateDayDto } from './dto';
import { JwtAuthGuard } from '../auth';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { SubscriptionCheck } from '../billing/subscription-check.decorator';
import { BillingService } from '../billing/billing.service';

@ApiTags('Outfit')
@Controller('outfit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OutfitController {
  constructor(
    private readonly outfitService: OutfitService,
    private readonly billingService: BillingService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate outfit suggestions based on user photo' })
  @ApiBody({ type: GenerateOutfitDto })
  @ApiResponse({
    status: 201,
    description: 'Outfit suggestions generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async generateOutfit(@Body() generateOutfitDto: GenerateOutfitDto) {
    return this.outfitService.generateOutfit(generateOutfitDto);
  }

  @Get('suggestions/:userId')
  @ApiOperation({ summary: 'Get outfit suggestions history for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns outfit suggestions history',
  })
  async getSuggestions(@Param('userId') userId: string) {
    return this.outfitService.getSuggestions(userId);
  }

  @Get('styles')
  @ApiOperation({ summary: 'Get available outfit styles' })
  @ApiResponse({ status: 200, description: 'Returns available outfit styles' })
  async getStyles() {
    return this.outfitService.getAvailableStyles();
  }

  @Post('save')
  @ApiOperation({ summary: 'Save generated outfit to database' })
  @ApiResponse({ status: 201, description: 'Outfit saved successfully' })
  async saveOutfit(@Request() req: any, @Body() saveOutfitDto: SaveOutfitDto) {
    return this.outfitService.saveOutfit(req.user.userId, saveOutfitDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get outfit generation history' })
  @ApiResponse({ status: 200, description: 'Returns outfit history' })
  async getHistory(@Request() req: any) {
    return this.outfitService.getOutfitHistory(req.user.userId);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly outfit plan (all 7 days)' })
  @ApiResponse({ status: 200, description: 'Returns week plan with days 0–6 (Monday–Sunday)' })
  async getWeekPlan(@Request() req: any, @Query() query: GetWeekPlanQueryDto) {
    return this.outfitService.getWeekPlan(req.user.userId, query.weekStartDate);
  }

  @Get('today')
  @ApiOperation({
    summary: 'Get today outfit for the current user',
    description:
      'Returns the outfit for today based on the current week and UTC weekday (0=Mon..6=Sun), using the same Monday-based weekStartDate normalization as the weekly plan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns today outfit, or null if not set yet',
  })
  async getToday(@Request() req: any) {
    return this.outfitService.getTodayOutfit(req.user.userId);
  }

  @Post('weekly/generate')
  @UseGuards(SubscriptionGuard)
  @SubscriptionCheck('weekly')
  @ApiOperation({
    summary: 'Generate AI outfit images for the full week (7 days)',
    description:
      'Long-running request (~1–2 min). Generates one AI outfit image per day from the user\'s wardrobe and weather. Returns an array of days, each with imageUrl. Profile image (userImage base64 or user avatar) is required and is sent to AI for every day so the user\'s face is preserved. Client should keep the connection open until the response succeeds.',
  })
  @ApiBody({ type: GenerateWeekPlanDto })
  @ApiResponse({
    status: 201,
    description: 'Week plan with AI-generated outfit image per day. Body: { weekStartDate, days: [{ dayIndex, weekday, imageUrl, outfit, weather }] }',
  })
  @ApiResponse({ status: 400, description: 'Invalid weekStartDate or missing profile image' })
  @ApiResponse({ status: 403, description: 'Subscription required or weekly generation limit reached' })
  async generateWeekPlan(@Request() req: any, @Body() body: GenerateWeekPlanDto) {
    const result = await this.outfitService.generateWeekPlan(req.user.userId, body);
    await this.billingService.incrementWeeklyGenerations(req.user.userId);
    return result;
  }

  @Post('weekly/:dayIndex/regenerate')
  @ApiOperation({
    summary: 'Regenerate AI outfit for a single day (e.g. refresh Friday)',
    description:
      'When the user clicks refresh on a specific weekday (e.g. Friday), call this with dayIndex 4 and weekStartDate (Monday of that week). Generates a new outfit image for that day only from wardrobe and weather. Returns the updated day. Profile image (userImage or avatar) is required.',
  })
  @ApiBody({ type: RegenerateDayDto })
  @ApiResponse({
    status: 201,
    description: 'Regenerated day. Body: { weekStartDate, day: { dayIndex, weekday, imageUrl, outfit, weather } }',
  })
  @ApiResponse({ status: 400, description: 'Invalid weekStartDate, dayIndex, or missing profile image' })
  async regenerateDay(
    @Request() req: any,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Body() body: RegenerateDayDto,
  ) {
    if (dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Monday) to 6 (Sunday).');
    }
    if (body.weekStartDate == null || body.weekStartDate === '') {
      throw new BadRequestException('weekStartDate is required in the request body.');
    }
    return this.outfitService.regenerateDayPlan(req.user.userId, dayIndex, body);
  }

  @Put('weekly/:dayIndex')
  @ApiOperation({ summary: 'Create or update outfit for a specific day (0=Mon .. 6=Sun)' })
  @ApiResponse({ status: 200, description: 'Outfit saved for the day' })
  async updateWeekDay(
    @Request() req: any,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Body() body: SaveOutfitDto,
  ) {
    if (dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Monday) to 6 (Sunday).');
    }
    if (body.weekStartDate == null || body.weekStartDate === '') {
      throw new BadRequestException('weekStartDate is required for weekly plan update.');
    }
    return this.outfitService.saveOutfit(req.user.userId, {
      ...body,
      weekStartDate: body.weekStartDate,
      dayIndex,
    });
  }

  @Delete('weekly/:dayIndex')
  @ApiOperation({ summary: 'Remove outfit for a specific day' })
  @ApiResponse({ status: 200, description: 'Outfit removed for the day' })
  async deleteWeekDay(
    @Request() req: any,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Query() query: GetWeekPlanQueryDto,
  ) {
    const weekStartDate = query.weekStartDate;
    if (weekStartDate == null || weekStartDate === '') {
      throw new BadRequestException('weekStartDate query is required (e.g. ?weekStartDate=2025-02-24).');
    }
    if (dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Monday) to 6 (Sunday).');
    }
    return this.outfitService.deleteOutfitForDay(req.user.userId, weekStartDate, dayIndex);
  }
}

