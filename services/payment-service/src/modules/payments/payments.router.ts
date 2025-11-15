import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  handleRazorpayWebhook,
  handleCreatePaymentOrder,
  handleVerifyPayment,
  handleGetPaymentTransaction,
} from './payments.controller';
import { requireAuth, validateRequest, paymentRateLimit } from '../../middlewares';
import { z } from 'zod';

export const paymentsRouter: ExpressRouter = Router();

// Webhook endpoints typically don't need rate limiting as they're called by payment gateways
// But we'll add it for other payment endpoints in the future
paymentsRouter.post('/razorpay/webhook', handleRazorpayWebhook);

// Create payment order
const createPaymentOrderSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().optional(),
  receipt: z.string().optional(),
  notes: z.record(z.string(), z.string()).optional(),
  entityType: z.enum(['appointment', 'other']),
  entityId: z.string().optional(),
  expiresInSeconds: z.number().int().positive().optional(),
});

paymentsRouter.post(
  '/orders',
  requireAuth(['patient', 'admin']),
  paymentRateLimit,
  validateRequest({ body: createPaymentOrderSchema }),
  handleCreatePaymentOrder,
);

// Verify payment
const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

paymentsRouter.post(
  '/verify',
  requireAuth(['patient', 'admin']),
  paymentRateLimit,
  validateRequest({ body: verifyPaymentSchema }),
  handleVerifyPayment,
);

// Get payment transaction
paymentsRouter.get(
  '/transactions/:orderId',
  requireAuth(['patient', 'doctor', 'admin']),
  handleGetPaymentTransaction,
);
