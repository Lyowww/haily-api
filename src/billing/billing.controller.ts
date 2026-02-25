import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  RawBodyRequest,
  Req,
  Res,
  Headers,
  BadRequestException,
  Redirect,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { ConfigService } from '../config';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly config: ConfigService,
  ) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 200, description: 'Checkout session URL', schema: { properties: { url: { type: 'string' } } } })
  async createCheckoutSession(@Request() req: any, @Body() dto: CreateCheckoutSessionDto) {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) throw new BadRequestException('User not found');
    return this.billingService.createCheckoutSession(userId, dto.priceId);
  }

  @Get('payment-success')
  @Public()
  @ApiOperation({ summary: 'Stripe checkout success page (set STRIPE_SUCCESS_URL to this URL)' })
  async paymentSuccess(
    @Query('session_id') sessionId: string | undefined,
    @Res() res: Response,
  ) {
    const redirectUrl = this.config.stripeSuccessRedirect ?? 'haily://payment-success';
    if (sessionId) {
      try {
        await this.billingService.syncSubscriptionFromCheckoutSession(sessionId);
      } catch (err: any) {
        // Log so we can debug; still show success page and let client retry via confirm-session
        console.error('payment-success sync failed:', err?.message ?? err);
      }
    }
    const html = this.getPaymentSuccessHtml(redirectUrl, sessionId);
    res.type('text/html').send(html);
  }

  @Post('confirm-session')
  @Public()
  @ApiOperation({ summary: 'Confirm checkout session and sync subscription (called from success page)' })
  @ApiResponse({ status: 200, description: 'Subscription synced' })
  @ApiResponse({ status: 400, description: 'session_id required' })
  async confirmSession(@Body() body: { session_id?: string }) {
    const sessionId = body?.session_id;
    if (!sessionId || typeof sessionId !== 'string') {
      throw new BadRequestException('session_id required');
    }
    await this.billingService.syncSubscriptionFromCheckoutSession(sessionId);
    return { ok: true };
  }

  private getPaymentSuccessHtml(redirectUrl: string, sessionId?: string): string {
    const safeUrl = redirectUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const safeSessionId = sessionId
      ? sessionId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="5;url=${safeUrl}">
  <title>Payment successful – Haily</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8f4ff 0%, #e8e0f5 100%);
      color: #1a1a2e;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    }
    .icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 700; }
    p { color: #64748b; line-height: 1.6; margin-bottom: 1.5rem; }
    a {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      color: #fff;
      text-decoration: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      margin-top: 0.5rem;
    }
    a:hover { opacity: 0.95; }
    .note { font-size: 0.875rem; color: #94a3b8; margin-top: 1.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Payment successful</h1>
    <p>Your subscription is active. You can close this page or you’ll be redirected back to the app shortly.</p>
    <a href="${safeUrl}">Return to app</a>
    <p class="note">Redirecting in 5 seconds…</p>
  </div>
  ${safeSessionId ? `<script>
(function(){
  var sessionId = "${safeSessionId}";
  fetch(window.location.origin + "/api/billing/confirm-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId })
  }).catch(function(){});
})();
</script>` : ''}
</body>
</html>`;
  }

  @Get('payment-cancel')
  @Public()
  @Redirect()
  @ApiOperation({ summary: 'Stripe checkout cancel redirect (set STRIPE_CANCEL_URL to this URL)' })
  paymentCancel() {
    const target = this.config.stripeCancelRedirect ?? 'haily://payment-cancel';
    return { url: target, statusCode: 302 };
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook (checkout.session.completed, subscription updated/deleted)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body required for webhook verification (enable rawBody in NestFactory.create)');
    }
    await this.billingService.handleWebhook(rawBody, signature);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscription info (plan, period start/end, limits)' })
  @ApiResponse({
    status: 200,
    description: 'Subscription info: plan, status, when period starts/ends, cancel flag, and remaining limits',
    schema: {
      example: {
        plan: 'pro',
        status: 'active',
        currentPeriodStart: '2026-03-01',
        currentPeriodEnd: '2026-04-01',
        cancelAtPeriodEnd: false,
        limits: { aiRemaining: 100, virtualRemaining: 100, weeklyRemaining: 1 },
      },
    },
  })
  async getStatus(@Request() req: any) {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) throw new BadRequestException('User not found');
    return this.billingService.getSubscriptionStatus(userId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  @ApiResponse({ status: 200, description: 'Subscription will cancel at period end' })
  async cancel(@Request() req: any) {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) throw new BadRequestException('User not found');
    await this.billingService.cancelSubscription(userId);
    return { ok: true };
  }

  @Post('restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore subscription (remove cancel_at_period_end)' })
  @ApiResponse({ status: 200, description: 'Subscription restored' })
  async restore(@Request() req: any) {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) throw new BadRequestException('User not found');
    await this.billingService.restoreSubscription(userId);
    return { ok: true };
  }
}
