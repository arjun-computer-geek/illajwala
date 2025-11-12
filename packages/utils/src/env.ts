import { config as loadDotenv } from "dotenv";
import { z } from "zod";

type DotenvOption = boolean | string | { path?: string };

export type LoadEnvOptions<TSchema extends z.ZodTypeAny> = {
  schema: TSchema;
  runtimeEnv?: Record<string, unknown> | NodeJS.ProcessEnv;
  dotenv?: DotenvOption;
  transform?: (env: z.infer<TSchema>) => z.infer<TSchema>;
  onError?: (error: z.ZodError) => never;
};

const applyDotenv = (option: DotenvOption | undefined) => {
  if (!option) {
    return;
  }

  if (option === true) {
    loadDotenv();
    return;
  }

  if (typeof option === "string") {
    loadDotenv({ path: option });
    return;
  }

  loadDotenv(option);
};

export const loadEnv = <TSchema extends z.ZodTypeAny>({
  schema,
  runtimeEnv = process.env,
  dotenv,
  transform,
  onError,
}: LoadEnvOptions<TSchema>): z.infer<TSchema> => {
  applyDotenv(dotenv ?? true);

  const result = schema.safeParse(runtimeEnv);

  if (!result.success) {
    if (onError) {
      onError(result.error);
    }

    const formatted = result.error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  return transform ? transform(result.data) : result.data;
};

