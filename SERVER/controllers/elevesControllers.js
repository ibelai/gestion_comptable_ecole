const express = require('express');
const router = express.Router();
const db = require('../db'); // ta connexion MySQL

// Liste tous les élèves
router.get('/', async (req, res) => {
  try {
    const [eleves] = await db.query('SELECT * FROM eleves');
    res.json(eleves);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un élève
router.post('/', async (req, res) => {
  const { nom, prenom, date_naissance, classe, email, telephone } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO eleves (nom, prenom, date_naissance, classe, email, telephone) VALUES (?, ?, ?, ?, ?, ?)',
      [nom, prenom, date_naissance, classe, email, telephone]
    );
    res.status(201).json({ id: result.insertId, nom, prenom, date_naissance, classe, email, telephone });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier un élève
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, date_naissance, classe, email, telephone } = req.body;
  try {
    await db.query(
      'UPDATE eleves SET nom=?, prenom=?, date_naissance=?, classe=?, email=?, telephone=? WHERE id=?',
      [nom, prenom, date_naissance, classe, email, telephone, id]
    );
    res.json({ message: 'Élève modifié' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un élève
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM eleves WHERE id=?', [id]);
    res.json({ message: 'Élève supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
