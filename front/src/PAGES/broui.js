import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ElevesList() {
  const [etape, setEtape] = useState(1);
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';

  // Champs élève
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [genre, setGenre] = useState('');
  const [classeId, setClasseId] = useState('');
  const [statutAffectation, setStatutAffectation] = useState('Affecté');

  // Liste des élèves (local)
  const [eleves, setEleves] = useState([]);

  // Champs paiement
  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [trimestre, setTrimestre] = useState('');
  const [datePaiement, setDatePaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [montantPaye, setMontantPaye] = useState('');

  // Frais supplémentaires
  const [droitsExamen, setDroitsExamen] = useState(false);
  const [fraisScolaire, setFraisScolaire] = useState(false);
  const [papiersRames, setPapiersRames] = useState(false);

  // Données classes
  const [classes, setClasses] = useState([]);
  const [montantsClasses, setMontantsClasses] = useState([]);
  const [montantDuClasse, setMontantDuClasse] = useState(0);

  const classeIdNom = classes.find(c => c.id === parseInt(classeId))?.nom;
  const FRAIS_SCOLAIRE = 17500;
  const [matriculesExistants, setMatriculesExistants] = useState([]);

  // 🔹 Récupération des matricules existants
  useEffect(() => {
    const fetchMatricules = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/eleves`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const matrics = res.data.map(e => e.matricule.toLowerCase().trim());
        setMatriculesExistants(matrics);
      } catch (err) {
        console.error("Erreur récupération matricules:", err);
      }
    };
    fetchMatricules();
  }, [API_URL, token]);

  // 🔹 Récupération classes et montants
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resClasses, resMontants] = await Promise.all([
          axios.get(`${API_URL}/api/classes`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/montants-classes`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setClasses(resClasses.data);
        setMontantsClasses(resMontants.data);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      }
    };
    fetchData();
  }, []);

  // 🔹 Calcul montant de la classe
  useEffect(() => {
    if (!classeId || !anneeScolaire || !statutAffectation) {
      setMontantDuClasse(0);
      return;
    }
    const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom;
    const montant = montantsClasses.find(m =>
      m.classe === classeNom &&
      m.annee_scolaire === anneeScolaire &&
      m.statut_affectation === statutAffectation
    );
    setMontantDuClasse(
      montant ? parseInt(montant.montant.toString().replace(/\s/g, ''), 10) : 0
    );
  }, [classeId, anneeScolaire, statutAffectation, classes, montantsClasses]);

  // 🔹 Calcul droits examen
  const calculerDroitsExamen = (classeNom, droitsExamen) => {
    if (!droitsExamen) return 0;
    if (classeNom === "3ème" || classeNom === "3EME") return 3000;
    if (classeNom === "Terminale" || classeNom === "TERMINALE") return 6000;
    return 0;
  };

  // 🔹 Génération reçu PDF
  const genererRecu = (paiement) => {
    const doc = new jsPDF();
    const img = new Image();
    img.src = '/logo.jpg';
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("GROUPE SCOLAIRE LONNY-ROSE", 105, 20, null, null, 'center');
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Reçu de paiement", 105, 30, null, null, 'center');
      doc.text(`Matricule : ${paiement.matricule}`, 10, 50);
      doc.text(`Nom : ${paiement.nom} ${paiement.prenom}`, 10, 58);
      doc.text(`Classe : ${paiement.classe}`, 10, 66);
      doc.text(`Année scolaire : ${paiement.anneeScolaire}`, 10, 74);
      doc.text(`Trimestre : ${paiement.trimestre}`, 10, 82);
      doc.text(`Date du paiement : ${paiement.date}`, 10, 90);
      doc.text(`Reçu N° : ${paiement.numero}`, 10, 98);

      const tableBody = [
        ['Montant dû (classe)', `${montantDuClasse} FCFA`],
      ];
      if (fraisScolaire) tableBody.push(['Frais scolaires', `${FRAIS_SCOLAIRE} FCFA`]);
      if (droitsExamen && paiement.droitsExamen > 0) tableBody.push(['Droits d\'examen', `${paiement.droitsExamen} FCFA`]);
      tableBody.push(['Montant payé', `${paiement.totalPaye} FCFA`], ['Reste à payer', `${paiement.reste} FCFA`]);
      if (papiersRames) tableBody.push(['Papiers rames', 'Oui']);

      doc.autoTable({
        startY: 110,
        head: [['Description', 'Montant']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      });

      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text('Merci pour votre paiement.', 10, pageHeight - 20);
      doc.text('Signature:', 150, pageHeight - 20);
      doc.save(`recu-${paiement.matricule}-${paiement.numero}.pdf`);
    };
    img.onerror = () => alert("Erreur : impossible de charger le logo.");
  };

  // 🔹 Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Étape 1 : Infos élève
    if (etape === 1) {
      if (!matricule || !nom || !prenom || !classeId) {
        alert("Veuillez remplir les champs obligatoires");
        return;
      }

      // Vérification matricule frontend
      if (matriculesExistants.includes(matricule.trim().toLowerCase())) {
        alert(`Le matricule "${matricule}" existe déjà.`);
        return;
      }

      setEtape(2);
      return;
    }

    // --- Étape 2 : Infos paiement
    if (!datePaiement || !anneeScolaire || !modePaiement || !trimestre) {
      alert("Veuillez remplir tous les champs de paiement");
      return;
    }

    if (montantDuClasse <= 0) {
      alert(`Aucun montant configuré pour cette classe. Contactez l'administrateur.`);
      return;
    }

    const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom || '';
    const montantPayeNum = Number(montantPaye) || 0;

    if (montantPayeNum <= 0) {
      alert("Le montant payé doit être supérieur à 0");
      return;
    }

    const frais = fraisScolaire ? FRAIS_SCOLAIRE : 0;
    const droits = calculerDroitsExamen(classeNom, droitsExamen);
    const totalAPayer = montantDuClasse + frais + droits;

    if (montantPayeNum > totalAPayer) {
      alert(`Le montant payé (${montantPayeNum} FCFA) ne peut pas dépasser le total à payer (${totalAPayer} FCFA)`);
      return;
    }

    try {
      // 🔹 Création élève
      const eleveData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        matricule: matricule.trim(),
        classe_id: parseInt(classeId),
        statut_affectation: statutAffectation,
        date_naissance: dateNaissance || null,
        genre: genre || null,
        trimestre,
        annee_scolaire: anneeScolaire.trim()
      };

      const resEleve = await axios.post(`${API_URL}/api/eleves`, eleveData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEleves(prev => [...prev, resEleve.data]);
      setMatriculesExistants(prev => [...prev, matricule.trim().toLowerCase()]);

      // 🔹 Création paiement
      const paiementData = {
        eleve_id: resEleve.data.id,
        montant_paye: montantPayeNum,
        date_paiement: datePaiement,
        annee_scolaire: anneeScolaire.trim(),
        mode_paiement: modePaiement,
        trimestre,
        fraisScolaire,
        droitsExamen,
        papiersRames
      };

      await axios.post(`${API_URL}/api/paiements`, paiementData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🔹 Générer reçu
      genererRecu({
        matricule,
        nom,
        prenom,
        classe: classeNom,
        anneeScolaire,
        trimestre,
        totalPaye: montantPayeNum,
        reste: totalAPayer - montantPayeNum,
        droitsExamen: droits,
        fraisScolaire: frais,
        papiersRames,
        date: datePaiement,
        numero: `REC-${Date.now()}`
      });

      alert("Élève et paiement enregistrés avec succès");

      // 🔹 Reset complet
      setEtape(1);
      setMatricule(""); setNom(""); setPrenom(""); setDateNaissance(""); setGenre("");
      setClasseId(""); setStatutAffectation("Affecté"); setAnneeScolaire(""); setTrimestre("");
      setDatePaiement(""); setMontantPaye(""); setModePaiement(""); setDroitsExamen(false);
      setFraisScolaire(false); setPapiersRames(false);

    } catch (err) {
      if (err.response) {
        alert(err.response.data.message || `Erreur serveur (${err.response.status})`);
      } else {
        alert(`Erreur inconnue : ${err.message}`);
      }
    }
  };

  // 🔹 Render
  return (
    <div className="container-fluid mt-4 px-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4>Gestion des élèves & paiements (Étape {etape}/2)</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {etape === 1 && (
                           <>
                <div className="mb-3">
                  <label className="form-label">Matricule</label>
                  <input type="text" className="form-control" value={matricule} onChange={e => setMatricule(e.target.value)} required />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nom</label>
                    <input className="form-control" value={nom} onChange={e => setNom(e.target.value)} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Prénom</label>
                    <input className="form-control" value={prenom} onChange={e => setPrenom(e.target.value)} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Date de naissance</label>
                  <input type="date" className="form-control" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Genre</label>
                  <select className="form-select" value={genre} onChange={e => setGenre(e.target.value)}>
                    <option value="">--Choisir--</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              <div className="col-md-3 mb-3">
  <label className="form-label">Statut d'affectation</label>
  <select className="form-select" value={statutAffectation} onChange={e => setStatutAffectation(e.target.value)}>
    <option value="Affecté">Affecté</option>
    <option value="Non affecté">Non affecté</option>
  </select>
</div>
                <div className="mb-3">
                  <label className="form-label">Classe</label>
                  <select className="form-select" value={classeId} onChange={e => setClasseId(e.target.value)} required>
                    <option value="">--Choisir une classe--</option>
                    {classes.map(c => (<option key={c.id} value={c.id}>{c.nom}</option>))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Suivant →</button>
              </>
            )}

            

            {etape === 2 && (
               <>
    {/* Champs de paiement */}
    <div className="mb-3">
      <label className="form-label">Année scolaire</label>
      <input
        type="text"
        className="form-control"
        placeholder="2024-2025"
        value={anneeScolaire}
        onChange={e => setAnneeScolaire(e.target.value)}
        required
      />
    </div>

    <div className="mb-3">
      <label className="form-label">Trimestre</label>
      <select
        className="form-select"
        value={trimestre}
        onChange={e => setTrimestre(e.target.value)}
        required
      >
        <option value="">--Choisir un trimestre--</option>
        <option value="T1">Premier trimestre</option>
        <option value="T2">Deuxième trimestre</option>
        <option value="T3">Troisième trimestre</option>
      </select>
    </div>

    <div className="mb-3">
      <label className="form-label">Date de paiement</label>
      <input
        type="date"
        className="form-control"
        value={datePaiement}
        onChange={e => setDatePaiement(e.target.value)}
        required
      />
    </div>

    <div className="mb-3">
      <label className="form-label">Mode de paiement</label>
      <select
        className="form-select"
        value={modePaiement}
        onChange={e => setModePaiement(e.target.value)}
        required
      >
        <option value="">--Choisir un mode--</option>
        <option value="Espèces">Espèces</option>
        <option value="Mobile Money">Mobile Money</option>
        <option value="Chèque">Chèque</option>
      </select>
    </div>

    {/* Frais supplémentaires */}
    <div className="border rounded p-3 mb-3 bg-light">
      <h6 className="mb-3">Frais à appliquer</h6>
      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="fraisScolaire"
          checked={fraisScolaire}
          onChange={e => setFraisScolaire(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="fraisScolaire">
          Frais scolaire ({FRAIS_SCOLAIRE} FCFA)
        </label>
      </div>

      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="droitsExamen"
          checked={droitsExamen}
          onChange={e => setDroitsExamen(e.target.checked)}
          disabled={
            !(classeIdNom === "3ème" || classeIdNom === "3EME" || classeIdNom === "Terminale" || classeIdNom === "TERMINALE")
          }
        />
        <label className="form-check-label" htmlFor="droitsExamen">
          Droits d'examen{" "}
          {classeIdNom === "3ème" || classeIdNom === "3EME"
            ? "(3000 FCFA)"
            : classeIdNom === "Terminale" || classeIdNom === "TERMINALE"
            ? "(6000 FCFA)"
            : "(Non disponible)"}
        </label>
      </div>

      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="papiersRames"
          checked={papiersRames}
          onChange={e => setPapiersRames(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="papiersRames">
          Papiers rames
        </label>
      </div>

   
    </div>

    {/* Récapitulatif */}
    <div className="alert alert-info">
      <h6>Récapitulatif des frais :</h6>
      <ul className="mb-0">
        <li>Montant classe: {montantDuClasse} FCFA</li>
        {fraisScolaire && <li>Frais scolaire: {FRAIS_SCOLAIRE} FCFA</li>}
        {droitsExamen && calculerDroitsExamen(classeIdNom, droitsExamen) > 0 && (
          <li>Droits d'examen: {calculerDroitsExamen(classeIdNom, droitsExamen)} FCFA</li>
        )}
        {papiersRames && <li>Papiers rames: Inclus</li>}
        <li>
          <strong>Total à payer (classe uniquement): {montantDuClasse} FCFA</strong>
        </li>
        <li>Montant payé: {montantPaye || 0} FCFA</li>
        <li>Reste à payer: {montantDuClasse - (parseFloat(montantPaye) || 0)} FCFA</li>
      </ul>
    </div>

    {/* Champs Total et Reste */}
    <div className="mb-3">
      <label className="form-label">Total à payer (classe uniquement)</label>
      <input
        type="number"
        className="form-control"
        value={montantDuClasse}
        readOnly
      />
    </div>

    <div className="mb-3">
      <label className="form-label">Montant payé</label>
      <input
        type="number"
        className="form-control"
        value={montantPaye}
        onChange={e => setMontantPaye(e.target.value)}
        min="0"
        max={montantDuClasse}
        placeholder="Entrer le montant payé"
        required
      />
      <small className="text-muted">Maximum autorisé: {montantDuClasse} FCFA</small>
    </div>

    <div className="mb-3">
      <label className="form-label">Reste à payer</label>
      <input
        type="number"
        className="form-control"
        value={montantDuClasse - (parseFloat(montantPaye) || 0)}
        readOnly
      />
    </div>

    {/* Boutons */}
    <button type="button" className="btn btn-secondary me-2" onClick={() => setEtape(1)}>
      ← Précédent
    </button>
    <button type="submit" className="btn btn-success">Valider</button>
  </>
)}
        

            <button type="submit" className="btn btn-success mt-3">
              {etape === 1 ? "Suivant" : "Enregistrer & Générer Reçu"}
            </button>
          </form>
        </div>
      </div>

      <hr className="my-4" />

      <h5>Liste des élèves</h5>
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Classe</th>
            <th>Année scolaire</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map(e => (
            <tr key={e.id}>
              <td>{e.matricule}</td>
              <td>{e.nom}</td>
              <td>{e.prenom}</td>
              <td>{classes.find(c => c.id === e.classe_id)?.nom}</td>
              <td>{e.annee_scolaire}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
