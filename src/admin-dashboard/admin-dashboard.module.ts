import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '../config';
import { PrismaModule } from '../prisma';
import { HelpCenterModule } from '../help-center';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminHelpCenterController } from './admin-help-center.controller';
import { AdminTablesController } from './admin-tables.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminGateway } from './admin.gateway';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
    HelpCenterModule,
  ],
  controllers: [
    AdminDashboardController,
    AdminHelpCenterController,
    AdminTablesController,
  ],
  providers: [AdminAuthService, AdminAuthGuard, AdminGateway],
  exports: [AdminAuthService],
})
export class AdminDashboardModule {}
