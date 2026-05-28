const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SavedList = sequelize.define('SavedList', {
  nombre: {
    type: DataTypes.STRING,
    defaultValue: "Lista de la compra"
  },
  items: {
    type: DataTypes.TEXT, // Guardaremos el array de productos como un texto JSON
    allowNull: false
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'listas',
  timestamps: true
});

module.exports = SavedList;