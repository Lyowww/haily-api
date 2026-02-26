import { Inject } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'node:events';
import { HelpCenterService } from '../help-center/help-center.service';
import { HelpCenterGateway } from '../help-center/help-center.gateway';
import { AdminAuthService } from './admin-auth.service';
import { EventsToken, HELP_CENTER_MESSAGE_CREATED } from '../events/events.module';
import type { HelpCenterMessagePayload } from '../help-center/help-center.types';

const ADMIN_NAMESPACE = '/admin-dashboard-socket';

function adminRoomForUser(userId: string): string {
  return `admin:user:${userId}`;
}

@WebSocketGateway({ namespace: ADMIN_NAMESPACE, cors: { origin: '*' } })
export class AdminGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private forwardMessageToAdminRooms = (payload: { userId: string; message: HelpCenterMessagePayload }) => {
    if (!this.server) return;
    const room = adminRoomForUser(payload.userId);
    this.server.to(room).emit('help_center:message', payload.message);
  };

  constructor(
    private jwtService: JwtService,
    private adminAuthService: AdminAuthService,
    private helpCenterService: HelpCenterService,
    private helpCenterGateway: HelpCenterGateway,
    @Inject(EventsToken) private events: EventEmitter,
  ) {}

  afterInit() {
    this.events.on(HELP_CENTER_MESSAGE_CREATED, this.forwardMessageToAdminRooms);
  }

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as { token?: string })?.token ??
      (typeof client.handshake.headers?.authorization === 'string'
        ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '').trim()
        : null);
    if (!token) {
      client.emit('admin:error', { code: 'UNAUTHORIZED', message: 'Missing admin token' });
      client.disconnect(true);
      return;
    }
    try {
      this.adminAuthService.verifyToken(token);
      (client.data as { admin?: boolean }).admin = true;
    } catch {
      client.emit('admin:error', { code: 'UNAUTHORIZED', message: 'Invalid admin token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    client.removeAllListeners();
  }

  @SubscribeMessage('admin:subscribe_user')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId: string },
  ): void {
    if (!(client.data as { admin?: boolean }).admin) return;
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    if (userId) {
      client.join(adminRoomForUser(userId));
      client.emit('admin:subscribed', { userId });
    }
  }

  @SubscribeMessage('admin:unsubscribe_user')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId: string },
  ): void {
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    if (userId) {
      client.leave(adminRoomForUser(userId));
      client.emit('admin:unsubscribed', { userId });
    }
  }

  @SubscribeMessage('admin:send_support')
  async handleSendSupport(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId: string; text: string },
  ): Promise<{ message?: HelpCenterMessagePayload; error?: string }> {
    if (!(client.data as { admin?: boolean }).admin) {
      return { error: 'Unauthorized' };
    }
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!userId || !text) {
      return { error: 'userId and text required' };
    }
    if (text.length > 2000) {
      return { error: 'Text max 2000 characters' };
    }
    try {
      const result = await this.helpCenterService.createMessage(userId, 'support', text);
      this.helpCenterGateway.emitMessageToUser(userId, result.message);
      this.events.emit(HELP_CENTER_MESSAGE_CREATED, { userId, message: result.message });
      return { message: result.message };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to send' };
    }
  }
}
