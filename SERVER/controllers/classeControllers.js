const db = require('../db');

// Cette fonction retourne simplement la liste des classes
exports.getAllClasses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM classes');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
};

