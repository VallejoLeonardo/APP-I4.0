import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Generate a secure random secret if none is provided
const generateSecureSecret = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

const ACCESS_SECRET = process.env.JWT_SECRET || generateSecureSecret();
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

export const generateAccessToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    console.error(
      "🚨 SECURITY WARNING: JWT_SECRET not set in environment variables. Using generated secret for this session only."
    );
    console.error(
      "🔧 Please set JWT_SECRET in your .env file for production use."
    );

    // In production, throw an error instead of using fallback
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET environment variable is required for production"
      );
    }
  }

  return jwt.sign({ userId }, ACCESS_SECRET, {
    expiresIn: EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, ACCESS_SECRET) as { userId: string };
};
