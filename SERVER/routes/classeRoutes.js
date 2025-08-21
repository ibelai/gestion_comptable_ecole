const express = require('express');
const router = express.Router();
const pool = require('../db');
const { montantAvecNomClasseSchema, montantUpdateSchema } = require('../validation/montantsSchema');

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
router.post('/avec-montant', async (req, res) => {
  const { nom, montant, annee_scolaire, statut_affectation } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insertion classe
    const [resultClass] = await conn.query(
      'INSERT INTO classes (nom) VALUES (?)',
      [nom]
    );

    // Récupérer l'ID de la classe nouvellement créée
    const classe_id = resultClass.insertId;

    // Insertion montant lié à la classe avec classe_id
    await conn.query(
      `INSERT INTO montants_classes (classe_id, montant, annee_scolaire, statut_affectation) VALUES (?, ?, ?, ?)`,
      [classe_id, montant, annee_scolaire, statut_affectation]
    );

    await conn.commit();
    res.status(201).json({ message: 'Classe et montant ajoutés avec succès', classe_id });
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

// GET montants avec filtre année et statut_affectation (avec JOIN pour récupérer le nom de classe)
router.get('/montants', async (req, res) => {
  const { annee, statut } = req.query;
  const conn = await pool.getConnection();
  try {
    let query = `
      SELECT m.*, c.nom as classe_nom 
      FROM montants_classes m 
      JOIN classes c ON m.classe_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (annee) {
      query += ' AND m.annee_scolaire = ?';
      params.push(annee);
    }

    if (statut) {
      if (statut === 'affecté' || statut === 'non affecté') {
        query += ' AND m.statut_affectation = ?';
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

// POST un montant - Option avec nom de classe (comme dans votre schéma actuel)
router.post('/montants', async (req, res) => {
  console.log('--- POST /montants ---');
  console.log('Body reçu:', req.body);

  try {
    // 1️⃣ Validation avec Joi
    const { error, value } = montantAvecNomClasseSchema.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('Erreur validation Joi:', error.details.map(d => d.message));
      return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
    }

    const { classe, montant, annee_scolaire, statut_affectation } = value;
    console.log('Valeurs validées:', { classe, montant, annee_scolaire, statut_affectation });

    // 2️⃣ Connexion à la base
    const conn = await pool.getConnection();
    console.log('Connexion DB OK');

    try {
      // Récupérer l'ID de la classe à partir du nom
      const [classResult] = await conn.query('SELECT id FROM classes WHERE nom = ?', [classe]);
      if (classResult.length === 0) {
        return res.status(400).json({ error: 'Classe non trouvée.' });
      }

      const classe_id = classResult[0].id;
      console.log('Classe trouvée, ID:', classe_id);

      // 3️⃣ Insertion dans la table avec classe_id
      const [result] = await conn.query(
        `INSERT INTO montants_classes (classe_id, montant, annee_scolaire, statut_affectation) VALUES (?, ?, ?, ?)`,
        [classe_id, montant, annee_scolaire, statut_affectation]
      );

      console.log('Insertion réussie, ID:', result.insertId);
      res.status(201).json({ id: result.insertId, classe, classe_id, montant, annee_scolaire, statut_affectation });

    } catch (dbErr) {
      console.error('Erreur SQL:', dbErr);
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ce montant existe déjà pour cette classe et année scolaire.' });
      }
      res.status(500).json({ error: dbErr.message || 'Erreur serveur SQL' });
    } finally {
      conn.release();
      console.log('Connexion DB fermée');
    }

  } catch (err) {
    console.error('Erreur serveur générale:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur inconnue' });
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