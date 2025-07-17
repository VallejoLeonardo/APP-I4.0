import express from "express";
import { getModels } from "../models/connections.js";

// Middleware para verificar si el usuario tiene acceso a una ruta específica
export const checkRouteAccess = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const requestedPath = req.query.path as string;

    if (!userId || !requestedPath) {
      res.status(400).json({
        message: "userId y path son requeridos",
      });
      return;
    }

    const { User, Menu } = getModels();

    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    // Buscar el elemento de menú para la ruta solicitada
    const menuItem = await Menu.findOne({ path: requestedPath, status: true });
    if (!menuItem) {
      res.status(404).json({ message: "Ruta no encontrada en el menú" });
      return;
    }

    // Verificar si el usuario tiene acceso
    const hasAccess =
      menuItem.roles.length === 0 ||
      menuItem.roles.some((role) => user.roles.includes(role));

    if (!hasAccess) {
      res.status(403).json({
        message: "No tienes permisos para acceder a esta ruta",
      });
      return;
    }

    // Si tiene acceso, continuar
    next();
  } catch (error) {
    console.error("Error en middleware de verificación de acceso:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// Middleware para verificar roles específicos
export const requireRoles = (allowedRoles: string[]) => {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params || req.body || req.query;

      if (!userId) {
        res.status(400).json({
          message: "userId es requerido",
        });
        return;
      }

      const { User } = getModels();
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      // Verificar si el usuario tiene al menos uno de los roles permitidos
      const hasRequiredRole = allowedRoles.some((role) =>
        user.roles.includes(role)
      );

      if (!hasRequiredRole) {
        res.status(403).json({
          message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(
            ", "
          )}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error en middleware de verificación de roles:", error);
      res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  };
};
