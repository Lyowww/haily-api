import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth';
import { HelpCenterService } from './help-center.service';

@ApiTags('Help Center')
@Controller('help-center')
export class HelpCenterController {
  constructor(private helpCenterService: HelpCenterService) {}

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List help center messages for current user' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  async list(@Request() req: any) {
    return this.helpCenterService.listMessages(req.user.id);
  }
}

