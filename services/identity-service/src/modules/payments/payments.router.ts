import { Router } from "express";
import { handleRazorpayWebhook } from "./payments.controller";

export const paymentsRouter = Router();

paymentsRouter.post("/razorpay/webhook", handleRazorpayWebhook);


