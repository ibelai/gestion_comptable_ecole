import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TopNavbar from "./Components/TopNavbar";
import Sidebar from "./Components/Sidebar";
import ElevesList from "./PAGES/ElevesList";
import Login from "./PAGE DE CONNEXION/LoginPage";
import ClassesPages from "./PAGES/ClassesPages";
import Paiement from "./PAGES/Paiement";
import Dashboard from "./PAGES/Dashboard";
import RegisterUser from "./Components/RegisterUser";
import UserProfile from "./PAGES/UserProfil";
import ChangerMotDePasse from "./PAGES/ChangerMotDePasse";
import MonProfil from "./PAGES/MonProfil";
import LayoutNav from "./Components/LayoutNav";
import PrivateRoute from "./Components/PrivateRoutes";
import MontantsClasses from "./PAGES/MontantClasse";
import ClassesFrais from "./PAGES/ClassesFrais";

import ElevesForm from "./PAGES/ElevesForm";
import './styles/responsive.css';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const exp = decoded.exp * 1000;
        if (Date.now() > exp) {
          localStorage.clear();
          setUser(null);
        } else {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        }
      } catch (err) {
        localStorage.clear();
        setUser(null);
      }
    } else {
      // IMPORTANT : on précise que s'il n'y a pas de token ou user, on est déconnecté
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <>
          <LayoutNav user={user} onLogout={handleLogout} />
          <Sidebar role={user.role} />
          <main className="main-content">
            <Routes>
              <Route
                path="/"
                element={
                  isAdmin ? (
                    <Navigate to="/tableau-de-bord" />
                  ) : (
                    <Navigate to="/paiements" />
                  )
                }
              />

              <Route
                path="/mon-profil"
                element={
                  <PrivateRoute user={user}>
                    <MonProfil user={user} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/changer-mot-de-passe"
                element={
                  <PrivateRoute user={user}>
                    <ChangerMotDePasse />
                  </PrivateRoute>
                }
              />
              <Route
                path="/eleves"
                element={
                  <PrivateRoute user={user}>
                    <ElevesList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/paiements"
                element={
                  <PrivateRoute user={user}>
                    <Paiement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/listeEleve"
                element={
                  <PrivateRoute user={user}>
                    <ElevesForm />
                  </PrivateRoute>
                }
              />
             
              
              <Route
                path="/profil"
                element={
                  <PrivateRoute user={user}>
                    <UserProfile />
                  </PrivateRoute>
                }
              />

              {/* Routes réservées aux admins */}
              <Route
                path="/classes"
                element={
                  <PrivateRoute user={user} requiredRole="admin">
                    <ClassesFrais />
                  </PrivateRoute>
                }
              />
              <Route
                path="/classesMontant"
                element={
                  <PrivateRoute user={user} requiredRole="admin">
                    <MontantsClasses />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/tableau-de-bord"
                element={
                  <PrivateRoute user={user} requiredRole={["admin", "comptable"]}>
                    <Dashboard role={user.role} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PrivateRoute user={user} requiredRole="admin">
                    <RegisterUser />
                  </PrivateRoute>
                }
              />

              

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </>
      )}
    </>
  );
};

export default App;
