const express = require('express');
const router = express.Router();
const pool = require('../db');
const { montantSchema, montantUpdateSchema } = require('../validation/montantsSchema');

// === ROUTES POUR LES CLASSES ===

// GET toutes les classes (simple liste)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM classes ORDER BY nom');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors du chargement des classes' });
  }
});

// POST une nouvelle classe avec montant (transaction)
router.post('/classes/avec-montant', async (req, res) => {
  const { nom, montant, annee_scolaire, statut_affectation } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insertion classe
    const [resultClass] = await conn.query(
      'INSERT INTO classes (nom) VALUES (?)',
      [nom]
    );

    // Insertion montant lié à la classe
    await conn.query(
      `INSERT INTO montants_classes (classe, montant, annee_scolaire, statut_affectation) VALUES (?, ?, ?, ?)`,
      [nom, montant, annee_scolaire, statut_affectation]
    );

    await conn.commit();
    res.status(201).json({ message: 'Classe et montant ajoutés avec succès' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cette classe ou ce montant existe déjà.' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// GET montants avec filtre année et statut_affectation
router.get('/montants', async (req, res) => {
  const { annee, statut } = req.query;
  const conn = await pool.getConnection();
  try {
    let query = 'SELECT * FROM montants_classes WHERE 1=1';
    const params = [];

    if (annee) {
      query += ' AND annee_scolaire = ?';
      params.push(annee);
    }

    if (statut) {
      if (statut === 'affecté' || statut === 'non affecté') {
        query += ' AND statut_affectation = ?';
        params.push(statut);
      } else {
        return res.status(400).json({ error: 'Statut affectation invalide.' });
      }
    }

    const [rows] = await conn.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// POST un montant
router.post('/montants', async (req, res) => {
  try {
    const { error, value } = montantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { classe, montant, annee_scolaire, statut_affectation } = value;

    const conn = await pool.getConnection();

    const [result] = await conn.query(
      `INSERT INTO montants_classes (classe, montant, annee_scolaire, statut_affectation) VALUES (?, ?, ?, ?)`,
      [classe, montant, annee_scolaire, statut_affectation]
    );

    conn.release();

    res.status(201).json({ id: result.insertId, classe, montant, annee_scolaire, statut_affectation });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce montant existe déjà pour cette classe et année scolaire.' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mise à jour montant
router.put('/montants/:id', async (req, res) => {
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

// DELETE montant
router.delete('/montants/:id', async (req, res) => {
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
