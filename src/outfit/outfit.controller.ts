import { Controller, Post, Body, Get, Param, Query, Delete, Put, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ParseIntPipe } from '@nestjs/common/pipes';
import { OutfitService } from './outfit.service';
import { GenerateOutfitDto, SaveOutfitDto, GetWeekPlanQueryDto, GenerateWeekPlanDto } from './dto';
import { JwtAuthGuard } from '../auth';

@ApiTags('Outfit')
@Controller('outfit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OutfitController {
  constructor(private readonly outfitService: OutfitService) {}

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

  @Post('weekly/generate')
  @ApiOperation({ summary: 'Generate full week plan for the selected week (all 7 days)' })
  @ApiBody({ type: GenerateWeekPlanDto })
  @ApiResponse({ status: 201, description: 'Week plan generated with suggestions per day' })
  @ApiResponse({ status: 400, description: 'Invalid weekStartDate' })
  async generateWeekPlan(@Request() req: any, @Body() body: GenerateWeekPlanDto) {
    return this.outfitService.generateWeekPlan(req.user.userId, body);
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

