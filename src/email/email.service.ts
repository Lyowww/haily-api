import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ConfigService } from '../config';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    if (this.config.isMailConfigured) {
      this.transporter = nodemailer.createTransport({
        host: this.config.mailHost,
        port: this.config.mailPort,
        secure: this.config.mailSecure,
        auth:
          this.config.mailUser && this.config.mailPassword
            ? {
                user: this.config.mailUser,
                pass: this.config.mailPassword,
              }
            : undefined,
      });
    }
  }

  private getFrom(): string {
    const from = this.config.mailFrom;
    if (from && from.length > 0) {
      return from;
    }
    const user = this.config.mailUser;
    if (user) {
      return user;
    }
    return 'noreply@localhost';
  }

  async send(options: SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      if (this.config.isDevelopment) {
        console.log('[Email] Not configured – skipping send:', options.subject, 'to', options.to);
      }
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: this.getFrom(),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html ?? options.text,
        replyTo: options.replyTo,
      });
      return true;
    } catch (err) {
      console.error('[Email] Send failed:', (err as Error).message);
      return false;
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const subject = 'Your account verification code';
    const text = `Your verification code is: ${code}\n\nThis code expires in 15 minutes. If you did not create an account, you can ignore this email.`;
    const html = `
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 15 minutes.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `;
    return this.send({ to: email, subject, text, html });
  }

  async sendWelcomeNoReply(email: string, code: string): Promise<boolean> {
    const subject = 'Welcome – your account has been created';
    const text = `Your account has been created. Use this code to verify your email: ${code}\n\nThis code expires in 15 minutes. This is a no-reply message.`;
    const html = `
      <p>Your account has been created.</p>
      <p>Verification code: <strong>${code}</strong></p>
      <p>This code expires in 15 minutes.</p>
      <p><em>This is a no-reply message. Please do not reply to this email.</em></p>
    `;
    return this.send({ to: email, subject, text, html });
  }

  async sendPasswordResetCode(email: string, code: string): Promise<boolean> {
    const subject = 'Password reset code';
    const text = `Your password reset code is: ${code}\n\nThis code expires in 15 minutes. If you did not request a reset, ignore this email.`;
    const html = `
      <p>Your password reset code is: <strong>${code}</strong></p>
      <p>This code expires in 15 minutes.</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `;
    return this.send({ to: email, subject, text, html });
  }
}
