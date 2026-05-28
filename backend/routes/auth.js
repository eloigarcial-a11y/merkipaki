const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura_merkipaki";

// 1. REGISTRO DE USUARIOS (POST /api/auth/register)
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Por favor, rellena todos los campos." });
    }

    // Comprobar si el email ya existe
    const existeUsuario = await User.findOne({ where: { email } });
    if (existeUsuario) {
      return res.status(400).json({ error: "Este correo electrónico ya está registrado." });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Crear usuario
    const nuevoUsuario = await User.create({
      email,
      password: passwordEncriptada
    });

    res.status(201).json({ mensaje: "¡Usuario registrado con éxito! Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor al registrar." });
  }
});

// 2. INICIO DE SESIÓN (POST /api/auth/login)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Introduce tu correo y contraseña." });
    }

    // Buscar usuario
    const usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      return res.status(400).json({ error: "El correo o la contraseña no son correctos." });
    }

    // Comprobar contraseña
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.status(400).json({ error: "El correo o la contraseña no son correctos." });
    }

    // Crear el token JWT (Expira en 7 días)
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      mensaje: "¡Inicio de sesión correcto!",
      token,
      usuario: { id: usuario.id, email: usuario.email }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno en el inicio de sesión." });
  }
});

// 3. RESTABLECER CONTRASEÑA (POST /api/auth/forgot-password)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Introduce el correo y la nueva contraseña." });
    }

    const usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ error: "No existe ningún usuario con ese correo." });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(newPassword, salt);

    // Actualizar en base de datos
    usuario.password = passwordEncriptada;
    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada correctamente. ¡Ya puedes loguearte!" });
  } catch (error) {
    console.error("Error al restablecer:", error);
    res.status(500).json({ error: "Error al restablecer la contraseña." });
  }
});

module.exports = router;