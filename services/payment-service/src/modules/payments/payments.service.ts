import { StatusCodes } from 'http-status-codes';
import { createOrder, verifyPaymentSignature, type RazorpayOrderResponse } from './razorpay.client';
import { AppError } from '../../utils';
import { env } from '../../config/env';

export type CreatePaymentOrderInput = {
  amount: number; // in minor units (paise for INR)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
};

export type CreatePaymentOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  receipt?: string;
  intentExpiresAt?: Date;
};

export const createPaymentOrder = async (
  input: CreatePaymentOrderInput,
  expiresInSeconds: number = 15 * 60, // 15 minutes default
): Promise<CreatePaymentOrderResponse> => {
  // Generate receipt if not provided
  const receipt =
    input.receipt || `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const order: RazorpayOrderResponse = await createOrder({
    amount: input.amount,
    currency: input.currency || env.RAZORPAY_CURRENCY,
    receipt,
    ...(input.notes ? { notes: input.notes } : {}),
  });

  const intentExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
    ...((order.receipt ?? input.receipt) ? { receipt: order.receipt ?? input.receipt } : {}),
    intentExpiresAt,
  };
};

export type VerifyPaymentInput = {
  orderId: string;
  paymentId: string;
  signature: string;
};

export const verifyPayment = async (input: VerifyPaymentInput): Promise<boolean> => {
  return verifyPaymentSignature({
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
  });
};

// Payment ledger model for tracking transactions
import { Schema, model, type Document } from 'mongoose';

export interface PaymentTransactionDocument extends Document {
  tenantId: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  receipt?: string;
  entityType: 'appointment' | 'other';
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<PaymentTransactionDocument>(
  {
    tenantId: { type: String, required: true, index: true, trim: true },
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    receipt: { type: String },
    entityType: { type: String, enum: ['appointment', 'other'], required: true },
    entityId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

PaymentTransactionSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
PaymentTransactionSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });

export const PaymentTransactionModel = model<PaymentTransactionDocument>(
  'PaymentTransaction',
  PaymentTransactionSchema,
);

export const createPaymentTransaction = async (
  tenantId: string,
  orderId: string,
  amount: number,
  currency: string,
  entityType: 'appointment' | 'other',
  entityId?: string,
  receipt?: string,
  metadata?: Record<string, unknown>,
) => {
  return PaymentTransactionModel.create({
    tenantId,
    orderId,
    amount,
    currency,
    entityType,
    entityId,
    receipt,
    metadata,
    status: 'pending',
  });
};

export const updatePaymentTransaction = async (
  orderId: string,
  updates: {
    paymentId?: string;
    status?: PaymentTransactionDocument['status'];
    metadata?: Record<string, unknown>;
  },
) => {
  return PaymentTransactionModel.findOneAndUpdate(
    { orderId },
    {
      ...(updates.paymentId ? { paymentId: updates.paymentId } : {}),
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.metadata ? { metadata: updates.metadata } : {}),
    },
    { new: true },
  );
};

export const getPaymentTransaction = async (orderId: string) => {
  return PaymentTransactionModel.findOne({ orderId });
};
