const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// GET profil
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("User dans req.user :", req.user);
    const [rows] = await pool.query(
      "SELECT id, nom, email, role, avatar FROM users WHERE id = ?",
      [req.user.id]
    );
    console.log("Résultat SQL:", rows);
    if (rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur dans GET /api/profil :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// PUT modifier profil
router.put("/", verifyToken, async (req, res) => {
  const { nom, email } = req.body;

  if (!nom || !email) {
    return res.status(400).json({ message: "Nom et email sont requis." });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Utilisateur non authentifié" });
  }

  try {
    await pool.query(
      "UPDATE users SET nom = ?, email = ? WHERE id = ?",
      [nom, email, req.user.id]
    );

    // Optionnel : renvoyer le profil mis à jour
    const [rows] = await pool.query(
      "SELECT id, nom, email, role, avatar FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({
      message: "Profil mis à jour avec succès",
      profil: rows[0],
    });
  } catch (err) {
    console.error("Erreur dans PUT /api/profil :", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
});

// PUT modifier mot de passe
router.put("/password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Les deux champs sont requis." });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Utilisateur non authentifié" });
  }

  try {
    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur dans PUT /api/profil/password :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST upload avatar
router.post("/avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier envoyé" });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Utilisateur non authentifié" });
  }

  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    await pool.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarUrl, req.user.id]);
    res.json({ avatarUrl });
  } catch (err) {
    console.error("Erreur dans POST /api/profil/avatar :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
