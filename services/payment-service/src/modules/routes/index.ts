import { Router } from 'express';
import { paymentsRouter } from '../payments/payments.router';
import { paymentRateLimit } from '../../middlewares';

export const rootRouter: Router = Router();

// Apply payment rate limiting to all routes
rootRouter.use(paymentRateLimit);

rootRouter.use('/payments', paymentsRouter);
