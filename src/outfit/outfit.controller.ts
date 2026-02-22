import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { OutfitService } from './outfit.service';
import { GenerateOutfitDto, SaveOutfitDto } from './dto';
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
}

