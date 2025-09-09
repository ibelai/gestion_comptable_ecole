import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaiementSolde from './PaiementsSolde';
import "./eleveForm.css";

const ElevesForm = () => {
  const [eleves, setEleves] = useState([]);
  const [classeFilter, setClasseFilter] = useState('');
  const [anneeFilter, setAnneeFilter] = useState('');
  const [affectationFilter, setAffectationFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [eleveSelectionne, setEleveSelectionne] = useState(null);
  const [eleveAModifier, setEleveAModifier] = useState(null);
  const [formModif, setFormModif] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    genre: '',
    statut_affectation: '',
    classe_id: '',
    trimestre: '',
    matricule: '',
    annee_scolaire:''
  });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");




  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';

  // Récupérer élèves avec filtres
  const fetchEleves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (classeFilter) params.classe = classeFilter;
      if (anneeFilter) params.annee_scolaire = anneeFilter;
      if (affectationFilter) params.statut_affectation = affectationFilter;

      const res = await axios.get(`${API_URL}/api/eleves/avec-montants`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      // S'assurer que c'est bien un tableau
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.eleves) ? res.data.eleves : []);
      setEleves(data);

    } catch (err) {
      console.error('Erreur chargement élèves:', err);
      alert("Erreur lors du chargement des élèves.");
    } finally {
      setLoading(false);
    }
  };

 const fetchClasses = async () => {
  try {
    
    const res = await axios.get(`${API_URL}/api/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = Array.isArray(res.data) ? res.data : [];
    setClasses(data.map(c => ({
      id: c.classe_id || c.id,
      nom: c.nom
    })));
  } catch (err) {
    console.error('Erreur chargement classes:', err);
    alert("Erreur lors du chargement des classes.");
  }
};

const fetchAnnees = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/eleves/annees-scolaires`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (Array.isArray(res.data)) {
      // Si c’est déjà ["2023-2024", "2024-2025"]
      if (typeof res.data[0] === "string") {
        setAnnees(res.data);
      } else {
        // Si c’est [{annee_scolaire:"2024-2025"}]
        setAnnees(res.data.map(a => a.annee_scolaire));
      }
    }
  } catch (err) {
    console.error('Erreur chargement années:', err);
    alert("Erreur lors du chargement des années scolaires.");
  }
};
;

  

  useEffect(() => {
    fetchEleves();
    fetchClasses();
    fetchAnnees();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('fr-FR');
  };

  const ouvrirModification = (eleve) => {
    setEleveAModifier(eleve);
    setFormModif({
      nom: eleve.nom || '',
      prenom: eleve.prenom || '',
      date_naissance: eleve.date_naissance ? eleve.date_naissance.slice(0,10) : '',
      genre: eleve.genre || '',
      statut_affectation: eleve.statut_affectation || '',
      classe_id: eleve.classe_id || '',
      trimestre: eleve.trimestre || '',
      matricule: eleve.matricule || '',
      annee_scolaire:eleve.annee_scolaire || ''
    });
  };

  const fermerModification = () => setEleveAModifier(null);

  const handleChangeModif = (e) => {
    const { name, value } = e.target;
    setFormModif(prev => ({ ...prev, [name]: value }));
  };

  const mettreAJourEleve = async () => {
    try {
      await axios.put(`${API_URL}/api/eleves/${eleveAModifier.id}`, formModif, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Élève modifié avec succès !");
      fermerModification();
      fetchEleves();
    } catch (err) {
      console.error("Erreur mise à jour élève :", err);
      alert("Erreur lors de la modification.");
    }
  };

 const supprimerEleve = async (id) => {
  if (!window.confirm("Voulez-vous vraiment supprimer cet élève ?")) return;

  const token = localStorage.getItem("token"); // <-- récupère le token ici
  if (!token) {
    alert("Vous devez être connecté pour effectuer cette action !");
    return;
  }

  try {
    await axios.delete(`${API_URL}/api/eleves/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Élève supprimé avec succès !");
    fetchEleves(); // rafraîchit la liste
  } catch (err) {
    console.error("Erreur suppression élève :", err);
    alert("Erreur lors de la suppression.");
  }
};


  // Totaux sécurisés
  const totalAPayer = Array.isArray(eleves) ? eleves.reduce((sum, e) => sum + Number(e.montant_total || 0), 0) : 0;
  const totalPaye = Array.isArray(eleves) ? eleves.reduce((sum, e) => sum + Number(e.montant_paye || 0), 0) : 0;
  const totalRestant = Array.isArray(eleves) ? eleves.reduce((sum, e) => sum + Number(e.montant_restant || 0), 0) : 0;

  return (
    <div className="container-fluid mt-4 px-4">
      <h4 className="mb-4">Liste des élèves inscrits</h4>

      {/* Filtres */}
      <div className="row g-3 mb-3">
    <select className="form-select" value={classeFilter} onChange={(e) => setClasseFilter(e.target.value)}>
  <option value="">-- Toutes les classes --</option>
  {classes.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
</select>





        <div className="col-md-3">
          <label className="form-label">Année scolaire</label>
          <select className="form-select" value={anneeFilter} onChange={(e) => setAnneeFilter(e.target.value)}>
            <option value="">-- Toutes les années --</option>
           {annees.map((a, idx) => (
  <option key={`${a}-${idx}`} value={a}>{a}</option>
))}

          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Affectation</label>
          <select className="form-select" value={affectationFilter} onChange={(e) => setAffectationFilter(e.target.value)}>
            <option value="">-- Tous --</option>
            <option value="affecté">Affecté</option>
            <option value="non affecté">Non affecté</option>
          </select>
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={fetchEleves} disabled={loading}>
            {loading ? "Chargement..." : "Rechercher"}
          </button>
        </div>
      </div>

      {/* Tableau élèves */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Matricule</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Naissance</th>
              <th>Genre</th>
              <th>Affectation</th>
              <th>Classe</th>
              <th>Année</th>
              <th>Trimestre</th>
              <th>À payer</th>
              <th>Payé</th>
              <th>Restant</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {eleves.length === 0 && !loading ? (
              <tr><td colSpan="13" className="text-center">Aucun élève trouvé.</td></tr>
            ) : (
              eleves.map(e => (
                <tr key={e.id}>
                  <td>{e.matricule || '—'}</td>
                  <td>{e.nom}</td>
                  <td>{e.prenom}</td>
                  <td>{formatDate(e.date_naissance)}</td>
                  <td>{e.genre}</td>
                  <td>{e.statut_affectation || '—'}</td>
                  <td>{e.classe}</td>
                  <td>{e.annee_scolaire}</td>
                  <td>{e.trimestre || '—'}</td>
                  <td><span className="badge bg-secondary">{e.montant_total} FCFA</span></td>
                  <td><span className={`badge ${e.montant_paye > 0 ? 'bg-primary' : 'bg-light text-dark'}`}>{e.montant_paye} FCFA</span></td>
                  <td><span className={`badge ${e.montant_restant === 0 ? 'bg-success' : e.montant_restant < e.montant_total ? 'bg-warning text-dark' : 'bg-danger'}`}>{e.montant_restant} FCFA</span></td>
                  <td>
                    <div className="d-grid gap-2 d-md-flex">
                     <button
  className="btn btn-sm btn-outline-info w-100"
  onClick={() => {
    console.log("Eleve cliqué :", e);
    setEleveSelectionne(e);
  }}
>
  Paiement
</button>

<button className="btn btn-sm btn-outline-warning w-100" onClick={() => ouvrirModification(e)}>Modifier</button>
                      <button className="btn btn-sm btn-outline-danger w-100" onClick={() => supprimerEleve(e.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {eleves.length > 0 && (
            <tfoot>
              <tr>
                <th colSpan="9" className="text-end">Totaux :</th>
                <th><span className="badge bg-secondary">{totalAPayer.toFixed(2)} FCFA</span></th>
                <th><span className="badge bg-primary">{totalPaye.toFixed(2)} FCFA</span></th>
                <th><span className="badge bg-danger">{totalRestant.toFixed(2)} FCFA</span></th>
                <th></th>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal Paiement */}
     <PaiementSolde
  eleveId={eleveSelectionne?.id} // maintenant l'ID existe
  show={!!eleveSelectionne}
  onClose={() => { setEleveSelectionne(null); fetchEleves(); }}
/>


      {/* Modale modification */}
       {eleveAModifier && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modifier l'élève : {eleveAModifier.nom} {eleveAModifier.prenom}</h5>
                  <button type="button" className="btn-close" onClick={fermerModification}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={(e) => { e.preventDefault(); mettreAJourEleve(); }}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Nom</label>
                        <input type="text" name="nom" className="form-control" value={formModif.nom} onChange={handleChangeModif} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Prénom</label>
                        <input type="text" name="prenom" className="form-control" value={formModif.prenom} onChange={handleChangeModif} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Date de naissance</label>
                        <input type="date" name="date_naissance" className="form-control" value={formModif.date_naissance} onChange={handleChangeModif} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Genre</label>
                        <select name="genre" className="form-select" value={formModif.genre} onChange={handleChangeModif}>
                          <option value="">-- Sélectionner --</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Affectation</label>
                        <select name="statut_affectation" className="form-select" value={formModif.statut_affectation} onChange={handleChangeModif}>
                          <option value="">-- Sélectionner --</option>
                          <option value="affecté">Affecté</option>
                          <option value="non affecté">Non affecté</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Classe</label>
                       <select name="classe_id" className="form-select" value={formModif.classe_id} onChange={handleChangeModif} required>
  <option value="">-- Sélectionner --</option>
  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
</select>

                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Trimestre</label>
                        <select name="trimestre" className="form-select" value={formModif.trimestre} onChange={handleChangeModif} required>
                          <option value="">-- Sélectionner --</option>
                          <option value="1">1er trimestre</option>
                          <option value="2">2ème trimestre</option>
                          <option value="3">3ème trimestre</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Matricule</label>
                        <input type="text" name="matricule" className="form-control" value={formModif.matricule} onChange={handleChangeModif} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Année scolaire</label>
                        <select name="annee_scolaire" className="form-select" value={formModif.annee_scolaire} onChange={handleChangeModif} required>
                          <option value="">-- Sélectionner --</option>
                          {annees.map((a, idx) => (
                            <option key={`${a}-${idx}`} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer mt-3">
                      <button type="button" className="btn btn-secondary" onClick={fermerModification}>Annuler</button>
                      <button type="submit" className="btn btn-primary">Enregistrer</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default ElevesForm;
