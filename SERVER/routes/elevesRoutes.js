const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// ✅ Récupérer toutes les années scolaires distinctes
router.get('/annees-scolaires', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT DISTINCT annee_scolaire FROM montants_classes ORDER BY annee_scolaire DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération années scolaires :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des années scolaires.' });
  }
});

// ✅ Liste des élèves avec montants + filtres (classe, année scolaire, affectation)
router.get('/avec-montants', verifyToken, async (req, res) => {
  try {
    const { classe, annee_scolaire, statut_affectation } = req.query;

    let sql = `
      SELECT 
        e.id, e.nom, e.prenom, e.date_naissance, e.genre,
        e.statut_affectation, e.matricule, e.trimestre,
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

    const conditions = [];
    const params = [];

    if (classe) {
      conditions.push('c.nom = ?');
      params.push(classe);
    }
    if (statut_affectation) {
      conditions.push('e.statut_affectation = ?');
      params.push(statut_affectation);
    }
    if (annee_scolaire) {
      conditions.push('mc.annee_scolaire = ?');
      params.push(annee_scolaire);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += `
      GROUP BY e.id, e.nom, e.prenom, e.date_naissance, e.genre, e.statut_affectation,
               e.matricule, e.trimestre, c.nom, mc.montant, mc.annee_scolaire
      ORDER BY e.nom
    `;

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erreur liste élèves avec montants :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Récupérer la liste simple des élèves (sans montants)
router.get("/", verifyToken, async (req, res) => {
  try {
    const [eleves] = await db.execute(
      `SELECT e.id, e.nom, e.prenom, e.matricule, e.trimestre, c.nom AS classe
       FROM eleves e
       LEFT JOIN classes c ON e.classe_id = c.id`
    );
    res.json(eleves);
  } catch (err) {
    console.error("Erreur chargement élèves :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Récupérer le solde d'un élève (requête avec paramètre)
router.get('/:eleveId/solde', verifyToken, async (req, res) => {
  try {
    const { eleveId } = req.params;
    const { annee_scolaire } = req.query;

    if (!annee_scolaire) {
      return res.status(400).json({ message: "L'année scolaire est obligatoire." });
    }

    const [rows] = await db.execute(
      `SELECT 
         e.nom, e.prenom, c.nom AS classe_nom,
         mc.montant AS montant_du,
         COALESCE(SUM(p.montant_paye), 0) AS total_paye,
         (mc.montant - COALESCE(SUM(p.montant_paye), 0)) AS reste_a_payer
       FROM eleves e
       JOIN classes c ON e.classe_id = c.id
       JOIN montants_classes mc ON mc.classe = c.nom AND mc.annee_scolaire = ?
       LEFT JOIN paiements p ON p.eleve_id = e.id AND p.annee_scolaire = ?
       WHERE e.id = ?
       GROUP BY e.id, e.nom, e.prenom, c.nom, mc.montant`,
      [annee_scolaire, annee_scolaire, eleveId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Aucune donnée trouvée pour cet élève." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur récupération solde élève:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// ✅ Création d’un élève (avec vérification d’unicité par matricule)
router.post('/', verifyToken, authorizeRoles('admin', 'comptable'), async (req, res) => {
  try {
    const { nom, prenom, date_naissance, genre, statut_affectation, classe_id, trimestre, matricule } = req.body;

    if (!nom || !prenom || !classe_id || !trimestre || !matricule) {
      return res.status(400).json({ message: "Nom, prénom, classe, trimestre et matricule sont obligatoires." });
    }

    const [exist] = await db.execute(`SELECT id FROM eleves WHERE matricule = ?`, [matricule]);
    if (exist.length > 0) {
      return res.status(400).json({ message: "Un élève avec ce matricule existe déjà." });
    }

    const [result] = await db.execute(
      `INSERT INTO eleves (nom, prenom, date_naissance, genre, statut_affectation, classe_id, trimestre, matricule) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, date_naissance || null, genre || null, statut_affectation || null, classe_id, trimestre, matricule]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Erreur création élève :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de l\'élève.' });
  }
});
// ✅ Modifier un élève (admin ou comptable)
router.put('/:id', verifyToken, authorizeRoles('admin', 'comptable'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, date_naissance, genre, statut_affectation, classe_id, trimestre, matricule } = req.body;

    if (!nom || !prenom || !classe_id || !trimestre || !matricule) {
      return res.status(400).json({ message: "Nom, prénom, classe, trimestre et matricule sont obligatoires." });
    }

    // Vérifier si un autre élève a déjà ce matricule
    const [existing] = await db.execute(
      `SELECT id FROM eleves WHERE matricule = ? AND id != ?`,
      [matricule, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Un autre élève possède déjà ce matricule." });
    }

    const [result] = await db.execute(
      `UPDATE eleves
       SET nom = ?, prenom = ?, date_naissance = ?, genre = ?, statut_affectation = ?, classe_id = ?, trimestre = ?, matricule = ?
       WHERE id = ?`,
      [nom, prenom, date_naissance || null, genre || null, statut_affectation || null, classe_id, trimestre, matricule, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Élève non trouvé." });
    }

    res.json({ message: "Élève mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur mise à jour élève :", error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'élève." });
  }
});
// ✅ Supprimer un élève (admin uniquement)
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(`DELETE FROM eleves WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Élève non trouvé." });
    }

    res.json({ message: "Élève supprimé avec succès." });
  } catch (error) {
    console.error("Erreur suppression élève :", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'élève." });
  }
});

module.exports = router;
 