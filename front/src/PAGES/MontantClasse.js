import React, { useState, useEffect } from "react";
import axios from "axios";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [montant, setMontant] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Charger les classes
  const fetchClasses = async () => {
    try {
      const res = await axios.get("https://gestion-comptable-ecole.onrender.com/api/classes");
      setClasses(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom || !niveau || montant === "") {
      alert("Tous les champs sont requis");
      return;
    }

    try {
      if (editingId) {
        // Modifier
        await axios.put(
          `https://gestion-comptable-ecole.onrender.com/api/classes/${editingId}`,
          { nom, niveau, montant: Number(montant) }
        );
        setEditingId(null);
      } else {
        // Créer
        await axios.post("https://gestion-comptable-ecole.onrender.com/api/classes", {
          nom,
          niveau,
          montant: Number(montant),
        });
      }
      setNom("");
      setNiveau("");
      setMontant("");
      fetchClasses();
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      alert(err.response?.data?.message || "Erreur serveur");
    }
  };

  const handleEdit = (classe) => {
    setEditingId(classe.id);
    setNom(classe.nom);
    setNiveau(classe.niveau);
    setMontant(classe.montant);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette classe ?")) return;
    try {
      await axios.delete(`https://gestion-comptable-ecole.onrender.com/api/classes/${id}`);
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
          <input className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div className="mb-3">
          <label>Niveau :</label>
          <input className="form-control" value={niveau} onChange={(e) => setNiveau(e.target.value)} />
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
        <button type="submit" className="btn btn-primary">
          {editingId ? "Modifier" : "Créer"}
        </button>
      </form>

      <h4 className="mt-5">Liste des classes</h4>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Niveau</th>
            <th>Montant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((classe) => (
            <tr key={classe.id}>
              <td>{classe.nom}</td>
              <td>{classe.niveau}</td>
              <td>{classe.montant}</td>
              <td>
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(classe)}>
                  Modifier
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(classe.id)}>
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
