import React from 'react';
import {
  Navbar,
  Container,
  Nav,
  Button,
  NavDropdown,
  Image
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSignOutAlt, FaUserCircle, FaKey } from 'react-icons/fa';
import { useState } from 'react';

const TopNavbar = ({ onLogout, user }) => {


  
 const avatarUrl = user?.avatar
  ? `http://localhost:5000/uploads/avatars/${user.avatar}`
  : "/default-avatar.png";


  return (
    <Navbar bg="dark" variant="dark" fixed="top" className="shadow">
      <Container fluid>
        <Navbar.Brand href="#">Gestion Comptable École</Navbar.Brand>

        <Nav className="ms-auto d-flex align-items-center">
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
              <NavDropdown.Item as={Link} to="/mon-profil">
                <FaUserCircle className="me-2" />
                Mon profil
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/changer-mot-de-passe">
                <FaKey className="me-2" />
                Changer mot de passe
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onLogout}>
                <FaSignOutAlt className="me-2" />
                Déconnexion
              </NavDropdown.Item>
            </NavDropdown>
          ) : (
            <Button variant="outline-light" onClick={onLogout}>
              <FaSignOutAlt className="me-2" />
              Déconnexion
            </Button>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;
