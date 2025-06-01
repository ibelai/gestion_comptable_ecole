const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Vérification des données reçues
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const user = rows[0];

    // Comparaison mot de passe
    const isValid = await bcrypt.compare(password, user.mot_de_passe
);
    if (!isValid) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Création du token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
