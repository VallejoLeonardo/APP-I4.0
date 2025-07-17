import express, { RequestHandler } from "express";
import {
  getMenuByRoles,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  initializeDefaultMenu,
} from "../controllers/menu.controller.js";
import { checkRouteAccess, requireRoles } from "../utils/roleMiddleware.js";

const routes = express.Router();

// Obtener menú filtrado por roles del usuario
routes.get("/user/:userId", getMenuByRoles as RequestHandler);

// Verificar acceso a una ruta específica
routes.get(
  "/check-access/:userId",
  checkRouteAccess as RequestHandler,
  (req, res) => {
    res.json({
      success: true,
      message: "Acceso permitido",
      path: req.query.path,
    });
  }
);

// Obtener todos los elementos de menú (solo para administradores)
routes.get("/all", getAllMenuItems as RequestHandler);

// Crear nuevo elemento de menú (solo para administradores)
routes.post("/create", createMenuItem as RequestHandler);

// Actualizar elemento de menú (solo para administradores)
routes.put("/update/:menuId", updateMenuItem as RequestHandler);

// Eliminar elemento de menú (solo para administradores)
routes.delete("/delete/:menuId", deleteMenuItem as RequestHandler);

// Inicializar menú por defecto
routes.post("/initialize", initializeDefaultMenu as RequestHandler);

export default routes;
