// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const {verifyToken,authorizeRoles} = require("../middleware/authMiddleware");

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

router.post(
  "/register",
  verifyToken,
  authorizeRoles("admin"),
  upload.single("avatar"),
  async (req, res) => {
    const { email, mot_de_passe, nom, role } = req.body;
    const avatar = req.file ? req.file.filename : null;

    if (!email || !mot_de_passe || !nom || !role) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    if (!["admin", "comptable"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    try {
      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (rows.length > 0) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }

      const hashedPassword = await bcrypt.hash(mot_de_passe, 10); // 🔒
      await db.query(
        "INSERT INTO users (email, nom, mot_de_passe, role, avatar) VALUES (?, ?, ?, ?, ?)",
        [email, nom, hashedPassword, role, avatar]
      );

      res.status(201).json({ message: "Utilisateur créé" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

module.exports = router;
