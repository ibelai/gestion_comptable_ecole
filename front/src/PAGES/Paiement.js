import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";

export default function Paiement() {
  const { register, handleSubmit, reset, getValues } = useForm({
    defaultValues: {
      annee_scolaire: "2024-2025", // par ex. prérempli, tu peux le modifier
    },
  });
   const API_URL = process.env.REACT_APP_API_URL ;
  const [showConfirm, setShowConfirm] = useState(false);
  const [eleves, setEleves] = useState([]);
  const [formDataCache, setFormDataCache] = useState(null);

  useEffect(() => {
    const fetchEleves = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/eleves`);
        setEleves(res.data);
      } catch (err) {
        console.error("Erreur chargement élèves :", err);
      }
    };
    fetchEleves();
  }, []);

  // Au submit initial, on ouvre juste la confirmation, on stocke les données
  const handleConfirm = (data) => {
    setFormDataCache(data);
    setShowConfirm(true);
  };

  // Annuler la confirmation
  const handleCancel = () => {
    setShowConfirm(false);
    setFormDataCache(null);
  };

  // Envoyer le formulaire après confirmation
  const onSubmitConfirmed = async () => {
    if (!formDataCache) return;

    try {
      const data = formDataCache;
      const formData = new FormData();

      // Ajout des champs dans FormData (attention fichier)
      Object.entries(data).forEach(([key, value]) => {
        // Si c'est un fichier, value est un tableau (fileList)
        if (key === "recu" && value?.length > 0) {
          formData.append(key, value[0]); // 1er fichier uniquement
        } else {
          formData.append(key, value);
        }
      });

      await axios.post(`${API_URL}/api/paiements`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Paiement ajouté avec succès");
      setShowConfirm(false);
      reset();
      setFormDataCache(null);
    } catch (err) {
      console.error("Erreur ajout paiement", err);
      alert("Erreur lors de l'ajout du paiement");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Ajouter un paiement </h2>

      <form onSubmit={handleSubmit(handleConfirm)} className="row g-3">
        {/* Sélecteur élève */}
        <div className="col-md-6">
          <label className="form-label">Élève</label>
          <select {...register("eleve_id", { required: true })} className="form-select">
            <option value="">-- Choisir un élève --</option>
            {eleves.map((eleve) => (
              <option key={eleve.id} value={eleve.id}>
                {eleve.nom} {eleve.prenom}
              </option>
            ))}
          </select>
        </div>

        {/* Date de paiement */}
        <div className="col-md-6">
          <label className="form-label">Date de paiement</label>
          <input
            type="date"
            {...register("date_paiement", { required: true })}
            className="form-control"
          />
        </div>

        {/* Montant payé */}
        <div className="col-md-6">
          <label className="form-label">Montant payé (FCFA)</label>
          <input
            type="number"
            step="0.01"
            {...register("montant_paye", { required: true, min: 0.01 })}
            className="form-control"
          />
        </div>

        {/* Mode de paiement */}
        <div className="col-md-6">
          <label className="form-label">Mode de paiement</label>
          <select {...register("mode_paiement", { required: true })} className="form-select">
            <option value="">-- Choisir --</option>
            <option value="Espèces">Espèces</option>
            <option value="Chèque">Chèque</option>
            <option value="Virement">Virement</option>
          </select>
        </div>

        {/* Année scolaire */}
        <div className="col-md-6">
          <label className="form-label">Année scolaire</label>
          <input
            type="text"
            {...register("annee_scolaire", { required: true })}
            className="form-control"
          />
        </div>

        {/* Trimestre */}
        <div className="col-md-6">
          <label className="form-label">Trimestre</label>
          <select {...register("trimestre", { required: true })} className="form-select">
            <option value="">-- Choisir --</option>
            <option value="1">1er trimestre</option>
            <option value="2">2e trimestre</option>
            <option value="3">3e trimestre</option>
          </select>
        </div>

        {/* Reçu (fichier) */}
        <div className="col-md-12">
          <label className="form-label">Reçu (PDF/image)</label>
          <input type="file" {...register("recu")} className="form-control" accept=".pdf,image/*" />
        </div>

        {/* Bouton soumission */}
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Ajouter le paiement
          </button>
        </div>
      </form>

      {/* Modal de confirmation */}
      <Modal show={showConfirm} onHide={handleCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer l'ajout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Voulez-vous vraiment enregistrer ce paiement ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            Annuler
          </Button>
          <Button variant="primary" onClick={onSubmitConfirmed}>
            Confirmer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
