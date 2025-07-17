import { getConnections } from "../config/db.js";
import { UserSchema } from "./User.js";
import { OrdenSchema } from "./Order.js";
import { ProductoSchema } from "./Product.js";
import { MenuSchema } from "./menu.js";
import { RolSchema } from "./Role.js";
// Función para inicializar todos los modelos con sus respectivas conexiones
export const initializeModels = () => {
    const connections = getConnections();
    // Crear modelos en sus respectivas bases de datos
    const User = connections.userDB.model("User", UserSchema, "user");
    const Orden = connections.ordenesDB.model("Orden", OrdenSchema, "ordenes");
    const Producto = connections.productosDB.model("Producto", ProductoSchema, "productos");
    const Menu = connections.userDB.model("Menu", MenuSchema, "menu");
    const Rol = connections.rolesDB.model("Role", RolSchema, "roles");
    return {
        User,
        Orden,
        Producto,
        Menu,
        Rol,
    };
};
// Exportar los modelos (se inicializarán cuando se llame a esta función)
let models = null;
export const getModels = () => {
    if (!models) {
        models = initializeModels();
    }
    return models;
};
