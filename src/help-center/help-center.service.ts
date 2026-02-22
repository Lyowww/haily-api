import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class HelpCenterService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(userId: string) {
    const existing = await this.prisma.helpCenterConversation.findUnique({
      where: { userId },
      select: { id: true, userId: true, status: true, createdAt: true, updatedAt: true },
    });
    if (existing) return existing;
    return await this.prisma.helpCenterConversation.create({
      data: { userId, status: 'open' },
      select: { id: true, userId: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async listMessages(userId: string) {
    const convo = await this.getOrCreateConversation(userId);
    const messages = await this.prisma.helpCenterMessage.findMany({
      where: { conversationId: convo.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, sender: true, text: true, createdAt: true },
    });
    return { conversation: convo, messages };
  }

  async createMessage(userId: string, sender: 'user' | 'support', text: string) {
    const convo = await this.getOrCreateConversation(userId);
    const msg = await this.prisma.helpCenterMessage.create({
      data: {
        conversationId: convo.id,
        sender,
        text,
      },
      select: { id: true, sender: true, text: true, createdAt: true },
    });
    return { conversationId: convo.id, message: msg };
  }
}

