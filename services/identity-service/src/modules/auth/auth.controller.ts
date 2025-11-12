import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import type {
  RegisterPatientInput,
  LoginPatientInput,
  LoginDoctorInput,
} from "./auth.schema";
import { loginDoctor, loginPatient, registerPatient } from "./auth.service";

export const handleRegisterPatient = catchAsync<
  Record<string, never>,
  unknown,
  RegisterPatientInput
>(async (req: Request<Record<string, never>, unknown, RegisterPatientInput>, res: Response) => {
  const result = await registerPatient(req.body);
  return res
    .status(StatusCodes.CREATED)
    .json(successResponse(result, "Patient registered"));
});

export const handleLoginPatient = catchAsync<
  Record<string, never>,
  unknown,
  LoginPatientInput
>(async (req: Request<Record<string, never>, unknown, LoginPatientInput>, res: Response) => {
  const result = await loginPatient(req.body);
  return res.json(successResponse(result, "Patient logged in"));
});

export const handleLoginDoctor = catchAsync<
  Record<string, never>,
  unknown,
  LoginDoctorInput
>(async (req: Request<Record<string, never>, unknown, LoginDoctorInput>, res: Response) => {
  const result = await loginDoctor(req.body);
  return res.json(successResponse(result, "Doctor logged in"));
});

