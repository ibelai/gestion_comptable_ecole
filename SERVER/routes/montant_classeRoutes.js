const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assure-toi que ce chemin est correct
const { montantSchema, montantUpdateSchema } = require('../validation/montantsSchema'); // Exemple

router.get('/', async (req, res) => {
  const { annee } = req.query;
  try {
    const conn = await pool.getConnection();
    let query = 'SELECT * FROM montants_classes';
    const params = [];
    if (annee) {
      query += ' WHERE annee_scolaire = ?';
      params.push(annee);
    }
    const [rows] = await conn.query(query, params);
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = montantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { classe, montant, annee_scolaire } = value;

    const conn = await pool.getConnection();

    const [result] = await conn.query(
      `INSERT INTO montants_classes (classe, montant, annee_scolaire) VALUES (?, ?, ?)`,
      [classe, montant, annee_scolaire]
    );

    conn.release();

    res.status(201).json({ id: result.insertId, classe, montant, annee_scolaire });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce montant existe déjà pour cette classe et année scolaire.' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { error, value } = montantUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { id } = req.params;
    const { montant } = value;

    const conn = await pool.getConnection();

    const [result] = await conn.query(
      `UPDATE montants_classes SET montant = ? WHERE id = ?`,
      [montant, id]
    );

    conn.release();

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Montant non trouvé' });

    res.json({ id, montant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    const [result] = await conn.query(
      `DELETE FROM montants_classes WHERE id = ?`,
      [id]
    );

    conn.release();

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Montant non trouvé' });

    res.json({ message: 'Montant supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
