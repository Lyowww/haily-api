import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';

/**
 * Body for POST /billing/verify-purchase.
 * - For iOS: set platform to "ios" and provide receiptData (base64 receipt from StoreKit).
 * - For Android/web: set platform to "android" or "web" and provide sessionId (Stripe checkout session ID).
 */
export class VerifyPurchaseDto {
  @ApiProperty({ enum: ['ios', 'android', 'web'], description: 'Platform of the purchase' })
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';

  @ApiPropertyOptional({ description: 'Base64-encoded Apple IAP receipt (required when platform=ios)' })
  @IsOptional()
  @IsString()
  receiptData?: string;

  @ApiPropertyOptional({ description: 'Stripe checkout session ID (required when platform=android or web)' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
