import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/login.dto';
import { getDashboardHtml } from './dashboard.html';

@ApiTags('Admin Dashboard')
@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private adminAuthService: AdminAuthService) {}

  /** Public so global JwtAuthGuard does not require app JWT; we validate admin password here. */
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login with password from .env' })
  @ApiResponse({ status: 201, description: 'Returns JWT for admin API' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  login(@Body() dto: AdminLoginDto) {
    if (!this.adminAuthService.validatePassword(dto.password)) {
      throw new UnauthorizedException('Invalid admin password');
    }
    return this.adminAuthService.login(dto.password);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Serve admin dashboard HTML (login form when not authenticated)' })
  @ApiResponse({ status: 200, description: 'Dashboard single-page app' })
  getDashboard(@Res() res: Response) {
    res.type('text/html').send(getDashboardHtml());
  }
}
