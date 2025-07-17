import { Connection } from "mongoose";
import { getConnections } from "../config/db.js";
import { UserSchema, IUser } from "./User.js";
import { OrdenSchema, Order } from "./Order.js";
import { ProductoSchema, Product } from "./Product.js";
import { MenuSchema, IMenu } from "./menu.js";
import { RolSchema, Role } from "./Role.js";

// Función para inicializar todos los modelos con sus respectivas conexiones
export const initializeModels = () => {
  const connections = getConnections();

  // Crear modelos en sus respectivas bases de datos
  const User = connections.userDB.model<IUser>("User", UserSchema, "user");
  const Orden = connections.ordenesDB.model<Order>(
    "Orden",
    OrdenSchema,
    "ordenes"
  );
  const Producto = connections.productosDB.model<Product>(
    "Producto",
    ProductoSchema,
    "productos"
  );
  const Menu = connections.userDB.model<IMenu>("Menu", MenuSchema, "menu");
  const Rol = connections.rolesDB.model<Role>("Role", RolSchema, "roles");

  return {
    User,
    Orden,
    Producto,
    Menu,
    Rol,
  };
};

// Exportar los modelos (se inicializarán cuando se llame a esta función)
let models: ReturnType<typeof initializeModels> | null = null;

export const getModels = () => {
  if (!models) {
    models = initializeModels();
  }
  return models;
};
