const mysql = require('mysql2/promise');

// Récupération des variables d'environnement
const db = mysql.createPool({
  host: process.env.DB_HOST,        // depuis Render Environment Variables
  user: process.env.DB_USER,        // depuis Render Environment Variables
  password: process.env.DB_PASSWORD,// depuis Render Environment Variables
  database: process.env.DB_NAME,    // depuis Render Environment Variables
  ssl: { rejectUnauthorized: true } // requis si tu utilises PlanetScale ou autre DB cloud
});

module.exports = db;
