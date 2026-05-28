// backend/config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let sequelize;

const initDatabase = async () => {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '../database.sqlite');
  
  let filebuffer;
  if (fs.existsSync(dbPath)) {
    filebuffer = fs.readFileSync(dbPath);
  }
  
  const db = new SQL.Database(filebuffer);
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
  
  sequelize.db = db;
  sequelize.dbPath = dbPath;
  
  return sequelize;
};

module.exports = { initDatabase, getSequelize: () => sequelize };