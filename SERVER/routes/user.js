const express = require("express");
const multer = require("multer");
const path = require("path");
 // adapte selon ton chemin
const router = express.Router();

// Middleware auth (à adapter selon ton code)
const authMiddleware = (req, res, next) => {
  // Exemple : récupérer l'user via token
  // Ici, tu dois parser le JWT et set req.user
  // Je pars sur une version simplifiée, à adapter !
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token invalide" });
  }
};

// Config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.post("/profile/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier envoyé" });

  try {
    const avatarUrl = `/uploads/${req.file.filename}`;

    await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });

    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
