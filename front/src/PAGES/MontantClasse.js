import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function MontantsAdmin() {
  const token = localStorage.getItem('token');
  const [montants, setMontants] = useState([]);
  const [form, setForm] = useState({
    id: null,
    classe: '',
    annee_scolaire: '',
    statut_affectation: 'affecté', // valeur par défaut cohérente
    montant: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Charger la liste
  useEffect(() => {
    axios.get('http://localhost:5000/api/classes/montants', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMontants(res.data))
      .catch(err => console.error(err));
  }, [token]);

  // Handle input change
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Ajouter ou modifier
  const handleSubmit = e => {
    e.preventDefault();

    // Nettoyage et trim des valeurs string
    const dataToSend = {
      classe: form.classe.trim(),
      annee_scolaire: form.annee_scolaire.trim(),
      statut_affectation: form.statut_affectation.trim(),
      montant: Number(form.montant),
    };

    console.log("Valeur statut_affectation envoyée :", dataToSend.statut_affectation);

    if (isEditing) {
      axios.put(`http://localhost:5000/api/classes/montants/${form.id}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setMontants(montants.map(m => (m.id === form.id ? res.data : m)));
        setForm({ id: null, classe: '', annee_scolaire: '', statut_affectation: 'affecté', montant: '' });
        setIsEditing(false);
      }).catch(err => alert('Erreur modification'));
    } else {
      axios.post('http://localhost:5000/api/classes/montants', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setMontants([...montants, res.data]);
        setForm({ id: null, classe: '', annee_scolaire: '', statut_affectation: 'affecté', montant: '' });
      }).catch(err => {
        if (err.response && err.response.data && err.response.data.error) {
          alert('Erreur ajout: ' + err.response.data.error);
        } else {
          alert('Erreur ajout inconnue');
        }
      });
    }
  };

  // Modifier : remplir le formulaire
  const startEdit = m => {
    setForm({
      id: m.id,
      classe: m.classe || '',
      annee_scolaire: m.annee_scolaire || '',
      statut_affectation: m.statut_affectation || 'affecté',
      montant: m.montant.toString() || '',
    });
    setIsEditing(true);
  };

  // Supprimer
  const handleDelete = id => {
    if (window.confirm('Confirmer la suppression ?')) {
      axios.delete(`http://localhost:5000/api/classes/montants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        setMontants(montants.filter(m => m.id !== id));
      }).catch(() => alert('Erreur suppression'));
    }
  };

  return (
    <div className="container mt-4">
      <h3>Gestion des montants par classe</h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label>Classe</label>
            <input
              type="text"
              name="classe"
              className="form-control"
              value={form.classe}
              onChange={handleChange}
              required
              placeholder="Ex: 6e, 5e..."
            />
          </div>
          <div className="col-md-3">
            <label>Année scolaire</label>
            <input
              type="text"
              name="annee_scolaire"
              className="form-control"
              value={form.annee_scolaire}
              onChange={handleChange}
              required
              placeholder="2024-2025"
            />
          </div>
          <div className="col-md-3">
            <label>Statut d'affectation</label>
            <select
              name="statut_affectation"
              className="form-select"
              value={form.statut_affectation}
              onChange={handleChange}
              required
            >
              <option value="">--Choisir--</option>
              <option value="affecté">Affecté (État)</option>
              <option value="non affecté">Non Affecté</option>
            </select>
          </div>
          <div className="col-md-2">
            <label>Montant (FCFA)</label>
            <input
              type="number"
              name="montant"
              className="form-control"
              value={form.montant}
              onChange={handleChange}
              required
              min="0"
            />
          </div>
          <div className="col-md-1">
            <button type="submit" className="btn btn-success w-100">
              {isEditing ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </form>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Classe</th>
            <th>Année scolaire</th>
            <th>Statut affectation</th>
            <th>Montant (FCFA)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {montants.length > 0 ? montants.map(m => (
            <tr key={m.id}>
              <td>{m.classe}</td>
              <td>{m.annee_scolaire}</td>
              <td>{m.statut_affectation}</td>
              <td>{m.montant}</td>
              <td>
                <button className="btn btn-primary btn-sm me-2" onClick={() => startEdit(m)}>Modifier</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Supprimer</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="5" className="text-center">Aucun montant configuré</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
