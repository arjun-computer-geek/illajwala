export * from "./env";
export * from "./invariant";

export const typedKeys = <T extends Record<string, unknown>>(obj: T) =>
  Object.keys(obj) as Array<keyof T>;

export const typedEntries = <T extends Record<string, unknown>>(obj: T) =>
  Object.entries(obj) as Array<[keyof T, T[keyof T]]>;

export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });