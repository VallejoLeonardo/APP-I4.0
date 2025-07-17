/**
 * Environment Validation Middleware
 *
 * Validates that all required environment variables are set
 * and throws early errors if security-critical variables are missing.
 */

import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  JWT_SECRET: string;
  USER_DB_URI: string;
  ORDENES_DB_URI: string;
  ROLES_DB_URI: string;
  PRODUCTOS_DB_URI: string;
  PORT: string;
  NODE_ENV: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentError";
  }
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnvironment(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical security variables (will cause app to fail)
  const criticalVars = [
    "JWT_SECRET",
    "USER_DB_URI",
    "ORDENES_DB_URI",
    "ROLES_DB_URI",
    "PRODUCTOS_DB_URI",
  ];

  // Important but not critical (will show warnings)
  const importantVars = [
    "PORT",
    "NODE_ENV",
    "JWT_EXPIRES_IN",
    "BCRYPT_SALT_ROUNDS",
  ];

  // Check critical variables
  criticalVars.forEach((varName) => {
    if (!process.env[varName] || process.env[varName]?.trim() === "") {
      errors.push(`Missing critical environment variable: ${varName}`);
    }
  });

  // Check important variables
  importantVars.forEach((varName) => {
    if (!process.env[varName] || process.env[varName]?.trim() === "") {
      warnings.push(`Missing recommended environment variable: ${varName}`);
    }
  });

  // Validate JWT_SECRET strength if present
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push(
        "JWT_SECRET must be at least 32 characters long for security"
      );
    }

    // Check for common weak secrets
    const weakSecrets = [
      "secret",
      "password",
      "123456",
      "your-secret-here",
      "change-this-secret",
      "fallback-secret",
    ];

    if (
      weakSecrets.some((weak) =>
        process.env.JWT_SECRET?.toLowerCase().includes(weak)
      )
    ) {
      errors.push(
        "JWT_SECRET appears to be using a default or weak value. Please generate a strong secret."
      );
    }
  }

  // Validate BCRYPT_SALT_ROUNDS if present
  if (process.env.BCRYPT_SALT_ROUNDS) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
    if (isNaN(saltRounds) || saltRounds < 10 || saltRounds > 15) {
      warnings.push(
        "BCRYPT_SALT_ROUNDS should be between 10-15 for optimal security"
      );
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn("⚠️  Environment Warnings:");
    warnings.forEach((warning) => console.warn(`   ${warning}`));
    console.warn("");
  }

  // Throw on critical errors
  if (errors.length > 0) {
    console.error("❌ Critical Environment Errors:");
    errors.forEach((error) => console.error(`   ${error}`));
    console.error("");
    console.error("💡 To fix these issues:");
    console.error("   1. Copy .env.example to .env");
    console.error("   2. Fill in all required values");
    console.error(
      "   3. Generate JWT_SECRET with: node -p \"require('crypto').randomBytes(64).toString('hex')\""
    );
    console.error("");
    throw new EnvironmentError(
      `Missing ${errors.length} critical environment variable(s)`
    );
  }

  console.log("✅ Environment validation passed");

  return {
    JWT_SECRET: process.env.JWT_SECRET!,
    USER_DB_URI: process.env.USER_DB_URI!,
    ORDENES_DB_URI: process.env.ORDENES_DB_URI!,
    ROLES_DB_URI: process.env.ROLES_DB_URI!,
    PRODUCTOS_DB_URI: process.env.PRODUCTOS_DB_URI!,
    PORT: process.env.PORT || "8080",
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || "12",
  };
}

/**
 * Gets environment configuration after validation
 */
export function getEnvConfig(): EnvConfig {
  return validateEnvironment();
}

export { EnvironmentError };
