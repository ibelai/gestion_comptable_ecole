import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ElevesList() {
  const [etape, setEtape] = useState(1);
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  // Champs élève
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [genre, setGenre] = useState('');
  const [classeId, setClasseId] = useState('');
  const [statutAffectation, setStatutAffectation] = useState('affecté');

  // Champs paiement
  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [trimestre, setTrimestre] = useState('');
  const [datePaiement, setDatePaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [montantPaye, setMontantPaye] = useState('');

  // Nouvelles cases à cocher
  const [droitsExamen, setDroitsExamen] = useState(false);
  const [fraisScolaire, setFraisScolaire] = useState(false);
  const [papiersRames, setPapiersRames] = useState(false);
  const [notifierParent, setNotifierParent] = useState(false); // ✅ Nouvelle option

  // Données classes
  const [classes, setClasses] = useState([]);
  const [montantsClasses, setMontantsClasses] = useState([]);
  const [montantDuClasse, setMontantDuClasse] = useState(0);
  
  const classeIdNom = classes.find(c => c.id === parseInt(classeId))?.nom;
  const FRAIS_SCOLAIRE = 17500;

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

  useEffect(() => {
    if (!classeId || !anneeScolaire || !statutAffectation) {
      setMontantDuClasse(0);
      return;
    }
    const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom;
    const montant = montantsClasses.find(m =>
      m.classe === classeNom &&
      m.annee_scolaire === anneeScolaire &&
      m.statut_affectation.toLowerCase() === statutAffectation.toLowerCase()
    );
    setMontantDuClasse(montant ? parseInt(montant.montant, 10) : 0);
  }, [classeId, anneeScolaire, statutAffectation, classes, montantsClasses]);


  

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

const calculerDroitsExamen = (classeNom, droitsExamen) => {
  if (!droitsExamen) return 0;
  if (classeNom === "3ème" || classeNom === "3EME") return 3000;
  if (classeNom === "Terminale" || classeNom === "TERMINALE") return 6000;
  return 0;
};

const calculerFraisScolaire = (fraisScolaire) => fraisScolaire ? FRAIS_SCOLAIRE : 0;

const calculerMontantTotal = (montantDuClasse, fraisScolaireMontant, droitsExamenMontant) =>
  montantDuClasse + fraisScolaireMontant + droitsExamenMontant;

const handleSubmit = async (e) => {
  e.preventDefault();

  if (etape === 1) {
    if (!matricule || !nom || !prenom || !classeId) {
      alert('Merci de remplir le matricule, nom, prénom et la classe');
      return;
    }
    setEtape(2);
    return;
  }

  // Étape 2 : paiement
  if (!datePaiement || !anneeScolaire || !modePaiement || !trimestre) {
    alert('Veuillez remplir tous les champs requis, y compris le trimestre');
    return;
  }

  const montantPayeNum = parseFloat(montantPaye) || 0;
  const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom || '';
  const droitsExamenMontant = calculerDroitsExamen(classeNom, droitsExamen);
  const fraisScolaireMontant = calculerFraisScolaire(fraisScolaire);
  const totalMontantDu = calculerMontantTotal(montantDuClasse, fraisScolaireMontant, droitsExamenMontant);
  const reste = totalMontantDu - montantPayeNum;

  if (isNaN(montantPayeNum) || montantPayeNum <= 0) {
    alert('Le montant payé doit être un nombre positif valide');
    return;
  }

  if (montantPayeNum > totalMontantDu) {
    alert(`Le montant payé (${montantPayeNum} FCFA) ne peut pas dépasser le montant dû (${totalMontantDu} FCFA)`);
    return;
  }
  try {
    // Créer l'élève
   const resEleve = await axios.post(
  `${API_URL}/api/eleves`,
  {
    nom: nom.trim(),
    prenom: prenom.trim(),
    matricule: matricule.trim(),
    classe_id: parseInt(classeId),
    statut_affectation: statutAffectation || "affecté",
    date_naissance: dateNaissance || null,
    // 🔥 CORRECTION : Convertir le trimestre en nombre
    trimestre: trimestre === "T1" ? 1 : trimestre === "T2" ? 2 : 3,
    annee_scolaire: anneeScolaire.trim()
  },
  { headers: { Authorization: `Bearer ${token}` } }
);
    console.log("Réponse API ELEVE:", resEleve.data);

    // Préparer les données de paiement
    const paiementData = {
      eleve_id: resEleve.data.id,
      montant_paye: montantPayeNum,
      date_paiement: datePaiement,
      annee_scolaire: anneeScolaire,
      mode_paiement: modePaiement,
      trimestre: trimestre,
      montant_du: totalMontantDu,
      montant_classe: montantDuClasse,
      droits_examen: droitsExamenMontant,
      frais_scolaire: fraisScolaireMontant,
      papiers_rames: papiersRames,
      has_droits_examen: droitsExamen,
      has_frais_scolaire: fraisScolaire,
      has_papiers_rames: papiersRames
    };

    await axios.post(`${API_URL}/api/paiements`, paiementData, { headers: { Authorization: `Bearer ${token}` } });

    const numeroRecu = `REC-${Date.now()}`;
    genererRecu({
      matricule,
      nom,
      prenom,
      classe: classeNom,
      anneeScolaire,
      trimestre,
      totalPaye: montantPayeNum,
      reste,
      droitsExamen: droitsExamenMontant,
      fraisScolaire: fraisScolaireMontant,
      papiersRames,
      date: datePaiement,
      numero: numeroRecu
    });

    // Notification aux parents si demandé
    if (notifierParent && reste > 0) {
      await axios.post(`${API_URL}/api/notifications`, {
        eleve_id: resEleve.data.id,
        message: `Bonjour, il reste ${reste} FCFA à payer pour ${nom} ${prenom}.`,
        type: 'sms'
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Le parent a été notifié du solde restant.');
    }

    alert('Élève et paiement enregistrés avec succès');

    // Réinitialisation des champs
    setMatricule(''); setNom(''); setPrenom('');
    setDateNaissance(''); setGenre('');
    setStatutAffectation(''); setClasseId('');
    setAnneeScolaire(''); setTrimestre('');
    setDatePaiement(''); setMontantPaye('');
    setModePaiement('');
    setDroitsExamen(false); setFraisScolaire(false); setPapiersRames(false);
    setNotifierParent(false);
    setEtape(1);

  } catch (err) {
    console.error('Erreur:', err);
    alert('Erreur lors de l\'enregistrement: ' + (err.response?.data?.message || err.message));
  }
};

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
                    <option value="affecté">Affecté</option>
                    <option value="non affecté">Non affecté</option>
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
      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="notifierParent"
          checked={notifierParent}
          onChange={e => setNotifierParent(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="notifierParent">
          Notifier le parent du solde restant
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
          <strong>
            Total:{" "}
            {calculerMontantTotal(
              montantDuClasse,
              fraisScolaire ? FRAIS_SCOLAIRE : 0,
              droitsExamen ? calculerDroitsExamen(classeIdNom, droitsExamen) : 0
            )}{" "}
            FCFA
          </strong>
        </li>
      </ul>
    </div>

    <div className="mb-3">
      <label className="form-label">Montant dû (total)</label>
      <input
        type="number"
        className="form-control"
        value={calculerMontantTotal(
          montantDuClasse,
          fraisScolaire ? FRAIS_SCOLAIRE : 0,
          droitsExamen ? calculerDroitsExamen(classeIdNom, droitsExamen) : 0
        )}
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
        max={calculerMontantTotal(
          montantDuClasse,
          fraisScolaire ? FRAIS_SCOLAIRE : 0,
          droitsExamen ? calculerDroitsExamen(classeIdNom, droitsExamen) : 0
        )}
        placeholder="Entrer le montant payé"
        required
      />
      <small className="text-muted">
        Maximum autorisé:{" "}
        {calculerMontantTotal(
          montantDuClasse,
          fraisScolaire ? FRAIS_SCOLAIRE : 0,
          droitsExamen ? calculerDroitsExamen(classeIdNom, droitsExamen) : 0
        )}{" "}
        FCFA
      </small>
    </div>
    <div className="mb-3">
      <label className="form-label">Reste à payer</label>
      <input
        type="number"
        className="form-control"
        value={
          calculerMontantTotal(
            montantDuClasse,
            fraisScolaire ? FRAIS_SCOLAIRE : 0,
            droitsExamen ? calculerDroitsExamen(classeIdNom, droitsExamen) : 0
          ) - (parseInt(montantPaye) || 0)
        }
        readOnly
      />
    </div>

    <button type="button" className="btn btn-secondary me-2" onClick={() => setEtape(1)}>
      ← Précédent
    </button>
    <button type="submit" className="btn btn-success">
      Valider
    </button>
  </>
)}

          </form>
        </div>
      </div>
    </div>
  );
}
