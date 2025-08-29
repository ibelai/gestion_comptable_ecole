import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FraisPage = () => {
  const [frais, setFrais] = useState([]);
  const [form, setForm] = useState({ type: '', montant: '', classe_id: '', annee_scolaire: '' });
  const [editId, setEditId] = useState(null);
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';
  useEffect(() => {
    fetchFrais();
  }, []);

  const fetchFrais = async () => {
    const res = await axios.get(`${API_URL}/api/frais`);
    setFrais(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`${API_URL}/api/frais/${editId}`, form);
    } else {
      await axios.post(`${API_URL}/api/frais`, form);
    }
    setForm({ type: '', montant: '', classe_id: '', annee_scolaire: '' });
    setEditId(null);
    fetchFrais();
  };

  const handleEdit = (frais) => {
    setForm(frais);
    setEditId(frais.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression ?')) {
      await axios.delete(`${API_URL}/api/frais/${id}`);
      fetchFrais();
    }
  };

  return (
    <div className="container mt-4">
      <h2>Gestion des Frais</h2>
      <form onSubmit={handleSubmit} className="mb-3">
        <input name="type" placeholder="Type" value={form.type} onChange={handleChange} className="form-control mb-2" required />
        <input name="montant" placeholder="Montant" value={form.montant} onChange={handleChange} className="form-control mb-2" required />
        <input name="classe_id" placeholder="Classe ID" value={form.classe_id} onChange={handleChange} className="form-control mb-2" required />
        <input name="annee_scolaire" placeholder="Année scolaire" value={form.annee_scolaire} onChange={handleChange} className="form-control mb-2" required />
        <button type="submit" className="btn btn-primary">{editId ? "Modifier" : "Ajouter"}</button>
      </form>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Type</th>
            <th>Montant</th>
            <th>Classe ID</th>
            <th>Année scolaire</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {frais.map((f) => (
            <tr key={f.id}>
              <td>{f.type}</td>
              <td>{f.montant}</td>
              <td>{f.classe_id}</td>
              <td>{f.annee_scolaire}</td>
              <td>
                <button onClick={() => handleEdit(f)} className="btn btn-warning btn-sm me-2">Modifier</button>
                <button onClick={() => handleDelete(f.id)} className="btn btn-danger btn-sm">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FraisPage;
