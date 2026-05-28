const express = require('express');
const router = express.Router();
const SavedList = require('../models/SavedList');

// Importamos tu middleware de autenticación
const verificarToken = require('../middlewares/auth');

// ============================================================
// 1. RUTA GET: Obtener todas las listas del usuario conectado
// ============================================================
router.get('/', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const listas = await SavedList.findAll({
      where: { userId: usuarioId },
      order: [['createdAt', 'DESC']],
    });

    const listasProcesadas = listas.map(l => {
      const data = l.toJSON();
      try {
        data.items = JSON.parse(data.items);
      } catch (e) {
        data.items = [];
      }
      return data;
    });

    res.json({ listas: listasProcesadas });
  } catch (err) {
    console.error('Error al consultar listas:', err);
    res.status(500).json({ error: 'Error al obtener el historial de listas' });
  }
});

// ============================================================
// 2. RUTA POST: Guardar una nueva lista de la compra
// ============================================================
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, items, total } = req.body;
    const usuarioId = req.user?.id;

    if (!items || !Array.isArray(items) || typeof total !== 'number') {
      return res.status(400).json({ error: 'Datos inválidos para guardar la lista.' });
    }

    const nombreLista = nombre || `Lista del ${new Date().toLocaleDateString()}`;

    const nuevaLista = await SavedList.create({
      nombre: nombreLista,
      items: JSON.stringify(items),
      total,
      userId: usuarioId,
    });

    res.status(201).json({
      mensaje: '¡Lista guardada con éxito!',
      id: nuevaLista.id,
    });
  } catch (err) {
    console.error('Error al guardar lista:', err);
    res.status(500).json({ error: 'Error al guardar la lista en la base de datos' });
  }
});

// ============================================================
// 3. RUTA DELETE: Eliminar una lista permanentemente
// ============================================================
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const listaId = req.params.id;
    const usuarioId = req.user?.id;

    const eliminadas = await SavedList.destroy({
      where: { id: listaId, userId: usuarioId },
    });

    if (eliminadas === 0) {
      return res.status(404).json({ error: 'No se encontró la lista o no tienes permisos para borrarla' });
    }

    res.json({ mensaje: 'Lista eliminada correctamente del historial' });
  } catch (err) {
    console.error('Error al eliminar lista:', err);
    res.status(500).json({ error: 'Error interno al intentar eliminar la lista' });
  }
});

module.exports = router;