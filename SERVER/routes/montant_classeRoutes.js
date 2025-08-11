const express = require('express');
const router = express.Router();
const pool = require('../db');
const { montantSchema, montantUpdateSchema } = require('../validation/montantsSchema');

// 🔹 GET : tous les montants (optionnellement filtrés par année ou statut)
router.get('/', async (req, res) => {
  const { annee, statut } = req.query;
  try {
    const conn = await pool.getConnection();
    let query = 'SELECT * FROM montants_classes WHERE 1=1';
    const params = [];

    if (annee) {
      query += ' AND annee_scolaire = ?';
      params.push(annee);
    }

    if (statut) {
      query += ' AND statut_affectation = ?';
      params.push(statut);
    }

    const [rows] = await conn.query(query, params);
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 🔹 POST : ajouter un montant
router.post('/', async (req, res) => {
  try {
    const { error, value } = montantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { classe, montant, annee_scolaire, statut_affectation } = value;

    const conn = await pool.getConnection();

    // Vérification si un montant existe déjà pour cette combinaison
    const [existing] = await conn.query(
      'SELECT * FROM montants_classes WHERE classe = ? AND annee_scolaire = ? AND statut_affectation = ?',
      [classe, annee_scolaire, statut_affectation]
    );

    if (existing.length > 0) {
      conn.release();
      return res.status(400).json({ error: 'Ce montant existe déjà pour cette classe, année et statut.' });
    }

    const [result] = await conn.query(
      `INSERT INTO montants_classes (classe, montant, annee_scolaire, statut_affectation) VALUES (?, ?, ?, ?)`,
      [classe, montant, annee_scolaire, statut_affectation]
    );

    conn.release();

    res.status(201).json({ id: result.insertId, classe, montant, annee_scolaire, statut_affectation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 🔹 PUT : modifier un montant existant
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

// 🔹 DELETE : supprimer un montant
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
