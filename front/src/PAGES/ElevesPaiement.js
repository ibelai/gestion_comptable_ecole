import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ElevesPaiements() {
  const [eleves, setEleves] = useState([]);
     const API_URL = process.env.REACT_APP_API_URL;
  const [filtres, setFiltres] = useState({
    classe_id: '',
    annee_scolaire: '2024-2025',
    trimestre: '1er',
  });

  useEffect(() => {
    fetchElevesPaiements();
  }, [filtres]);

  async function fetchElevesPaiements() {
    try {
      const res = await axios.get(`${API_URL}/api/eleves/eleves-paiements`, { params: filtres });
      setEleves(res.data);
    } catch {
      alert('Erreur chargement données');
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFiltres(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="container mt-4">
      <h2>Élèves - Paiements</h2>

      {/* Filtres */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Classe</label>
          <select
            className="form-select"
            name="classe_id"
            value={filtres.classe_id}
            onChange={handleChange}
          >
            <option value="">Toutes les classes</option>
            {/* Remplacer par options dynamiques depuis API classes */}
            <option value="1">Classe 1</option>
            <option value="2">Classe 2</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Année scolaire</label>
          <input
            type="text"
            className="form-control"
            name="annee_scolaire"
            value={filtres.annee_scolaire}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Trimestre</label>
          <select
            className="form-select"
            name="trimestre"
            value={filtres.trimestre}
            onChange={handleChange}
          >
            <option value="1er">1er</option>
            <option value="2e">2e</option>
            <option value="3e">3e</option>
            <option value="">Annuel</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <table className="table table-bordered table-striped">
        <thead className="table-dark">
          <tr>
            <th>Élève</th>
            <th>Classe</th>
            <th>Montant dû (€)</th>
            <th>Montant payé (€)</th>
            <th>Montant restant (€)</th>
          </tr>
        </thead>
        <tbody>
          {eleves.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">Aucun élève trouvé</td>
            </tr>
          ) : (
            eleves.map(e => (
              <tr key={e.eleve_id}>
                <td>{e.eleve_nom}</td>
                <td>{e.classe_nom}</td>
                <td>{e.montant_du?.toFixed(2) ?? '0.00'}</td>
                <td>{e.montant_paye?.toFixed(2) ?? '0.00'}</td>
                <td>{e.montant_restant?.toFixed(2) ?? '0.00'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
