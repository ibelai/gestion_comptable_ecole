const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Configuration multer pour stocker les reçus dans /uploads/recus
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/recus");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// Middleware d'authentification global sur toutes les routes
router.use(verifyToken);

/**
 * Ajouter un paiement (admin, comptable)
 * Accepte un fichier reçu (optionnel)
 */
router.post("/", authorizeRoles("admin", "comptable"), upload.single("recu"), async (req, res) => {
  try {
    const { eleve_id, date_paiement, montant_paye, mode_paiement, annee_scolaire, trimestre } = req.body;
    const recu = req.file ? req.file.filename : null;

    // Validation minimale
    if (!eleve_id || !date_paiement || !montant_paye || !annee_scolaire) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas fournis." });
    }

    const montant = parseFloat(montant_paye);
    if (isNaN(montant) || montant <= 0) {
      return res.status(400).json({ message: "Le montant payé doit être un nombre valide et positif." });
    }

    // Récupérer élève + classe
    const [[eleve]] = await db.execute(`
      SELECT e.id, c.nom AS classe_nom
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.id = ?
    `, [eleve_id]);
    if (!eleve) return res.status(404).json({ message: "Élève introuvable." });

    // Récupérer montant dû
    const [[montantRow]] = await db.execute(`
      SELECT montant FROM montants_classes
      WHERE classe = ? AND annee_scolaire = ?
    `, [eleve.classe_nom, annee_scolaire]);
    if (!montantRow) {
      return res.status(400).json({ message: `Aucun montant défini pour la classe ${eleve.classe_nom} en ${annee_scolaire}` });
    }
    const montant_du = parseFloat(montantRow.montant);

    // Somme des paiements déjà effectués
    const [[{ total_paye }]] = await db.execute(`
      SELECT IFNULL(SUM(montant_paye), 0) AS total_paye
      FROM paiements
      WHERE eleve_id = ? AND annee_scolaire = ?
    `, [eleve_id, annee_scolaire]);

    const totalVersements = parseFloat(total_paye) + montant;
    if (totalVersements > montant_du) {
      return res.status(400).json({
        message: `Paiement refusé : dépassement du montant dû (${montant_du} FCFA). Déjà payé : ${total_paye} FCFA.`,
      });
    }

    // Insertion paiement
    await db.execute(`
      INSERT INTO paiements (eleve_id, date_paiement, montant_paye, mode_paiement, recu, annee_scolaire, trimestre)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [eleve_id, date_paiement, montant, mode_paiement || null, recu, annee_scolaire, trimestre || null]);

    res.status(201).json({
      message: "Paiement enregistré avec succès.",
      recu: recu ? `/uploads/recus/${recu}` : null,
    });

  } catch (err) {
    console.error("Erreur ajout paiement:", err);
    res.status(500).json({ message: "Erreur serveur lors de l’enregistrement du paiement." });
  }
});

/**
 * Historique des paiements d’un élève
 */
router.get("/:id", async (req, res) => {
  try {
    const eleveId = req.params.id;
    const [paiements] = await db.execute(`
      SELECT p.*, e.nom, e.prenom 
      FROM paiements p 
      JOIN eleves e ON p.eleve_id = e.id
      WHERE p.eleve_id = ?
      ORDER BY p.date_paiement DESC
    `, [eleveId]);

    res.json(paiements);
  } catch (err) {
    console.error("Erreur historique paiements:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * Filtrage des paiements (par classe, trimestre, élève, année scolaire)
 */
router.get("/", async (req, res) => {
  try {
    const { classe_id, trimestre, eleve_id, annee_scolaire } = req.query;
    let sql = `
      SELECT p.*, e.nom, e.prenom 
      FROM paiements p 
      JOIN eleves e ON p.eleve_id = e.id 
      WHERE 1=1`;
    const params = [];

    if (classe_id) {
      sql += " AND e.classe_id = ?";
      params.push(classe_id);
    }
    if (trimestre) {
      sql += " AND p.trimestre = ?";
      params.push(trimestre);
    }
    if (eleve_id) {
      sql += " AND p.eleve_id = ?";
      params.push(eleve_id);
    }
    if (annee_scolaire) {
      sql += " AND p.annee_scolaire = ?";
      params.push(annee_scolaire);
    }

    sql += " ORDER BY p.date_paiement DESC";

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erreur filtrage paiements:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * Supprimer un paiement (admin uniquement)
 */
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const paiementId = req.params.id;

    const [[paiement]] = await db.execute(`SELECT * FROM paiements WHERE id = ?`, [paiementId]);

    if (!paiement) {
      return res.status(404).json({ message: "Paiement non trouvé." });
    }

    if (paiement.recu) {
      const filePath = path.join(__dirname, "../uploads/recus", paiement.recu);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.execute(`DELETE FROM paiements WHERE id = ?`, [paiementId]);
    res.json({ message: "Paiement supprimé avec succès." });
  } catch (err) {
    console.error("Erreur suppression paiement:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
});

/**
 * Solde d’un élève pour une année scolaire donnée
 */
router.get("/:id/solde", async (req, res) => {
  try {
    const eleveId = req.params.id;
    const anneeScolaire = req.query.annee_scolaire;

    if (!anneeScolaire) {
      return res.status(400).json({ message: "Le paramètre 'annee_scolaire' est requis." });
    }

    const [[eleve]] = await db.execute(`
      SELECT e.id, c.nom AS classe_nom
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.id = ?
    `, [eleveId]);
    if (!eleve) return res.status(404).json({ message: "Élève introuvable." });

    const [[montantRow]] = await db.execute(`
      SELECT montant FROM montants_classes
      WHERE classe = ? AND annee_scolaire = ?
    `, [eleve.classe_nom, anneeScolaire]);
    if (!montantRow) return res.status(400).json({ message: "Montant dû introuvable." });

    const montant_du = parseFloat(montantRow.montant);

    const [[{ total_paye }]] = await db.execute(`
      SELECT IFNULL(SUM(montant_paye), 0) AS total_paye
      FROM paiements
      WHERE eleve_id = ? AND annee_scolaire = ?
    `, [eleveId, anneeScolaire]);

    const reste_a_payer = montant_du - parseFloat(total_paye);

    res.json({ montant_du, total_paye, reste_a_payer });

  } catch (err) {
    console.error("Erreur solde élève:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;
