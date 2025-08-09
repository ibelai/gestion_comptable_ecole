import React from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import {
  FaUserGraduate,
  FaMoneyBillWave,
  FaList,
  FaHistory,
  FaChalkboardTeacher,
  FaTachometerAlt,
  FaUserPlus,
} from "react-icons/fa";

const Sidebar = ({ role }) => {
  const location = useLocation();
 console.log("🎯 Rôle reçu dans Sidebar :", role);
const commonLinks = [
  { path: "/tableau-de-bord", label: "Tableau de bord", icon: <FaTachometerAlt /> },
  { path: "/eleves", label: "Gestion des élèves", icon: <FaUserGraduate /> },
  { path: "/paiements", label: "Paiements", icon: <FaMoneyBillWave /> },
  { path: "/listeEleve", label: "Liste des élèves", icon: <FaList /> },
  
  
   
 
 
  
];



  // Liens supplémentaires pour admin
 const adminLinks = [
  { path: "/classes", label: "Gestion des classes", icon: <FaChalkboardTeacher /> },
  { path: "/classesMontant", label: "Gestion des Montant Des Classes", icon: <FaChalkboardTeacher /> },
 
  { path: "/register", label: "Ajouter un utilisateur", icon: <FaUserPlus /> },
];



 const linksToShow = role === "admin"
  ? [...commonLinks, ...adminLinks]
  : commonLinks;


  return (
    <div
      className="sidebar"
      style={{
        width: "220px",
        height: "100vh",
        position: "fixed",
        top: "56px", // hauteur navbar
        left: 0,
        backgroundColor: "#343a40",
        paddingTop: "20px",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <Nav className="flex-column">
        {linksToShow.map(({ path, label, icon }) => (
          <Nav.Item key={path}>
            <Nav.Link
              as={Link}
              to={path}
              active={location.pathname === path}
              style={{
                color: "white",
                padding: "12px 20px",
                fontWeight: location.pathname === path ? "bold" : "normal",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {icon} {label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    </div>
  );
};

export default Sidebar;
