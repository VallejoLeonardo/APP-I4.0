import { generateAccessToken, verifyToken as verifyTokenUtil, } from "../utils/generateToken.js";
import cache from "../utils/cache.js";
import dayjs from "dayjs";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { getModels } from "../models/connections.js";
export const login = async (req, res) => {
    const { username, password } = req.body;
    const { User } = getModels();
    const user = await User.findOne({ email: username });
    // Validar que las credenciales esten presentes
    if (!user) {
        res.status(401).json({ message: "Credenciales no válidas" });
        return;
    }
    // Verificar la contraseña hasheada
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
        res.status(401).json({ message: "Credenciales no válidas" });
        return;
    }
    const accessToken = generateAccessToken(user.id);
    cache.set(user.id, accessToken, 60 * 30);
    res.json({ accessToken });
};
export const getTimeToken = (req, res) => {
    const { userId } = req.query;
    // Validate that userId is provided and is a string
    if (!userId || typeof userId !== "string") {
        res
            .status(400)
            .json({ message: "userId es requerido en query como string" });
        return;
    }
    const ttl = cache.getTtl(userId);
    if (ttl === undefined || ttl === null) {
        res.status(404).json({ message: "Token no encontrado o expirado" });
        return;
    }
    const now = Date.now();
    const timeToLife = Math.floor((ttl - now) / 1000);
    // Checar si el token ha expirado
    // Si el tiempo restante es menor o igual a 0, el token ha expirado
    if (timeToLife <= 0) {
        res.status(404).json({ message: "Token expirado" });
        return;
    }
    const expTime = dayjs(ttl).format("HH:mm:ss");
    res.json({
        timeToLife,
        expTime,
    });
};
export const updateToken = (req, res) => {
    const { userId } = req.params;
    const ttl = cache.getTtl(userId);
    if (!ttl) {
        res.status(404).json({ message: "Token no encontrado" });
        return;
    }
    const newTimeTtl = 60 * 15;
    cache.ttl(userId, newTimeTtl);
    res.json({ message: "Tiempo de vida actualizado" });
};
export const getAllUsers = async (req, res) => {
    const { userEmail } = req.query;
    const { User } = getModels();
    try {
        if (userEmail) {
            // Si se proporciona un email, filtrar por ese email
            const userByEmail = await User.find({ email: userEmail });
            console.log("Usuarios filtrados por email:", userByEmail);
            res.json({ users: userByEmail });
        }
        else {
            // Si no se proporciona email, devolver todos los usuarios
            const userList = await User.find();
            console.log("Todos los usuarios:", userList);
            res.json({ users: userList });
        }
    }
    catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
export const saveUser = async (req, res) => {
    const { nombre, email, password, roles, phone } = req.body;
    const { User } = getModels();
    try {
        // Hash the password before saving
        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            nombre,
            email,
            password: hashedPassword,
            roles: roles || ["user"], // Use provided roles or default to ['user']
            phone,
            createdAt: Date.now(),
            status: true,
        });
        const user = await newUser.save();
        res.status(201).json({ message: "Usuario creado exitosamente", user });
    }
    catch (error) {
        console.error("Error al guardar usuario:", error);
        res.status(426).json({ message: "Error interno del servidor" });
    }
};
export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { nombre, email, password, phone, roles, status } = req.body;
    const { User } = getModels();
    try {
        // Check if user exists
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        // Prepare update object
        const updateData = {};
        if (nombre)
            updateData.nombre = nombre;
        if (email)
            updateData.email = email;
        if (phone)
            updateData.phone = phone;
        if (roles)
            updateData.roles = roles;
        if (status !== undefined)
            updateData.status = status;
        // Hash password if provided
        if (password) {
            updateData.password = await hashPassword(password);
        }
        // Update user
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!updatedUser) {
            res.status(404).json({ message: "Error al actualizar usuario" });
            return;
        }
        res.json({
            message: "Usuario actualizado exitosamente",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const { User } = getModels();
    try {
        // Verificar si el usuario existe
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        // Verificar si el usuario ya está eliminado (status = false)
        if (!existingUser.status) {
            res.status(400).json({ message: "El usuario ya está eliminado" });
            return;
        }
        // Realizar soft delete cambiando el status a false
        const deletedUser = await User.findByIdAndUpdate(userId, {
            status: false,
            deletedAt: Date.now(), // Opcional: agregar fecha de eliminación
        }, {
            new: true,
            runValidators: true,
        });
        if (!deletedUser) {
            res.status(404).json({ message: "Error al eliminar usuario" });
            return;
        }
        res.json({
            message: "Usuario eliminado exitosamente",
            user: deletedUser,
        });
    }
    catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
export const verifyToken = (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({ message: "Token no proporcionado" });
        return;
    }
    try {
        // Verificar token con la función de utilidad
        const decoded = verifyTokenUtil(token);
        // Verificar si el token está en cache
        const ttl = cache.getTtl(decoded.userId);
        if (!ttl || ttl <= Date.now()) {
            res.status(401).json({ message: "Token expirado" });
            return;
        }
        res.json({
            valid: true,
            userId: decoded.userId,
            message: "Token válido",
        });
    }
    catch (error) {
        res.status(401).json({ message: "Token inválido" });
    }
};
