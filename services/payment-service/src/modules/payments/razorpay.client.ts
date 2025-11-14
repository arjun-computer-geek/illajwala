import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env } from '../../config/env';

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  [key: string]: unknown;
};

export const createOrder = async ({
  amount,
  currency,
  receipt,
  notes,
}: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> => {
  const order = (await razorpay.orders.create({
    amount,
    currency,
    receipt,
    payment_capture: true,
    notes,
  } as any)) as unknown as RazorpayOrderResponse;
  return order;
};

export const verifySignature = ({ signature, payload }: { signature: string; payload: string }) => {
  const hmac = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return digest === signature;
};

export const verifyPaymentSignature = ({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) => {
  const hmac = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET);
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest('hex');
  return digest === signature;
};
