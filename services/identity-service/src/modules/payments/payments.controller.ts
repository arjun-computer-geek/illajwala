import type { Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError, catchAsync, successResponse } from '../../utils';
import { verifySignature } from './razorpay.client';
import { AppointmentModel } from '../appointments/appointment.model';

const RAZORPAY_SIGNATURE_HEADER = 'x-razorpay-signature';

type RazorpayWebhookRequest = Request & { rawBody?: string };

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

  if (!orderId) {
    return res
      .status(StatusCodes.OK)
      .json(successResponse({ ignored: true }, 'Webhook missing order reference'));
  }

  const appointment = await AppointmentModel.findOne({ 'payment.orderId': orderId });

  if (!appointment || !appointment.payment) {
    return res
      .status(StatusCodes.OK)
      .json(successResponse({ ignored: true }, 'No appointment found for webhook'));
  }

  const now = new Date();
  const paymentStatus: string | undefined = paymentEntity?.status;
  const paymentId: string | undefined = paymentEntity?.id;
  const failureReason: string | undefined =
    paymentEntity?.error_description ?? paymentEntity?.description;

  const historyType =
    eventName === 'payment.captured'
      ? 'payment-captured'
      : eventName === 'payment.failed'
        ? 'payment-failed'
        : 'webhook-received';

  appointment.payment.history = [
    ...(appointment.payment.history ?? []),
    {
      type: historyType,
      payload: {
        event: eventName,
        paymentId,
        status: paymentStatus,
      },
      createdAt: now,
    },
  ];

  if (eventName === 'payment.captured' || paymentStatus === 'captured') {
    if (appointment.payment.status !== 'captured') {
      appointment.payment.status = 'captured';
      if (paymentId) {
        appointment.payment.paymentId = paymentId;
      }
      appointment.payment.capturedAt = now;
      appointment.status = 'confirmed';
    }
  } else if (eventName === 'payment.failed' || paymentStatus === 'failed') {
    appointment.payment.status = 'failed';
    appointment.payment.failedAt = now;
    if (paymentId) {
      appointment.payment.paymentId = paymentId;
    }
    if (failureReason) {
      appointment.notes = [appointment.notes, `Payment failed: ${failureReason}`]
        .filter(Boolean)
        .join('\n');
    }
  }

  await appointment.save();

  return res.status(StatusCodes.OK).json(successResponse({ processed: true }, 'Webhook processed'));
};

export const handleRazorpayWebhook: RequestHandler = catchAsync(razorpayWebhookHandler);
