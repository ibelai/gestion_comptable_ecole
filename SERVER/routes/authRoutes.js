const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

router.post("/login", async (req, res) => {
  console.log("=== DÉBUT LOGIN ===");
  console.log("Body reçu:", req.body);
  
  const { email, password } = req.body;

  // Vérification des données reçues
  if (!email || !password) {
    console.log("Données manquantes");
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  try {
    console.log("Tentative de connexion DB pour:", email);
    
    // Test de connexion DB
    console.log("Variables d'env DB:", {
      host: process.env.DB_HOST ? 'OK' : 'MANQUANT',
      user: process.env.DB_USER ? 'OK' : 'MANQUANT',
      password: process.env.DB_PASSWORD ? 'OK' : 'MANQUANT',
      database: process.env.DB_NAME ? 'OK' : 'MANQUANT',
      jwt: process.env.JWT_SECRET ? 'OK' : 'MANQUANT'
    });

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    console.log("Résultat DB:", rows.length, "utilisateur(s) trouvé(s)");

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const user = rows[0];
    console.log("Utilisateur trouvé:", { id: user.id, email: user.email });

    // Comparaison mot de passe
    const isValid = await bcrypt.compare(password, user.mot_de_passe);
    console.log("Mot de passe valide:", isValid);
    
    if (!isValid) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Création du token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Token créé avec succès");
    console.log("=== FIN LOGIN SUCCÈS ===");

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
    console.error("=== ERREUR LOGIN ===");
    console.error("Type d'erreur:", err.name);
    console.error("Message d'erreur:", err.message);
    console.error("Stack trace:", err.stack);
    console.error("=== FIN ERREUR ===");
    res.status(500).json({ message: "Erreur serveur" });
  }
});
module.exports = router;
