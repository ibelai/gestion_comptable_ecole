import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ElevesList() {
  const [etape, setEtape] = useState(1);
  const token = localStorage.getItem('token');

  const [matricule, setMatricule] = useState(''); // <-- Nouveau
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [genre, setGenre] = useState('');
  const [classeId, setClasseId] = useState('');
  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [trimestre, setTrimestre] = useState('');
  const [montantPaye, setMontantPaye] = useState('');
  const [datePaiement, setDatePaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [montantDu, setMontantDu] = useState(0);
  const [statutAffectation, setStatutAffectation] = useState('');

  const [classes, setClasses] = useState([]);
  const [montantsClasses, setMontantsClasses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resClasses, resMontants] = await Promise.all([
          axios.get('http://localhost:5000/api/classes'),
          axios.get('http://localhost:5000/api/classes/montants')
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
      setMontantDu(0);
      return;
    }

    const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom;

    const montant = montantsClasses.find(m =>
      m.classe === classeNom &&
      m.annee_scolaire === anneeScolaire &&
      m.statut_affectation === statutAffectation
    );

    setMontantDu(montant ? parseInt(montant.montant, 10) : 0);
  }, [classeId, anneeScolaire, statutAffectation, classes, montantsClasses]);

  const genererRecu = (paiement) => {
    const doc = new jsPDF();

    const img = new Image();
    img.src = '/logo.png';

    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("GROUPE SCOLAIRE LONNY-ROSE", 105, 20, null, null, 'center');

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Reçu de paiement", 105, 30, null, null, 'center');

      doc.text(`Matricule : ${paiement.matricule}`, 10, 50);           // <-- affichage matricule reçu
      doc.text(`Nom de l'élève : ${paiement.nom} ${paiement.prenom}`, 10, 58);
      doc.text(`Classe : ${paiement.classe}`, 10, 66);
      doc.text(`Année scolaire : ${paiement.anneeScolaire}`, 10, 74);
      doc.text(`Trimestre : ${paiement.trimestre}`, 10, 82);
      doc.text(`Date du paiement : ${paiement.date}`, 10, 90);
      doc.text(`Reçu N° : ${paiement.numero}`, 10, 98);

      doc.autoTable({
        startY: 110,
        head: [['Description', 'Montant']],
        body: [
          ['Frais de scolarité', `${paiement.montant} FCFA`],
          ['Total payé', `${paiement.totalPaye} FCFA`],
          ['Reste à payer', `${paiement.reste} FCFA`],
        ],
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

    img.onerror = () => {
      alert("Erreur : impossible de charger le logo.");
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (etape === 1) {
      if (!matricule || !nom || !prenom || !classeId) {
        alert('Merci de remplir le matricule, nom, prénom et la classe');
        return;
      }
      setEtape(2);
    } else {
      if (!datePaiement || !anneeScolaire || !modePaiement || !trimestre) {
        alert('Veuillez remplir tous les champs requis, y compris le trimestre');
        return;
      }

      const montantPayeNum = parseInt(montantPaye, 10);
      if (montantPayeNum > montantDu) {
        alert(`Le montant payé (${montantPayeNum}) ne peut pas dépasser le montant dû (${montantDu} FCFA).`);
        return;
      }

      try {
       const resEleve = await axios.post('http://localhost:5000/api/eleves', {
  matricule: matricule.trim(),
  nom: nom.trim(),
  prenom: prenom.trim(),
  date_naissance: dateNaissance || null,
  genre: genre || null,
  statut_affectation: statutAffectation,
  classe_id: parseInt(classeId, 10),
  trimestre: trimestre,  // ajoute ceci si le backend l’attend
}, {
  headers: { Authorization: `Bearer ${token}` }
});


        await axios.post('http://localhost:5000/api/paiements', {
          eleve_id: resEleve.data.id,
          montant_paye: montantPayeNum,
          date_paiement: datePaiement,
          annee_scolaire: anneeScolaire,
          mode_paiement: modePaiement,
          montant_du: montantDu,
          trimestre
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom;
        const numeroRecu = `REC-${Date.now()}`;
        const reste = montantDu - montantPayeNum;

        genererRecu({
          matricule,        // <-- passage matricule reçu
          nom,
          prenom,
          classe: classeNom,
          anneeScolaire,
          trimestre,
          montant: montantDu,
          totalPaye: montantPayeNum,
          reste,
          date: datePaiement,
          numero: numeroRecu
        });

        alert('Élève et paiement enregistrés avec succès');
        // Reset champs
        setMatricule('');
        setNom('');
        setPrenom('');
        setDateNaissance('');
        setGenre('');
        setStatutAffectation('');
        setClasseId('');
        setAnneeScolaire('');
        setTrimestre('');
        setDatePaiement('');
        setMontantPaye('');
        setModePaiement('');
        setEtape(1);
      } catch (err) {
        console.error('Erreur détail:', err.response?.data || err.message);
        alert('Erreur : ' + (err.response?.data?.message || err.message));
      }
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
                  <input
                    type="text"
                    className="form-control"
                    value={matricule}
                    onChange={e => setMatricule(e.target.value)}
                    required
                  />
                </div>
                <div className="row">
  <div className="col-md-6 mb-3">
    <label className="form-label">Nom</label>
    <input className="form-control" value={nom} onChange={e => setNom(e.target.value)} required  />
  </div>
  <div className="col-md-6 mb-3">
    <label className="form-label">Prénom</label>
    <input className="form-control" value={prenom} onChange={e => setPrenom(e.target.value)} required  />
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
                <div className="mb-3">
                  <label className="form-label">Statut d'affectation</label>
                  <select className="form-select" value={statutAffectation} onChange={e => setStatutAffectation(e.target.value)} required>
                    <option value="">--Choisir--</option>
                    <option value="affecté">Affecté (État)</option>
                    <option value="non affecté">Non Affecté</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Classe</label>
                  <select className="form-select" value={classeId} onChange={e => setClasseId(e.target.value)} required>
                    <option value="">--Choisir une classe--</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
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
                  <select className="form-select" value={trimestre} onChange={e => setTrimestre(e.target.value)} required>
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
                  <select className="form-select" value={modePaiement} onChange={e => setModePaiement(e.target.value)} required>
                    <option value="">--Choisir un mode--</option>
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Montant dû</label>
                  <input type="number" className="form-control" value={montantDu} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Montant payé</label>
                  <input
                    type="number"
                    className="form-control"
                    value={montantPaye}
                    onChange={e => {
                      let val = e.target.value;
                      if (val === '') return setMontantPaye('');
                      val = parseInt(val, 10);
                      if (isNaN(val) || val < 0) val = 0;
                      if (val > montantDu) val = montantDu;
                      setMontantPaye(val);
                    }}
                    min="0"
                    max={montantDu}
                    required
                  />
                </div>
                <button type="button" className="btn btn-secondary me-2" onClick={() => setEtape(1)}>← Précédent</button>
                <button type="submit" className="btn btn-success">Valider</button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
