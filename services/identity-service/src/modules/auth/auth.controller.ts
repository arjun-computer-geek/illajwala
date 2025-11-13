import type { Request, Response } from "express";
import type { CookieOptions } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import type {
  RegisterPatientInput,
  LoginPatientInput,
  LoginDoctorInput,
  LoginAdminInput,
} from "./auth.schema";
import {
  loginAdmin,
  loginDoctor,
  loginPatient,
  registerPatient,
  refreshSession,
} from "./auth.service";
import { AppError } from "../../utils/app-error";
import { refreshTokenMaxAgeSeconds } from "../../utils/jwt";
import { isProd } from "../../config/env";

const REFRESH_COOKIE_NAME = "illajwala_refresh_token";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  path: "/",
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: refreshTokenMaxAgeSeconds * 1000,
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
};

const respondWithAuth = <T extends { refreshToken: string }>(
  res: Response,
  payload: T,
  message: string,
  status = StatusCodes.OK
) => {
  setRefreshTokenCookie(res, payload.refreshToken);
  const { refreshToken, ...data } = payload;
  return res.status(status).json(successResponse(data, message));
};

export const handleRegisterPatient = catchAsync<
  Record<string, never>,
  unknown,
  RegisterPatientInput
>(async (req: Request<Record<string, never>, unknown, RegisterPatientInput>, res: Response) => {
  const result = await registerPatient(req.body);
  return respondWithAuth(res, result, "Patient registered", StatusCodes.CREATED);
});

export const handleLoginPatient = catchAsync<
  Record<string, never>,
  unknown,
  LoginPatientInput
>(async (req: Request<Record<string, never>, unknown, LoginPatientInput>, res: Response) => {
  const result = await loginPatient(req.body);
  return respondWithAuth(res, result, "Patient logged in");
});

export const handleLoginDoctor = catchAsync<
  Record<string, never>,
  unknown,
  LoginDoctorInput
>(async (req: Request<Record<string, never>, unknown, LoginDoctorInput>, res: Response) => {
  const result = await loginDoctor(req.body);
  return respondWithAuth(res, result, "Doctor logged in");
});

export const handleLoginAdmin = catchAsync<
  Record<string, never>,
  unknown,
  LoginAdminInput
>(async (req: Request<Record<string, never>, unknown, LoginAdminInput>, res: Response) => {
  const result = await loginAdmin(req.body);
  return respondWithAuth(res, result, "Admin logged in");
});

export const handleRefreshSession = catchAsync(async (req: Request, res: Response) => {
  const refreshTokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const refreshTokenFromBody =
    typeof req.body === "object" && req.body !== null ? (req.body as { refreshToken?: string }).refreshToken : undefined;

  const refreshToken = refreshTokenFromCookie ?? refreshTokenFromBody;

  if (!refreshToken) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Refresh token is missing",
    });
  }

  const result = await refreshSession(refreshToken);
  return respondWithAuth(res, result, "Session refreshed");
});

export const handleLogout = catchAsync(async (_req: Request, res: Response) => {
  clearRefreshTokenCookie(res);
  return res.status(StatusCodes.NO_CONTENT).send();
});

