import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PaiementForm() {
  const [paiements, setPaiements] = useState([]);
  const [filters, setFilters] = useState({
    classe_id: "",
    eleve_id: "",
    trimestre: "",
    annee_scolaire: "",
  });
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';
  const fetchPaiements = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/paiements`, { params: filters });
      setPaiements(res.data);
    } catch (err) {
      console.error("Erreur chargement paiements", err);
    }
  };

  useEffect(() => {
    fetchPaiements();
  }, [filters]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Liste des paiements</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <input name="classe_id" value={filters.classe_id} onChange={handleChange} className="form-control" placeholder="ID classe" />
        </div>
        <div className="col-md-3">
          <input name="eleve_id" value={filters.eleve_id} onChange={handleChange} className="form-control" placeholder="ID élève" />
        </div>
        <div className="col-md-3">
          <input name="trimestre" value={filters.trimestre} onChange={handleChange} className="form-control" placeholder="Trimestre (1, 2, 3)" />
        </div>
        <div className="col-md-3">
          <input name="annee_scolaire" value={filters.annee_scolaire} onChange={handleChange} className="form-control" placeholder="Année scolaire" />
        </div>
      </div>

      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Élève</th>
            <th>Date</th>
            <th>Montant payé</th>
            <th>Mode</th>
            <th>Reçu</th>
          </tr>
        </thead>
        <tbody>
          {paiements.map((p) => (
            <tr key={p.id}>
              <td>{p.nom} {p.prenom}</td>
              <td>{p.date_paiement}</td>
              <td>{p.montant_paye} €</td>
              <td>{p.mode_paiement}</td>
              <td>
                {p.recu ? (
                  <a href={`/uploads/recus/${p.recu}`} target="_blank" rel="noopener noreferrer">
                    Voir reçu
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
