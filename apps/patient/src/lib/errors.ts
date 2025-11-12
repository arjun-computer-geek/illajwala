import axios from "axios";

export const getErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { error?: { message?: string } })?.error?.message ??
      error.response?.statusText ??
      error.message;
    return message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};


