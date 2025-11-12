import { Router } from "express";
import { appointmentRouter } from "../appointments/appointments.router";
import { doctorRouter } from "../doctors/doctors.router";
import { patientRouter } from "../patients/patients.router";
import { authRouter } from "../auth/auth.router";
import { statsRouter } from "../stats/stats.router";

export const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/patients", patientRouter);
rootRouter.use("/doctors", doctorRouter);
rootRouter.use("/appointments", appointmentRouter);
rootRouter.use("/stats", statsRouter);

