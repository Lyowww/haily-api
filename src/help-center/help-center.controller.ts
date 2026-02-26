import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth';
import { HelpCenterService } from './help-center.service';
import { SendHelpCenterMessageDto } from './dto';

@ApiTags('Help Center')
@Controller('help-center')
export class HelpCenterController {
  constructor(private helpCenterService: HelpCenterService) {}

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List help center messages for current user' })
  @ApiResponse({ status: 200, description: 'Conversation and messages' })
  async list(@Request() req: any) {
    return this.helpCenterService.listMessages(req.user.id);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message and get updated conversation (user message + auto-reply)' })
  @ApiBody({ type: SendHelpCenterMessageDto })
  @ApiResponse({ status: 201, description: 'Updated conversation and messages' })
  async send(@Request() req: any, @Body() body: SendHelpCenterMessageDto) {
    const userId = req.user.id;
    await this.helpCenterService.createMessage(userId, 'user', body.text.trim());
    const autoReply =
      'Thanks for reaching out. A support specialist will reply as soon as possible.';
    await this.helpCenterService.createMessage(userId, 'support', autoReply);
    return this.helpCenterService.listMessages(userId);
  }
}

