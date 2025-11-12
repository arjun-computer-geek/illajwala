import { PatientModel } from "./patient.model";
import type { CreatePatientInput, UpdatePatientInput, AddDependentInput } from "./patient.schema";
import { hashPassword } from "../../utils/password";

export const createPatient = async (payload: CreatePatientInput) => {
  const passwordHash = await hashPassword(payload.password);
  return PatientModel.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
  });
};

export const getPatientByEmail = async (email: string) =>
  PatientModel.findOne({ email }).select("-passwordHash");

export const getPatientById = async (id: string) => PatientModel.findById(id).select("-passwordHash");

export const updatePatientProfile = async (id: string, payload: UpdatePatientInput) =>
  PatientModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).select(
    "-passwordHash"
  );

export const addDependent = async (patientId: string, dependent: AddDependentInput) =>
  PatientModel.findByIdAndUpdate(
    patientId,
    { $push: { dependents: dependent } },
    { new: true, runValidators: true }
  ).select("-passwordHash");

export const removeDependent = async (patientId: string, dependentName: string) =>
  PatientModel.findByIdAndUpdate(
    patientId,
    { $pull: { dependents: { name: dependentName } } },
    { new: true, runValidators: true }
  ).select("-passwordHash");

