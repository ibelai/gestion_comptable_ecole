



import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ElevesForm = () => {
  const [eleves, setEleves] = useState([]);
  const [classeFilter, setClasseFilter] = useState('');
  const [anneeFilter, setAnneeFilter] = useState('');

  const fetchEleves = () => {
    // Préparer params en n'envoyant que les filtres non vides
    const params = {};
    if (classeFilter.trim() !== '') params.classe = classeFilter.trim();
    if (anneeFilter.trim() !== '') params.annee_scolaire = anneeFilter.trim();

    axios.get('http://localhost:5000/api/eleves/avec-montants', { params })
      .then(res => setEleves(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchEleves();
  }, []); // Charge au démarrage sans filtres

  // Optionnel : calcul des totaux
const totalAPayer = eleves.reduce((sum, e) => sum + Number(e.montant_total || 0), 0);
const totalPaye = eleves.reduce((sum, e) => sum + Number(e.montant_paye || 0), 0);
const totalRestant = eleves.reduce((sum, e) => sum + Number(e.montant_restant || 0), 0);


  // Formatage date (exemple : YYYY-MM-DD → JJ/MM/YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="container mt-4">
      <h4>Liste des élèves inscrits</h4>

      <div className="row mb-3">
        <div className="col-md-4">
          <label htmlFor="classeFilter" className="form-label">Filtrer par classe</label>
          <input
            id="classeFilter"
            type="text"
            className="form-control"
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
            placeholder="Ex : 6ème A"
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="anneeFilter" className="form-label">Filtrer par année scolaire</label>
          <input
            id="anneeFilter"
            type="text"
            className="form-control"
            value={anneeFilter}
            onChange={(e) => setAnneeFilter(e.target.value)}
            placeholder="Ex : 2024-2025"
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={fetchEleves}>Rechercher</button>
        </div>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Naissance</th>
            <th>Genre</th>
            <th>Classe</th>
            <th>Année</th>
            <th>À payer</th>
            <th>Payé</th>
            <th>Restant</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map(e => (
            <tr key={e.id}>
              <td>{e.nom}</td>
              <td>{e.prenom}</td>
              <td>{formatDate(e.date_naissance)}</td>
              <td>{e.genre}</td>
              <td>{e.classe}</td>
              <td>{e.annee_scolaire}</td>
              <td><span className="badge bg-secondary">{e.montant_total} €</span></td>
              <td>
                <span className={`badge ${e.montant_paye > 0 ? 'bg-primary' : 'bg-light text-dark'}`}>
                  {e.montant_paye} €
                </span>
              </td>
              <td>
                <span className={`badge 
                  ${e.montant_restant === 0 
                    ? 'bg-success' 
                    : e.montant_restant < e.montant_total 
                      ? 'bg-warning text-dark' 
                      : 'bg-danger'}`}>
                  {e.montant_restant} €
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        {eleves.length > 0 && (
          <tfoot>
            <tr>
              <th colSpan="6" className="text-end">Totaux :</th>
            <span className="badge bg-secondary">{Number(totalAPayer).toFixed(2)} €</span>

              <th><span className="badge bg-primary">{totalPaye.toFixed(2)} €</span></th>
              <th><span className="badge bg-danger">{totalRestant.toFixed(2)} €</span></th>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default ElevesForm;
