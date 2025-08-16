const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // Railway donne un port spécifique
  ssl: {
    rejectUnauthorized: false // avec Railway, il faut souvent mettre false
  }
});

module.exports = db;
