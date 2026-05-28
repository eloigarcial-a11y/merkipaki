// ============================================================
// DATOS DE RESPALDO
// Se usan cuando Apify no está disponible o para las ofertas,
// que no tienen scraper directo.
// ============================================================

const productosFallback = [
  { nombre: "Leche entera",     supermercado: "Mercadona", marca: "Hacendado",  precio: 0.75, unidad: "1L",    categoria: "lácteos",   imagen: null },
  { nombre: "Leche entera",     supermercado: "Carrefour", marca: "Carrefour",  precio: 0.79, unidad: "1L",    categoria: "lácteos",   imagen: null },
  { nombre: "Leche entera",     supermercado: "Lidl",      marca: "Milbona",    precio: 0.69, unidad: "1L",    categoria: "lácteos",   imagen: null },
  { nombre: "Pan de molde",     supermercado: "Mercadona", marca: "Hacendado",  precio: 1.05, unidad: "450g",  categoria: "panadería", imagen: null },
  { nombre: "Pan de molde",     supermercado: "Carrefour", marca: "Carrefour",  precio: 1.29, unidad: "500g",  categoria: "panadería", imagen: null },
  { nombre: "Aceite de oliva",  supermercado: "Mercadona", marca: "Hacendado",  precio: 8.49, unidad: "1L",    categoria: "aceites",   imagen: null },
  { nombre: "Aceite de oliva",  supermercado: "Carrefour", marca: "Carrefour",  precio: 7.99, unidad: "1L",    categoria: "aceites",   imagen: null },
  { nombre: "Huevos M",         supermercado: "Mercadona", marca: "Hacendado",  precio: 1.69, unidad: "12 ud", categoria: "huevos",    imagen: null },
  { nombre: "Huevos M",         supermercado: "Carrefour", marca: "Carrefour",  precio: 1.89, unidad: "12 ud", categoria: "huevos",    imagen: null },
  { nombre: "Agua mineral",     supermercado: "Mercadona", marca: "Hacendado",  precio: 0.19, unidad: "1.5L",  categoria: "bebidas",   imagen: null },
  { nombre: "Agua mineral",     supermercado: "Carrefour", marca: "Carrefour",  precio: 0.22, unidad: "1.5L",  categoria: "bebidas",   imagen: null },
];

const ofertas = [
  { id: 1, emoji: "🥛", nombre: "Leche entera pack 6",          supermercado: "Mercadona", precioAntes: 4.50, precioAhora: 3.29, hasta: "30/09/2026", descripcion: "6 briks de 1L por precio especial" },
  { id: 2, emoji: "🫒", nombre: "Aceite de oliva virgen extra", supermercado: "Carrefour", precioAntes: 7.99, precioAhora: 5.99, hasta: "15/09/2026", descripcion: "Botella de 1L, oferta de temporada" },
  { id: 3, emoji: "🍗", nombre: "Pechuga de pollo",             supermercado: "Lidl",      precioAntes: 5.20, precioAhora: 3.49, hasta: "31/12/2026", descripcion: "Bandeja de 500g" },
  { id: 4, emoji: "🧴", nombre: "Detergente lavadora",          supermercado: "Aldi",      precioAntes: 5.99, precioAhora: 3.29, hasta: "20/10/2026", descripcion: "60 lavados, ahorra un 45%" },
  { id: 5, emoji: "🥚", nombre: "Huevos camperos L",            supermercado: "Dia",       precioAntes: 2.89, precioAhora: 1.99, hasta: "15/08/2026", descripcion: "Docena de huevos de gallinas criadas en suelo" }
];

module.exports = { productosFallback, ofertas };
