import { AxiosError } from "axios";

type ApiValidationErrors = Record<string, string[] | string | null | undefined>;

interface ApiErrorResponse {
  message?: string;
  errors?: ApiValidationErrors;
}

const flattenValidationErrors = (errors?: ApiValidationErrors): string[] => {
  if (!errors) return [];

  return Object.values(errors)
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return [value];
      return [];
    })
    .filter(Boolean);
};

export const getApiErrorMessage = (error: unknown): string => {
  if (!(error instanceof AxiosError)) {
    return "Something went wrong. Please try again.";
  }

  const responseData = error.response?.data as ApiErrorResponse | undefined;
  const validationMessages = flattenValidationErrors(responseData?.errors);
  if (validationMessages.length > 0) {
    return validationMessages.join(" ");
  }

  if (responseData?.message) {
    return responseData.message;
  }

  return error.message || "Something went wrong. Please try again.";
};
