import { ServiceClient, type ServiceClientOptions } from '../client';
import { serviceConfig } from '../config';

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  receipt?: string;
  intentExpiresAt?: string;
}

export interface PaymentServiceClient {
  createPaymentOrder(data: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<PaymentOrder>;
  verifyPaymentSignature(data: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<boolean>;
  handleWebhook(data: unknown): Promise<void>;
}

export class PaymentServiceClientImpl implements PaymentServiceClient {
  private client: ServiceClient;

  constructor(options?: Partial<ServiceClientOptions>) {
    this.client = new ServiceClient(
      {
        baseURL: serviceConfig.paymentServiceUrl,
        ...options,
      },
      serviceConfig,
    );
  }

  async createPaymentOrder(data: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<PaymentOrder> {
    const response = await this.client.post<{ data: PaymentOrder; message?: string }>(
      '/api/payments/orders',
      data,
    );
    return response.data;
  }

  async verifyPaymentSignature(data: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<boolean> {
    const response = await this.client.post<{ data: { verified: boolean }; message?: string }>(
      '/api/payments/verify',
      data,
    );
    return response.data.verified;
  }

  async handleWebhook(data: unknown): Promise<void> {
    await this.client.post('/api/payments/webhook', data);
  }
}

export function createPaymentServiceClient(
  options?: Partial<ServiceClientOptions>,
): PaymentServiceClient {
  return new PaymentServiceClientImpl(options);
}
