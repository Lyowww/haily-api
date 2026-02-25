import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ example: 'price_xxx', description: 'Stripe Price ID' })
  @IsString()
  @IsNotEmpty()
  priceId!: string;
}
