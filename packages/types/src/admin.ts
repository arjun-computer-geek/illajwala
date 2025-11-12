import { z } from "zod";
import { objectIdSchema } from "./common";

export const adminSchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  email: z.string().email(),
  role: z.literal("admin").default("admin"),
});

export type AdminProfile = z.infer<typeof adminSchema>;

