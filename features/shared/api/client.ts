const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  status?: number;
};

function getMessageFromPayload(parsed: unknown, status: number) {
  if (parsed && typeof parsed === "object") {
    const payload = parsed as { message?: string; error?: string };
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
  }

  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "The requested resource was not found.";

  return `Request failed with status ${status}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  authRequired = false,
): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (authRequired && typeof window !== "undefined") {
    const token = window.localStorage.getItem("breakfast_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Make sure the backend is running and try again.",
    );
  }

  const rawText = await response.text();
  let parsed: unknown = null;

  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (!response.ok) {
    const message = getMessageFromPayload(parsed, response.status);
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return (parsed ?? null) as T;
}

export { API_BASE_URL };
