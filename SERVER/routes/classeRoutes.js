const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Lister toutes les classes
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM classes ORDER BY nom");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Créer une classe
router.post("/", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { nom, affecte } = req.body;
  if (!nom || !affecte) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO classes (nom, affecte) VALUES (?, ?)",
      [nom, affecte]
    );
    res.status(201).json({ message: "Classe créée", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier une classe
router.put("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { nom, affecte } = req.body;
  if (!nom || !affecte) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }
  try {
    const [result] = await db.query(
      "UPDATE classes SET nom = ?, affecte = ? WHERE id = ?",
      [nom, affecte, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Classe non trouvée" });
    res.json({ message: "Classe modifiée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer une classe
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM classes WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Classe non trouvée" });
    res.json({ message: "Classe supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
