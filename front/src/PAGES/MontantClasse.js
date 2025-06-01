import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/classes';

function GestionClassesMontants() {
  const [form, setForm] = useState({
    nom: '',
    montant: '',
    annee_scolaire: ''
  });
  const [montants, setMontants] = useState([]);
  const [anneeFilter, setAnneeFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newMontant, setNewMontant] = useState('');

  const fetchMontants = async () => {
    try {
      const response = await axios.get(`${API_URL}/montants`, {
        params: anneeFilter ? { annee: anneeFilter } : {}
      });
      setMontants(response.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des montants");
    }
  };

  useEffect(() => {
    fetchMontants();
  }, [anneeFilter]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/avec-montant`, form);
      alert("Classe et montant ajoutés !");
      setForm({ nom: '', montant: '', annee_scolaire: '' });
      fetchMontants();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await axios.delete(`${API_URL}/montants/${id}`);
      fetchMontants();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleEdit = (id, montant) => {
    setEditingId(id);
    setNewMontant(montant);
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/montants/${id}`, { montant: newMontant });
      setEditingId(null);
      fetchMontants();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Ajouter une classe avec son montant</h3>
      <form className="row g-3 mb-4" onSubmit={handleCreate}>
        <div className="col-md-4">
          <input
            type="text"
            name="nom"
            placeholder="Nom de la classe"
            className="form-control"
            value={form.nom}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            type="number"
            name="montant"
            placeholder="Montant"
            className="form-control"
            value={form.montant}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            name="annee_scolaire"
            placeholder="Année scolaire (ex: 2024-2025)"
            className="form-control"
            value={form.annee_scolaire}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-2">
          <button type="submit" className="btn btn-success w-100">Ajouter</button>
        </div>
      </form>

      <div className="mb-3">
        <label className="form-label">Filtrer par année scolaire :</label>
        <input
          type="text"
          className="form-control"
          placeholder="2024-2025"
          value={anneeFilter}
          onChange={(e) => setAnneeFilter(e.target.value)}
        />
      </div>

      <h5>Liste des classes avec montants</h5>
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Classe</th>
            <th>Montant</th>
            <th>Année scolaire</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {montants.map((m) => (
            <tr key={m.id}>
              <td>{m.classe}</td>
              <td>
                {editingId === m.id ? (
                  <input
                    type="number"
                    className="form-control"
                    value={newMontant}
                    onChange={(e) => setNewMontant(e.target.value)}
                  />
                ) : (
                  `${m.montant} FCFA`
                )}
              </td>
              <td>{m.annee_scolaire}</td>
              <td>
                {editingId === m.id ? (
                  <>
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => handleUpdate(m.id)}
                    >
                      Sauvegarder
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => handleEdit(m.id, m.montant)}
                    >
                      Modifier
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(m.id)}
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {montants.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-muted">Aucun montant trouvé</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GestionClassesMontants;
