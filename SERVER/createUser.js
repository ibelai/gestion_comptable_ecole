const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const db = require('./db'); // pool déjà configuré

async function createAdmin() {
  const nom = 'Admin';
  const email = 'admin@example.com';
  const mot_de_passe = '12345678';
  const role = 'admin';
  const avatar = 'default.png'; // ou null

  try {
    // Vérifier si l'email existe déjà
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('⚠️ Cet email existe déjà :', email);
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insérer dans la base
    await db.query(
      'INSERT INTO users (nom, email, mot_de_passe, role, avatar) VALUES (?, ?, ?, ?, ?)',
      [nom, email, hashedPassword, role, avatar]
    );

    console.log('✅ Admin créé avec succès.');

  } catch (err) {
    console.error('❌ Erreur lors de la création de l’admin :', err.message);
  }
}

createAdmin();
