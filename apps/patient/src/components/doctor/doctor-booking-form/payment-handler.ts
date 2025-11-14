import type { BookAppointmentResponse } from '@/types/api';
import type { Doctor } from '@/types/api';
import { appointmentsApi } from '@/lib/api/appointments';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import type { QueryClient } from '@tanstack/react-query';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

type RazorpayCheckoutHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutFailure = {
  error: {
    description?: string;
    code?: string;
    reason?: string;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayCheckoutFailure) => void) => void;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, unknown>;
  handler: (response: RazorpayCheckoutHandlerResponse) => void;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let razorpayScriptPromise: Promise<boolean> | null = null;

const loadRazorpayScript = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof window.Razorpay !== 'undefined') {
    return true;
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise.then((loaded) => loaded && typeof window.Razorpay !== 'undefined');
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const loaded = await razorpayScriptPromise;
  return loaded && typeof window.Razorpay !== 'undefined';
};

export const startPaymentFlow = async (
  result: BookAppointmentResponse,
  doctor: Doctor,
  patientName: string,
  patientEmail: string,
  patientPhone: string,
  queryClient: QueryClient,
  router: AppRouterInstance,
  availabilityParams: { days: number },
): Promise<boolean> => {
  if (!result.payment) {
    return false;
  }

  try {
    const scriptReady = await loadRazorpayScript();
    if (!scriptReady || !window.Razorpay) {
      toast.error("We couldn't load the payment gateway. Please try again in a moment.");
      return false;
    }

    const RazorpayCheckout = window.Razorpay;
    if (!RazorpayCheckout) {
      toast.error('Razorpay is not available right now. Please retry the payment shortly.');
      return false;
    }

    const appointment = result.appointment;
    const paymentOrder = result.payment;

    const success = await new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (value: boolean) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };

      const checkout = new RazorpayCheckout({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Illajwala VisitNow',
        description: `Appointment with ${doctor.name}`,
        order_id: paymentOrder.orderId,
        prefill: {
          name: patientName || undefined,
          email: patientEmail || undefined,
          contact: patientPhone || undefined,
        },
        notes: {
          appointmentId: appointment._id,
          doctorId: doctor._id,
        },
        handler: async (response: RazorpayCheckoutHandlerResponse) => {
          try {
            await appointmentsApi.confirmPayment(appointment._id, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            toast.success('Payment confirmed', {
              description:
                'Your appointment is confirmed. You can review details in My Appointments.',
            });

            await Promise.all([
              queryClient.invalidateQueries({ queryKey: queryKeys.appointments() }),
              queryClient.invalidateQueries({
                queryKey: queryKeys.doctorAvailability(doctor._id, availabilityParams),
              }),
            ]);

            router.push('/account/appointments');
            settle(true);
          } catch (error) {
            console.error('[patient] Failed to confirm Razorpay payment', error);
            toast.error(
              getErrorMessage(
                error,
                'We received the payment but could not verify it automatically. Please contact support.',
              ),
            );
            settle(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment pending', {
              description: 'You can resume the payment anytime from My Appointments.',
            });
            settle(false);
          },
        },
        theme: {
          color: '#2563eb',
        },
      });

      checkout.on('payment.failed', (event: RazorpayCheckoutFailure) => {
        console.error('[patient] Razorpay payment failed', event.error);
        toast.error(event.error.description ?? 'Payment failed. Please try again.');
        settle(false);
      });

      checkout.open();
    });

    return success;
  } catch (error) {
    console.error('[patient] Payment flow error', error);
    toast.error(getErrorMessage(error, 'Payment processing failed. Please try again.'));
    return false;
  }
};
