// backend/config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Crea la base de datos en un archivo local automático
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false // Para no ensuciar la consola con logs de SQL
});

module.exports = sequelize;