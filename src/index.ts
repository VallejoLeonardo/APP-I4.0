import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import connectDB from "./config/db.js";
import { initializeModels } from "./models/connections.js";
import { validateEnvironment } from "./config/environment.js";

// Validate environment variables before starting the application
const envConfig = validateEnvironment();

const app = express();
const PORT = envConfig.PORT || process.env.PORT || 8080;

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            process.env.FRONTEND_URL,
            /\.railway\.app$/, // Allow all Railway domains
          ]
        : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Rutas
app.use("/api/v1", authRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1/menu", menuRoutes);

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API Sistema de Gestión I4.0",
    version: "1.0.0",
    status: "running",
  });
});

// Inicializar conexiones a las bases de datos y modelos
connectDB()
  .then(() => {
    // Inicializar modelos después de que las conexiones estén listas
    initializeModels();
    console.log("✅ Modelos inicializados correctamente");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en el puerto: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1); // Termina el proceso si no se puede conectar a la base de datos
  });
