import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { UserEventsController } from './user-events.controller';
import { UserEventsService } from './user-events.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserEventsController],
  providers: [UserEventsService],
  exports: [UserEventsService],
})
export class UserEventsModule {}
