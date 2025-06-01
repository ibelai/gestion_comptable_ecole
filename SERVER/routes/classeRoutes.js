const express = require('express');
const router = express.Router();
const pool = require('../db');
const { montantSchema, montantUpdateSchema } = require('../validation/montantsSchema');

// === ROUTES POUR LES CLASSES ===

// GET toutes les classes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM classes ORDER BY nom');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors du chargement des classes' });
  }
});

// POST une nouvelle classe
router.post('/avec-montant', async (req, res) => {
  const { nom, montant, annee_scolaire } = req.body;
  const conn = await pool.getConnection(); // ✅ correction ici
  try {
    await conn.beginTransaction();

    // 1. Insérer la classe
    const [resultClass] = await conn.query(
      'INSERT INTO classes (nom) VALUES (?)',
      [nom]
    );

    const classeNom = nom;

    // 2. Insérer le montant dans montants_classes
    await conn.query(
      'INSERT INTO montants_classes (classe, montant, annee_scolaire) VALUES (?, ?, ?)',
      [classeNom, montant, annee_scolaire]
    );

    await conn.commit();
    conn.release();

    res.status(201).json({ message: 'Classe et montant ajoutés avec succès' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cette classe ou ce montant existe déjà.' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



// === ROUTES POUR LES MONTANTS DES CLASSES ===

// GET montants (filtrable par année scolaire)
router.get('/montants', async (req, res) => {
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

// POST un montant
router.post('/montants', async (req, res) => {
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

// PUT mettre à jour un montant
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

// DELETE un montant
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
