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
import { HelpCenterService } from './help-center.service';
import { SendHelpCenterMessageDto } from './dto';

type JwtPayload = { sub: string; email?: string };

@WebSocketGateway({ namespace: '/help-center', cors: { origin: '*' } })
export class HelpCenterGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private jwtService: JwtService,
    private helpCenterService: HelpCenterService,
  ) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as any)?.token ||
      (typeof client.handshake.headers?.authorization === 'string'
        ? client.handshake.headers.authorization
        : null);

    const raw = typeof token === 'string' ? token.replace(/^Bearer\s+/i, '') : null;
    if (!raw) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(raw);
      const userId = payload?.sub;
      if (!userId) {
        client.disconnect(true);
        return;
      }
      (client.data as any).userId = userId;
      client.join(this.roomForUser(userId));
      await this.helpCenterService.getOrCreateConversation(userId);
    } catch {
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
  ) {
    const userId = (client.data as any)?.userId as string | undefined;
    if (!userId) return;
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) return;

    const created = await this.helpCenterService.createMessage(userId, 'user', text);
    this.server.to(this.roomForUser(userId)).emit('help_center:message', {
      ...created.message,
      sender: 'user',
    });

    const autoReply =
      'Thanks for reaching out. A support specialist will reply as soon as possible.';
    const support = await this.helpCenterService.createMessage(userId, 'support', autoReply);
    this.server.to(this.roomForUser(userId)).emit('help_center:message', {
      ...support.message,
      sender: 'support',
    });
  }

  private roomForUser(userId: string) {
    return `help_center:user:${userId}`;
  }
}

