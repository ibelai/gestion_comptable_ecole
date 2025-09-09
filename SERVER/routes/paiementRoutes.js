const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

/**
 * Ajouter un paiement - Version simplifiée sans notifications
 */
router.post("/",verifyToken, authorizeRoles("admin", "comptable"), async (req, res) => {
  console.log("=== [Paiement] Début enregistrement ===");
  console.log("Données reçues:", JSON.stringify(req.body, null, 2));

  try {
    const { 
      eleve_id, 
      montant_paye, 
      annee_scolaire, 
      mode_paiement, 
      date_paiement,
      trimestre,
      fraisScolaire,     // boolean
      droitsExamen,      // boolean  
      papiersRames       // boolean
    } = req.body;

    // ✅ Validation des champs obligatoires
    if (!eleve_id || montant_paye === undefined || montant_paye === null || !annee_scolaire) {
      console.log("❌ Validation échouée - Champs manquants");
      return res.status(400).json({ 
        message: "Champs obligatoires manquants (eleve_id, montant_paye, annee_scolaire)"
      });
    }

    const montantPayeNum = parseFloat(montant_paye);
    if (isNaN(montantPayeNum) || montantPayeNum <= 0) {
      console.log("❌ Montant invalide:", montant_paye);
      return res.status(400).json({ message: "Le montant payé doit être un nombre positif" });
    }

    console.log("✅ Validation initiale OK");

    // ✅ Récupération des informations élève
    const [eleveRows] = await db.query(
      `SELECT e.id, e.classe_id, e.nom, e.prenom, 
              c.nom AS classe_nom, e.statut_affectation
       FROM eleves e 
       JOIN classes c ON e.classe_id = c.id 
       WHERE e.id = ?`, 
      [eleve_id]
    );

    if (!eleveRows || eleveRows.length === 0) {
      console.log("❌ Élève non trouvé:", eleve_id);
      return res.status(404).json({ message: "Élève introuvable avec l'ID: " + eleve_id });
    }

    const eleve = eleveRows[0];
    console.log("✅ Élève trouvé:", {
      id: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      classe: eleve.classe_nom,
      statut: eleve.statut_affectation
    });

    // ✅ Normalisation du statut d'affectation
    let statutRecherche = eleve.statut_affectation;
    if (eleve.statut_affectation === 'affecté') statutRecherche = 'Affecté';
    if (eleve.statut_affectation === 'non affecté') statutRecherche = 'Non affecté';

    console.log("Statut pour recherche:", statutRecherche);

    // ✅ Récupération du montant de la classe
    let montantClasse = 0;
    const [montantRows] = await db.query(
      `SELECT montant FROM montants_classes 
       WHERE classe = ? AND annee_scolaire = ? AND statut_affectation = ?`,
      [eleve.classe_nom, annee_scolaire, statutRecherche]
    );

    if (!montantRows || montantRows.length === 0) {
      console.log("❌ Aucun montant trouvé, essai sans statut...");
      
      // Essayer sans le statut d'affectation
      const [montantRowsAlt] = await db.query(
        `SELECT montant FROM montants_classes WHERE classe = ? AND annee_scolaire = ? LIMIT 1`,
        [eleve.classe_nom, annee_scolaire]
      );

      if (!montantRowsAlt || montantRowsAlt.length === 0) {
        return res.status(400).json({ 
          message: `Aucun montant défini pour la classe ${eleve.classe_nom} pour l'année ${annee_scolaire}`
        });
      }
      
      montantClasse = parseFloat(montantRowsAlt[0].montant);
      console.log("⚠️ Utilisation montant sans statut:", montantClasse);
    } else {
      montantClasse = parseFloat(montantRows[0].montant);
      console.log("✅ Montant classe trouvé:", montantClasse);
    }

    if (isNaN(montantClasse) || montantClasse <= 0) {
      console.log("❌ Montant classe invalide");
      return res.status(500).json({ message: "Montant de classe invalide dans la base de données" });
    }

    // ✅ Calcul des paiements antérieurs
    const [paiementRows] = await db.query(
      `SELECT IFNULL(SUM(montant_paye), 0) AS total_paye 
       FROM paiements 
       WHERE eleve_id = ? AND annee_scolaire = ?`,
      [eleve_id, annee_scolaire]
    );

    const totalDejaPaye = parseFloat(paiementRows[0]?.total_paye || 0);
    const resteAPayerClasse = montantClasse - totalDejaPaye;

    console.log(`Calculs: Montant classe: ${montantClasse}, Déjà payé: ${totalDejaPaye}, Reste: ${resteAPayerClasse}`);

    // ✅ Validation du montant
    if (montantPayeNum > resteAPayerClasse) {
      console.log("❌ Paiement trop élevé");
      return res.status(400).json({ 
        message: `Le paiement de ${montantPayeNum} FCFA dépasse le montant restant de ${resteAPayerClasse} FCFA pour la classe`
      });
    }

    // ✅ Calcul des frais additionnels (pour information seulement)
    const montantFraisScolaire = fraisScolaire ? 17500 : 0;
    const montantDroitsExamen = droitsExamen ? (
      (eleve.classe_nom === "3ème" || eleve.classe_nom === "3EME") ? 3000 :
      (eleve.classe_nom === "Terminale" || eleve.classe_nom === "TERMINALE") ? 6000 : 0
    ) : 0;

    console.log("Frais additionnels:", { scolaire: montantFraisScolaire, examen: montantDroitsExamen });

    // ✅ Insertion du paiement (version simplifiée)
    const [result] = await db.query(
      `INSERT INTO paiements 
       (eleve_id, montant_paye, date_paiement, annee_scolaire, mode_paiement, trimestre,
        frais_scolaire_du, frais_scolaire_paye, 
        frais_classe_du, frais_classe_paye, 
        droit_examen_du, droit_examen_paye,
        papiers_rames) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eleve_id,
        montantPayeNum,
        date_paiement || new Date().toISOString().split("T")[0],
        annee_scolaire,
        mode_paiement || "Espèces",
        trimestre || null,
        17500,                          // Frais scolaires standard
        montantFraisScolaire,           // Montant payé pour frais scolaires
        montantClasse,                  // Montant dû pour la classe
        totalDejaPaye + montantPayeNum, // Total payé pour la classe (cumulé)
        montantDroitsExamen > 0 ? montantDroitsExamen : 0, // Montant dû examen
        montantDroitsExamen,            // Montant payé examen
        papiersRames ? 1 : 0
      ]
    );

    const paiementId = result.insertId;
    console.log("✅ Paiement inséré avec ID:", paiementId);

    // ✅ Génération du reçu (avec gestion d'erreur)
    let lienRecu = null;
    try {
      const paiementPourRecu = {
        id: paiementId,
        nom: eleve.nom,
        prenom: eleve.prenom,
        classe_nom: eleve.classe_nom,
        montant_paye: montantPayeNum,
        date_paiement: date_paiement || new Date().toISOString().split("T")[0],
        mode_paiement: mode_paiement || "Espèces",
        annee_scolaire,
        trimestre,
        fraisScolaire: montantFraisScolaire,
        droitsExamen: montantDroitsExamen,
        papiersRames
      };

      lienRecu = genererRecuPDF(paiementPourRecu);
      console.log("✅ Reçu généré:", lienRecu);
    } catch (pdfError) {
      console.error("⚠️ Erreur génération PDF (non bloquante):", pdfError.message);
    }

    // ✅ Réponse de succès
    const nouveauReste = resteAPayerClasse - montantPayeNum;
    console.log("✅ Paiement enregistré avec succès");
    
    res.status(201).json({
      message: "Paiement enregistré avec succès",
      paiement: {
        id: paiementId,
        eleve_id,
        montant_paye: montantPayeNum,
        montant_classe: montantClasse,
        total_deja_paye: totalDejaPaye + montantPayeNum,
        reste_a_payer: nouveauReste,
        frais_additionnels: {
          frais_scolaire: montantFraisScolaire,
          droits_examen: montantDroitsExamen,
          papiers_rames: papiersRames
        }
      },
      recu: lienRecu
    });

  } catch (globalError) {
    console.error("=== [Paiement] ERREUR GLOBALE ===", globalError);
    console.error("Stack:", globalError.stack);
    
    res.status(500).json({ 
      message: "Erreur serveur lors de l'enregistrement du paiement", 
      error: process.env.NODE_ENV === 'development' ? globalError.message : "Erreur interne"
    });
  }
});
module.exports = router;
