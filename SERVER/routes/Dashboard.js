const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken,authorizeRoles} = require("../middleware/authMiddleware");

// Middleware pour vérifier un rôle précis


/** 📊 Dashboard Admin : Vue globale */
router.get("/admin", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const [[{ totalEleves }]] = await pool.query("SELECT COUNT(*) AS totalEleves FROM eleves");
    const [[{ totalComptables }]] = await pool.query("SELECT COUNT(*) AS totalComptables FROM users WHERE role = 'comptable'");
    const [[{ totalClasses }]] = await pool.query("SELECT COUNT(*) AS totalClasses FROM classes");
    const [[{ totalFrais }]] = await pool.query("SELECT COUNT(*) AS totalFrais FROM montants_classes");

    res.json({
      totalEleves,
      totalComptables,
      totalClasses,
      totalFrais,
    });
  } catch (error) {
    console.error("Erreur dashboard admin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/** 💰 Dashboard Comptable : Vue financière */
router.get("/comptable", verifyToken, authorizeRoles("comptable"), async (req, res) => {
  try {
    const [[{ totalEleves }]] = await pool.query("SELECT COUNT(*) AS totalEleves FROM eleves");
    const [[{ totalPaye }]] = await pool.query("SELECT SUM(montant_paye) AS totalPaye FROM paiements");
   const [[{ totalAttendu }]] = await pool.query(`
  SELECT SUM(f.montant) AS totalAttendu
FROM eleves e
JOIN classes c ON e.classe_id = c.id
JOIN montants_classes f ON f.classe = c.nom

`);


    const soldeRestant = (totalAttendu || 0) - (totalPaye || 0);

    res.json({
      totalEleves,
      totalAttendu: totalAttendu || 0,
      totalPaye: totalPaye || 0,
      soldeRestant,
    });
  } catch (error) {
    console.error("Erreur dashboard comptable:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
