import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // ✅ user directement
      localStorage.setItem("role", user.role); // (optionnel si tu veux le garder)

      onLoginSuccess(user); // ✅ user directement

      // Redirection selon le rôle
      if (user.role === "admin") {
        navigate("/tableau-de-bord");
      } else if (user.role === "comptable") {
        navigate("/paiements");
      } else {
        navigate("/");
      }

    } catch (err) {
      if (!err.response) {
        setError("Impossible de contacter le serveur. Vérifiez que le backend est démarré.");
      } else {
        setError(err.response.data.message || "Erreur lors de la connexion");
      }
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Connexion</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email</label>
          <input type="email" className="form-control" value={email}
                 onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Mot de passe</label>
          <input type="password" className="form-control" value={password}
                 onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary w-100">Se connecter</button>
      </form>
    </div>
  );
}

export default Login;
