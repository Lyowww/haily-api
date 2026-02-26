import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config';

export const ADMIN_JWT_SUB = 'admin';
export const ADMIN_JWT_ROLE = 'admin';

export interface AdminJwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  validatePassword(password: string): boolean {
    const adminPassword = this.configService.adminPassword;
    if (!adminPassword) {
      return false;
    }
    return password === adminPassword;
  }

  login(password: string): { accessToken: string } {
    if (!this.validatePassword(password)) {
      throw new UnauthorizedException('Invalid admin password');
    }
    const payload: AdminJwtPayload = { sub: ADMIN_JWT_SUB, role: ADMIN_JWT_ROLE };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    return { accessToken };
  }

  verifyToken(token: string): AdminJwtPayload {
    const payload = this.jwtService.verify<AdminJwtPayload>(token);
    if (payload?.sub !== ADMIN_JWT_SUB || payload?.role !== ADMIN_JWT_ROLE) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return payload;
  }
}
