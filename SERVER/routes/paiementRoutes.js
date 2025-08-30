const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Middleware global d'authentification
router.use(verifyToken);

/**
 * Générer un reçu PDF côté serveur
 */
function genererRecuPDF(paiement) {
  const doc = new PDFDocument();
  const uploadDir = path.join(__dirname, "../uploads/recus");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const fichier = path.join(uploadDir, `recu_${paiement.id}.pdf`);

  doc.pipe(fs.createWriteStream(fichier));
  
  doc.fontSize(16).text('Reçu de paiement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Élève: ${paiement.nom} ${paiement.prenom}`);
  doc.text(`Classe: ${paiement.classe_nom}`);
  doc.text(`Montant payé: ${paiement.montant_paye} FCFA`);
  doc.text(`Date: ${paiement.date_paiement}`);
  doc.text(`Mode de paiement: ${paiement.mode_paiement || 'N/A'}`);
  doc.text(`Année scolaire: ${paiement.annee_scolaire}`);
  doc.text(`Trimestre: ${paiement.trimestre || 'N/A'}`);
  
  doc.end();
  return `/uploads/recus/recu_${paiement.id}.pdf`;
}

/**
 * Ajouter un paiement
 */
router.post("/", authorizeRoles("admin", "comptable"), async (req, res) => {
  try {
    console.log("=== [Paiement] Début enregistrement ===");
    console.log("Données reçues:", req.body);

    const { eleve_id, montant_paye, annee_scolaire, mode_paiement } = req.body;

    // 🔎 Validation des champs
    if (!eleve_id || !montant_paye || !annee_scolaire) {
      return res.status(400).json({
        message: "Champs obligatoires manquants",
        required: ["eleve_id", "montant_paye", "annee_scolaire"]
      });
    }

    // 🔎 Vérifier que l'élève existe
    const [[eleve]] = await db.query(
      "SELECT e.id, e.classe_id, e.nom, e.prenom, c.nom AS classe_nom " +
      "FROM eleves e JOIN classes c ON e.classe_id = c.id WHERE e.id = ?", 
      [eleve_id]
    );
    if (!eleve) {
      return res.status(404).json({ message: "Élève introuvable" });
    }

    // 🔎 Vérifier montant défini pour cette classe/année
    const [[montantRow]] = await db.query(
      "SELECT montant FROM montants_classes WHERE classe_id = ? AND annee_scolaire = ?",
      [eleve.classe_id, annee_scolaire]
    );
    if (!montantRow) {
      return res.status(400).json({
        message: `Aucun montant défini pour la classe ${eleve.classe_id} en ${annee_scolaire}`
      });
    }

    const montantClasse = montantRow.montant;

    // 🔎 Vérifier le total déjà payé
    const [[{ total_paye }]] = await db.query(
      "SELECT IFNULL(SUM(montant_paye),0) AS total_paye FROM paiements WHERE eleve_id = ? AND annee_scolaire = ?",
      [eleve_id, annee_scolaire]
    );
    const reste_a_payer = montantClasse - total_paye;

    if (montant_paye > reste_a_payer) {
      return res.status(400).json({ message: "Le paiement dépasse le montant restant à payer" });
    }

    // 💡 Calcul automatique frais scolaires & droits examen
    let montantFraisScolaire = 17500; // Exemple : montant fixe
    let montantDroitsExamen = 0;

    if (eleve.classe_nom === "3ème" || eleve.classe_id === 3) {
      montantDroitsExamen = 3000;
    } else if (eleve.classe_nom === "Terminale") {
      montantDroitsExamen = 6000;
    }

    // Valeurs initiales payées (0 si premier paiement)
    const montantFraisScolairePaye = 0;
    const montantDroitsExamenPaye = 0;
    const montantClassePaye = total_paye + montant_paye;

    // 💾 Insertion du paiement
   const [result] = await db.query(
  `INSERT INTO paiements 
   (eleve_id, montant_paye, date_paiement, annee_scolaire, mode_paiement, 
    frais_scolaire_du, frais_scolaire_paye, 
    frais_classe_du, frais_classe_paye, 
    droit_examen_du, droit_examen_paye) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    eleve_id,
    montant_paye,
    new Date().toISOString().split("T")[0], // 📌 ici on ajoute la date
    annee_scolaire,
    mode_paiement || "espèces",
    montantFraisScolaire,
    montantFraisScolairePaye,
    montantClasse,
    montantClassePaye,
    montantDroitsExamen,
    montantDroitsExamenPaye
  ]
);


    // 🔖 Génération du reçu PDF
    const paiement = {
      id: result.insertId,
      nom: eleve.nom,
      prenom: eleve.prenom,
      classe_nom: eleve.classe_nom,
      montant_paye,
      date_paiement: new Date().toISOString().split("T")[0],
      mode_paiement: mode_paiement || "espèces",
      annee_scolaire
    };
    const lienRecu = genererRecuPDF(paiement);

    console.log("✔ Paiement enregistré avec ID:", result.insertId);

    res.status(201).json({
      message: "Paiement enregistré avec succès",
      paiement,
      recu: lienRecu
    });

  } catch (err) {
    console.error("=== [Paiement] ERREUR ===", err);
    res.status(500).json({
      message: "Erreur serveur lors de l’enregistrement du paiement.",
      error: err.message
    });
  }
});
module.exports = router;
