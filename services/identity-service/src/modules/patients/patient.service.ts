import {
  PatientModel,
  defaultNotificationPreferences,
  type PatientNotificationPreferences,
} from "./patient.model";
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
    notificationPreferences: defaultNotificationPreferences,
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

export const getNotificationPreferences = async (patientId: string) => {
  const patient = await PatientModel.findById(patientId).select("notificationPreferences");
  return patient?.notificationPreferences ?? defaultNotificationPreferences;
};

type NotificationPreferencesPatch = {
  [K in keyof PatientNotificationPreferences]?: PatientNotificationPreferences[K] | undefined;
};

export const updateNotificationPreferences = async (
  patientId: string,
  payload: NotificationPreferencesPatch
) => {
  const update: Record<string, unknown> = {};
  if (payload.emailReminders !== undefined) {
    update["notificationPreferences.emailReminders"] = payload.emailReminders;
  }
  if (payload.smsReminders !== undefined) {
    update["notificationPreferences.smsReminders"] = payload.smsReminders;
  }
  if (payload.whatsappReminders !== undefined) {
    update["notificationPreferences.whatsappReminders"] = payload.whatsappReminders;
  }

  const patient = await PatientModel.findByIdAndUpdate(
    patientId,
    Object.keys(update).length > 0 ? { $set: update } : {},
    { new: true, runValidators: true }
  ).select("notificationPreferences");

  return patient?.notificationPreferences ?? defaultNotificationPreferences;
};

