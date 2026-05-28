const express  = require("express");
const router   = express.Router();
const { buscarEnSupermercados } = require("../services/apify");
const { productosFallback }     = require("../data/fallback");

// Cache simple en memoria para no llamar a Apify en cada petición
// { "leche": { data: [...], timestamp: 123456 } }
const cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos en ms

function obtenerCache(clave) {
  const entrada = cache[clave];
  if (!entrada) return null;
  if (Date.now() - entrada.timestamp > CACHE_TTL) {
    delete cache[clave];
    return null;
  }
  return entrada.data;
}

function guardarCache(clave, data) {
  cache[clave] = { data, timestamp: Date.now() };
}


// ── GET /api/products?q=leche ────────────────────────────────
// Busca en Mercadona y Carrefour vía Apify.
// Si Apify falla, usa los datos de respaldo.
// ────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { q, supermercado } = req.query;

  const query        = q ? q.trim().toLowerCase() : "";
  const supersFiltro = supermercado
    ? [supermercado.toLowerCase()]
    : ["mercadona", "carrefour"];

  if (!query) {
    const fallback = productosFallback
      .map(p => ({ ...p, esMejorPrecio: false }));
    return res.json({ total: fallback.length, productos: fallback, fuente: "fallback" });
  }

  const claveCache = `${query}_${supersFiltro.join("_")}`;

  // Devuelve del cache si existe
  const enCache = obtenerCache(claveCache);
  if (enCache) {
    console.log(`[Cache] Hit para "${query}"`);
    return res.json({ total: enCache.length, productos: enCache, fuente: "cache" });
  }

  try {
    console.log(`[Apify] Buscando "${query}" en ${supersFiltro.join(", ")}...`);
    const productos = await buscarEnSupermercados(query, supersFiltro);

    if (productos.length === 0) {
      // Apify no encontró nada — devuelve los de fallback filtrados
      const fallback = productosFallback
        .filter(p => p.nombre.toLowerCase().includes(query))
        .map(p => ({ ...p, esMejorPrecio: false }));

      return res.json({ total: fallback.length, productos: fallback, fuente: "fallback" });
    }

    guardarCache(claveCache, productos);

    console.log(`[Apify] ${productos.length} resultados para "${query}"`);
    res.json({ total: productos.length, productos, fuente: "apify" });

  } catch (error) {
    console.error("[Apify] Error:", error.message);

    // Si Apify falla completamente, usa datos de respaldo
    const fallback = productosFallback
      .filter(p => p.nombre.toLowerCase().includes(query))
      .map(p => ({ ...p, esMejorPrecio: false }));

    res.json({
      total:     fallback.length,
      productos: fallback,
      fuente:    "fallback",
      aviso:     "Usando datos locales. Apify no disponible.",
    });
  }
});


// ── GET /api/products/cache ──────────────────────────────────
// Ver qué hay en el cache (útil para debugging)
// ────────────────────────────────────────────────────────────
router.get("/cache", (req, res) => {
  const claves = Object.keys(cache).map(k => ({
    query:    k,
    items:    cache[k].data.length,
    expira:   new Date(cache[k].timestamp + CACHE_TTL).toLocaleTimeString(),
  }));
  res.json({ entradas: claves.length, cache: claves });
});


module.exports = router;
