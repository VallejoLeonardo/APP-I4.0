import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/generateToken.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      message: "Token de acceso requerido",
      code: "MISSING_TOKEN",
    });
    return;
  }

  // Validar formato básico del token JWT
  if (token.split(".").length !== 3) {
    res.status(401).json({
      message: "Formato de token inválido",
      code: "INVALID_TOKEN_FORMAT",
    });
    return;
  }

  try {
    const decoded = verifyToken(token);

    // Validar que el payload contiene userId
    if (!decoded.userId) {
      res.status(403).json({
        message: "Token inválido: userId no encontrado",
        code: "INVALID_TOKEN_PAYLOAD",
      });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);

    let errorMessage = "Token inválido";
    let errorCode = "INVALID_TOKEN";

    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        errorMessage = "Token expirado";
        errorCode = "TOKEN_EXPIRED";
      } else if (error.message.includes("malformed")) {
        errorMessage = "Token malformado";
        errorCode = "MALFORMED_TOKEN";
      }
    }

    res.status(403).json({
      message: errorMessage,
      code: errorCode,
    });
  }
};
