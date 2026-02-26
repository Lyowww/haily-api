import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

/**
 * Body for POST /billing/restore-purchases.
 * Optional platform and receiptData. If omitted, we try both iOS (stored receipt) and Stripe.
 */
export class RestorePurchasesDto {
  @ApiPropertyOptional({ enum: ['ios', 'android', 'web'], description: 'Platform to restore (optional; if omitted, both iOS and Stripe are tried)' })
  @IsOptional()
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform?: 'ios' | 'android' | 'web';

  @ApiPropertyOptional({ description: 'For iOS: base64 receipt from the device (optional if we have a stored receipt)' })
  @IsOptional()
  @IsString()
  receiptData?: string;
}
