import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';

const CODE_EXPIRY_MINUTES = 15;

function generateSixDigitCode(): string {
  return String(randomInt(100000, 999999));
}

/** Shape user for API responses: include emailVerified derived from emailVerifiedAt */
function toUserResponse(user: {
  id: string;
  email: string;
  avatarBaseImageUrl: string | null;
  onboardingStatus: string;
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerifiedAt?: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    avatarBaseImageUrl: user.avatarBaseImageUrl,
    onboardingStatus: user.onboardingStatus,
    sex: user.sex,
    age: user.age,
    heightCm: user.heightCm,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    emailVerified: !!user.emailVerifiedAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
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

    // 6-digit verification code for email (stored plain for comparison; expires in 15 min)
    const emailVerificationCode = generateSixDigitCode();
    const emailVerificationExpires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        onboardingStatus: 'pending',
        emailVerificationCode,
        emailVerificationExpires,
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
        emailVerifiedAt: true,
      },
    });

    // Send no-reply welcome email with verification code
    await this.emailService.sendWelcomeNoReply(email, emailVerificationCode);

    // Generate JWT token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user: toUserResponse(user),
      accessToken,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { email, code } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerificationCode: true,
        emailVerificationExpires: true,
        emailVerifiedAt: true,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }
    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }
    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      throw new BadRequestException('No verification pending. Request a new code.');
    }
    if (new Date() > user.emailVerificationExpires) {
      throw new BadRequestException('Verification code expired. Request a new code.');
    }
    if (user.emailVerificationCode !== code) {
      throw new BadRequestException('Invalid email or code');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: null,
        emailVerificationExpires: null,
        emailVerifiedAt: new Date(),
      },
    });
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    // Always return success to avoid leaking whether email exists
    const code = generateSixDigitCode();
    const expires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: code,
          passwordResetExpires: expires,
        },
      });
      await this.emailService.sendPasswordResetCode(email, code);
    }
    return {
      message:
        'If an account exists for this email, you will receive a password reset code shortly.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, code, newPassword } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordResetToken: true,
        passwordResetExpires: true,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      throw new BadRequestException('No password reset requested. Use forgot password first.');
    }
    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Reset code expired. Request a new code.');
    }
    if (user.passwordResetToken !== code) {
      throw new BadRequestException('Invalid email or code');
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      throw new BadRequestException('Password must be 8–128 characters');
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    return { message: 'Password reset successfully' };
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
      user: toUserResponse(user),
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
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return toUserResponse(user);
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
        emailVerifiedAt: true,
      },
    });

    return toUserResponse(user);
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
        emailVerifiedAt: true,
      },
    });

    return toUserResponse(user);
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

