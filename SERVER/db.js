const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'bamba',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'gestion_comptable',
  // Configuration corrigée pour mysql2
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Retirez ces options qui causent les warnings
  // acquireTimeout: 60000,  ← Retirez cette ligne
  // timeout: 60000,         ← Retirez cette ligne
});

// Test de connexion au démarrage
db.getConnection()
  .then(connection => {
    console.log('✅ Connexion à la base de données réussie');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('Database:', process.env.DB_NAME || 'gestion_comptable');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    console.log('Variables d\'environnement:');
    console.log('DB_HOST:', process.env.DB_HOST || 'NON DÉFINI');
    console.log('DB_USER:', process.env.DB_USER || 'NON DÉFINI');
    console.log('DB_NAME:', process.env.DB_NAME || 'NON DÉFINI');
  });

module.exports = db;