const express = require("express");
const router  = express.Router();
const { ofertas } = require("../data/fallback");

// Comprueba si una oferta ha expirado de forma segura a nivel de fecha limpia
function caducada(hasta) {
  const [d, m, a] = hasta.split("/").map(Number);
  const fechaOferta = new Date(a, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); 
  return fechaOferta < hoy;
}

router.get("/", (req, res) => {
  const { supermercado, activas, q } = req.query;
  let resultado = ofertas;

  if (supermercado) {
    resultado = resultado.filter(o =>
      o.supermercado.toLowerCase() === supermercado.toLowerCase()
    );
  }
  if (activas === "true") {
    resultado = resultado.filter(o => !caducada(o.hasta));
  }
  
  // Búsqueda por texto en ofertas
  if (q && q.trim() !== "") {
    const queryTerm = q.trim().toLowerCase();
    resultado = resultado.filter(o => 
      o.nombre.toLowerCase().includes(queryTerm) || 
      o.descripcion.toLowerCase().includes(queryTerm)
    );
  }

  const conCalculos = resultado.map(o => ({
    ...o,
    descuentoPct: Math.round((1 - o.precioAhora / o.precioAntes) * 100),
    ahorro:       +(o.precioAntes - o.precioAhora).toFixed(2),
    caducada:     caducada(o.hasta),
  }));

  res.json({ total: conCalculos.length, ofertas: conCalculos });
});

router.get("/:id", (req, res) => {
  const oferta = ofertas.find(o => o.id === parseInt(req.params.id));
  if (!oferta) return res.status(404).json({ error: "Oferta no encontrada" });
  
  res.json({
    ...oferta,
    descuentoPct: Math.round((1 - oferta.precioAhora / oferta.precioAntes) * 100),
    ahorro:       +(oferta.precioAntes - oferta.precioAhora).toFixed(2),
    caducada:     caducada(oferta.hasta),
  });
});

module.exports = router;