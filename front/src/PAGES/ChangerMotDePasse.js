import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Alert, Container, Spinner } from "react-bootstrap";

const ChangerMotDePasse = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("success");
  const [loading, setLoading] = useState(false);
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000'  ;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!currentPassword || !newPassword) {
      setMessage("Merci de remplir tous les champs.");
      setVariant("warning");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
     await axios.put(
  `${API_URL}/api/profil/password`,
  { currentPassword, newPassword },
  { headers: { Authorization: `Bearer ${token}` } }
);
      setMessage("Mot de passe mis à jour !");
      setVariant("success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors de la mise à jour du mot de passe");
      setVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ maxWidth: 600 }} className="mt-4">
      <h2 className="mb-4">Changer mon mot de passe</h2>
      {message && <Alert variant={variant}>{message}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formCurrentPassword">
          <Form.Label>Mot de passe actuel</Form.Label>
          <Form.Control
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formNewPassword">
          <Form.Label>Nouveau mot de passe</Form.Label>
          <Form.Control
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
          />
        </Form.Group>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              {" "}Chargement...
            </>
          ) : (
            "Changer le mot de passe"
          )}
        </Button>
      </Form>
    </Container>
  );
};

export default ChangerMotDePasse;
