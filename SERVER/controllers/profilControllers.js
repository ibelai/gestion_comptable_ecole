

exports.getProfile = async (req, res) => {
  try {
    // On récupère l'utilisateur par son id stocké dans req.user par le middleware
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "email", "role", "avatar"], // champs à renvoyer
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
