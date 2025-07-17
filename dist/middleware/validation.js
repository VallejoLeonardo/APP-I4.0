import { Types } from "mongoose";
// Middleware para manejar errores de validación
export const handleValidationErrors = (errors) => {
    return (req, res, next) => {
        if (errors.length > 0) {
            res.status(400).json({
                message: "Errores de validación",
                errors,
            });
            return;
        }
        next();
    };
};
// Funciones de validación personalizadas
export const validators = {
    // Validar email
    isEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    // Validar email con dominios específicos permitidos
    isEmailWithAllowedDomains: (email) => {
        const allowedDomains = [
            "gmail.com",
            "hotmail.com",
            "outlook.com",
            "yahoo.com",
            "company.com",
        ];
        const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
        const match = email.match(emailRegex);
        if (!match)
            return false;
        const domain = match[1].toLowerCase();
        return allowedDomains.includes(domain);
    },
    // Validar que el email no esté en lista negra
    isEmailNotBlacklisted: (email) => {
        const blacklistedEmails = [
            "test@test.com",
            "admin@admin.com",
            "user@user.com",
        ];
        const blacklistedDomains = [
            "tempmail.com",
            "10minutemail.com",
            "mailinator.com",
        ];
        const emailLower = email.toLowerCase();
        // Verificar email específico
        if (blacklistedEmails.includes(emailLower))
            return false;
        // Verificar dominio
        const domain = emailLower.split("@")[1];
        return !blacklistedDomains.includes(domain);
    },
    // Validar contraseña segura con criterios adicionales
    isStrongPassword: (password) => {
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongPasswordRegex.test(password);
    },
    // Validar que la contraseña no contenga información personal
    isPasswordNotPersonal: (password, userData) => {
        const passwordLower = password.toLowerCase();
        // No debe contener el nombre
        if (userData.nombre) {
            const nameParts = userData.nombre.toLowerCase().split(" ");
            for (const part of nameParts) {
                if (part.length > 2 && passwordLower.includes(part)) {
                    return false;
                }
            }
        }
        // No debe contener el email
        if (userData.email) {
            const emailPart = userData.email.split("@")[0].toLowerCase();
            if (emailPart.length > 2 && passwordLower.includes(emailPart)) {
                return false;
            }
        }
        return true;
    },
    // Validar que la contraseña no esté en la lista de contraseñas comunes
    isPasswordNotCommon: (password) => {
        const commonPasswords = [
            "password",
            "123456",
            "123456789",
            "qwerty",
            "abc123",
            "password123",
            "admin",
            "letmein",
            "welcome",
            "monkey",
            "1234567890",
            "admin123",
        ];
        return !commonPasswords.includes(password.toLowerCase());
    },
    // Validar teléfono (10 dígitos)
    isValidPhone: (phone) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    },
    // Validar teléfono con formato internacional
    isValidInternationalPhone: (phone) => {
        const intlPhoneRegex = /^\+?[1-9]\d{1,14}$/;
        return intlPhoneRegex.test(phone.replace(/\s/g, ""));
    },
    // Validar nombre (solo letras, espacios y acentos)
    isValidName: (name) => {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        return nameRegex.test(name);
    },
    // Validar que el nombre no contenga palabras prohibidas
    isNameNotProfane: (name) => {
        const profaneWords = [
            "admin",
            "test",
            "null",
            "undefined",
            "root",
            "system",
        ];
        const nameLower = name.toLowerCase();
        return !profaneWords.some((word) => nameLower.includes(word));
    },
    // Validar nombre de producto
    isValidProductName: (name) => {
        const productNameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/;
        return productNameRegex.test(name);
    },
    // Validar que el nombre del producto no sea duplicado (se verificará en controller)
    isProductNameNotDuplicate: (name) => {
        // Esta validación se implementará en el controller con consulta a BD
        return name.trim().length > 0;
    },
    // Validar descripción de producto
    isValidProductDescription: (description) => {
        // No debe contener solo espacios o ser muy genérica
        const trimmed = description.trim();
        if (trimmed.length < 10)
            return false;
        const genericPhrases = [
            "lorem ipsum",
            "test",
            "prueba",
            "producto genérico",
        ];
        const descLower = trimmed.toLowerCase();
        return !genericPhrases.some((phrase) => descLower.includes(phrase));
    },
    // Validar ObjectId de MongoDB
    isValidObjectId: (id) => {
        return Types.ObjectId.isValid(id);
    },
    // Validar roles
    isValidRole: (role) => {
        const validRoles = ["admin", "user", "manager"];
        return validRoles.includes(role);
    },
    // Validar que no se asignen roles administrativos sin autorización
    isRoleAssignmentValid: (roles, userRole) => {
        const adminRoles = ["admin", "super_admin"];
        const hasAdminRole = roles.some((role) => adminRoles.includes(role));
        // Solo admins pueden asignar roles administrativos
        if (hasAdminRole && userRole !== "admin") {
            return false;
        }
        return true;
    },
    // Validar precio (máximo 2 decimales)
    isValidPrice: (price) => {
        return Number(price.toFixed(2)) === Number(price) && price > 0;
    },
    // Validar rango de precio realista
    isRealisticPrice: (price) => {
        return price >= 0.01 && price <= 1000000; // Entre 1 centavo y 1 millón
    },
    // Validar cantidad/stock
    isValidQuantity: (quantity) => {
        return Number.isInteger(quantity) && quantity >= 0 && quantity <= 999999;
    },
    // Validar que la cantidad no sea sospechosamente alta
    isReasonableQuantity: (quantity) => {
        return quantity <= 10000; // Límite razonable para evitar errores de entrada
    },
    // Validar entrada de texto contra inyección XSS
    isSafeText: (text) => {
        const xssRegex = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i;
        return !xssRegex.test(text);
    },
    // Validar entrada contra inyección SQL
    isSafeSQLText: (text) => {
        const sqlInjectionRegex = /(\'|\\\'|;|(\s*(or|and)\s+.*(=|like))|(\s*union\s)|(\s*select\s)|(\s*insert\s)|(\s*delete\s)|(\s*update\s)|(\s*drop\s))/i;
        return !sqlInjectionRegex.test(text);
    },
    // Validar longitud de texto en rangos específicos
    isValidTextLength: (text, min, max) => {
        const trimmed = text.trim();
        return trimmed.length >= min && trimmed.length <= max;
    },
    // Validar que no haya caracteres de control
    hasNoControlCharacters: (text) => {
        const controlCharRegex = /[\x00-\x1F\x7F]/;
        return !controlCharRegex.test(text);
    },
    // Validar formato de fecha
    isValidDate: (date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime()) && parsedDate > new Date("1900-01-01");
    },
    // Validar que la fecha no sea futura (para fechas de creación)
    isDateNotFuture: (date) => {
        const parsedDate = new Date(date);
        return parsedDate <= new Date();
    },
    // Validar URL si se proporciona
    isValidURL: (url) => {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    },
    // Validar que una cadena no esté vacía después de trim
    isNotEmpty: (value) => {
        return value.trim().length > 0;
    },
    // Validar que un número esté en un rango específico
    isInRange: (value, min, max) => {
        return value >= min && value <= max;
    },
};
// Middleware de validación para usuarios
export const validateCreateUser = (req, res, next) => {
    const { nombre, email, password, phone, roles } = req.body;
    const errors = [];
    // Validar nombre
    if (!nombre || typeof nombre !== "string") {
        errors.push({ field: "nombre", message: "El nombre es requerido" });
    }
    else if (!validators.isNotEmpty(nombre)) {
        errors.push({ field: "nombre", message: "El nombre no puede estar vacío" });
    }
    else if (!validators.isValidTextLength(nombre, 2, 50)) {
        errors.push({
            field: "nombre",
            message: "El nombre debe tener entre 2 y 50 caracteres",
        });
    }
    else if (!validators.isValidName(nombre.trim())) {
        errors.push({
            field: "nombre",
            message: "El nombre solo puede contener letras y espacios",
        });
    }
    else if (!validators.isNameNotProfane(nombre.trim())) {
        errors.push({
            field: "nombre",
            message: "El nombre contiene palabras no permitidas",
        });
    }
    else if (!validators.isSafeText(nombre)) {
        errors.push({
            field: "nombre",
            message: "El nombre contiene caracteres no seguros",
        });
    }
    else if (!validators.hasNoControlCharacters(nombre)) {
        errors.push({
            field: "nombre",
            message: "El nombre contiene caracteres de control no válidos",
        });
    }
    // Validar email
    if (!email || typeof email !== "string") {
        errors.push({ field: "email", message: "El email es requerido" });
    }
    else if (!validators.isEmail(email)) {
        errors.push({ field: "email", message: "El email no es válido" });
    }
    else if (!validators.isValidTextLength(email, 5, 100)) {
        errors.push({
            field: "email",
            message: "El email debe tener entre 5 y 100 caracteres",
        });
    }
    else if (!validators.isEmailWithAllowedDomains(email)) {
        errors.push({
            field: "email",
            message: "El email debe usar un dominio permitido (gmail.com, hotmail.com, outlook.com, yahoo.com)",
        });
    }
    else if (!validators.isEmailNotBlacklisted(email)) {
        errors.push({
            field: "email",
            message: "Este email no está permitido",
        });
    }
    else if (!validators.isSafeText(email)) {
        errors.push({
            field: "email",
            message: "El email contiene caracteres no seguros",
        });
    }
    // Validar contraseña
    if (!password || typeof password !== "string") {
        errors.push({ field: "password", message: "La contraseña es requerida" });
    }
    else if (!validators.isStrongPassword(password)) {
        errors.push({
            field: "password",
            message: "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial",
        });
    }
    else if (!validators.isPasswordNotPersonal(password, { nombre, email })) {
        errors.push({
            field: "password",
            message: "La contraseña no debe contener información personal",
        });
    }
    else if (!validators.isPasswordNotCommon(password)) {
        errors.push({
            field: "password",
            message: "La contraseña es demasiado común, por favor elige una más segura",
        });
    }
    else if (password.length > 128) {
        errors.push({
            field: "password",
            message: "La contraseña no puede exceder 128 caracteres",
        });
    }
    // Validar teléfono
    if (!phone || typeof phone !== "string") {
        errors.push({ field: "phone", message: "El teléfono es requerido" });
    }
    else if (!validators.isValidPhone(phone)) {
        errors.push({
            field: "phone",
            message: "El teléfono debe tener exactamente 10 dígitos",
        });
    }
    else if (!validators.isSafeSQLText(phone)) {
        errors.push({
            field: "phone",
            message: "El teléfono contiene caracteres no permitidos",
        });
    }
    // Validar roles
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        errors.push({
            field: "roles",
            message: "Debe seleccionar al menos un rol",
        });
    }
    else if (!roles.every((role) => validators.isValidRole(role))) {
        errors.push({
            field: "roles",
            message: "Roles inválidos. Solo se permiten: admin, user, manager",
        });
    }
    else if (!validators.isRoleAssignmentValid(roles)) {
        errors.push({
            field: "roles",
            message: "No tienes permisos para asignar roles administrativos",
        });
    }
    else if (roles.length > 3) {
        errors.push({
            field: "roles",
            message: "No se pueden asignar más de 3 roles por usuario",
        });
    }
    // Validaciones adicionales de seguridad
    if (req.body.createdAt && !validators.isValidDate(req.body.createdAt)) {
        errors.push({
            field: "createdAt",
            message: "Fecha de creación inválida",
        });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
export const validateUpdateUser = (req, res, next) => {
    const { userId } = req.params;
    const { nombre, email, password, phone, roles, status } = req.body;
    const errors = [];
    // Validar userId
    if (!validators.isValidObjectId(userId)) {
        errors.push({ field: "userId", message: "ID de usuario inválido" });
    }
    // Validar nombre (opcional)
    if (nombre !== undefined) {
        if (typeof nombre !== "string") {
            errors.push({
                field: "nombre",
                message: "El nombre debe ser una cadena de texto",
            });
        }
        else if (!validators.isNotEmpty(nombre)) {
            errors.push({
                field: "nombre",
                message: "El nombre no puede estar vacío",
            });
        }
        else if (!validators.isValidTextLength(nombre, 2, 50)) {
            errors.push({
                field: "nombre",
                message: "El nombre debe tener entre 2 y 50 caracteres",
            });
        }
        else if (!validators.isValidName(nombre.trim())) {
            errors.push({
                field: "nombre",
                message: "El nombre solo puede contener letras y espacios",
            });
        }
        else if (!validators.isNameNotProfane(nombre.trim())) {
            errors.push({
                field: "nombre",
                message: "El nombre contiene palabras no permitidas",
            });
        }
        else if (!validators.isSafeText(nombre)) {
            errors.push({
                field: "nombre",
                message: "El nombre contiene caracteres no seguros",
            });
        }
        else if (!validators.hasNoControlCharacters(nombre)) {
            errors.push({
                field: "nombre",
                message: "El nombre contiene caracteres de control no válidos",
            });
        }
    }
    // Validar email (opcional)
    if (email !== undefined) {
        if (typeof email !== "string") {
            errors.push({
                field: "email",
                message: "El email debe ser una cadena de texto",
            });
        }
        else if (!validators.isEmail(email)) {
            errors.push({ field: "email", message: "El email no es válido" });
        }
        else if (!validators.isValidTextLength(email, 5, 100)) {
            errors.push({
                field: "email",
                message: "El email debe tener entre 5 y 100 caracteres",
            });
        }
        else if (!validators.isEmailWithAllowedDomains(email)) {
            errors.push({
                field: "email",
                message: "El email debe usar un dominio permitido",
            });
        }
        else if (!validators.isEmailNotBlacklisted(email)) {
            errors.push({
                field: "email",
                message: "Este email no está permitido",
            });
        }
        else if (!validators.isSafeText(email)) {
            errors.push({
                field: "email",
                message: "El email contiene caracteres no seguros",
            });
        }
    }
    // Validar contraseña (opcional)
    if (password !== undefined) {
        if (typeof password !== "string") {
            errors.push({
                field: "password",
                message: "La contraseña debe ser una cadena de texto",
            });
        }
        else if (!validators.isStrongPassword(password)) {
            errors.push({
                field: "password",
                message: "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial",
            });
        }
        else if (!validators.isPasswordNotPersonal(password, { nombre, email })) {
            errors.push({
                field: "password",
                message: "La contraseña no debe contener información personal",
            });
        }
        else if (!validators.isPasswordNotCommon(password)) {
            errors.push({
                field: "password",
                message: "La contraseña es demasiado común, por favor elige una más segura",
            });
        }
        else if (password.length > 128) {
            errors.push({
                field: "password",
                message: "La contraseña no puede exceder 128 caracteres",
            });
        }
    }
    // Validar teléfono (opcional)
    if (phone !== undefined) {
        if (typeof phone !== "string") {
            errors.push({
                field: "phone",
                message: "El teléfono debe ser una cadena de texto",
            });
        }
        else if (!validators.isValidPhone(phone)) {
            errors.push({
                field: "phone",
                message: "El teléfono debe tener exactamente 10 dígitos",
            });
        }
        else if (!validators.isSafeSQLText(phone)) {
            errors.push({
                field: "phone",
                message: "El teléfono contiene caracteres no permitidos",
            });
        }
    }
    // Validar roles (opcional)
    if (roles !== undefined) {
        if (!Array.isArray(roles) || roles.length === 0) {
            errors.push({
                field: "roles",
                message: "Debe seleccionar al menos un rol",
            });
        }
        else if (!roles.every((role) => validators.isValidRole(role))) {
            errors.push({
                field: "roles",
                message: "Roles inválidos. Solo se permiten: admin, user, manager",
            });
        }
        else if (!validators.isRoleAssignmentValid(roles)) {
            errors.push({
                field: "roles",
                message: "No tienes permisos para asignar roles administrativos",
            });
        }
        else if (roles.length > 3) {
            errors.push({
                field: "roles",
                message: "No se pueden asignar más de 3 roles por usuario",
            });
        }
    }
    // Validar status (opcional)
    if (status !== undefined && typeof status !== "boolean") {
        errors.push({
            field: "status",
            message: "El estado debe ser verdadero o falso",
        });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Middleware de validación para productos
export const validateCreateProduct = (req, res, next) => {
    const { name, description, Quantity, price } = req.body;
    const errors = [];
    // Validar nombre
    if (!name || typeof name !== "string") {
        errors.push({ field: "name", message: "El nombre es requerido" });
    }
    else if (!validators.isNotEmpty(name)) {
        errors.push({ field: "name", message: "El nombre no puede estar vacío" });
    }
    else if (!validators.isValidTextLength(name, 2, 100)) {
        errors.push({
            field: "name",
            message: "El nombre debe tener entre 2 y 100 caracteres",
        });
    }
    else if (!validators.isValidProductName(name.trim())) {
        errors.push({
            field: "name",
            message: "El nombre contiene caracteres no válidos",
        });
    }
    else if (!validators.isSafeText(name)) {
        errors.push({
            field: "name",
            message: "El nombre contiene caracteres no seguros",
        });
    }
    else if (!validators.isSafeSQLText(name)) {
        errors.push({
            field: "name",
            message: "El nombre contiene caracteres no permitidos",
        });
    }
    else if (!validators.hasNoControlCharacters(name)) {
        errors.push({
            field: "name",
            message: "El nombre contiene caracteres de control no válidos",
        });
    }
    // Validar descripción
    if (!description || typeof description !== "string") {
        errors.push({
            field: "description",
            message: "La descripción es requerida",
        });
    }
    else if (!validators.isNotEmpty(description)) {
        errors.push({
            field: "description",
            message: "La descripción no puede estar vacía",
        });
    }
    else if (!validators.isValidTextLength(description, 10, 500)) {
        errors.push({
            field: "description",
            message: "La descripción debe tener entre 10 y 500 caracteres",
        });
    }
    else if (!validators.isValidProductDescription(description)) {
        errors.push({
            field: "description",
            message: "La descripción debe ser más específica y detallada",
        });
    }
    else if (!validators.isSafeText(description)) {
        errors.push({
            field: "description",
            message: "La descripción contiene caracteres no seguros",
        });
    }
    else if (!validators.isSafeSQLText(description)) {
        errors.push({
            field: "description",
            message: "La descripción contiene caracteres no permitidos",
        });
    }
    else if (!validators.hasNoControlCharacters(description)) {
        errors.push({
            field: "description",
            message: "La descripción contiene caracteres de control no válidos",
        });
    }
    // Validar cantidad
    if (Quantity === undefined || typeof Quantity !== "number") {
        errors.push({ field: "Quantity", message: "La cantidad es requerida" });
    }
    else if (!validators.isValidQuantity(Quantity)) {
        errors.push({
            field: "Quantity",
            message: "La cantidad debe ser un número entero entre 0 y 999,999",
        });
    }
    else if (!validators.isReasonableQuantity(Quantity)) {
        errors.push({
            field: "Quantity",
            message: "La cantidad parece ser demasiado alta. Verifique el valor ingresado",
        });
    }
    // Validar precio
    if (price === undefined || typeof price !== "number") {
        errors.push({ field: "price", message: "El precio es requerido" });
    }
    else if (!validators.isValidPrice(price)) {
        errors.push({
            field: "price",
            message: "El precio debe ser un número positivo con máximo 2 decimales",
        });
    }
    else if (!validators.isRealisticPrice(price)) {
        errors.push({
            field: "price",
            message: "El precio debe estar entre $0.01 y $1,000,000",
        });
    }
    else if (!validators.isInRange(price, 0.01, 999999.99)) {
        errors.push({
            field: "price",
            message: "El precio debe ser un número entre 0.01 y 999,999.99",
        });
    }
    // Validaciones adicionales de negocio
    if (typeof price === "number" && typeof Quantity === "number") {
        const totalValue = price * Quantity;
        if (totalValue > 10000000) {
            // 10 millones
            errors.push({
                field: "general",
                message: "El valor total del inventario (precio × cantidad) es demasiado alto",
            });
        }
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
export const validateUpdateProduct = (req, res, next) => {
    const { productId } = req.params;
    const { name, description, Quantity, price } = req.body;
    const errors = [];
    // Validar productId
    if (!validators.isValidObjectId(productId)) {
        errors.push({ field: "productId", message: "ID de producto inválido" });
    }
    // Validar nombre (opcional)
    if (name !== undefined) {
        if (typeof name !== "string") {
            errors.push({
                field: "name",
                message: "El nombre debe ser una cadena de texto",
            });
        }
        else if (!validators.isNotEmpty(name)) {
            errors.push({ field: "name", message: "El nombre no puede estar vacío" });
        }
        else if (!validators.isValidTextLength(name, 2, 100)) {
            errors.push({
                field: "name",
                message: "El nombre debe tener entre 2 y 100 caracteres",
            });
        }
        else if (!validators.isValidProductName(name.trim())) {
            errors.push({
                field: "name",
                message: "El nombre contiene caracteres no válidos",
            });
        }
        else if (!validators.isSafeText(name)) {
            errors.push({
                field: "name",
                message: "El nombre contiene caracteres no seguros",
            });
        }
        else if (!validators.isSafeSQLText(name)) {
            errors.push({
                field: "name",
                message: "El nombre contiene caracteres no permitidos",
            });
        }
        else if (!validators.hasNoControlCharacters(name)) {
            errors.push({
                field: "name",
                message: "El nombre contiene caracteres de control no válidos",
            });
        }
    }
    // Validar descripción (opcional)
    if (description !== undefined) {
        if (typeof description !== "string") {
            errors.push({
                field: "description",
                message: "La descripción debe ser una cadena de texto",
            });
        }
        else if (!validators.isNotEmpty(description)) {
            errors.push({
                field: "description",
                message: "La descripción no puede estar vacía",
            });
        }
        else if (!validators.isValidTextLength(description, 10, 500)) {
            errors.push({
                field: "description",
                message: "La descripción debe tener entre 10 y 500 caracteres",
            });
        }
        else if (!validators.isValidProductDescription(description)) {
            errors.push({
                field: "description",
                message: "La descripción debe ser más específica y detallada",
            });
        }
        else if (!validators.isSafeText(description)) {
            errors.push({
                field: "description",
                message: "La descripción contiene caracteres no seguros",
            });
        }
        else if (!validators.isSafeSQLText(description)) {
            errors.push({
                field: "description",
                message: "La descripción contiene caracteres no permitidos",
            });
        }
        else if (!validators.hasNoControlCharacters(description)) {
            errors.push({
                field: "description",
                message: "La descripción contiene caracteres de control no válidos",
            });
        }
    }
    // Validar cantidad (opcional)
    if (Quantity !== undefined) {
        if (typeof Quantity !== "number") {
            errors.push({
                field: "Quantity",
                message: "La cantidad debe ser un número",
            });
        }
        else if (!validators.isValidQuantity(Quantity)) {
            errors.push({
                field: "Quantity",
                message: "La cantidad debe ser un número entero entre 0 y 999,999",
            });
        }
        else if (!validators.isReasonableQuantity(Quantity)) {
            errors.push({
                field: "Quantity",
                message: "La cantidad parece ser demasiado alta. Verifique el valor ingresado",
            });
        }
    }
    // Validar precio (opcional)
    if (price !== undefined) {
        if (typeof price !== "number") {
            errors.push({
                field: "price",
                message: "El precio debe ser un número",
            });
        }
        else if (!validators.isValidPrice(price)) {
            errors.push({
                field: "price",
                message: "El precio debe ser un número positivo con máximo 2 decimales",
            });
        }
        else if (!validators.isRealisticPrice(price)) {
            errors.push({
                field: "price",
                message: "El precio debe estar entre $0.01 y $1,000,000",
            });
        }
        else if (!validators.isInRange(price, 0.01, 999999.99)) {
            errors.push({
                field: "price",
                message: "El precio debe ser un número entre 0.01 y 999,999.99",
            });
        }
    }
    // Validaciones adicionales de negocio
    if (typeof price === "number" && typeof Quantity === "number") {
        const totalValue = price * Quantity;
        if (totalValue > 10000000) {
            // 10 millones
            errors.push({
                field: "general",
                message: "El valor total del inventario (precio × cantidad) es demasiado alto",
            });
        }
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Middleware de validación para órdenes
export const validateCreateOrder = (req, res, next) => {
    const { userId, products } = req.body;
    const errors = [];
    // Validar userId
    if (!userId || !validators.isValidObjectId(userId)) {
        errors.push({ field: "userId", message: "ID de usuario inválido" });
    }
    // Validar productos
    if (!products || !Array.isArray(products) || products.length === 0) {
        errors.push({
            field: "products",
            message: "Debe incluir al menos un producto",
        });
    }
    else if (products.length > 50) {
        errors.push({
            field: "products",
            message: "No se pueden incluir más de 50 productos en una orden",
        });
    }
    else {
        let totalOrderValue = 0;
        let totalItems = 0;
        products.forEach((product, index) => {
            // Validar productId
            if (!product.productId ||
                !validators.isValidObjectId(product.productId)) {
                errors.push({
                    field: `products[${index}].productId`,
                    message: "ID de producto inválido",
                });
            }
            // Validar quantity
            if (!product.quantity ||
                typeof product.quantity !== "number" ||
                !Number.isInteger(product.quantity) ||
                product.quantity < 1 ||
                product.quantity > 999) {
                errors.push({
                    field: `products[${index}].quantity`,
                    message: "La cantidad debe ser un número entero entre 1 y 999",
                });
            }
            else {
                totalItems += product.quantity;
                // Validar cantidad individual por producto
                if (product.quantity > 100) {
                    errors.push({
                        field: `products[${index}].quantity`,
                        message: "La cantidad por producto no puede exceder 100 unidades",
                    });
                }
            }
            // Validar que no haya productos duplicados
            const duplicateIndex = products.findIndex((p, i) => i !== index && p.productId === product.productId);
            if (duplicateIndex !== -1) {
                errors.push({
                    field: `products[${index}].productId`,
                    message: "Producto duplicado en la orden",
                });
            }
            // Estimación del valor de la orden (se validará en el controller con precios reales)
            if (product.estimatedPrice &&
                typeof product.estimatedPrice === "number") {
                totalOrderValue += product.estimatedPrice * product.quantity;
            }
        });
        // Validar total de items en la orden
        if (totalItems > 500) {
            errors.push({
                field: "products",
                message: "El total de artículos en la orden no puede exceder 500",
            });
        }
        // Validar valor estimado total de la orden
        if (totalOrderValue > 100000) {
            // $100,000
            errors.push({
                field: "products",
                message: "El valor total estimado de la orden es demasiado alto",
            });
        }
    }
    // Validaciones adicionales de seguridad
    if (req.body.total !== undefined) {
        if (typeof req.body.total !== "number" || req.body.total < 0) {
            errors.push({
                field: "total",
                message: "El total debe ser un número positivo",
            });
        }
        else if (req.body.total > 100000) {
            errors.push({
                field: "total",
                message: "El total de la orden excede el límite permitido",
            });
        }
    }
    if (req.body.notes && typeof req.body.notes === "string") {
        if (!validators.isSafeText(req.body.notes)) {
            errors.push({
                field: "notes",
                message: "Las notas contienen caracteres no seguros",
            });
        }
        else if (!validators.isValidTextLength(req.body.notes, 0, 500)) {
            errors.push({
                field: "notes",
                message: "Las notas no pueden exceder 500 caracteres",
            });
        }
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
export const validateUpdateOrderStatus = (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const errors = [];
    // Validar orderId
    if (!validators.isValidObjectId(orderId)) {
        errors.push({ field: "orderId", message: "ID de orden inválido" });
    }
    // Validar status
    if (status === undefined || typeof status !== "boolean") {
        errors.push({
            field: "status",
            message: "El estado debe ser verdadero o falso",
        });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Middleware de validación para login
export const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];
    // Validar username (email)
    if (!username || typeof username !== "string") {
        errors.push({ field: "username", message: "El email es requerido" });
    }
    else if (!validators.isNotEmpty(username)) {
        errors.push({
            field: "username",
            message: "El email no puede estar vacío",
        });
    }
    else if (!validators.isEmail(username)) {
        errors.push({ field: "username", message: "Debe ser un email válido" });
    }
    else if (!validators.isValidTextLength(username, 5, 100)) {
        errors.push({
            field: "username",
            message: "El email debe tener entre 5 y 100 caracteres",
        });
    }
    else if (!validators.isSafeText(username)) {
        errors.push({
            field: "username",
            message: "El email contiene caracteres no seguros",
        });
    }
    else if (!validators.isSafeSQLText(username)) {
        errors.push({
            field: "username",
            message: "El email contiene caracteres no permitidos",
        });
    }
    // Validar password
    if (!password || typeof password !== "string") {
        errors.push({ field: "password", message: "La contraseña es requerida" });
    }
    else if (!validators.isNotEmpty(password)) {
        errors.push({
            field: "password",
            message: "La contraseña no puede estar vacía",
        });
    }
    else if (password.length < 8) {
        errors.push({
            field: "password",
            message: "La contraseña debe tener al menos 8 caracteres",
        });
    }
    else if (password.length > 128) {
        errors.push({
            field: "password",
            message: "La contraseña no puede exceder 128 caracteres",
        });
    }
    else if (!validators.hasNoControlCharacters(password)) {
        errors.push({
            field: "password",
            message: "La contraseña contiene caracteres de control no válidos",
        });
    }
    // Validaciones adicionales de seguridad para login
    if (req.body.rememberMe !== undefined &&
        typeof req.body.rememberMe !== "boolean") {
        errors.push({
            field: "rememberMe",
            message: "El campo 'recordarme' debe ser verdadero o falso",
        });
    }
    // Validar headers de seguridad básicos
    const userAgent = req.headers["user-agent"];
    if (!userAgent || userAgent.length < 10) {
        errors.push({
            field: "security",
            message: "Información del navegador requerida",
        });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Validación para parámetros de ID
export const validateMongoId = (paramName) => (req, res, next) => {
    const id = req.params[paramName];
    const errors = [];
    if (!validators.isValidObjectId(id)) {
        errors.push({ field: paramName, message: `${paramName} inválido` });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Middleware de validación general para entrada de datos
export const validateGeneralInput = (req, res, next) => {
    const errors = [];
    // Validar tamaño del payload
    const payloadSize = JSON.stringify(req.body).length;
    if (payloadSize > 1024 * 1024) {
        // 1MB
        errors.push({
            field: "general",
            message: "El tamaño de los datos enviados es demasiado grande",
        });
    }
    // Validar profundidad del objeto
    const maxDepth = 10;
    const getDepth = (obj, depth = 0) => {
        if (depth > maxDepth)
            return depth;
        if (obj === null || typeof obj !== "object")
            return depth;
        return Math.max(depth, ...Object.values(obj).map((v) => getDepth(v, depth + 1)));
    };
    if (getDepth(req.body) > maxDepth) {
        errors.push({
            field: "general",
            message: "La estructura de datos es demasiado compleja",
        });
    }
    // Validar número de campos
    const fieldCount = Object.keys(req.body).length;
    if (fieldCount > 50) {
        errors.push({
            field: "general",
            message: "Demasiados campos en la petición",
        });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Middleware de validación para actualización de stock
export const validateStockUpdate = (req, res, next) => {
    const { quantity, operation } = req.body;
    const { productId } = req.params;
    const errors = [];
    // Validar productId
    if (!validators.isValidObjectId(productId)) {
        errors.push({ field: "productId", message: "ID de producto inválido" });
    }
    // Validar quantity
    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
        errors.push({
            field: "quantity",
            message: "La cantidad debe ser un número entero",
        });
    }
    else if (!validators.isInRange(quantity, 1, 10000)) {
        errors.push({
            field: "quantity",
            message: "La cantidad debe estar entre 1 y 10,000",
        });
    }
    // Validar operation
    if (!operation || typeof operation !== "string") {
        errors.push({
            field: "operation",
            message: "La operación es requerida",
        });
    }
    else if (!["add", "subtract"].includes(operation)) {
        errors.push({
            field: "operation",
            message: "La operación debe ser 'add' o 'subtract'",
        });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Middleware de validación para búsquedas y filtros
export const validateSearchFilters = (req, res, next) => {
    const { name, status, page, limit, sortBy, sortOrder } = req.query;
    const errors = [];
    // Validar parámetros de búsqueda
    if (name && typeof name === "string") {
        if (!validators.isValidTextLength(name, 1, 100)) {
            errors.push({
                field: "name",
                message: "El término de búsqueda debe tener entre 1 y 100 caracteres",
            });
        }
        else if (!validators.isSafeText(name)) {
            errors.push({
                field: "name",
                message: "El término de búsqueda contiene caracteres no seguros",
            });
        }
    }
    // Validar status
    if (status && !["true", "false"].includes(status)) {
        errors.push({
            field: "status",
            message: "El estado debe ser 'true' o 'false'",
        });
    }
    // Validar paginación
    if (page) {
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
            errors.push({
                field: "page",
                message: "La página debe ser un número entre 1 y 1000",
            });
        }
    }
    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            errors.push({
                field: "limit",
                message: "El límite debe ser un número entre 1 y 100",
            });
        }
    }
    // Validar ordenamiento
    if (sortBy && typeof sortBy === "string") {
        const allowedSortFields = [
            "name",
            "createdAt",
            "price",
            "quantity",
            "status",
        ];
        if (!allowedSortFields.includes(sortBy)) {
            errors.push({
                field: "sortBy",
                message: "Campo de ordenamiento no válido",
            });
        }
    }
    if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
        errors.push({
            field: "sortOrder",
            message: "El orden debe ser 'asc' o 'desc'",
        });
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
// Middleware de validación para archivos (si se implementa upload)
export const validateFileUpload = (req, // Using any type for multer compatibility
res, next) => {
    const errors = [];
    if (req.file) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (!allowedTypes.includes(req.file.mimetype)) {
            errors.push({
                field: "file",
                message: "Tipo de archivo no permitido. Solo se permiten JPEG, PNG y WebP",
            });
        }
        if (req.file.size > maxSize) {
            errors.push({
                field: "file",
                message: "El archivo es demasiado grande. Máximo 5MB",
            });
        }
        // Validar nombre del archivo
        if (req.file.originalname &&
            !validators.isSafeText(req.file.originalname)) {
            errors.push({
                field: "file",
                message: "El nombre del archivo contiene caracteres no seguros",
            });
        }
    }
    if (errors.length > 0) {
        res.status(400).json({
            message: "Errores de validación",
            errors,
        });
        return;
    }
    next();
};
