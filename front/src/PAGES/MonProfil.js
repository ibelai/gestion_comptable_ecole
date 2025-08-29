import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Spinner, Alert } from "react-bootstrap";

const MonProfil = () => {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const API_URL = process.env.REACT_APP_API_URL  ;
  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Vous devez être connecté");
          setLoading(false);
          return;
        }
        const res = await axios.get(`${API_URL}/api/profil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfil(res.data);
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError("Erreur lors du chargement du profil");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, []);

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!profil) {
    return null; // ou un message "Aucun profil trouvé"
  }

  return (
    <Container style={{ maxWidth: 600 }} className="mt-4">
      <h2 className="mb-4">Mon Profil</h2>
      <Card>
        <Card.Body className="text-center">
          {profil.avatar ? (
            <img
              src={`${API_URL}/uploads/avatars/${profil.avatar}`} 
              alt={`Avatar de ${profil.nom}`}
              style={{ width: 100, borderRadius: "50%", marginBottom: 20 }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                marginBottom: 20,
                backgroundColor: "#ddd",
                display: "inline-block",
              }}
              aria-label="Pas d'avatar"
            />
          )}
          <Card.Text>
            <strong>Nom :</strong> {profil.nom}
          </Card.Text>
          <Card.Text>
            <strong>Email :</strong> {profil.email}
          </Card.Text>
          <Card.Text>
            <strong>Rôle :</strong> {profil.role}
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MonProfil;
