const db = require('../db');

// Obtenir tous les montants par classe
exports.getAllMontants = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, c.nom AS classe_nom
      FROM montants_par_classe m
      JOIN classes c ON c.id = m.classe_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// Obtenir le montant total pour une classe
exports.getMontantByClasse = async (req, res) => {
  const { classe_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM montants_par_classe WHERE classe_id = ?',
      [classe_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Non défini' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// Créer ou mettre à jour le montant total pour une classe
exports.createOrUpdateMontant = async (req, res) => {
   const { classe_id, montant_total } = req.body;
  try {
    const existing = await db.query('SELECT * FROM montants_par_classe WHERE classe_id = ?', [classe_id]);
    if (existing[0].length > 0) {
      await db.query('UPDATE montants_par_classe SET montant_total = ? WHERE classe_id = ?', [montant_total, classe_id]);
    } else {
      await db.query('INSERT INTO montants_par_classe (classe_id, montant_total) VALUES (?, ?)', [classe_id, montant_total]);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
};
