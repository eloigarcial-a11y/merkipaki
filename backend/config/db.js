// backend/config/db.js
const { Sequelize } = require('sequelize');

// PostgreSQL en Render
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/merkipaki', {
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 10000
  }
});

// Función para reintentar conexión
async function testConnection() {
  let retries = 10;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log("✅ Conexión a PostgreSQL exitosa");
      return true;
    } catch (err) {
      retries--;
      console.log(`⏳ Reintentando conexión a BD... (${retries} intentos restantes)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error("No se pudo conectar a la BD después de múltiples intentos");
}

module.exports = { sequelize, testConnection };