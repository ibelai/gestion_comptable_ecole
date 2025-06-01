// backend/routes/eleves.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // module de connexion MySQL
const {verifyToken,  authorizeRoles} =require("../middleware/authMiddleware")


router.get("/", async (req, res) => {
  try {
    const [eleves] = await db.query(
      `SELECT e.id, e.nom, e.prenom, c.nom AS classe
       FROM eleves e
       LEFT JOIN classes c ON e.classe_id = c.id`
    );
    res.json(eleves);
  } catch (err) {
    console.error("Erreur chargement élèves :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nom, prenom, date_naissance, genre, classe_id } = req.body;
    if (!nom || !prenom || !classe_id) {
      return res.status(400).json({ message: "Nom, prénom et classe sont obligatoires." });
    }

    const [result] = await db.execute(
      'INSERT INTO eleves (nom, prenom, date_naissance, genre, classe_id) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, date_naissance || null, genre || null, classe_id]
    );

    // Retourner l'id créé pour la suite (paiement)
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de l\'élève.' });
  }
});
// backend/routes/eleves.js
router.get('/avec-montants', async (req, res) => {
  try {
    const { classe, annee_scolaire } = req.query;

    // Base de la requête avec jointures
    let sql = `
      SELECT 
        e.id,
        e.nom,
        e.prenom,
        e.date_naissance,
        e.genre,
        c.nom AS classe,
        mc.montant AS montant_total,
        COALESCE(SUM(p.montant_paye), 0) AS montant_paye,
        (mc.montant - COALESCE(SUM(p.montant_paye), 0)) AS montant_restant,
        mc.annee_scolaire
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      JOIN montants_classes mc ON mc.classe = c.nom
      LEFT JOIN paiements p ON e.id = p.eleve_id AND p.annee_scolaire = mc.annee_scolaire
    `;

    // Conditions dynamiques
    const conditions = [];
    const params = [];

    if (classe) {
      conditions.push('c.nom = ?');
      params.push(classe);
    }

    if (annee_scolaire) {
      conditions.push('mc.annee_scolaire = ?');
      params.push(annee_scolaire);
    }

    // Ajout des conditions WHERE si elles existent
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Ajout du GROUP BY et ORDER BY
    sql += `
      GROUP BY e.id, e.nom, e.prenom, e.date_naissance, e.genre, c.nom, mc.montant, mc.annee_scolaire
      ORDER BY e.nom
    `;

    // Exécution de la requête avec les params
    const [rows] = await db.execute(sql, params);

    res.json(rows);
  } catch (err) {
    console.error('Erreur liste élèves avec montants :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});


module.exports = router;
