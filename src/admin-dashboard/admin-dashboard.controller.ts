import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminPublic } from './admin-public.decorator';
import { AdminLoginDto } from './dto/login.dto';
import { getDashboardHtml } from './dashboard.html';

@ApiTags('Admin Dashboard')
@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private adminAuthService: AdminAuthService) {}

  @AdminPublic()
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

  @AdminPublic()
  @Get()
  @ApiOperation({ summary: 'Serve admin dashboard HTML (login form when not authenticated)' })
  @ApiResponse({ status: 200, description: 'Dashboard single-page app' })
  getDashboard(@Res() res: Response) {
    res.type('text/html').send(getDashboardHtml());
  }
}
