const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// 📊 Dashboard Admin : Vue globale
/** 📊 Dashboard Admin avec vue financière */
router.get("/admin", verifyToken, authorizeRoles("admin","comptable"), async (req, res) => {
  try {
    // Nombre total d'élèves, comptables et classes
    const [[{ totalEleves }]] = await pool.query("SELECT COUNT(*) AS totalEleves FROM eleves");
    const [[{ totalComptables }]] = await pool.query("SELECT COUNT(*) AS totalComptables FROM users WHERE role = 'comptable'");
    const [[{ totalClasses }]] = await pool.query("SELECT COUNT(*) AS totalClasses FROM classes");

    // Total des frais configurés pour toutes les classes
    const [[{ totalFrais }]] = await pool.query("SELECT SUM(montant) AS totalFrais FROM montants_classes");

    // Total payé par les élèves
    const [[{ totalPaye }]] = await pool.query("SELECT SUM(montant_paye) AS totalPaye FROM paiements");

    // Total attendu pour tous les élèves
    const [[{ totalAttendu }]] = await pool.query(`
      SELECT SUM(f.montant) AS totalAttendu
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      JOIN montants_classes f ON f.classe = c.nom
    `);

    const soldeRestant = (totalAttendu || 0) - (totalPaye || 0);

    res.json({
      totalEleves,
      totalComptables,
      totalClasses,
      totalFrais: totalFrais || 0,
      totalAttendu: totalAttendu || 0,
      totalPaye: totalPaye || 0,
      soldeRestant,
    });
  } catch (error) {
    console.error("Erreur dashboard admin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
