import { Global, Module } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export const HELP_CENTER_MESSAGE_CREATED = 'help_center:message_created';

export const EventsToken = Symbol('EventsToken');

export function createAppEventEmitter(): EventEmitter {
  const ee = new EventEmitter();
  ee.setMaxListeners(50);
  return ee;
}

@Global()
@Module({
  providers: [
    {
      provide: EventsToken,
      useFactory: createAppEventEmitter,
    },
  ],
  exports: [EventsToken],
})
export class EventsModule {}
