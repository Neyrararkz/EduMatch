import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAccessToken,
} from "./token-storage";

const API_URL = import.meta.env.VITE_API_URL;

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  skipAuthRefresh?: boolean;
};

type RefreshResponse = {
  accessToken: string;
};

function isRefreshResponse(data: unknown): data is RefreshResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "accessToken" in data &&
    typeof data.accessToken === "string"
  );
}

function getErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return "Request failed";
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseResponse(response);

  if (!response.ok || !isRefreshResponse(data)) {
    clearStoredTokens();
    return null;
  }

  setStoredAccessToken(data.accessToken);

  return data.accessToken;
}

async function sendRequest(
  endpoint: string,
  options: RequestOptions,
  token: string | null
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const shouldUseToken =
    !endpoint.startsWith("/auth/login") &&
    !endpoint.startsWith("/auth/register");

  const token = shouldUseToken
    ? getStoredAccessToken() ?? options.token ?? null
    : null;

  let response = await sendRequest(endpoint, options, token);
  let data = await parseResponse(response);

  if (
    response.status === 401 &&
    !options.skipAuthRefresh &&
    endpoint !== "/auth/refresh"
  ) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      response = await sendRequest(endpoint, options, newAccessToken);
      data = await parseResponse(response);
    }
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as T;
}