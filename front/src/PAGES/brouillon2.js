import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";


export default function PaiementComplet() {
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:1000";

  const [classes, setClasses] = useState([]);
  const [montantsClasses, setMontantsClasses] = useState([]);

  const [classeId, setClasseId] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState("2024-2025");
  const [statutAffectation, setStatutAffectation] = useState("affecté");
  const [trimestre, setTrimestre] = useState(""); // Ajout du champ trimestre

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [matricule, setMatricule] = useState("");
  const [dateNaissance, setDateNaissance] = useState(""); // Ajout du champ date de naissance

  const [fraisScolaire, setFraisScolaire] = useState(17500);
  const [fraisClasse, setFraisClasse] = useState(0);
  const [droitExamen, setDroitExamen] = useState(0);
  const [papiersRames, setPapiersRames] = useState(2500);

  // Checkbox pour payer ou pas avec montants personnalisables
  const [payerFraisScolaire, setPayerFraisScolaire] = useState(false);
  const [payerDroitExamen, setPayerDroitExamen] = useState(false);
  const [payerPapiersRames, setPayerPapiersRames] = useState(false);

  // Montants payés pour chaque type (permet paiements partiels)
  const [montantFraisScolaireAPayer, setMontantFraisScolaireAPayer] = useState(0);
  const [montantDroitExamenAPayer, setMontantDroitExamenAPayer] = useState(0);
  const [montantPapiersRamesAPayer, setMontantPapiersRamesAPayer] = useState(0);
  const [montantClassePaye, setMontantClassePaye] = useState(0);

  const [modePaiement, setModePaiement] = useState("");
  const [datePaiement, setDatePaiement] = useState("");

// utils/recuPDF.js



  const generateRecu = (eleve, paiement) => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GROUPE SCOLAIRE ONNY ROSE", 50, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Adresse : Abidjan, Côte d’Ivoire`, 20, 40);
    doc.text(`Téléphone : +225 07 00 00 00`, 20, 46);
    doc.text(`Email : contact@onnyrose.ci`, 20, 52);
    doc.line(20, 55, 190, 55);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REÇU DE PAIEMENT", 75, 70);

    doc.setFont("helvetica", "normal");
    doc.text(`N° Reçu : REC-${paiement.id}`, 20, 85);
    doc.text(`Nom & Prénom : ${eleve.nom} ${eleve.prenom}`, 20, 95);
    doc.text(`Matricule : ${eleve.matricule}`, 20, 105);
    doc.text(`Classe : ${eleve.classe}`, 20, 115);
    doc.text(`Année scolaire : ${paiement.annee_scolaire}`, 20, 125);
    doc.text(`Trimestre : ${paiement.trimestre}`, 20, 135);

    const frais = [
      ["Frais scolaires", `${paiement.frais_scolaires} FCFA`],
      ["Droits d'examen", `${paiement.droit_examen} FCFA`],
      ["Papiers rame", `${paiement.papiers_rame} FCFA`],
      ["Frais de classe", `${paiement.frais_classe} FCFA`],
    ];

    doc.autoTable({
      startY: 145,
      head: [["Libellé", "Montant"]],
      body: frais,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: "center" },
      bodyStyles: { halign: "right" },
      columnStyles: { 0: { halign: "left" }, 1: { halign: "right" } },
    });

    let y = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Montant total dû : ${paiement.montant_total} FCFA`, 20, y);
    y += 10;
    doc.text(`Montant payé : ${paiement.montant_paye} FCFA`, 20, y);
    y += 10;
    doc.text(`Montant restant : ${paiement.montant_restant} FCFA`, 20, y);

    y += 15;
    if (paiement.montant_restant > 0) {
      doc.setTextColor(200, 0, 0);
      doc.text("Statut : EN COURS", 20, y);
    } else {
      doc.setTextColor(0, 150, 0);
      doc.text("Statut : SOLDÉ", 20, y);
    }

    doc.setTextColor(0, 0, 0);
    doc.line(140, y + 20, 190, y + 20);
    doc.text("Signature & Cachet", 145, y + 30);

    doc.setFontSize(10);
    doc.text("Merci pour votre paiement.", 20, 280);
    doc.text("Document généré automatiquement - GROUPE SCOLAIRE ONNY ROSE", 20, 286);

    doc.save(`recu-${paiement.id}.pdf`);
  };

  // --- Récupérer classes et montants ---
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
        console.error("Erreur récupération données :", err);
      }
    };
    fetchData();
  }, [token, API_URL]);

  // --- Calcul frais classe et droit examen ---
  useEffect(() => {
    if (!classeId) {
      setFraisClasse(0);
      setDroitExamen(0);
      setPayerDroitExamen(false);
      return;
    }

    const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom;
    if (!classeNom) return;

    // Calcul frais de classe
    const montantClasseObj = montantsClasses.find(
      m => m.classe === classeNom &&
           m.annee_scolaire === anneeScolaire &&
           m.statut_affectation.toLowerCase() === statutAffectation.toLowerCase()
    );

    setFraisClasse(montantClasseObj ? parseInt(montantClasseObj.montant, 10) : 0);

    // Calcul droit d'examen selon la classe
    const nomLower = classeNom.toLowerCase();
    let montantDroitExamen = 0;
    
    if (nomLower.includes('terminale') || nomLower.includes('tle')) {
      montantDroitExamen = 6000;
    } else if (nomLower.includes('3ème') || nomLower.includes('3eme')) {
      montantDroitExamen = 3000;
    }
    
    setDroitExamen(montantDroitExamen);
    
    // Auto-cocher le droit d'examen si c'est une classe d'examen
    setPayerDroitExamen(montantDroitExamen > 0);
    setMontantDroitExamenAPayer(montantDroitExamen);

    // Reset autres valeurs
    setPayerFraisScolaire(false);
    setPayerPapiersRames(false);
    setMontantFraisScolaireAPayer(0);
    setMontantPapiersRamesAPayer(0);
    setMontantClassePaye();

  }, [classeId, anneeScolaire, statutAffectation, classes, montantsClasses]);

  // --- Gestion des cases à cocher ---
  const handleFraisScolaireChange = (checked) => {
    setPayerFraisScolaire(checked);
    setMontantFraisScolaireAPayer(checked ? fraisScolaire : 0);
  };

  const handleDroitExamenChange = (checked) => {
    setPayerDroitExamen(checked);
    setMontantDroitExamenAPayer(checked ? droitExamen : 0);
  };

  const handlePapiersRamesChange = (checked) => {
    setPayerPapiersRames(checked);
    setMontantPapiersRamesAPayer(checked ? papiersRames : 0);
  };

  // --- Totaux ---
  const totalPaye = montantFraisScolaireAPayer + montantDroitExamenAPayer + montantPapiersRamesAPayer + montantClassePaye;
  const totalDu = fraisScolaire + fraisClasse + droitExamen + papiersRames;
  const resteAPayer = totalDu - totalPaye;

  // --- Soumission ---
 const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation
  if (!nom || !prenom || !matricule || !classeId || !trimestre || !modePaiement || !datePaiement) {
    alert("Merci de remplir tous les champs requis (nom, prénom, matricule, classe, trimestre, mode de paiement, date).");
    return;
  }

  if (totalPaye === 0) {
    alert("Veuillez sélectionner au moins un frais à payer.");
    return;
  }

  if (totalPaye > totalDu) {
    alert("Le montant total payé ne peut pas dépasser le montant total dû.");
    return;
  }

  try {
    // 1️⃣ Créer l'élève
    const resEleve = await axios.post(
      `${API_URL}/api/eleves`,
      {
        nom: nom.trim(),
        prenom: prenom.trim(),
        matricule: matricule.trim(),
        classe_id: parseInt(classeId),
        statut_affectation: statutAffectation,
        trimestre: trimestre,
        date_naissance: dateNaissance || null
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const eleveId = resEleve.data.id;

    // 2️⃣ Créer le paiement avec seulement les champs attendus par le backend
    const resPaiement = await axios.post(
      `${API_URL}/api/paiements`,
      {
        eleve_id: eleveId,
        date_paiement: datePaiement,
        mode_paiement: modePaiement,
        montant_paye: totalPaye,
        annee_scolaire: anneeScolaire,
        trimestre: trimestre
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
alert("Élève et paiement enregistrés avec succès !");
generateRecu(
  { nom, prenom, matricule, classe: classes.find(c => c.id === parseInt(classeId))?.nom },
  resPaiement.data.paiement
);

   

    // Reset formulaire
    setNom("");
    setPrenom("");
    setMatricule("");
    setDateNaissance("");
    setClasseId("");
    setTrimestre("");
    setModePaiement("");
    setDatePaiement("");
    setPayerFraisScolaire(false);
    setPayerDroitExamen(false);
    setPayerPapiersRames(false);
    setMontantFraisScolaireAPayer(0);
    setMontantDroitExamenAPayer(0);
    setMontantPapiersRamesAPayer(0);
    setMontantClassePaye(0);

  } catch (err) {
    console.error("Erreur complète:", err);
    console.error("Réponse du serveur:", err.response?.data);

    alert("Erreur lors de l'enregistrement : " + (err.response?.data?.message || err.message));
  }
};


  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">Gestion Paiement Élève</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Informations de l'élève */}
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Matricule *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={matricule} 
                  onChange={e => setMatricule(e.target.value)} 
                  required 
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Nom *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nom} 
                  onChange={e => setNom(e.target.value)} 
                  required 
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Prénom *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={prenom} 
                  onChange={e => setPrenom(e.target.value)} 
                  required 
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Date de naissance</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={dateNaissance} 
                  onChange={e => setDateNaissance(e.target.value)} 
                />
              </div>
            </div>

            {/* Configuration classe et année */}
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Année scolaire *</label>
                <select 
                  className="form-select" 
                  value={anneeScolaire} 
                  onChange={e => setAnneeScolaire(e.target.value)} 
                  required
                >
                  <option value="">--Choisir--</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Classe *</label>
                <select 
                  className="form-select" 
                  value={classeId} 
                  onChange={e => setClasseId(e.target.value)} 
                  required
                >
                  <option value="">--Choisir--</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Trimestre *</label>
                <select 
                  className="form-select" 
                  value={trimestre} 
                  onChange={e => setTrimestre(e.target.value)} 
                  required
                >
                  <option value="">--Choisir--</option>
                  <option value="1">Trimestre 1</option>
                  <option value="2">Trimestre 2</option>
                  <option value="3">Trimestre 3</option>
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Statut d'affectation</label>
                <select 
                  className="form-select" 
                  value={statutAffectation} 
                  onChange={e => setStatutAffectation(e.target.value)}
                >
                  <option value="affecté">Affecté</option>
                  <option value="non affecté">Non affecté</option>
                </select>
              </div>
            </div>

            {/* Informations de paiement */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Mode de paiement *</label>
                <select 
                  className="form-select" 
                  value={modePaiement} 
                  onChange={e => setModePaiement(e.target.value)} 
                  required
                >
                  <option value="">--Choisir--</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Date du paiement *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={datePaiement} 
                  onChange={e => setDatePaiement(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Section des frais */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">Sélection des frais à payer</h5>
              </div>
              <div className="card-body">
                
                {/* Frais scolaires */}
                <div className="row mb-3 align-items-center">
                  <div className="col-md-1">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="fraisScolaire"
                        checked={payerFraisScolaire} 
                        onChange={e => handleFraisScolaireChange(e.target.checked)}
                      />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <label className="form-check-label fw-bold" htmlFor="fraisScolaire">
                      Frais scolaires (obligatoire)
                    </label>
                    <div className="text-muted">Montant dû: {fraisScolaire} FCFA</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Montant à payer</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={montantFraisScolaireAPayer}
                      onChange={e => {
                        const val = Math.max(0, Math.min(fraisScolaire, parseInt(e.target.value) || 0));
                        setMontantFraisScolaireAPayer(val);
                      }}
                      disabled={!payerFraisScolaire}
                      min="0" 
                      max={fraisScolaire}
                    />
                  </div>
                </div>

                <hr />

                {/* Papiers/Rames */}
                <div className="row mb-3 align-items-center">
                  <div className="col-md-1">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="papiersRames"
                        checked={payerPapiersRames} 
                        onChange={e => handlePapiersRamesChange(e.target.checked)}
                      />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <label className="form-check-label fw-bold" htmlFor="papiersRames">
                      Papiers/Rames (pour tous)
                    </label>
                    <div className="text-muted">Montant dû: {papiersRames} FCFA</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Montant à payer</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={montantPapiersRamesAPayer}
                      onChange={e => {
                        const val = Math.max(0, Math.min(papiersRames, parseInt(e.target.value) || 0));
                        setMontantPapiersRamesAPayer(val);
                      }}
                      disabled={!payerPapiersRames}
                      min="0" 
                      max={papiersRames}
                    />
                  </div>
                </div>

                <hr />

                {/* Droit d'examen - seulement pour 3ème et terminale */}
                {droitExamen > 0 && (
                  <>
                    <div className="row mb-3 align-items-center">
                      <div className="col-md-1">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="droitExamen"
                            checked={payerDroitExamen} 
                            onChange={e => handleDroitExamenChange(e.target.checked)}
                          />
                        </div>
                      </div>
                      <div className="col-md-5">
                        <label className="form-check-label fw-bold" htmlFor="droitExamen">
                          Droit d'examen 
                          {droitExamen === 6000 ? ' (Terminale)' : ' (3ème)'}
                        </label>
                        <div className="text-muted">Montant dû: {droitExamen} FCFA</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Montant à payer</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={montantDroitExamenAPayer}
                          onChange={e => {
                            const val = Math.max(0, Math.min(droitExamen, parseInt(e.target.value) || 0));
                            setMontantDroitExamenAPayer(val);
                          }}
                          disabled={!payerDroitExamen}
                          min="0" 
                          max={droitExamen}
                        />
                      </div>
                    </div>
                    <hr />
                  </>
                )}

                {/* Frais de classe */}
                {fraisClasse > 0 && (
                  <div className="row mb-3 align-items-center">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Frais de classe</label>
                      <div className="text-muted">
                        Montant dû selon classe et statut: {fraisClasse} FCFA
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Montant à payer</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={montantClassePaye} 
                        onChange={e => {
                          const val = Math.max(0, Math.min(fraisClasse, parseInt(e.target.value) || 0));
                          setMontantClassePaye(val);
                        }}
                        min="0"
                        max={fraisClasse}
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Récapitulatif */}
            <div className="alert alert-info mt-4">
              <div className="row">
                <div className="col-md-3">
                  <strong>Total dû :</strong><br/>
                  <span className="fs-5">{totalDu} FCFA</span>
                </div>
                <div className="col-md-3">
                  <strong>Total à payer :</strong><br/>
                  <span className="fs-5">{totalPaye} FCFA</span>
                </div>
                <div className="col-md-3">
                  <strong>Reste à payer :</strong><br/>
                  <span className={`fs-5 ${resteAPayer > 0 ? 'text-danger' : 'text-success'}`}>
                    {resteAPayer} FCFA
                  </span>
                </div>
                <div className="col-md-3">
                  <strong>Statut :</strong><br/>
                  <span className={`fs-6 ${resteAPayer <= 0 ? 'text-success' : 'text-warning'}`}>
                    {resteAPayer <= 0 ? 'SOLDÉ ✓' : 'EN COURS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                disabled={totalPaye === 0}
              >
                Enregistrer le paiement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}