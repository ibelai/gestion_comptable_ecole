const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require("multer");
const path = require("path");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// 📦 Configuration de multer pour les reçus
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/recus");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

/** 📌 Ajouter un paiement */
router.post("/", verifyToken, authorizeRoles("comptable"), upload.single("recu"), async (req, res) => {
  const { eleve_id, date_paiement, montant_paye, mode_paiement, annee_scolaire } = req.body;
  const recu = req.file ? req.file.filename : null;

  try {
    await db.query(
      "INSERT INTO paiements (eleve_id, date_paiement, montant_paye, mode_paiement, recu, annee_scolaire) VALUES (?, ?, ?, ?, ?, ?)",
      [eleve_id, date_paiement, montant_paye, mode_paiement, recu, annee_scolaire]
    );
    res.status(201).json({ message: "Paiement enregistré avec succès" });
  } catch (err) {
    console.error("Erreur ajout paiement:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
/** 📄 Historique des paiements d’un élève */
router.get("/:id", verifyToken, async (req, res) => {
  const eleveId = req.params.id;
  try {
    const [paiements] = await db.query(
      "SELECT * FROM paiements WHERE eleve_id = ? ORDER BY date_paiement DESC",
      [eleveId]
    );
    res.json(paiements);
  } catch (err) {
    console.error("Erreur historique paiements:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/** 🔍 Filtrage des paiements */
router.get("/", verifyToken, async (req, res) => {
  const { classe_id, trimestre, eleve_id, annee_scolaire } = req.query;
  let sql = `SELECT p.*, e.nom, e.prenom FROM paiements p JOIN eleves e ON p.eleve_id = e.id WHERE 1=1`;
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

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erreur filtrage paiements:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
