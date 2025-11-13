import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { handleRazorpayWebhook } from "./payments.controller";

export const paymentsRouter: ExpressRouter = Router();

paymentsRouter.post("/razorpay/webhook", handleRazorpayWebhook);


