const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api"
).replace(/\/$/, "");

const API_ORIGIN = new URL(API_BASE_URL).origin;
const TOKEN_KEY = "campus_lost_found_token";

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getApiAssetUrl(path) {
  if (!path) {
    return "";
  }

  return path.startsWith("http")
    ? path
    : new URL(path, API_ORIGIN).toString();
}

export async function apiRequest(
  path,
  {
    method = "GET",
    body,
    headers = {}
  } = {}
) {
  const requestHeaders = new Headers(headers);
  const token = getToken();

  if (token) {
    requestHeaders.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  let requestBody;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set(
      "Content-Type",
      "application/json"
    );
    requestBody = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers: requestHeaders,
        body: requestBody
      }
    );
  } catch (error) {
    throw new ApiError(
      "无法连接服务器，请确认后端已经启动"
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  let data = null;

  if (response.status !== 204) {
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      typeof data.message === "string"
        ? data.message
        : `请求失败（${response.status}）`;

    throw new ApiError(
      message,
      response.status,
      data
    );
  }

  return data;
}
