require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const path     = require("path");

// 1. IMPORTAR LA CONFIGURACIÓN DE LA BASE DE DATOS (NUEVO)
const { initDatabase } = require("./config/db");

// Importación de rutas existentes
const productRoutes = require("./routes/products");
const offerRoutes   = require("./routes/offers");

// 2. IMPORTACIÓN DE LAS FUTURAS RUTAS DE USUARIOS Y LISTAS (NUEVO)
// Nota: Las dejamos comentadas para que el servidor no falle hasta que creemos los archivos
 const authRoutes    = require("./routes/auth");
 const listRoutes    = require("./routes/lists");

const app  = express();
const PORT = process.env.PORT || 3000;

// Comprueba que el token de Apify está configurado
if (!process.env.APIFY_TOKEN) {
  console.warn("⚠️  APIFY_TOKEN no encontrado en .env — usando datos de respaldo");
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Rutas del proyecto
app.use("/api/products", productRoutes);
app.use("/api/offers",   offerRoutes);

// 3. ENLAZAR LAS FUTURAS RUTAS DE LA API (NUEVO)
 app.use("/api/auth",   authRoutes);
 app.use("/api/lists",  listRoutes);

app.get("/api", (req, res) => {
  res.json({
    nombre:  "Merkipaki API v2",
    apify:   !!process.env.APIFY_TOKEN,
    endpoints: [
      "GET /api/products?q=leche              → busca en Mercadona + Carrefour vía Apify",
      "GET /api/products?q=leche&supermercado=mercadona → solo Mercadona",
      "GET /api/products/cache                → ver cache actual",
      "GET /api/offers                        → ofertas de la semana",
      "GET /api/offers?activas=true           → solo vigentes",
      "GET /api/offers/:id                    → detalle de oferta",
    ],
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 4. INICIALIZAR BASE DE DATOS CON SQL.JS (NUEVO)
initDatabase().then((sequelize) => {
  sequelize.sync().then(() => {
    console.log("💾 Base de datos SQLite conectada y sincronizada.");
    
    app.listen(PORT, () => {
      console.log(`\n🛒 Merkipaki v2 corriendo en http://localhost:${PORT}`);
      console.log(`📦 API en http://localhost:${PORT}/api`);
      console.log(`🔑 Apify: ${process.env.APIFY_TOKEN ? "✅ configurado" : "❌ no configurado"}\n`);
    });
  }).catch(err => {
    console.error("❌ No se pudo sincronizar la base de datos:", err);
  });
}).catch(err => {
  console.error("❌ No se pudo inicializar la base de datos:", err);
});