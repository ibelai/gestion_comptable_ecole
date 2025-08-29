// middleware/auth.js
const jwt = require("jsonwebtoken");

// ✅ Enhanced middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token manquant", error: "MISSING_TOKEN" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Format de token invalide", error: "INVALID_TOKEN_FORMAT" });
  }

  const token = authHeader.split(" ")[1]; // Utiliser authHeader ici
  if (!token) {
    return res.status(401).json({ message: "Token manquant après 'Bearer'", error: "MISSING_TOKEN" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré", error: "INVALID_TOKEN" });
  }
};


// ✅ Enhanced middleware to authorize roles with better validation
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ 
        message: "Utilisateur non authentifié", 
        error: "USER_NOT_AUTHENTICATED" 
      });
    }

    const userRole = req.user.role;
    
    // Check if user has a role
    if (!userRole) {
      return res.status(403).json({ 
        message: "Rôle utilisateur non défini", 
        error: "USER_ROLE_UNDEFINED" 
      });
    }

    // Flatten the roles array (in case nested arrays are passed)
    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Accès interdit : rôle non autorisé", 
        error: "INSUFFICIENT_PERMISSIONS",
        userRole,
        allowedRoles 
      });
    }
    
    next();
  };
};

// ✅ Optional: Middleware to check if JWT_SECRET is configured
const checkJWTSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.error("⚠️  JWT_SECRET n'est pas défini dans les variables d'environnement");
    process.exit(1);
  }
};

// ✅ Optional: Middleware for optional authentication (won't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Continue without setting req.user
  }

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    console.log("Token invalide pour authentification optionnelle:", error.message);
  }
  
  next();
};

module.exports = {
  verifyToken,
  authorizeRoles,
  optionalAuth,
  checkJWTSecret,
};