import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { handleRazorpayWebhook } from './payments.controller';

export const paymentsRouter: ExpressRouter = Router();

// Webhook endpoints typically don't need rate limiting as they're called by payment gateways
// But we'll add it for other payment endpoints in the future
paymentsRouter.post('/razorpay/webhook', handleRazorpayWebhook);
