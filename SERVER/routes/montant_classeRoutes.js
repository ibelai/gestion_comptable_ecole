const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const { montantSchema, montantUpdateSchema } = require("../validation/montantsSchema");

// Lister tous les montants (optionnel par année ou statut)
router.get("/", verifyToken, async (req, res) => {
  const { annee_scolaire, statut_affectation } = req.query;
  try {
    let sql = "SELECT * FROM montants_classes WHERE 1=1";
    const params = [];
    if (annee_scolaire) { sql += " AND annee_scolaire = ?"; params.push(annee_scolaire); }
    if (statut_affectation) { sql += " AND statut_affectation = ?"; params.push(statut_affectation); }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter un montant
// POST /api/montants-classes
// POST /api/montants-classes
router.post("/", async (req, res) => {
  try {
    const { nom, montant, annee_scolaire, statut_affectation } = req.body;

    if (!nom || !montant || !annee_scolaire || !statut_affectation) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    // Vérifier si la classe existe déjà
    const [classeExist] = await db.query("SELECT * FROM classes WHERE nom = ?", [nom]);
    let classeId;
    if (classeExist.length > 0) {
      classeId = classeExist[0].id;
    } else {
      const [resClasse] = await db.query("INSERT INTO classes (nom) VALUES (?)", [nom]);
      classeId = resClasse.insertId;
    }

    // Ajouter le montant lié à cette classe
    await db.query(
      "INSERT INTO montants_classes (classe_id, classe, montant, annee_scolaire, statut_affectation) VALUES (?, ?, ?, ?, ?)",
      [classeId, nom, montant, annee_scolaire, statut_affectation]
    );

    res.status(201).json({ message: "Classe et montant ajoutés avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier un montant
// Modifier un montant
router.put("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { nom, montant, annee_scolaire, statut_affectation } = req.body;
    const { id } = req.params;

    if (!nom || !montant || !annee_scolaire || !statut_affectation) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const [result] = await db.query(
      "UPDATE montants_classes SET classe = ?, montant = ?, annee_scolaire = ?, statut_affectation = ? WHERE id = ?",
      [nom, montant, annee_scolaire, statut_affectation, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Montant non trouvé" });

    res.json({ id, nom, montant, annee_scolaire, statut_affectation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// Supprimer un montant
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM montants_classes WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Montant non trouvé" });
    res.json({ message: "Montant supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
