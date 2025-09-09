import React, { useState, useEffect } from "react";
import axios from "axios";

const token = localStorage.getItem("token");
const api = axios.create({
  baseURL:   process.env.REACT_APP_API_URL || 'http://localhost:1000',
  headers: { Authorization: `Bearer ${token}` }
});

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [nom, setNom] = useState("");
  const [montant, setMontant] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState("");
  const [statutAffectation, setStatutAffectation] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Charger les classes
  const fetchClasses = async () => {
    try {
      const res = await api.get("/api/montants-classes");
      setClasses(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || "Erreur serveur");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Soumettre (Créer ou Modifier)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom || !montant || !anneeScolaire || !statutAffectation) {
      alert("Tous les champs sont requis");
      return;
    }

    try {
      if (editingId) {
        // Modifier
        await api.put(`/montants-classes/${editingId}`, {
          nom,
          montant: Number(montant),
          annee_scolaire: anneeScolaire,
          statut_affectation: statutAffectation
        });
        setEditingId(null);
      } else {
        // Créer
        await api.post("/montants-classes", {
          nom,
          montant: Number(montant),
          annee_scolaire: anneeScolaire,
          statut_affectation: statutAffectation
        });
      }
      // Reset formulaire
      setNom("");
      setMontant("");
      setAnneeScolaire("");
      setStatutAffectation("");
      fetchClasses();
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      alert(err.response?.data?.message || "Erreur serveur");
    }
  };

  // Pré-remplir pour édition
  const handleEdit = (classe) => {
    setEditingId(classe.id);
    setNom(classe.classe || classe.nom); // selon ton backend
    setMontant(classe.montant);
    setAnneeScolaire(classe.annee_scolaire);
    setStatutAffectation(classe.statut_affectation);
  };

  // Supprimer
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette classe ?")) return;
    try {
      await api.delete(`/montants-classes/${id}`);
      fetchClasses();
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      alert(err.response?.data?.message || "Erreur serveur");
    }
  };

  return (
    <div className="container mt-4">
      <h3>{editingId ? "Modifier une classe" : "Créer une classe"}</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Nom :</label>
          <input
            className="form-control"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Montant :</label>
          <input
            type="number"
            className="form-control"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Année scolaire :</label>
          <input
            className="form-control"
            value={anneeScolaire}
            onChange={(e) => setAnneeScolaire(e.target.value)}
            placeholder="Ex: 2024-2025"
          />
        </div>

        <div className="mb-3">
          <label>Statut d'affectation :</label>
          <select
            className="form-control"
            value={statutAffectation}
            onChange={(e) => setStatutAffectation(e.target.value)}
          >
            <option value="">-- Sélectionner --</option>
            <option value="Affecté">Affecté</option>
            <option value="Non affecté">Non affecté</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          {editingId ? "Modifier" : "Créer"}
        </button>
      </form>

      <h4 className="mt-5">Liste des classes</h4>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Montant</th>
            <th>Année scolaire</th>
            <th>Statut affectation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((classe) => (
            <tr key={classe.id}>
              <td>{classe.classe || classe.nom}</td>
              <td>{classe.montant}</td>
              <td>{classe.annee_scolaire}</td>
              <td>{classe.statut_affectation}</td>
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
    </div>
  );
};

export default ClassesPage;
