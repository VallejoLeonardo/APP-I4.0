import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Interfaces para tipar las conexiones
interface DatabaseConnections {
  userDB: mongoose.Connection;
  ordenesDB: mongoose.Connection;
  rolesDB: mongoose.Connection;
  productosDB: mongoose.Connection;
}

// Configuración de las bases de datos usando variables de entorno con fallbacks para Atlas
const dbConfigs = {
  user: {
    uri:
      process.env.USER_DB_URI ||
      "mongodb+srv://username:password@cluster.mongodb.net/user?retryWrites=true&w=majority",
    name: "user",
  },
  ordenes: {
    uri:
      process.env.ORDENES_DB_URI ||
      "mongodb+srv://username:password@cluster.mongodb.net/ordenes?retryWrites=true&w=majority",
    name: "ordenes",
  },
  roles: {
    uri:
      process.env.ROLES_DB_URI ||
      "mongodb+srv://username:password@cluster.mongodb.net/roles?retryWrites=true&w=majority",
    name: "roles",
  },
  productos: {
    uri:
      process.env.PRODUCTOS_DB_URI ||
      "mongodb+srv://username:password@cluster.mongodb.net/productos?retryWrites=true&w=majority",
    name: "productos",
  },
};

// Variable para almacenar las conexiones
let connections: DatabaseConnections;

const connectDB = async (): Promise<DatabaseConnections> => {
  try {
    // Opciones de conexión optimizadas para MongoDB Atlas
    const connectionOptions = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    };

    // Crear conexiones a cada base de datos con opciones optimizadas
    const userDB = await mongoose.createConnection(
      dbConfigs.user.uri,
      connectionOptions
    );
    const ordenesDB = await mongoose.createConnection(
      dbConfigs.ordenes.uri,
      connectionOptions
    );
    const rolesDB = await mongoose.createConnection(
      dbConfigs.roles.uri,
      connectionOptions
    );
    const productosDB = await mongoose.createConnection(
      dbConfigs.productos.uri,
      connectionOptions
    );

    // Almacenar las conexiones
    connections = {
      userDB,
      ordenesDB,
      rolesDB,
      productosDB,
    };

    console.log("✅ Conectado a todas las bases de datos en MongoDB Atlas:");
    console.log(`  - ${dbConfigs.user.name}: Connected to Atlas cluster`);
    console.log(`  - ${dbConfigs.ordenes.name}: Connected to Atlas cluster`);
    console.log(`  - ${dbConfigs.roles.name}: Connected to Atlas cluster`);
    console.log(`  - ${dbConfigs.productos.name}: Connected to Atlas cluster`);

    return connections;
  } catch (error) {
    console.error(
      "❌ Error al conectar a las bases de datos de MongoDB Atlas:",
      error
    );
    process.exit(1); // Termina el proceso si no se puede conectar
  }
};

// Función para obtener las conexiones (útil para usar en otros archivos)
export const getConnections = (): DatabaseConnections => {
  if (!connections) {
    throw new Error(
      "Las bases de datos no han sido inicializadas. Llama a connectDB() primero."
    );
  }
  return connections;
};

export default connectDB;
