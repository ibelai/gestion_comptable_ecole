import { useState } from "react";
import axios from "axios";

function RegisterUser() {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("comptable");
  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("nom", nom);
     formData.append("mot_de_passe", password);
    formData.append("role", role);
    
    if (avatar) formData.append("avatar", avatar);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/users/register", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("✅ Utilisateur créé avec succès !");
      setEmail("");
      setNom("");
      setPassword("");
      setRole("comptable");
      setAvatar(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Erreur lors de la création.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Créer un utilisateur</h2>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label className="form-label">Nom</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nom complet"
            value={nom}
            required
            onChange={(e) => setNom(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="Adresse email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Mot de passe</label>
          <input
            type="password"
            className="form-control"
            placeholder="Mot de passe"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Rôle</label>
          <select
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="comptable">Comptable</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Photo (avatar)</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Créer l'utilisateur
        </button>
      </form>
    </div>
  );
}

export default RegisterUser;
