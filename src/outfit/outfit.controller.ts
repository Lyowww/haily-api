import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OutfitService } from './outfit.service';
import { GenerateOutfitDto, SaveOutfitDto } from './dto';
import { JwtAuthGuard } from '../auth';

@ApiTags('Outfits')
@Controller('outfits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OutfitController {
  constructor(private readonly outfitService: OutfitService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a structured outfit recommendation from the user wardrobe',
  })
  @ApiBody({ type: GenerateOutfitDto })
  @ApiResponse({
    status: 201,
    description: 'Outfit recommendation generated successfully',
    schema: {
      example: {
        outfit_items: ['wardrobe-item-id-1', 'wardrobe-item-id-2', 'wardrobe-item-id-3'],
        explanation: 'Balanced for your event and weather.',
        weather_match: true,
        style_match: true,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async generateOutfit(@Request() req: any, @Body() generateOutfitDto: GenerateOutfitDto) {
    return this.outfitService.generateOutfit(req.user.userId, generateOutfitDto);
  }

  @Post('save')
  @ApiOperation({ summary: 'Save a generated or manual outfit' })
  @ApiResponse({ status: 201, description: 'Outfit saved successfully' })
  async saveOutfit(@Request() req: any, @Body() saveOutfitDto: SaveOutfitDto) {
    return this.outfitService.saveOutfit(req.user.userId, saveOutfitDto);
  }

  @Get()
  @ApiOperation({ summary: 'List saved outfits for the current user' })
  @ApiResponse({ status: 200, description: 'Outfits returned successfully' })
  async getOutfits(@Request() req: any) {
    return this.outfitService.getOutfits(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved outfit' })
  @ApiResponse({ status: 200, description: 'Outfit deleted successfully' })
  async deleteOutfit(@Request() req: any, @Param('id') id: string) {
    return this.outfitService.deleteOutfit(req.user.userId, id);
  }
}

