import React, { useEffect, useState } from "react";
import axios from "axios";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';
  const [form, setForm] = useState({
    id: null,
    nom: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Charger la liste des classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/classes`);
      setClasses(res.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des classes");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Gérer le formulaire
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Soumettre (ajout ou modif)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/classes/${form.id}`, form);
      } else {
        await axios.post(`${API_URL}/api/classes`, form);
      }
      setForm({ id: null, nom: "" });
      setIsEditing(false);
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde");
    }
  };

  // Editer une classe
  const handleEdit = (classe) => {
    setForm({
      id: classe.id,
      nom: classe.nom,
    });
    setIsEditing(true);
  };

  // Supprimer une classe
  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette classe ?")) {
      try {
        await axios.delete(`${API_URL}/api/classes/${id}`);
        fetchClasses();
      } catch {
        setError("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2>Gestion des classes</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-4 border p-3 rounded bg-light">
        <h5>{isEditing ? "Modifier une classe" : "Ajouter une classe"}</h5>
        <div className="mb-3">
          <label>Nom de la classe</label>
          <input
            type="text"
            name="nom"
            className="form-control"
            value={form.nom}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          {isEditing ? "Modifier" : "Ajouter"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => {
              setForm({ id: null, nom: "" });
              setIsEditing(false);
              setError("");
            }}
          >
            Annuler
          </button>
        )}
      </form>

      <h4>Liste des classes</h4>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Nom de la classe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center">
                  Aucune classe trouvée
                </td>
              </tr>
            )}
            {classes.map((classe) => (
              <tr key={classe.id}>
                <td>{classe.nom}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleEdit(classe)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(classe.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ClassesPage;
