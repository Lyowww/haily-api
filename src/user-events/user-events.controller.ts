import { Body, Controller, Delete, Get, Param, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserEventsService } from './user-events.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class UserEventsController {
  constructor(private readonly userEventsService: UserEventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an event for outfit planning' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(@Request() req: any, @Body() dto: CreateEventDto) {
    return this.userEventsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List events for the current user' })
  @ApiResponse({ status: 200, description: 'Events returned successfully' })
  list(@Request() req: any) {
    return this.userEventsService.list(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.userEventsService.remove(req.user.userId, id);
  }
}
