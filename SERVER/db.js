const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'bamba',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'gestion_comptable',
  // Options additionnelles recommandées
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Test de connexion au démarrage
db.getConnection()
  .then(connection => {
    console.log('✅ Connexion à la base de données réussie');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  });

module.exports = db;