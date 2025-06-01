



const mysql = require('mysql2/promise');
const db = mysql.createPool({
  host: 'localhost',
  user: 'bamba',
  password: '12345678',
  database: 'gestion_comptable', // ici
});


module.exports = db;



