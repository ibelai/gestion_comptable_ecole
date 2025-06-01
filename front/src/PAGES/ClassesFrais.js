import React, { useState } from 'react';
import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = 'http://localhost:5000/api';

function AjoutClasseAvecMontant() {
  const [form, setForm] = useState({
    nom: '',
    montant: '',
    annee_scolaire: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/classes/avec-montant`, form);
      alert("Classe et montant ajoutés !");
      setForm({ nom: '', montant: '', annee_scolaire: '' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Ajouter une classe avec son montant</h3>
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Nom de la classe</label>
          <input
            type="text"
            className="form-control"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Montant</label>
          <input
            type="number"
            className="form-control"
            name="montant"
            value={form.montant}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Année scolaire</label>
          <input
            type="text"
            className="form-control"
            name="annee_scolaire"
            value={form.annee_scolaire}
            onChange={handleChange}
            placeholder="ex: 2024-2025"
            required
          />
        </div>

        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-success w-100">Ajouter</button>
        </div>
      </form>
    </div>
  );
}

export default AjoutClasseAvecMontant;
