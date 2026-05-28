// backend/middlewares/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura_merkipaki";

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: "Acceso denegado. Inicia sesión." });

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.user = verificado; // Guardamos los datos del usuario en la petición (id, email)
    next();
  } catch (err) {
    res.status(403).json({ error: "Token inválido o expirado." });
  }
};