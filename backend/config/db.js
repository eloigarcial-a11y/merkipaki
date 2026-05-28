// backend/config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Sequelize usa sql.js automáticamente como fallback
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

module.exports = sequelize;