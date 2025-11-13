import { StatusCodes } from "http-status-codes";
import type { FilterQuery } from "mongoose";
import { verifyPassword, hashPassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type TokenRole,
} from "../../utils/jwt";
import { PatientModel, type PatientDocument } from "../patients/patient.model";
import { DoctorModel, type DoctorDocument } from "../doctors/doctor.model";
import { AdminModel, type AdminDocument } from "../admins/admin.model";
import type {
  RegisterPatientInput,
  LoginPatientInput,
  LoginDoctorInput,
  LoginAdminInput,
} from "./auth.schema";
import { AppError } from "../../utils/app-error";

type AuthTokens = {
  token: string;
  refreshToken: string;
};

type PatientAuthResult = AuthTokens & {
  patient: Record<string, unknown>;
  role: "patient";
};

type DoctorAuthResult = AuthTokens & {
  doctor: Record<string, unknown>;
  role: "doctor";
};

type AdminAuthResult = AuthTokens & {
  admin: Record<string, unknown>;
  role: "admin";
};

type AuthResult = PatientAuthResult | DoctorAuthResult | AdminAuthResult;

const issueTokens = (id: string, role: TokenRole): AuthTokens => ({
  token: signAccessToken({ sub: id, role }),
  refreshToken: signRefreshToken({ sub: id, role }),
});

const scrubPatient = (patient: PatientDocument) => {
  const plain = patient.toObject({ versionKey: false });
  delete plain.passwordHash;
  return plain;
};

const scrubDoctor = (doctor: DoctorDocument) => doctor.toObject({ versionKey: false });

const scrubAdmin = (admin: AdminDocument) => {
  const plain = admin.toObject({ versionKey: false });
  delete plain.passwordHash;
  return plain;
};

const buildPatientAuthResult = (patient: PatientDocument): PatientAuthResult => {
  const tokens = issueTokens(patient.id, "patient");
  return {
    ...tokens,
    patient: scrubPatient(patient),
    role: "patient",
  };
};

const buildDoctorAuthResult = (doctor: DoctorDocument): DoctorAuthResult => {
  const tokens = issueTokens(doctor.id, "doctor");
  return {
    ...tokens,
    doctor: scrubDoctor(doctor),
    role: "doctor",
  };
};

const buildAdminAuthResult = (admin: AdminDocument): AdminAuthResult => {
  const tokens = issueTokens(admin.id, "admin");
  return {
    ...tokens,
    admin: scrubAdmin(admin),
    role: "admin",
  };
};

export const registerPatient = async (payload: RegisterPatientInput): Promise<PatientAuthResult> => {
  const existingPatient = await PatientModel.findOne({
    $or: [{ email: payload.email }, { phone: payload.phone }],
  });

  if (existingPatient) {
    throw AppError.from({
      statusCode: StatusCodes.CONFLICT,
      message: "Patient already exists",
    });
  }

  const passwordHash = await hashPassword(payload.password);
  const patient = await PatientModel.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
  });

  return buildPatientAuthResult(patient);
};

export const loginPatient = async (payload: LoginPatientInput): Promise<PatientAuthResult> => {
  const patient = await PatientModel.findOne({ email: payload.email });
  if (!patient) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  }

  const isValid = await verifyPassword(payload.password, patient.passwordHash);
  if (!isValid) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  }

  return buildPatientAuthResult(patient);
};

export const loginDoctor = async (payload: LoginDoctorInput): Promise<DoctorAuthResult> => {
  const orConditions: FilterQuery<DoctorDocument>[] = [{ email: payload.email }];
  if (payload.phone) {
    orConditions.push({ phone: payload.phone });
  }

  const doctor = await DoctorModel.findOne({ $or: orConditions });

  if (!doctor) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: "Doctor not found",
    });
  }

  return buildDoctorAuthResult(doctor);
};

export const loginAdmin = async (payload: LoginAdminInput): Promise<AdminAuthResult> => {
  const admin = await AdminModel.findOne({ email: payload.email });

  if (!admin) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  }

  const isValid = await verifyPassword(payload.password, admin.passwordHash);
  if (!isValid) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Invalid credentials",
    });
  }

  return buildAdminAuthResult(admin);
};

export const refreshSession = async (refreshToken: string): Promise<AuthResult> => {
  const payload = verifyRefreshToken(refreshToken);

  switch (payload.role) {
    case "patient": {
      const patient = await PatientModel.findById(payload.sub);
      if (!patient) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "Patient not found",
        });
      }
      return buildPatientAuthResult(patient);
    }
    case "doctor": {
      const doctor = await DoctorModel.findById(payload.sub);
      if (!doctor) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "Doctor not found",
        });
      }
      return buildDoctorAuthResult(doctor);
    }
    case "admin": {
      const admin = await AdminModel.findById(payload.sub);
      if (!admin) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "Admin not found",
        });
      }
      return buildAdminAuthResult(admin);
    }
    default:
      throw AppError.from({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Unsupported token role",
      });
  }
};

