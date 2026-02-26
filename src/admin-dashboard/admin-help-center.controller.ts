import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from './admin-auth.guard';
import { HelpCenterService } from '../help-center/help-center.service';
import { PrismaService } from '../prisma';

@ApiTags('Admin Dashboard – Help Center')
@Controller('admin-dashboard/help-center')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('admin')
export class AdminHelpCenterController {
  constructor(
    private helpCenterService: HelpCenterService,
    private prisma: PrismaService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List all help center conversations' })
  @ApiResponse({ status: 200, description: 'Conversations with user info' })
  async listConversations() {
    const list = await this.prisma.helpCenterConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, createdAt: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, sender: true, text: true, createdAt: true },
        },
      },
    });
    return list.map((c) => ({
      id: c.id,
      userId: c.userId,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      user: c.user,
      lastMessage: c.messages[0]
        ? {
            id: c.messages[0].id,
            sender: c.messages[0].sender,
            text: c.messages[0].text,
            createdAt: c.messages[0].createdAt.toISOString(),
          }
        : null,
    }));
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  async getMessages(@Param('id') id: string) {
    const convo = await this.prisma.helpCenterConversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!convo) {
      return { conversation: null, messages: [] };
    }
    return {
      conversation: {
        id: convo.id,
        userId: convo.userId,
        status: convo.status,
        user: convo.user,
      },
      messages: convo.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  @Post('conversations/:userId/messages')
  @ApiOperation({ summary: 'Send support message to a user conversation (by userId)' })
  @ApiResponse({ status: 201, description: 'Message created' })
  async sendSupportMessage(
    @Param('userId') userId: string,
    @Body() body: { text: string },
  ) {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > 2000) {
      return { error: 'Text required, max 2000 characters' };
    }
    const result = await this.helpCenterService.createMessage(userId, 'support', text);
    return result.message;
  }
}
