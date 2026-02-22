import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma';
import { RegisterDto, LoginDto } from './dto';
// import { ConfigService } from '../config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    // private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        onboardingStatus: 'pending',
      },
      select: {
        id: true,
        email: true,
        avatarBaseImageUrl: true,
        onboardingStatus: true,
        sex: true,
        age: true,
        heightCm: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user,
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user has a password hash
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Account not set up with password. Please use magic link or reset password.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        avatarBaseImageUrl: user.avatarBaseImageUrl,
        onboardingStatus: user.onboardingStatus,
        sex: user.sex,
        age: user.age,
        heightCm: user.heightCm,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        avatarBaseImageUrl: true,
        onboardingStatus: true,
        sex: true,
        age: true,
        heightCm: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfilePhoto(userId: string, photoUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarBaseImageUrl: photoUrl },
      select: {
        id: true,
        email: true,
        avatarBaseImageUrl: true,
        onboardingStatus: true,
        sex: true,
        age: true,
        heightCm: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateProfile(
    userId: string,
    update: { sex?: 'male' | 'female'; age?: number; heightCm?: number },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(update.sex !== undefined ? { sex: update.sex } : {}),
        ...(update.age !== undefined ? { age: update.age } : {}),
        ...(update.heightCm !== undefined ? { heightCm: update.heightCm } : {}),
      },
      select: {
        id: true,
        email: true,
        avatarBaseImageUrl: true,
        onboardingStatus: true,
        sex: true,
        age: true,
        heightCm: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (!user.passwordHash) {
      throw new BadRequestException('Password is not set for this account');
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }
    if (newPassword.length > 128) {
      throw new BadRequestException('New password is too long');
    }
    if (newPassword === currentPassword) {
      throw new BadRequestException('New password must be different');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { ok: true };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}

