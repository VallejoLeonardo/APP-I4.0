import { getModels } from "../models/connections.js";
// Obtener menú basado en los roles del usuario
export const getMenuByRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { User, Menu } = getModels();
        // Buscar el usuario para obtener sus roles
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        // Obtener todos los elementos de menú activos
        const menuItems = await Menu.find({ status: true }).sort({
            order: 1,
            title: 1,
        });
        // Filtrar elementos de menú basado en los roles del usuario
        const filteredMenu = menuItems.filter((item) => {
            // Si el item no tiene roles específicos, está disponible para todos
            if (!item.roles || item.roles.length === 0) {
                return true;
            }
            // Verificar si el usuario tiene al menos uno de los roles requeridos
            return item.roles.some((role) => user.roles.includes(role));
        });
        res.json({
            success: true,
            menu: filteredMenu.map((item) => ({
                id: item._id,
                title: item.title,
                path: item.path,
                icon: item.icon,
                roles: item.roles,
                order: item.order,
            })),
            userRoles: user.roles,
        });
    }
    catch (error) {
        console.error("Error al obtener menú por roles:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
// Obtener todos los elementos de menú (para administradores)
export const getAllMenuItems = async (req, res) => {
    try {
        const { Menu } = getModels();
        const menuItems = await Menu.find({ status: true }).sort({
            order: 1,
            title: 1,
        });
        res.json({
            success: true,
            menu: menuItems,
        });
    }
    catch (error) {
        console.error("Error al obtener elementos de menú:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
// Crear nuevo elemento de menú
export const createMenuItem = async (req, res) => {
    try {
        const { title, path, icon, roles, order } = req.body;
        const { Menu } = getModels();
        // Validar datos requeridos
        if (!title || !path || !icon) {
            res.status(400).json({
                success: false,
                message: "Título, ruta e icono son requeridos",
            });
            return;
        }
        // Verificar si ya existe un elemento con la misma ruta
        const existingMenu = await Menu.findOne({ path });
        if (existingMenu) {
            res.status(400).json({
                success: false,
                message: "Ya existe un elemento de menú con esta ruta",
            });
            return;
        }
        const newMenuItem = new Menu({
            title,
            path,
            icon,
            roles: roles || [],
            order: order || 0,
            status: true,
            createdAt: new Date(),
        });
        const savedMenuItem = await newMenuItem.save();
        res.status(201).json({
            success: true,
            message: "Elemento de menú creado exitosamente",
            menu: savedMenuItem,
        });
    }
    catch (error) {
        console.error("Error al crear elemento de menú:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
// Actualizar elemento de menú
export const updateMenuItem = async (req, res) => {
    try {
        const { menuId } = req.params;
        const { title, path, icon, roles, order, status } = req.body;
        const { Menu } = getModels();
        // Verificar si el elemento existe
        const existingMenuItem = await Menu.findById(menuId);
        if (!existingMenuItem) {
            res.status(404).json({
                success: false,
                message: "Elemento de menú no encontrado",
            });
            return;
        }
        // Si se está actualizando la ruta, verificar que no exista otra con la misma ruta
        if (path && path !== existingMenuItem.path) {
            const duplicateMenu = await Menu.findOne({ path, _id: { $ne: menuId } });
            if (duplicateMenu) {
                res.status(400).json({
                    success: false,
                    message: "Ya existe un elemento de menú con esta ruta",
                });
                return;
            }
        }
        // Actualizar los campos proporcionados
        const updateData = {};
        if (title)
            updateData.title = title;
        if (path)
            updateData.path = path;
        if (icon)
            updateData.icon = icon;
        if (roles !== undefined)
            updateData.roles = roles;
        if (order !== undefined)
            updateData.order = order;
        if (status !== undefined)
            updateData.status = status;
        const updatedMenuItem = await Menu.findByIdAndUpdate(menuId, updateData, {
            new: true,
            runValidators: true,
        });
        res.json({
            success: true,
            message: "Elemento de menú actualizado exitosamente",
            menu: updatedMenuItem,
        });
    }
    catch (error) {
        console.error("Error al actualizar elemento de menú:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
// Eliminar elemento de menú (soft delete)
export const deleteMenuItem = async (req, res) => {
    try {
        const { menuId } = req.params;
        const { Menu } = getModels();
        // Verificar si el elemento existe
        const existingMenuItem = await Menu.findById(menuId);
        if (!existingMenuItem) {
            res.status(404).json({
                success: false,
                message: "Elemento de menú no encontrado",
            });
            return;
        }
        // Realizar soft delete
        await Menu.findByIdAndUpdate(menuId, { status: false });
        res.json({
            success: true,
            message: "Elemento de menú eliminado exitosamente",
        });
    }
    catch (error) {
        console.error("Error al eliminar elemento de menú:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
// Inicializar menú por defecto (función de utilidad)
export const initializeDefaultMenu = async (req, res) => {
    try {
        const { Menu } = getModels();
        // Verificar si ya existen elementos de menú
        const existingMenuCount = await Menu.countDocuments();
        if (existingMenuCount > 0) {
            res.status(400).json({
                success: false,
                message: "Ya existen elementos de menú en la base de datos",
            });
            return;
        }
        // Menú por defecto basado en el frontend
        const defaultMenuItems = [
            {
                title: "Dashboard",
                path: "/dashboard",
                icon: "DashboardOutlined",
                roles: ["admin", "user"],
                order: 1,
            },
            {
                title: "Usuarios",
                path: "/users",
                icon: "UserOutlined",
                roles: ["admin"],
                order: 2,
            },
            {
                title: "Productos",
                path: "/products",
                icon: "UnorderedListOutlined",
                roles: ["admin", "user"],
                order: 3,
            },
            {
                title: "Órdenes",
                path: "/orders",
                icon: "ShoppingCartOutlined",
                roles: ["admin", "user"],
                order: 4,
            },
            {
                title: "Reportes",
                path: "/report",
                icon: "BarChartOutlined",
                roles: ["admin"],
                order: 5,
            },
        ];
        // Insertar elementos de menú por defecto
        const insertedMenuItems = await Menu.insertMany(defaultMenuItems.map((item) => ({
            ...item,
            status: true,
            createdAt: new Date(),
        })));
        res.status(201).json({
            success: true,
            message: "Menú por defecto inicializado exitosamente",
            menu: insertedMenuItems,
        });
    }
    catch (error) {
        console.error("Error al inicializar menú por defecto:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
