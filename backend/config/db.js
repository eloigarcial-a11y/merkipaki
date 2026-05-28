// backend/config/db.js
const { Sequelize } = require('sequelize');

// PostgreSQL en Render
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/merkipaki', {
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: true
  }
});

module.exports = sequelize;