import type { Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  AppError,
  catchAsync,
  successResponse,
  requireTenantId,
  type AuthenticatedRequest,
} from '../../utils';
import { verifySignature } from './razorpay.client';
import {
  createPaymentOrder,
  verifyPayment,
  createPaymentTransaction,
  updatePaymentTransaction,
  getPaymentTransaction,
} from './payments.service';

const RAZORPAY_SIGNATURE_HEADER = 'x-razorpay-signature';

type RazorpayWebhookRequest = Request & { rawBody?: string };

export const handleCreatePaymentOrder = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const { amount, currency, receipt, notes, entityType, entityId, expiresInSeconds } =
      req.body as {
        amount: number;
        currency?: string;
        receipt?: string;
        notes?: Record<string, string>;
        entityType: 'appointment' | 'other';
        entityId?: string;
        expiresInSeconds?: number;
      };

    if (!amount || amount <= 0) {
      throw AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Amount must be greater than 0',
      });
    }

    const order = await createPaymentOrder(
      {
        amount,
        ...(currency ? { currency } : {}),
        ...(receipt ? { receipt } : {}),
        ...(notes ? { notes } : {}),
      },
      expiresInSeconds,
    );

    // Create payment transaction record
    await createPaymentTransaction(
      tenantId,
      order.orderId,
      order.amount,
      order.currency,
      entityType,
      entityId,
      order.receipt,
      notes,
    );

    return res.status(StatusCodes.CREATED).json(successResponse(order, 'Payment order created'));
  },
);

export const handleVerifyPayment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, paymentId, signature } = req.body as {
    orderId: string;
    paymentId: string;
    signature: string;
  };

  const isValid = await verifyPayment({ orderId, paymentId, signature });

  if (!isValid) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid payment signature',
    });
  }

  // Update payment transaction
  await updatePaymentTransaction(orderId, {
    paymentId,
    status: 'captured',
  });

  return res.json(successResponse({ verified: true }, 'Payment verified'));
});

export const handleGetPaymentTransaction = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.params as { orderId: string };

    const transaction = await getPaymentTransaction(orderId);

    if (!transaction) {
      throw AppError.from({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Payment transaction not found',
      });
    }

    return res.json(successResponse(transaction));
  },
);

const razorpayWebhookHandler = async (req: Request, res: Response) => {
  const signatureHeader = req.headers[RAZORPAY_SIGNATURE_HEADER];

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Missing Razorpay signature',
    });
  }

  const rawBody = (req as RazorpayWebhookRequest).rawBody;

  if (!rawBody) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Unable to verify webhook payload',
    });
  }

  const isAuthentic = verifySignature({
    signature: signatureHeader,
    payload: rawBody,
  });

  if (!isAuthentic) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid webhook signature',
    });
  }

  const eventName: string | undefined = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;

  if (!eventName || !paymentEntity) {
    return res
      .status(StatusCodes.OK)
      .json(successResponse({ ignored: true }, 'Event payload missing payment entity'));
  }

  const orderId: string | undefined = paymentEntity?.order_id;
  const paymentId: string | undefined = paymentEntity?.id;
  const paymentStatus: string | undefined = paymentEntity?.status;

  if (!orderId) {
    return res
      .status(StatusCodes.OK)
      .json(successResponse({ ignored: true }, 'Webhook missing order reference'));
  }

  // Update payment transaction
  const transaction = await getPaymentTransaction(orderId);
  if (!transaction) {
    return res
      .status(StatusCodes.OK)
      .json(successResponse({ ignored: true }, 'No payment transaction found for webhook'));
  }

  const now = new Date();
  const historyType =
    eventName === 'payment.captured'
      ? 'payment-captured'
      : eventName === 'payment.failed'
        ? 'payment-failed'
        : 'webhook-received';

  const statusMap: Record<string, 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded'> = {
    created: 'pending',
    authorized: 'authorized',
    captured: 'captured',
    failed: 'failed',
    refunded: 'refunded',
  };

  const newStatus = statusMap[paymentStatus || ''] || transaction.status;

  await updatePaymentTransaction(orderId, {
    ...(paymentId ? { paymentId } : {}),
    status: newStatus,
    metadata: {
      ...transaction.metadata,
      webhookEvents: [
        ...((transaction.metadata?.webhookEvents as any[]) || []),
        {
          type: historyType,
          event: eventName,
          ...(paymentId ? { paymentId } : {}),
          ...(paymentStatus ? { status: paymentStatus } : {}),
          receivedAt: now.toISOString(),
        },
      ],
    },
  });

  // TODO: Publish payment event via event bus to notify appointment-service
  // await publishPaymentEvent({ type: 'payment.captured', orderId, paymentId, ... });

  return res.status(StatusCodes.OK).json(successResponse({ processed: true }, 'Webhook processed'));
};

export const handleRazorpayWebhook: RequestHandler = catchAsync(razorpayWebhookHandler);
