const db = require("../config/db");

// Paiements par élève
exports.getPaiementsByEleve = async (req, res) => {
  try {
    const [paiements] = await db.execute(
      `SELECT * FROM paiements WHERE eleve_id = ? ORDER BY date_paiement DESC`,
      [req.params.id]
    );
    res.json(paiements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
