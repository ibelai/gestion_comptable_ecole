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
  const API_URL =process.env.REACT_APP_API_URL ||  'http://localhost:1000';

  // Chargement des infos solde
  useEffect(() => {
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

  const formatMontant = (val) => Math.round(val);

  const handlePaiement = async () => {
    setMessage('');
    const montantFloat = parseFloat(montant);

    if (!eleve) return;
    if (isNaN(montantFloat) || montantFloat <= 0) {
      setMessage("Montant invalide");
      return;
    }
    if (montantFloat > eleve.reste_a_payer) {
      setMessage("Le montant dépasse le solde restant.");
      return;
    }

    setChargement(true);
    const numeroRecu = recu.trim() || genererNumeroRecu();

    try {
      await axios.post(`${API_URL}/api/paiements`, {
        eleve_id: eleveId,
        montant_paye: montantFloat,
        mode_paiement: modePaiement,
        date_paiement: new Date().toISOString().split('T')[0],
        annee_scolaire: anneeScolaire,
        description: "Versement"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Regénérer le solde après paiement
      const updated = await axios.get(`${API_URL}/api/eleves/${eleveId}/solde?annee_scolaire=${anneeScolaire}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEleve(updated.data);

      genererRecu({
        nom: updated.data.nom,
        prenom: updated.data.prenom,
        classe: updated.data.classe,
        montant_du: updated.data.montant_du,
        reste: updated.data.reste_a_payer,
        montant: montantFloat,
        mode_paiement: modePaiement,
        date_paiement: new Date(),
        numero: numeroRecu,
        totalPaye: updated.data.total_paye
      });

      setMontant('');
      setRecu('');
      setMessage("Paiement effectué avec succès !");

      setTimeout(() => {
        setMessage('');
        if (onClose) onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Erreur lors du paiement.");
    } finally {
      setChargement(false);
    }
  };

  const genererRecu = (paiement) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Reçu de Paiement", 105, 20, { align: "center" });
  doc.setFontSize(11);

  let y = 40;
  doc.text(`Reçu N°: ${paiement.numero}`, 14, y);
  doc.text(`Nom: ${paiement.nom} ${paiement.prenom}`, 14, y + 6);
  doc.text(`Classe: ${paiement.classe}`, 14, y + 12);
  doc.text(`Date: ${new Date(paiement.date_paiement).toLocaleDateString()}`, 14, y + 18);
  doc.text(`Mode de paiement: ${paiement.mode_paiement}`, 14, y + 24);

  // corps du tableau
  const tableBody = [
    ['Montant dû', `${formatMontant(paiement.montant_du)} FCFA`],
    ['Déjà payé', `${formatMontant(paiement.totalPaye - paiement.montant)} FCFA`],
    ['Paiement actuel', `${formatMontant(paiement.montant)} FCFA`],
    ['Reste à payer', `${formatMontant(paiement.reste)} FCFA`],
    ['Frais scolaires', paiement.fraisScolaires ? 'OK' : '❌'],
    ['Papiers rames', paiement.papiers ? 'OK' : '❌'],
  ];

  // 👉 Ajouter droit examen seulement pour Terminale et 3ème
  if (paiement.classe === "Terminale" || paiement.classe === "3ème") {
    tableBody.push(['Droit examen', paiement.droitExamen ? 'OK' : '❌']);
  }

  doc.autoTable({
    startY: y + 30,
    head: [['Description', 'Montant / Statut']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
  });

  doc.save(`Recu_${paiement.nom}_${paiement.prenom}_${paiement.numero}.pdf`);
};

  if (!show) return null;

  return (
    <div className="modal show fade d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content p-3">
          <div className="modal-header">
            <h5 className="modal-title">Paiement de l'élève</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {!eleve ? <div>Chargement...</div> : (
              <>
                <h6><strong>{eleve.nom} {eleve.prenom}</strong> — {eleve.classe}</h6>
                <p><strong>Montant dû :</strong> {eleve.montant_du} FCFA</p>
                <p><strong>Déjà payé :</strong> {eleve.total_paye} FCFA</p>
                <p><strong>Reste à payer :</strong> {eleve.reste_a_payer} FCFA</p>

                <div className="form-check">
                  <input type="checkbox" className="form-check-input" checked={eleve.frais_scolaires} readOnly />
                  <label className="form-check-label">Frais scolaires</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" checked={eleve.droit_examen} readOnly />
                  <label className="form-check-label">Droit examen</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" checked={eleve.papiers} readOnly />
                  <label className="form-check-label">Papiers/rames</label>
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
