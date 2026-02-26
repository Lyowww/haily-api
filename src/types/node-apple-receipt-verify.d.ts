declare module 'node-apple-receipt-verify' {
  export interface ValidateProduct {
    bundleId?: string;
    productId: string;
    transactionId: string;
    originalTransactionId?: string;
    purchaseDate: number;
    expirationDate?: number;
    quantity?: number;
  }

  export interface ValidateOptions {
    receipt: string;
    device?: string;
    environment?: ('sandbox' | 'production')[];
  }

  export function config(options: {
    secret?: string;
    verbose?: boolean;
    environment?: ('sandbox' | 'production')[];
    ignoreExpiredError?: boolean;
    ignoreExpired?: boolean;
    extended?: boolean;
  }): void;

  export function validate(
    options: ValidateOptions,
    callback: (err: Error | null, products: ValidateProduct[]) => void,
  ): void;
}
