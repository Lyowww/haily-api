import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type {
  HelpCenterConversationPayload,
  HelpCenterMessagePayload,
} from './help-center.types';

@Injectable()
export class HelpCenterService {
  constructor(private prisma: PrismaService) {}

  private toConversationPayload(convo: {
    id: string;
    userId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): HelpCenterConversationPayload {
    return {
      id: convo.id,
      userId: convo.userId,
      status: convo.status as 'open' | 'closed',
      createdAt: convo.createdAt.toISOString(),
      updatedAt: convo.updatedAt.toISOString(),
    };
  }

  private toMessagePayload(
    msg: { id: string; conversationId: string; sender: string; text: string; createdAt: Date },
  ): HelpCenterMessagePayload {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      sender: msg.sender as HelpCenterMessagePayload['sender'],
      text: msg.text,
      createdAt: msg.createdAt.toISOString(),
    };
  }

  async getOrCreateConversation(userId: string) {
    const existing = await this.prisma.helpCenterConversation.findUnique({
      where: { userId },
      select: { id: true, userId: true, status: true, createdAt: true, updatedAt: true },
    });
    if (existing) return this.toConversationPayload(existing);
    const created = await this.prisma.helpCenterConversation.create({
      data: { userId, status: 'open' },
      select: { id: true, userId: true, status: true, createdAt: true, updatedAt: true },
    });
    return this.toConversationPayload(created);
  }

  async getConversationRaw(userId: string) {
    return this.prisma.helpCenterConversation.findUnique({
      where: { userId },
      select: { id: true, userId: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async listMessages(userId: string) {
    const convo = await this.getOrCreateConversation(userId);
    const raw = await this.prisma.helpCenterMessage.findMany({
      where: { conversationId: convo.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, conversationId: true, sender: true, text: true, createdAt: true },
    });
    const messages = raw.map((m) => this.toMessagePayload(m));
    return { conversation: convo, messages };
  }

  async createMessage(
    userId: string,
    sender: 'user' | 'support',
    text: string,
  ): Promise<{ conversationId: string; message: HelpCenterMessagePayload }> {
    const convoRaw = await this.getConversationRaw(userId);
    const convo =
      convoRaw ||
      (await this.prisma.helpCenterConversation.create({
        data: { userId, status: 'open' },
        select: { id: true, userId: true, status: true, createdAt: true, updatedAt: true },
      }));
    const msg = await this.prisma.helpCenterMessage.create({
      data: {
        conversationId: convo.id,
        sender,
        text,
      },
      select: { id: true, conversationId: true, sender: true, text: true, createdAt: true },
    });
    return {
      conversationId: convo.id,
      message: this.toMessagePayload(msg),
    };
  }
}

