import express from "express";
import { getMenuByRoles, getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, initializeDefaultMenu, } from "../controllers/menu.controller.js";
import { checkRouteAccess } from "../utils/roleMiddleware.js";
const routes = express.Router();
// Obtener menú filtrado por roles del usuario
routes.get("/user/:userId", getMenuByRoles);
// Verificar acceso a una ruta específica
routes.get("/check-access/:userId", checkRouteAccess, (req, res) => {
    res.json({
        success: true,
        message: "Acceso permitido",
        path: req.query.path,
    });
});
// Obtener todos los elementos de menú (solo para administradores)
routes.get("/all", getAllMenuItems);
// Crear nuevo elemento de menú (solo para administradores)
routes.post("/create", createMenuItem);
// Actualizar elemento de menú (solo para administradores)
routes.put("/update/:menuId", updateMenuItem);
// Eliminar elemento de menú (solo para administradores)
routes.delete("/delete/:menuId", deleteMenuItem);
// Inicializar menú por defecto
routes.post("/initialize", initializeDefaultMenu);
export default routes;
