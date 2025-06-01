import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";

export default function Paiement() {
  const { register, handleSubmit, reset, getValues } = useForm();
  const [showConfirm, setShowConfirm] = useState(false);
  const [eleves, setEleves] = useState([]);

  // 🧠 Charger les élèves au montage
  useEffect(() => {
    const fetchEleves = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/eleves"); // 🔁 adapte l’URL à ton backend
        setEleves(res.data);
      } catch (err) {
        console.error("Erreur chargement élèves :", err);
      }
    };

    fetchEleves();
  }, []);

  const handleConfirm = () => setShowConfirm(true);
  const handleCancel = () => setShowConfirm(false);

  const onSubmitConfirmed = async () => {
    const data = getValues();
    try {
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }

      await axios.post("http://localhost:5000/api/paiements", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Paiement ajouté avec succès");
      setShowConfirm(false);
      reset();
    } catch (err) {
      console.error("Erreur ajout paiement", err);
      alert("Erreur lors de l'ajout du paiement");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Ajouter un paiement</h2>

      <form onSubmit={handleSubmit(handleConfirm)} className="row g-3">
        {/* ✅ Sélecteur élève */}
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

        {/* Le reste du formulaire inchangé */}
        <div className="col-md-6">
          <label className="form-label">Date de paiement</label>
          <input type="date" {...register("date_paiement", { required: true })} className="form-control" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Montant payé (€)</label>
          <input type="number" step="0.01" {...register("montant_paye", { required: true })} className="form-control" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Mode de paiement</label>
          <select {...register("mode_paiement", { required: true })} className="form-select">
            <option value="">-- Choisir --</option>
            <option value="Espèces">Espèces</option>
            <option value="Chèque">Chèque</option>
            <option value="Virement">Virement</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Année scolaire</label>
          <input type="text" {...register("annee_scolaire", { required: true })} className="form-control" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Trimestre</label>
          <select {...register("trimestre", { required: true })} className="form-select">
            <option value="">-- Choisir --</option>
            <option value="1">1er trimestre</option>
            <option value="2">2e trimestre</option>
            <option value="3">3e trimestre</option>
          </select>
        </div>
        <div className="col-md-12">
          <label className="form-label">Reçu (PDF/image)</label>
          <input type="file" {...register("recu")} className="form-control" />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary">Ajouter le paiement</button>
        </div>
      </form>

      {/* Modal de confirmation */}
      <Modal show={showConfirm} onHide={handleCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer l'ajout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous vraiment enregistrer ce paiement ?
        </Modal.Body>
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
