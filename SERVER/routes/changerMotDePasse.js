// routes/profile.js (ou profilePassword.js si tu préfères)
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

router.put("/password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Les deux champs sont requis." });
  }

  try {
    // Récupérer le hash actuel
    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe actuel incorrect" });

    // Hash le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mise à jour dans la base
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
