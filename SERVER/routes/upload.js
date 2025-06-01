const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Config multer pour dossier uploads et nom fichier unique
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // dossier uploads à la racine du serveur
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + "-" + Date.now() + ext;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Route POST upload avatar
router.post("/avatar", upload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier reçu" });
  }
  // Renvoie le chemin relatif pour sauvegarder dans la BDD
  res.json({ avatarUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;
