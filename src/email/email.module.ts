import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '../config';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
