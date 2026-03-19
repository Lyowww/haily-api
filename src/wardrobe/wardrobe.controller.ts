import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { WardrobeService } from './wardrobe.service';
import { AddWardrobeItemDto } from './dto/add-wardrobe-item.dto';
import { UpdateWardrobeItemDto } from './dto/update-wardrobe-item.dto';
import { UploadWardrobeItemDto } from './dto/upload-wardrobe-item.dto';

@ApiTags('Wardrobe')
@ApiBearerAuth()
@Controller('wardrobe')
export class WardrobeController {
  constructor(private readonly wardrobeService: WardrobeService) {}

  @Post()
  @ApiOperation({ summary: 'Add item to wardrobe' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  async addItem(@Request() req: any, @Body() addItemDto: AddWardrobeItemDto) {
    return this.wardrobeService.addItem(req.user.userId, addItemDto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a wardrobe item image and enrich it with AI metadata',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
          example: 'Blue Linen Shirt',
        },
        categoryHint: {
          type: 'string',
          example: 'tops',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Wardrobe item uploaded successfully' })
  async uploadItem(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadWardrobeItemDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.wardrobeService.uploadAndCreateItem(req.user.userId, file, dto);
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

