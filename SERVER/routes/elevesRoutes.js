const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");


// =============================
// 📌 Lister les élèves avec montants
// =============================
router.get("/avec-montants", verifyToken, async (req, res) => {
  try {
    const { classe, annee_scolaire, statut_affectation } = req.query;

    let sql = `
      SELECT e.id, e.nom, e.prenom, e.matricule, e.trimestre,
             e.date_naissance, e.genre, e.statut_affectation,
             c.nom AS classe,
             mc.montant AS montant_total,
             COALESCE(SUM(p.montant_paye), 0) AS montant_paye,
             (mc.montant - COALESCE(SUM(p.montant_paye), 0)) AS montant_restant,
             mc.annee_scolaire
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      JOIN montants_classes mc 
        ON mc.classe_id = c.id 
       AND mc.annee_scolaire = e.annee_scolaire
       AND mc.statut_affectation = e.statut_affectation
      LEFT JOIN paiements p 
        ON p.eleve_id = e.id 
       AND p.annee_scolaire = e.annee_scolaire
      WHERE 1=1
    `;

    const params = [];
    if (classe) { sql += " AND c.nom = ?"; params.push(classe); }
    if (annee_scolaire) { sql += " AND mc.annee_scolaire = ?"; params.push(annee_scolaire); }
    if (statut_affectation) { sql += " AND e.statut_affectation = ?"; params.push(statut_affectation); }

    sql += `
      GROUP BY e.id, e.nom, e.prenom, e.matricule, e.trimestre,
               e.date_naissance, e.genre, e.statut_affectation,
               c.nom, mc.montant, mc.annee_scolaire
      ORDER BY e.nom
    `;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erreur lors de la récupération des élèves:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Vérification matricule unique
router.get("/check-matricule/:matricule", verifyToken, async (req, res) => {
  try {
    const { matricule } = req.params;
    const [existingEleve] = await db.query(
      "SELECT id FROM eleves WHERE LOWER(TRIM(matricule)) = ?",
      [matricule.trim().toLowerCase()]
    );
    res.json({ exists: existingEleve.length > 0 });
  } catch (err) {
    console.error("Erreur vérification matricule:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// =============================
// 📌 Années scolaires existantes
// =============================
router.get("/annees-scolaires", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT annee_scolaire 
      FROM montants_classes 
      ORDER BY annee_scolaire DESC
    `);
    res.json(rows.map(r => r.annee_scolaire));
  } catch (err) {
    console.error("Erreur chargement années:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


// =============================
// 📌 Solde d’un élève
// =============================
router.get("/:eleveId/solde", verifyToken, async (req, res) => {
  try {
    const { eleveId } = req.params;
    const { annee_scolaire } = req.query;
    if (!annee_scolaire) return res.status(400).json({ message: "Année scolaire requise" });

    // Infos élève
    const [[eleve]] = await db.query(`
      SELECT e.id, e.nom, e.prenom, e.classe_id, e.statut_affectation, c.nom AS classe_nom
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.id = ?
    `, [eleveId]);

    if (!eleve) return res.status(404).json({ message: "Élève introuvable" });

    // Montant dû
    const [[montantRow]] = await db.query(`
      SELECT montant 
      FROM montants_classes 
      WHERE classe_id = ? AND annee_scolaire = ? AND statut_affectation = ?
    `, [eleve.classe_id, annee_scolaire, eleve.statut_affectation]);

    if (!montantRow) {
      return res.status(400).json({ message: `Aucun montant défini pour ${eleve.classe_nom} (${eleve.statut_affectation}) en ${annee_scolaire}` });
    }

    // Total payé
    const [[{ total_paye }]] = await db.query(`
      SELECT IFNULL(SUM(montant_paye),0) AS total_paye
      FROM paiements
      WHERE eleve_id = ? AND annee_scolaire = ?
    `, [eleveId, annee_scolaire]);

    // Frais spécifiques
    const [paiementsSpecifiques] = await db.query(`
      SELECT description 
      FROM paiements
      WHERE eleve_id = ? AND annee_scolaire = ? 
        AND description IN ('Frais scolaires', 'Droit examen', 'Papiers/rames')
    `, [eleveId, annee_scolaire]);

    const dejaPayes = paiementsSpecifiques.map(p => p.description);

    res.json({
      eleveId,
      nom: eleve.nom,
      prenom: eleve.prenom,
      classe: eleve.classe_nom,
      statut_affectation: eleve.statut_affectation,
      annee_scolaire,
      montant_du: montantRow.montant,
      total_paye,
      reste_a_payer: montantRow.montant - total_paye,
      frais_scolaires: dejaPayes.includes("Frais scolaires"),
      droit_examen: dejaPayes.includes("Droit examen"),
      papiers: dejaPayes.includes("Papiers/rames")
    });

  } catch (err) {
    console.error("Erreur lors de la récupération du solde:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


// =============================
// 📌 Création d’un élève
// =============================
// =============================
// 📌 Création d’un élève
// =============================
// Dans votre route POST /api/eleves, modifiez cette partie :

// =============================
// 📌 Création d’un élève
// =============================
router.post("/", verifyToken, authorizeRoles("admin", "comptable"), async (req, res) => {
  try {
    const {
      nom,
      prenom,
      date_naissance,
      genre,
      statut_affectation,
      classe_id,
      trimestre,
      matricule,
      annee_scolaire
    } = req.body;

    // Vérification des champs obligatoires
    if (!nom || !prenom || !classe_id || !trimestre || !matricule || !annee_scolaire) {
      return res.status(400).json({ 
        message: "Champs obligatoires manquants", 
        required: ["nom", "prenom", "classe_id", "trimestre", "annee_scolaire", "matricule"]
      });
    }

    // 🔥 Fonction pour convertir le trimestre
    const convertirTrimestre = (t) => {
      if (typeof t === 'number') return t;
      switch(t.toString().toUpperCase()) {
        case "T1": return 1;
        case "T2": return 2;
        case "T3": return 3;
        default: return parseInt(t) || 1;
      }
    };

    // 🔥 Vérification matricule unique (trim + lowercase)
    const matriculeNettoye = matricule.trim().toLowerCase();
    console.log("Vérification matricule :", matriculeNettoye);

    const [existingEleve] = await db.query(
      "SELECT id FROM eleves WHERE LOWER(TRIM(matricule)) = ?",
      [matriculeNettoye]
    );

    if (existingEleve.length > 0) {
      return res.status(400).json({ message: "Matricule déjà existant" });
    }

    // Vérification classe
    const [existingClasse] = await db.query("SELECT id FROM classes WHERE id = ?", [classe_id]);
    if (existingClasse.length === 0) {
      return res.status(400).json({ message: "Classe introuvable" });
    }

    // Insertion élève
    const [result] = await db.query(`
      INSERT INTO eleves 
      (nom, prenom, date_naissance, genre, statut_affectation, classe_id, trimestre, matricule, annee_scolaire)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nom.trim(),
      prenom.trim(),
      date_naissance || null,
      genre || null,
      statut_affectation || "affecté",
      parseInt(classe_id),
      convertirTrimestre(trimestre),
      matricule.trim(),
      annee_scolaire.trim()
    ]);

    // 🔥 Récupérer l'élève complet
    const [[newEleve]] = await db.query(`
      SELECT e.id, e.nom, e.prenom, e.matricule, e.date_naissance, e.genre,
             e.trimestre, e.statut_affectation, e.annee_scolaire,
             c.nom AS classe
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.id = ?
    `, [result.insertId]);

    res.status(201).json(newEleve);

  } catch (err) {
    console.error("Erreur création élève:", err);
    res.status(500).json({ message: "Erreur lors de la création de l'élève", error: err.message });
  }
});


// =============================
// 📌 Suppression d’un élève
// =============================
router.delete("/:id", verifyToken, authorizeRoles("admin","comptable"), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifie si l'élève existe
    const [rows] = await db.query("SELECT * FROM eleves WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Élève introuvable" });
    }

    // Supprime l'élève
    await db.query("DELETE FROM eleves WHERE id = ?", [id]);

    res.json({ message: "Élève supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression élève:", err);
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
});


module.exports = router;
