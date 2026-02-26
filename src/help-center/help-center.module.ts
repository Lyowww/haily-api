import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '../config';
import { PrismaModule } from '../prisma';
import { HelpCenterController } from './help-center.controller';
import { HelpCenterGateway } from './help-center.gateway';
import { HelpCenterService } from './help-center.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HelpCenterController],
  providers: [HelpCenterService, HelpCenterGateway],
  exports: [HelpCenterService, HelpCenterGateway],
})
export class HelpCenterModule {}

