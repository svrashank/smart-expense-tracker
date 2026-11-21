import axios from "axios";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Turns anything thrown by an API call into a sentence for the UI. Backend errors
// are `{ code, detail: "text" }`; FastAPI's own 422 validation errors send
// `detail` as a list, which falls through to the generic message.
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Can't reach the server. Check your connection and try again.";
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
    return `Request failed (${error.response.status}).`;
  }
  return "Something went wrong. Please try again.";
}
