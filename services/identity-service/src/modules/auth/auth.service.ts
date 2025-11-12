import { StatusCodes } from "http-status-codes";
import type { FilterQuery } from "mongoose";
import { verifyPassword, hashPassword } from "../../utils/password";
import { signJwt } from "../../utils/jwt";
import { PatientModel } from "../patients/patient.model";
import { DoctorModel, type DoctorDocument } from "../doctors/doctor.model";
import type { RegisterPatientInput, LoginPatientInput, LoginDoctorInput } from "./auth.schema";
import { AppError } from "../../utils/app-error";

const scrubPatient = (patient: any) => {
  const plain = patient.toObject({ versionKey: false });
  delete plain.passwordHash;
  return plain;
};

const scrubDoctor = (doctor: any) => doctor.toObject({ versionKey: false });

export const registerPatient = async (payload: RegisterPatientInput) => {
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

  const token = signJwt({ sub: patient.id, role: "patient" });
  return { patient: scrubPatient(patient), token };
};

export const loginPatient = async (payload: LoginPatientInput) => {
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

  const token = signJwt({ sub: patient.id, role: "patient" });
  return { patient: scrubPatient(patient), token };
};

export const loginDoctor = async (payload: LoginDoctorInput) => {
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

  const token = signJwt({ sub: doctor.id, role: "doctor" });
  return { doctor: scrubDoctor(doctor), token };
};

