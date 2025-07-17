#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔐 Generando secretos seguros para el proyecto...\n");

// Generar JWT Secret
const jwtSecret = crypto.randomBytes(64).toString("hex");

// Generar un salt personalizado para bcrypt (aunque bcrypt genera uno automáticamente)
const bcryptSalt = Math.floor(Math.random() * 5) + 10; // Entre 10-14 rounds

console.log("✅ Secretos generados:");
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`BCRYPT_SALT_ROUNDS=${bcryptSalt}`);

// Verificar si existe .env
const envPath = path.join(__dirname, "..", ".env");
const envExamplePath = path.join(__dirname, "..", ".env.example");

if (!fs.existsSync(envPath)) {
  console.log("\n📄 Creando archivo .env desde .env.example...");

  if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, "utf8");

    // Reemplazar valores vacíos con los generados
    envContent = envContent.replace(
      "JWT_SECRET=GENERATE_YOUR_OWN_SECRET_HERE_NEVER_USE_THIS_DEFAULT",
      `JWT_SECRET=${jwtSecret}`
    );
    envContent = envContent.replace(
      "BCRYPT_SALT_ROUNDS=12",
      `BCRYPT_SALT_ROUNDS=${bcryptSalt}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Archivo .env creado con secretos seguros");
  } else {
    console.log("❌ No se encontró .env.example");
  }
} else {
  console.log("\n⚠️  El archivo .env ya existe.");
  console.log(
    "💡 Copia manualmente los secretos generados arriba si es necesario."
  );
}

console.log("\n🚀 ¡Configuración de seguridad completada!");
console.log(
  "🔒 Asegúrate de no commitear el archivo .env al control de versiones."
);
