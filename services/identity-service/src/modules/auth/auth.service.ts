import { StatusCodes } from 'http-status-codes';
import type { FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import { verifyPassword, hashPassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../middlewares';
import type { TokenRole, TokenPayload } from '@illajwala/shared';
import { PatientModel, type PatientDocument } from '../patients/patient.model';
import { DoctorModel, type DoctorDocument } from '../doctors/doctor.model';
import { AdminModel, type AdminDocument } from '../admins/admin.model';
import type {
  RegisterPatientInput,
  LoginPatientInput,
  LoginDoctorInput,
  LoginAdminInput,
} from './auth.schema';
import { AppError } from '../../utils';

type AuthTokens = {
  token: string;
  refreshToken: string;
  tenantId?: string;
};

type PatientAuthResult = AuthTokens & {
  tenantId: string;
  patient: Record<string, unknown>;
  role: 'patient';
};

type DoctorAuthResult = AuthTokens & {
  tenantId: string;
  doctor: Record<string, unknown>;
  role: 'doctor';
};

type AdminAuthResult = AuthTokens & {
  admin: Record<string, unknown>;
  role: 'admin';
};

type AuthResult = PatientAuthResult | DoctorAuthResult | AdminAuthResult;

const issueTokens = (id: string, role: TokenRole, tenantId?: string | null): AuthTokens => {
  const normalizedTenantId: string | null = tenantId ?? null;
  const payload: TokenPayload =
    normalizedTenantId !== null
      ? { sub: id, role, tenantId: normalizedTenantId }
      : { sub: id, role };

  const tokens: AuthTokens = {
    token: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };

  if (normalizedTenantId !== null) {
    tokens.tenantId = normalizedTenantId;
  }

  return tokens;
};

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
  const tokens = issueTokens(patient.id, 'patient', patient.tenantId);
  return {
    ...tokens,
    tenantId: patient.tenantId,
    patient: scrubPatient(patient),
    role: 'patient',
  };
};

const buildDoctorAuthResult = (doctor: DoctorDocument): DoctorAuthResult => {
  const tokens = issueTokens(doctor.id, 'doctor', doctor.tenantId);
  return {
    ...tokens,
    tenantId: doctor.tenantId,
    doctor: scrubDoctor(doctor),
    role: 'doctor',
  };
};

const buildAdminAuthResult = (admin: AdminDocument): AdminAuthResult => {
  const tokens = issueTokens(admin.id, 'admin', admin.tenantId ?? null);
  return {
    ...tokens,
    admin: scrubAdmin(admin),
    role: 'admin',
  };
};

export const registerPatient = async (
  payload: RegisterPatientInput,
  tenantId: string,
): Promise<PatientAuthResult> => {
  const existingPatient = await PatientModel.findOne({
    tenantId,
    $or: [{ email: payload.email }, { phone: payload.phone }],
  });

  if (existingPatient) {
    throw AppError.from({
      statusCode: StatusCodes.CONFLICT,
      message: 'Patient already exists',
    });
  }
  const passwordHash = await hashPassword(payload.password);
  const patient = await PatientModel.create({
    tenantId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    primaryClinicId: payload.clinicId ? new Types.ObjectId(payload.clinicId) : null,
  });

  return buildPatientAuthResult(patient);
};

export const loginPatient = async (
  payload: LoginPatientInput,
  tenantId: string,
): Promise<PatientAuthResult> => {
  const patient = await PatientModel.findOne({ email: payload.email, tenantId });
  if (!patient) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid credentials',
    });
  }

  const isValid = await verifyPassword(payload.password, patient.passwordHash);
  if (!isValid) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid credentials',
    });
  }
  return buildPatientAuthResult(patient);
};

export const loginDoctor = async (
  payload: LoginDoctorInput,
  tenantId: string,
): Promise<DoctorAuthResult> => {
  const orConditions: FilterQuery<DoctorDocument>[] = [{ email: payload.email }];
  if (payload.phone) {
    orConditions.push({ phone: payload.phone });
  }

  const doctor = await DoctorModel.findOne({ tenantId, $or: orConditions });

  if (!doctor) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Doctor not found',
    });
  }

  return buildDoctorAuthResult(doctor);
};

export const loginAdmin = async (payload: LoginAdminInput): Promise<AdminAuthResult> => {
  const admin = await AdminModel.findOne({ email: payload.email });

  if (!admin) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid credentials',
    });
  }

  const isValid = await verifyPassword(payload.password, admin.passwordHash);
  if (!isValid) {
    throw AppError.from({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid credentials',
    });
  }

  return buildAdminAuthResult(admin);
};

export const refreshSession = async (refreshToken: string): Promise<AuthResult> => {
  const payload = verifyRefreshToken(refreshToken);

  switch (payload.role) {
    case 'patient': {
      if (!payload.tenantId) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Invalid patient session context',
        });
      }

      const patient = await PatientModel.findOne({ _id: payload.sub, tenantId: payload.tenantId });
      if (!patient) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Patient not found',
        });
      }
      return buildPatientAuthResult(patient);
    }
    case 'doctor': {
      if (!payload.tenantId) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Invalid doctor session context',
        });
      }

      const doctor = await DoctorModel.findOne({ _id: payload.sub, tenantId: payload.tenantId });
      if (!doctor) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Doctor not found',
        });
      }
      return buildDoctorAuthResult(doctor);
    }
    case 'admin': {
      const admin = await AdminModel.findById(payload.sub);
      if (!admin) {
        throw AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Admin not found',
        });
      }
      return buildAdminAuthResult(admin);
    }
    default:
      throw AppError.from({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Unsupported token role',
      });
  }
};
