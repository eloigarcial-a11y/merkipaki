// ============================================================
// SERVICIO APIFY
// Llama a los scrapers de Apify para cada supermercado
// y normaliza los resultados a un formato común.
// ============================================================

const fetch = require("node-fetch");

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const BASE_URL    = "https://api.apify.com/v2";

// IDs de los actores en Apify
const ACTORS = {
  mercadona: "zOiLZ2YwWpoBjhddk",        // Mercadona Price and Product Scraper
  carrefour: "123webdata~carrefour-scraper", // Carrefour Scraper
};

// ── Helper: lanza un actor y espera el resultado ─────────────
async function ejecutarActor(actorId, input) {
  const runRes = await fetch(
    `${BASE_URL}/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=300`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(input),
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Apify error al lanzar actor ${actorId}: ${err}`);
  }

  const runData = await runRes.json();
  const estado  = runData.data.status;

  if (estado === "FAILED" || estado === "ABORTED" || estado === "TIMED-OUT") {
    throw new Error(`Actor ${actorId} falló con estado: ${estado}`);
  }

  const datasetId = runData.data.defaultDatasetId;

  const itemsRes = await fetch(
    `${BASE_URL}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true&limit=15`
  );
  const items = await itemsRes.json();
  return Array.isArray(items) ? items : [];
}

// ── Normaliza un producto de Mercadona ───────────────────────
function normalizarMercadona(item) {
  const instrucciones = item.price_instructions || item.priceInstructions || {};

  const precio =
    parseFloat(instrucciones.unit_price) ||
    parseFloat(instrucciones.unitPrice)  ||
    parseFloat(item.price)               ||
    0;

  const unidad =
    instrucciones.unit_name        ||
    instrucciones.unitName         ||
    instrucciones.unit_user_price  ||
    item.packaging                 ||
    item.unitSize                  ||
    "ud";

  const categoria =
    item.categories?.[0]?.name    ||
    item.category                  ||
    item.section                   ||
    "otros";

  const imagen =
    item.photos?.[0]?.zoom         ||
    item.photos?.[0]?.regular      ||
    item.thumbnail                 ||
    item.imageUrl                  ||
    null;

  return {
    nombre:       item.display_name || item.name || item.displayName || "Sin nombre",
    supermercado: "Mercadona",
    marca:        item.brand || "Hacendado",
    precio,
    unidad,
    categoria,
    imagen,
    url: item.share_url || item.productUrl || "https://tienda.mercadona.es",
  };
}

// ── Normaliza un producto de Carrefour ───────────────────────
function normalizarCarrefour(item) {
  return {
    nombre:       item.name        || item.title || "Sin nombre",
    supermercado: "Carrefour",
    marca:        item.brand       || "Carrefour",
    precio:       parseFloat(item.price || item.currentPrice || 0),
    unidad:       item.unit        || item.packageSize || "ud",
    categoria:    item.category    || item.categoryName || "otros",
    imagen:       item.imageUrl    || item.image || null,
    url:          item.url         || `https://www.carrefour.es`,
  };
}

// ── Función principal: busca en todos los supermercados ──────
async function buscarEnSupermercados(query, supermercados = ["mercadona"]) {
  const promesas = [];

  if (supermercados.includes("mercadona")) {
    promesas.push(
      ejecutarActor(ACTORS.mercadona, {
        search:     query,
        postalCode: "08001",
        maxResults: 15,
      })
        .then(items => {
          console.log(`[Mercadona] ${items.length} items recibidos`);
          return items.map(normalizarMercadona);
        })
        .catch(err => {
          console.error("Error Mercadona:", err.message);
          return [];
        })
    );
  }

  if (supermercados.includes("carrefour")) {
    promesas.push(
      ejecutarActor(ACTORS.carrefour, { query, country: "ES", maxItems: 10 })
        .then(items => {
          console.log(`[Carrefour] ${items.length} items recibidos`);
          return items.map(normalizarCarrefour);
        })
        .catch(err => {
          console.error("Error Carrefour:", err.message);
          return [];
        })
    );
  }

  const resultados = await Promise.all(promesas);
  const todos = resultados.flat();
  const validos = todos.filter(p => p.precio > 0);

  return marcarMejorPrecio(validos);
}

// ── Marca qué producto tiene el mejor precio de la lista ─────
function marcarMejorPrecio(productos) {
  if (productos.length === 0) return [];

  const precioMin = Math.min(...productos.map(p => p.precio));

  return productos
    .map(p => ({
      ...p,
      precio:        +p.precio.toFixed(2),
      esMejorPrecio: p.precio === precioMin,
    }))
    .sort((a, b) => a.precio - b.precio);
}

module.exports = { buscarEnSupermercados };