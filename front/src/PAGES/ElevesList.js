import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ElevesList() {
  const [etape, setEtape] = useState(1);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [genre, setGenre] = useState('');
  const [classeId, setClasseId] = useState('');

  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [montantPaye, setMontantPaye] = useState(0);
  const [datePaiement, setDatePaiement] = useState('');

  const [classes, setClasses] = useState([]);
  const [montantsClasses, setMontantsClasses] = useState([]);
  const [montantDu, setMontantDu] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:5000/api/classes')
      .then(res => setClasses(res.data))
      .catch(console.error);

    axios.get('http://localhost:5000/api/classes/montants')
      .then(res => setMontantsClasses(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!classeId || !anneeScolaire) {
      setMontantDu(0);
      return;
    }
    const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom;
    const montantTrouve = montantsClasses.find(m =>
      m.classe === classeNom && m.annee_scolaire === anneeScolaire
    );
    setMontantDu(montantTrouve ? montantTrouve.montant : 0);
  }, [classeId, anneeScolaire, classes, montantsClasses]);

  const genererRecu = (paiement) => {
    const doc = new jsPDF();
    const logoBase64 = 'data:image/png;base64,...'; // Remplace par ton vrai logo

    // doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30); // Si tu as un logo

    doc.setFontSize(18);
    doc.text('Reçu de paiement', 105, 20, null, null, 'center');

    doc.setFontSize(12);
    doc.text(`Nom de l'élève : ${paiement.nom} ${paiement.prenom}`, 10, 50);
    doc.text(`Classe : ${paiement.classe}`, 10, 58);
    doc.text(`Date du paiement : ${paiement.date}`, 10, 66);
    doc.text(`Reçu N° : ${paiement.numero}`, 10, 74);

    doc.autoTable({
      startY: 85,
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

    doc.setFontSize(10);
    doc.text('Merci pour votre paiement.', 10, doc.internal.pageSize.height - 20);
    doc.text('Signature:', 150, doc.internal.pageSize.height - 20);

    doc.save(`recu-${paiement.nom}-${paiement.numero}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (etape === 1) {
      if (!nom || !prenom || !classeId) {
        alert('Merci de remplir le nom, prénom et la classe');
        return;
      }
      setEtape(2);
    } else {
      if (!datePaiement || !anneeScolaire) {
        alert('Merci de remplir la date de paiement et l\'année scolaire');
        return;
      }

      try {
        const resEleve = await axios.post('http://localhost:5000/api/eleves', {
          nom,
          prenom,
          date_naissance: dateNaissance,
          genre,
          classe_id: parseInt(classeId)
        });

        await axios.post('http://localhost:5000/api/paiements', {
          eleve_id: resEleve.data.id,
          montant_paye: parseFloat(montantPaye),
          date_paiement: datePaiement,
          annee_scolaire: anneeScolaire,
          montant_du: montantDu
        });

        const classeNom = classes.find(c => c.id === parseInt(classeId))?.nom;

        const numeroRecu = `REC-${Date.now()}`;
        const reste = montantDu - parseFloat(montantPaye);

        genererRecu({
          nom,
          prenom,
          classe: classeNom,
          montant: montantDu,
          totalPaye: parseFloat(montantPaye),
          reste,
          date: datePaiement,
          numero: numeroRecu
        });

        alert('Élève et paiement enregistrés avec succès');

        // Réinitialisation
        setNom('');
        setPrenom('');
        setDateNaissance('');
        setGenre('');
        setClasseId('');
        setAnneeScolaire('');
        setDatePaiement('');
        setMontantPaye(0);
        setEtape(1);
      } catch (err) {
        console.error(err);
        alert('Erreur lors de l\'enregistrement');
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4>Gestion des élèves & paiements (Étape {etape}/2)</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {etape === 1 && (
              <>
                <div className="mb-3">
                  <label className="form-label">Nom</label>
                  <input type="text" className="form-control" value={nom} onChange={e => setNom(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Prénom</label>
                  <input type="text" className="form-control" value={prenom} onChange={e => setPrenom(e.target.value)} required />
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
                  <input type="text" className="form-control" placeholder="2024-2025" value={anneeScolaire} onChange={e => setAnneeScolaire(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date de paiement</label>
                  <input type="date" className="form-control" value={datePaiement} onChange={e => setDatePaiement(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Montant dû</label>
                  <input type="number" className="form-control" value={montantDu} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Montant payé</label>
                  <input type="number" className="form-control" value={montantPaye} onChange={e => setMontantPaye(e.target.value)} min="0" max={montantDu} required />
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