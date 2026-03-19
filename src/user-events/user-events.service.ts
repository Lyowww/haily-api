import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class UserEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventDto) {
    return this.prisma.userEvent.create({
      data: {
        userId,
        name: dto.name,
        date: new Date(dto.date),
        type: dto.type ?? null,
      },
    });
  }

  async list(userId: string) {
    const events = await this.prisma.userEvent.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    return { events };
  }

  async remove(userId: string, id: string) {
    const event = await this.prisma.userEvent.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.userEvent.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
