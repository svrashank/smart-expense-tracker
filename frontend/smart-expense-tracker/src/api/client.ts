import axios from "axios";

// One axios instance for every backend call. `withCredentials` makes the browser
// send the httponly `access_token` cookie, which is how the backend knows who we are.
export const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1`,
  withCredentials: true,
});
