import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PaiementSoldeModal({ eleveId, show, onClose }) {
  const token = localStorage.getItem('token');
  const [eleve, setEleve] = useState(null);
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [recu, setRecu] = useState('');
  const [message, setMessage] = useState('');
  const [chargement, setChargement] = useState(false);
  const anneeScolaire = "2024-2025";
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';

  useEffect(() => {
     console.log("eleveId reçu :", eleveId, "show :", show);
  if (!eleveId || !show) return;
    
    axios.get(`${API_URL}/api/eleves/${eleveId}/solde?annee_scolaire=${anneeScolaire}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setEleve(res.data))
    .catch(err => {
      console.error("Erreur chargement élève:", err);
      setMessage("Erreur chargement données élève.");
    });
  }, [eleveId, show]);

  const genererNumeroRecu = () => `REC${Date.now()}`;

  const handlePaiement = async () => {
    setMessage('');
    const montantFloat = parseFloat(montant);
    if (isNaN(montantFloat) || montantFloat <= 0) {
      setMessage("Montant invalide");
      return;
    }
    if (montantFloat > eleve.reste_a_payer) {
      setMessage("Le montant dépasse le solde restant.");
      return;
    }
    if (recu.trim().length > 20) {
      setMessage("Le numéro de reçu est trop long.");
      return;
    }

    setChargement(true);
    const numeroRecu = recu.trim() || genererNumeroRecu();

    try {
      await axios.post(`${API_URL}/api/paiements`, {
        eleve_id: eleveId,
        montant_paye: montantFloat,
        mode_paiement: modePaiement,
        recu: numeroRecu,
        date_paiement: new Date().toISOString().split('T')[0],
        annee_scolaire: anneeScolaire,
        description: "Versement" // 👈 ici tu peux aussi mettre "Frais scolaires", etc.
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      genererRecu({
        nom: eleve.nom,
        prenom: eleve.prenom,
        classe: eleve.classe,
        montant_du: eleve.montant_du || 0,
        reste: Math.max(0, eleve.reste_a_payer - montantFloat),
        montant: montantFloat,
        mode_paiement: modePaiement,
        date_paiement: new Date(),
        numero: numeroRecu,
        totalPaye: (eleve.total_paye || 0) + montantFloat
      });

      setMontant('');
      setRecu('');
      setMessage("Paiement effectué avec succès !");

      const updated = await axios.get(`${API_URL}/api/eleves/${eleveId}/solde?annee_scolaire=${anneeScolaire}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEleve(updated.data);

      setTimeout(() => {
        setMessage('');
        if (onClose) onClose(); // Ferme la modale après succès
      }, 1500);

    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Erreur lors du paiement.");
    } finally {
      setChargement(false);
    }
  };
const formatMontant = (val) => {
  return Math.round(val); // ou Math.floor / toFixed(0)
};

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

      let y = 50;
      doc.text(`Nom : ${paiement.nom} ${paiement.prenom}`, 10, y);
      y += 8;
      doc.text(`Classe : ${paiement.classe}`, 10, y);
      y += 8;
      doc.text(`Montant dû : ${paiement.montant_du} FCFA`, 10, y);
      y += 8;
      doc.text(`Montant restant : ${paiement.reste} FCFA`, 10, y);
      y += 8;
      doc.text(`Date : ${new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}`, 10, y);
      y += 8;
      doc.text(`Reçu N° : ${paiement.numero}`, 10, y);

     doc.autoTable({
  startY: y + 15,
  head: [['Description', 'Montant']],
  body: [
    ['Montant dû', `${formatMontant(paiement.montant_du)} FCFA`],
    ['Déjà payé', `${formatMontant(paiement.totalPaye - paiement.montant)} FCFA`],
    ['Paiement actuel', `${formatMontant(paiement.montant)} FCFA`],
    ['Reste à payer', `${formatMontant(paiement.reste)} FCFA`],
  ],
  theme: 'grid',
  styles: { fontSize: 11 },
  headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
});


      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text('Merci pour votre paiement.', 10, pageHeight - 20);
      doc.text('Signature:', 150, pageHeight - 20);
      doc.line(150, pageHeight - 18, 190, pageHeight - 18);

      doc.save(`recu-${paiement.nom}-${paiement.numero}.pdf`);
    };

    img.onerror = () => alert("Erreur : impossible de charger le logo.");
  };

  if (!show) return null;

  return (
    <div className="modal show fade d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content p-3">
          <div className="modal-header">
            <h5 className="modal-title">Paiement de l'élève</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {!eleve ? (
              <div>Chargement...</div>
            ) : (
              <>
                <h6><strong>{eleve.nom} {eleve.prenom}</strong> — {eleve.classe}</h6>
                <p><strong>Montant dû :</strong> {eleve.montant_du} FCFA</p>
                <p><strong>Déjà payé :</strong> {eleve.total_paye} FCFA</p>
                <p><strong>Reste à payer :</strong> {eleve.reste_a_payer} FCFA</p>

                {/* ✅ Cases des frais spécifiques */}
                <div className="mb-3">
                  <label><strong>Frais spécifiques :</strong></label>
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" checked={eleve?.frais_scolaires} readOnly />
                    <label className="form-check-label">Frais scolaires</label>
                  </div>
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" checked={eleve?.droit_examen} readOnly />
                    <label className="form-check-label">Droit examen</label>
                  </div>
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" checked={eleve?.papiers} readOnly />
                    <label className="form-check-label">Papiers/rames</label>
                  </div>
                </div>

                {eleve.reste_a_payer <= 0 && (
                  <div className="alert alert-success">Paiement complet effectué pour cette année scolaire.</div>
                )}

                <div className="mb-2">
                  <label>Montant à payer maintenant :</label>
                  <input type="number" className="form-control" value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    min="0" max={eleve.reste_a_payer}
                  />
                </div>

                <div className="mb-2">
                  <label>Mode de paiement :</label>
                  <select className="form-select" value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label>Numéro de reçu (facultatif) :</label>
                  <input type="text" className="form-control" value={recu} onChange={(e) => setRecu(e.target.value)} />
                </div>

                {message && <div className="alert alert-info">{message}</div>}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
            <button className="btn btn-success" onClick={handlePaiement} disabled={chargement || !eleve || eleve.reste_a_payer <= 0}>
              {chargement ? "Traitement..." : "Valider le paiement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
