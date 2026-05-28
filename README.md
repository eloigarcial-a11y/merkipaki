# 🛒 Merkipaki v2 — Precios reales vía Apify

Comparador de supermercados con **precios reales** de Mercadona y Carrefour,
obtenidos en tiempo real a través de los scrapers de [Apify](https://apify.com).

---

## Cómo funciona

```
Usuario busca "leche"
       ↓
Frontend → fetch → GET /api/products?q=leche
       ↓
Backend (Express) → Apify API → Scraper Mercadona + Scraper Carrefour
       ↓
Resultados normalizados → Frontend muestra tabla comparativa
```

---

## Estructura

```
merkipaki/
├── backend/
│   ├── server.js              ← servidor Express
│   ├── services/
│   │   └── apify.js           ← llama a los scrapers de Apify
│   ├── routes/
│   │   ├── products.js        ← GET /api/products
│   │   └── offers.js          ← GET /api/offers
│   └── data/
│       └── fallback.js        ← datos de respaldo si Apify falla
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env                       ← tu token de Apify (NO subir a GitHub)
├── .env.example               ← plantilla sin token
└── package.json
```

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar el servidor
npm start

# 3. Abrir en el navegador
http://localhost:3000
```

---

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products?q=leche` | Precios reales de Mercadona + Carrefour |
| GET | `/api/products?q=leche&supermercado=mercadona` | Solo Mercadona |
| GET | `/api/products/cache` | Ver qué búsquedas están en caché |
| GET | `/api/offers` | Ofertas de la semana |
| GET | `/api/offers?activas=true` | Solo ofertas vigentes |
| GET | `/api/offers/:id` | Detalle de una oferta |

---

## Notas importantes

- La primera búsqueda tarda **~15-20 segundos** porque Apify lanza el scraper en tiempo real.
- Las búsquedas repetidas son instantáneas gracias a la **caché de 10 minutos**.
- Si Apify no está disponible, el sistema usa **datos de respaldo** automáticamente.
- El token de Apify está en `.env` — **nunca lo subas a GitHub**.

---

## Tecnologías

- **Backend:** Node.js, Express, node-fetch, dotenv
- **Scrapers:** Apify (Mercadona + Carrefour)
- **Frontend:** HTML, CSS, JavaScript (Fetch API)
