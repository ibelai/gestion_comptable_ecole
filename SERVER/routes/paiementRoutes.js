const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware global
router.use(verifyToken);

/**
 * Générer reçu PDF
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
  doc.text(`Mode de paiement: ${paiement.mode_paiement}`);
  doc.text(`Année scolaire: ${paiement.annee_scolaire}`);
  doc.text(`Trimestre: ${paiement.trimestre || 'N/A'}`);
  doc.end();

  return `/uploads/recus/recu_${paiement.id}.pdf`;
}

/**
 * Envoyer un email
 */
async function envoyerEmailParent(eleve, reste) {
  if (!eleve.parent_email) return;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
  });

  await transporter.sendMail({
    from: `"École ABC" <${process.env.MAIL_USER}>`,
    to: eleve.parent_email,
    subject: "Notification paiement scolaire",
    text: `Bonjour,

Il reste ${reste} FCFA à payer pour ${eleve.nom} ${eleve.prenom} 
(Classe: ${eleve.classe_nom}) pour l'année scolaire ${eleve.annee_scolaire}.

Merci de régulariser le paiement rapidement.

Cordialement,
École ABC`,
  });

  console.log("✉ Email envoyé au parent:", eleve.parent_email);
}

/**
 * Envoyer un SMS
 */
async function envoyerSMSParent(eleve, reste) {
  if (!eleve.parent_tel) return;

  await twilioClient.messages.create({
    body: `École ABC : Il reste ${reste} FCFA à payer pour ${eleve.nom} ${eleve.prenom} (${eleve.classe_nom}). Merci.`,
    from: process.env.TWILIO_PHONE,
    to: eleve.parent_tel
  });

  console.log("📱 SMS envoyé au parent:", eleve.parent_tel);
}

/**
 * Ajouter un paiement
 */
router.post("/", authorizeRoles("admin", "comptable"), async (req, res) => {
  try {
    console.log("=== [Paiement] Début enregistrement ===");
    const { eleve_id, montant_paye, annee_scolaire, mode_paiement, date_paiement, notify_email, notify_sms } = req.body;

    if (!eleve_id || !montant_paye || !annee_scolaire) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Récup élève
    const [[eleve]] = await db.query(
      "SELECT e.id, e.classe_id, e.nom, e.prenom, e.parent_email, e.parent_tel, c.nom AS classe_nom " +
      "FROM eleves e JOIN classes c ON e.classe_id = c.id WHERE e.id = ?", 
      [eleve_id]
    );
    if (!eleve) return res.status(404).json({ message: "Élève introuvable" });

    // Montant classe
    const [[montantRow]] = await db.query(
      "SELECT montant FROM montants_classes WHERE classe_id = ? AND annee_scolaire = ?",
      [eleve.classe_id, annee_scolaire]
    );
    if (!montantRow) {
      return res.status(400).json({ message: "Aucun montant défini pour la classe" });
    }
    const montantClasse = montantRow.montant;

    // Total payé
    const [[{ total_paye }]] = await db.query(
      "SELECT IFNULL(SUM(montant_paye),0) AS total_paye FROM paiements WHERE eleve_id = ? AND annee_scolaire = ?",
      [eleve_id, annee_scolaire]
    );
    const reste_a_payer = montantClasse - total_paye;
    if (montant_paye > reste_a_payer) {
      return res.status(400).json({ message: "Paiement dépasse le montant restant" });
    }

    // Frais fixes
    const montantFraisScolaire = 17500;
    const montantDroitsExamen = (eleve.classe_nom === "3ème" || eleve.classe_id === 3) ? 3000 : (eleve.classe_nom === "Terminale" ? 6000 : 0);

    // Insertion paiement
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
        date_paiement || new Date().toISOString().split("T")[0],
        annee_scolaire,
        mode_paiement || "Espèces",
        montantFraisScolaire,
        0,
        montantClasse,
        total_paye + montant_paye,
        montantDroitsExamen,
        0
      ]
    );

    // Générer reçu PDF
    const paiement = {
      id: result.insertId,
      nom: eleve.nom,
      prenom: eleve.prenom,
      classe_nom: eleve.classe_nom,
      montant_paye,
      date_paiement: date_paiement || new Date().toISOString().split("T")[0],
      mode_paiement: mode_paiement || "Espèces",
      annee_scolaire
    };
    const lienRecu = genererRecuPDF(paiement);

    // Notifier parents selon options
    const nouveau_reste = reste_a_payer - montant_paye;
    if (notify_email) await envoyerEmailParent({ ...eleve, annee_scolaire }, nouveau_reste);
    if (notify_sms) await envoyerSMSParent({ ...eleve, annee_scolaire }, nouveau_reste);

    res.status(201).json({
      message: "Paiement enregistré et notifications envoyées",
      paiement,
      recu: lienRecu
    });

  } catch (err) {
    console.error("=== [Paiement] ERREUR ===", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;
