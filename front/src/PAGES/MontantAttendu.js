import React from 'react'
const totalPaye = paiementsFiltres.reduce((sum, p) => sum + parseFloat(p.montant), 0);

const getMontantRestant = (eleveId) => {
  const totalPayeEleve = paiements
    .filter((p) => p.eleve_id === eleveId)
    .reduce((sum, p) => sum + parseFloat(p.montant), 0);
  return montantAttenduParEleve - totalPayeEleve;
};

export default function MontantAttendu() {
  return (
    <div>
      <div className="alert alert-info">
  <strong>Total payé :</strong> {totalPaye.toLocaleString("fr-FR")} FCFA
</div>

    </div>
  )
}
