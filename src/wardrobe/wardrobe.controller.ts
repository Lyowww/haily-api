import { Controller, Post, Get, Delete, Body, Param, Patch, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { WardrobeService } from './wardrobe.service';
import { IsString, IsOptional, IsArray } from 'class-validator';

class AddWardrobeItemDto {
  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  imageUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  tags?: any;
}

class UpdateWardrobeItemDto {
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  seasonTags?: string[];
}

@ApiTags('Wardrobe')
@ApiBearerAuth()
@Controller('wardrobe')
export class WardrobeController {
  constructor(private readonly wardrobeService: WardrobeService) {}

  @Post()
  @ApiOperation({ summary: 'Add item to wardrobe' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  async addItem(@Request() req: any, @Body() addItemDto: AddWardrobeItemDto) {
    // Get userId from authenticated user (JWT token)
    const userId = req.user.userId;
    return this.wardrobeService.addItem(
      userId,
      addItemDto.category,
      addItemDto.imageUrl,
      addItemDto.tags,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user wardrobe' })
  @ApiResponse({ status: 200, description: 'Returns user wardrobe items' })
  async getUserWardrobe(@Request() req: any) {
    return this.wardrobeService.getUserWardrobe(req.user.userId);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get wardrobe items by category' })
  async getByCategory(@Request() req: any, @Param('category') category: string) {
    return this.wardrobeService.getItemsByCategory(req.user.userId, category);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete wardrobe item' })
  async deleteItem(@Request() req: any, @Param('id') id: string) {
    return this.wardrobeService.deleteItem(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update wardrobe item (user overrides)' })
  async updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWardrobeItemDto,
  ) {
    return this.wardrobeService.updateItem(req.user.userId, id, dto);
  }
}

