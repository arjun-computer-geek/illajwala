import {
  PatientModel,
  defaultNotificationPreferences,
  type PatientNotificationPreferences,
} from "./patient.model";
import type { CreatePatientInput, UpdatePatientInput, AddDependentInput } from "./patient.schema";
import { hashPassword } from "../../utils/password";
import { Types } from "mongoose";

export const createPatient = async (payload: CreatePatientInput, tenantId: string) => {
  const passwordHash = await hashPassword(payload.password);
  const { clinicId, ...rest } = payload;
  return PatientModel.create({
    tenantId,
    name: rest.name,
    email: rest.email,
    phone: rest.phone,
    passwordHash,
    dateOfBirth: rest.dateOfBirth,
    gender: rest.gender,
    primaryClinicId: clinicId ? new Types.ObjectId(clinicId) : null,
    notificationPreferences: defaultNotificationPreferences,
  });
};

export const getPatientByEmail = async (email: string, tenantId: string) =>
  PatientModel.findOne({ email, tenantId }).select("-passwordHash");

export const getPatientById = async (id: string, tenantId: string) =>
  PatientModel.findOne({ _id: id, tenantId }).select("-passwordHash");

export const updatePatientProfile = async (id: string, tenantId: string, payload: UpdatePatientInput) => {
  const { clinicId, ...rest } = payload;
  const updatePayload: Record<string, unknown> = { ...rest };

  if (clinicId !== undefined) {
    updatePayload.primaryClinicId = clinicId ? new Types.ObjectId(clinicId) : null;
  }

  return PatientModel.findOneAndUpdate({ _id: id, tenantId }, updatePayload, {
    new: true,
    runValidators: true,
  }).select("-passwordHash");
};

export const addDependent = async (patientId: string, tenantId: string, dependent: AddDependentInput) =>
  PatientModel.findOneAndUpdate(
    { _id: patientId, tenantId },
    { $push: { dependents: dependent } },
    { new: true, runValidators: true }
  ).select("-passwordHash");

export const removeDependent = async (patientId: string, tenantId: string, dependentName: string) =>
  PatientModel.findOneAndUpdate(
    { _id: patientId, tenantId },
    { $pull: { dependents: { name: dependentName } } },
    { new: true, runValidators: true }
  ).select("-passwordHash");

export const getNotificationPreferences = async (patientId: string, tenantId: string) => {
  const patient = await PatientModel.findOne({ _id: patientId, tenantId }).select("notificationPreferences");
  return patient?.notificationPreferences ?? defaultNotificationPreferences;
};

type NotificationPreferencesPatch = {
  [K in keyof PatientNotificationPreferences]?: PatientNotificationPreferences[K] | undefined;
};

export const updateNotificationPreferences = async (
  patientId: string,
  tenantId: string,
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
  if (payload.waitlistReminders !== undefined) {
    update["notificationPreferences.waitlistReminders"] = payload.waitlistReminders;
  }

  const patient = await PatientModel.findOneAndUpdate(
    { _id: patientId, tenantId },
    Object.keys(update).length > 0 ? { $set: update } : {},
    { new: true, runValidators: true }
  ).select("notificationPreferences");

  return patient?.notificationPreferences ?? defaultNotificationPreferences;
};

