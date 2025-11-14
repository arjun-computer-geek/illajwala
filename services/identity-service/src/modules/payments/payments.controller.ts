import type { Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync, successResponse } from '../../utils';
import { getServiceClients } from '../../config/service-clients';
import type { AuthenticatedRequest } from '../../utils';

// Forward webhook to payment service
const razorpayWebhookHandler = async (req: Request, res: Response) => {
  try {
    // Forward webhook to payment service
    const { payment } = getServiceClients();
    await payment.handleWebhook(req.body);
    return res
      .status(StatusCodes.OK)
      .json(successResponse({ processed: true }, 'Webhook processed'));
  } catch (error) {
    // If payment service is unavailable, return error
    return res
      .status(StatusCodes.SERVICE_UNAVAILABLE)
      .json(successResponse({ processed: false }, 'Payment service unavailable'));
  }
};

export const handleRazorpayWebhook: RequestHandler = catchAsync(razorpayWebhookHandler);
