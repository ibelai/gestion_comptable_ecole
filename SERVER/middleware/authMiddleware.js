// middleware/auth.js
const jwt = require("jsonwebtoken");

// ✅ Middleware pour vérifier le token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "votre_cle_secrete");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide" });
  }
};

// ✅ Middleware pour autoriser un ou plusieurs rôles
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Accès interdit : rôle non autorisé" });
    }
    next();
  };
};

// ✅ Export des deux fonctions
module.exports = {
  verifyToken,
  authorizeRoles,
};
