import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNavbar from "./TopNavbar";
import { Container, Spinner } from "react-bootstrap";

const LayoutNav = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfil = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/profil", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement du profil", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <>
      <TopNavbar user={user} onLogout={handleLogout} />
      <div className="pt-5" style={{ paddingTop: "70px" }}>
        <Container>{children}</Container>
      </div>
    </>
  );
};

export default LayoutNav;
