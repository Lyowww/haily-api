import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  RawBodyRequest,
  Req,
  Headers,
  BadRequestException,
  Redirect,
} from '@nestjs/common';
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
  @Redirect()
  @ApiOperation({ summary: 'Stripe checkout success redirect (set STRIPE_SUCCESS_URL to this URL)' })
  paymentSuccess() {
    const target = this.config.stripeSuccessRedirect ?? 'haily://payment-success';
    return { url: target, statusCode: 302 };
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
