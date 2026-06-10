import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function numberOptional(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsedValue;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: numberOptional("PORT", 3000),

  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: required("REDIS_URL"),

  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES_IN: optional("JWT_ACCESS_EXPIRES_IN", "15m"),
  JWT_REFRESH_EXPIRES_IN: optional("JWT_REFRESH_EXPIRES_IN", "7d"),

  CLIENT_URL: optional("CLIENT_URL", "http://localhost:5173"),
} as const;