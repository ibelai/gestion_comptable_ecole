import React, { useState } from "react";
import { Navbar, Container, Nav, NavDropdown, Image, Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import {
  FaUserGraduate,
  FaMoneyBillWave,
  FaList,
  FaChalkboardTeacher,
  FaTachometerAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaUserCircle,
  FaKey
} from "react-icons/fa";

const FullNavbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';
  const commonLinks = [
    { path: "/tableau-de-bord", label: "Tableau de bord", icon: <FaTachometerAlt /> },
    { path: "/eleves", label: "Gestion des élèves", icon: <FaUserGraduate /> },
    { path: "/listeEleve", label: "Liste des élèves", icon: <FaList /> }
  ];

  const avatarUrl = user?.avatar
    ? `${API_URL}/uploads/avatars/${user.avatar}`
    : "";

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      fixed="top"
      className="shadow"
      expanded={expanded}
    >
      <Container fluid>
        <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
         <img src="/logo.jpg" alt="logo" height="40" className="d-inline-block align-top"/>
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="navbar-nav"
          onClick={() => setExpanded(expanded ? false : true)}
        />

        <Navbar.Collapse id="navbar-nav">
          {/* Liens centrés */}
          <Nav className="mx-auto justify-content-center">
            {commonLinks.map(({ path, label, icon }) => (
              <Nav.Link
                as={Link}
                to={path}
                key={path}
                active={location.pathname === path}
                onClick={() => setExpanded(false)}
                style={{
                  fontWeight: location.pathname === path ? "bold" : "normal",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {icon} {label}
              </Nav.Link>
            ))}

            {(user?.role === "admin" || user?.role === "comptable") && (
              <NavDropdown
                title="Gestion"
                id="gestion-dropdown"
                menuVariant="dark"
                onClick={() => setExpanded(false)}
              >
                {user?.role === "admin" && (
                  <>
                   
                    <NavDropdown.Item as={Link} to="/classesMontant" onClick={() => setExpanded(false)}>
                      <FaMoneyBillWave className="me-2" /> Gestion des classes et des montants
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/register" onClick={() => setExpanded(false)}>
                      <FaUserPlus className="me-2" /> Ajouter un utilisateur
                    </NavDropdown.Item>
                  </>
                )}
              </NavDropdown>
            )}
          </Nav>

          {/* Profil utilisateur */}
          <Nav>
            {user ? (
              <NavDropdown
                title={
                  <span className="d-flex align-items-center">
                    <Image
                      src={avatarUrl}
                      roundedCircle
                      width="32"
                      height="32"
                      className="me-2"
                      alt="Profil"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    {user.nom ? `${user.nom} (${user.role})` : user.role}
                  </span>
                }
                id="user-dropdown"
                align="end"
                menuVariant="dark"
              >
                <NavDropdown.Item as={Link} to="/mon-profil" onClick={() => setExpanded(false)}>
                  <FaUserCircle className="me-2" /> Mon profil
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/changer-mot-de-passe" onClick={() => setExpanded(false)}>
                  <FaKey className="me-2" /> Changer mot de passe
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => { onLogout(); setExpanded(false); }}>
                  <FaSignOutAlt className="me-2" /> Déconnexion
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button variant="outline-light" onClick={() => { onLogout(); setExpanded(false); }}>
                <FaSignOutAlt className="me-2" /> Déconnexion
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default FullNavbar;
