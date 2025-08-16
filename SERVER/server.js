// Charger les variables d'environnement
require("dotenv").config();
const path = require('path');
const express = require("express");
const cors = require("cors");

// Récupération des variables d'environnement
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const jwtSecret = process.env.JWT_SECRET;



// Initialisation d'Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dossiers statiques pour les uploads
app.use("/uploads", express.static("uploads"));
app.use('/uploads/recus', express.static('uploads/recus'));

// Routes
const authRoutes = require("./routes/authRoutes");
const profilRoute = require("./routes/profile");
const uploadRouter = require("./routes/upload");
const userRoutes = require("./routes/userRoutes");
const elevesRoutes = require('./routes/elevesRoutes');
const changerMotdePase = require('./routes/changerMotDePasse');
const classesRoutes = require('./routes/classeRoutes');
const registerRoute = require("./routes/registerRoutes");
const paiementsRoutes = require("./routes/paiementRoutes");
const MontantClasse = require("./routes/montant_classeRoutes");
const Dashboard = require("./routes/Dashboard");
const userRouter = require("./routes/user");

// Définition des routes
app.use('/api/eleves', elevesRoutes);
app.use('/api/montants-classes', MontantClasse);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profil", profilRoute);
app.use('/api/classes', classesRoutes);
app.use("/api", uploadRouter);
app.use("/api/usersRegister", registerRoute);
app.use("/api/user", userRouter);
app.use("/api/motPasse", changerMotdePase);
app.use("/api/paiements", paiementsRoutes);
app.use("/api/dashboard", Dashboard);

// Démarrer le serveur Express
const port = process.env.PORT || 1000
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
