import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'node:events';
import { HelpCenterService } from './help-center.service';
import { SendHelpCenterMessageDto } from './dto';
import type { HelpCenterErrorPayload, HelpCenterMessagePayload } from './help-center.types';
import { EventsToken, HELP_CENTER_MESSAGE_CREATED } from '../events/events.module';

type JwtPayload = { sub: string; email?: string };

@WebSocketGateway({ namespace: '/help-center', cors: { origin: '*' } })
export class HelpCenterGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private jwtService: JwtService,
    private helpCenterService: HelpCenterService,
    @Inject(EventsToken) private events: EventEmitter,
  ) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as { token?: string })?.token ??
      (typeof client.handshake.headers?.authorization === 'string'
        ? client.handshake.headers.authorization
        : null);

    const raw = typeof token === 'string' ? token.replace(/^Bearer\s+/i, '').trim() : null;
    if (!raw) {
      client.emit('help_center:error', {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid token',
      } satisfies HelpCenterErrorPayload);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(raw);
      const userId = payload?.sub;
      if (!userId) {
        client.emit('help_center:error', {
          code: 'UNAUTHORIZED',
          message: 'Invalid token payload',
        } satisfies HelpCenterErrorPayload);
        client.disconnect(true);
        return;
      }
      (client.data as { userId?: string }).userId = userId;
      client.join(this.roomForUser(userId));
      const { conversation, messages } = await this.helpCenterService.listMessages(userId);
      client.emit('help_center:connected', { conversation, messages });
    } catch {
      client.emit('help_center:error', {
        code: 'UNAUTHORIZED',
        message: 'Token verification failed',
      } satisfies HelpCenterErrorPayload);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    client.removeAllListeners();
  }

  @SubscribeMessage('help_center:send')
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendHelpCenterMessageDto,
  ): Promise<{ message?: HelpCenterMessagePayload; error?: HelpCenterErrorPayload }> {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) {
      return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return {
        error: { code: 'VALIDATION_ERROR', message: 'Message text is required', details: { text } },
      };
    }
    if (text.length > 2000) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message text must be at most 2000 characters',
          details: { maxLength: 2000 },
        },
      };
    }

    try {
      const created = await this.helpCenterService.createMessage(userId, 'user', text);
      const room = this.roomForUser(userId);
      this.server.to(room).emit('help_center:message', created.message);
      this.events.emit(HELP_CENTER_MESSAGE_CREATED, { userId, message: created.message });

      const autoReply =
        'Thanks for reaching out. A support specialist will reply as soon as possible.';
      const support = await this.helpCenterService.createMessage(userId, 'support', autoReply);
      this.server.to(room).emit('help_center:message', support.message);
      this.events.emit(HELP_CENTER_MESSAGE_CREATED, { userId, message: support.message });

      return { message: created.message };
    } catch (err) {
      return {
        error: {
          code: 'SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to send message',
        },
      };
    }
  }

  @SubscribeMessage('help_center:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { isTyping?: boolean },
  ): void {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) return;
    const isTyping = body?.isTyping === true;
    // Broadcast to same user room (e.g. for future support-agent view; same client can ignore)
    client.to(this.roomForUser(userId)).emit('help_center:typing', {
      isTyping,
      sender: 'support' as const,
    });
  }

  roomForUser(userId: string) {
    return `help_center:user:${userId}`;
  }

  /** Emit a message to a user's room (e.g. when admin sends support reply). */
  emitMessageToUser(userId: string, message: HelpCenterMessagePayload): void {
    this.server.to(this.roomForUser(userId)).emit('help_center:message', message);
  }
}

