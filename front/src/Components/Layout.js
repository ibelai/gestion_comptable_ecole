import React from "react";
import {
  Navbar,
  Container,
  Nav,
  NavDropdown,
  Image
} from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import {
  FaUserGraduate,
  FaMoneyBillWave,
  FaList,
  FaChalkboardTeacher,
  FaTachometerAlt,
  FaUserPlus,
  FaUserCircle,
  FaKey,
  FaSignOutAlt
} from "react-icons/fa";

const FullNavbar = ({ role, user, onLogout }) => {
  const location = useLocation();

  const avatarUrl = user?.avatar
    ? `http://localhost:5000/uploads/avatars/${user.avatar}`
    : "/default-avatar.png";

  const commonLinks = [
    { path: "/tableau-de-bord", label: "Tableau de bord", icon: <FaTachometerAlt /> },
    { path: "/eleves", label: "Gestion des élèves", icon: <FaUserGraduate /> },
    { path: "/listeEleve", label: "Liste des élèves", icon: <FaList /> },
  ];

  const adminLinks = [
    { path: "/classes", label: "Gestion des classes", icon: <FaChalkboardTeacher /> },
    { path: "/classesMontant", label: "Montants des classes", icon: <FaMoneyBillWave /> },
    { path: "/register", label: "Ajouter un utilisateur", icon: <FaUserPlus /> },
  ];

  const linksToShow = role === "admin"
    ? [...commonLinks, ...adminLinks]
    : commonLinks;

  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="shadow">
      <Container fluid>
        {/* Logo / Nom */}
        <Navbar.Brand as={Link} to="/">Gestion Comptable École</Navbar.Brand>

        {/* Bouton menu pour mobile */}
        <Navbar.Toggle aria-controls="main-navbar" />

        {/* Contenu navbar */}
        <Navbar.Collapse id="main-navbar">
          {/* Liens à gauche */}
          <Nav className="me-auto">
            {linksToShow.map(({ path, label, icon }) => (
              <Nav.Link
                as={Link}
                to={path}
                key={path}
                active={location.pathname === path}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                {icon} {label}
              </Nav.Link>
            ))}
          </Nav>

          {/* Menu utilisateur à droite */}
          {user && (
            <Nav>
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
                <NavDropdown.Item as={Link} to="/mon-profil">
                  <FaUserCircle className="me-2" /> Mon profil
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/changer-mot-de-passe">
                  <FaKey className="me-2" /> Changer mot de passe
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={onLogout}>
                  <FaSignOutAlt className="me-2" /> Déconnexion
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default FullNavbar;
