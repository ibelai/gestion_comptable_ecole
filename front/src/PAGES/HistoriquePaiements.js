import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Table, Container, Row, Col, Button, Card } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const HistoriquePaiements = () => {
  const { id } = useParams();
  const [eleve, setEleve] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [totalPaye, setTotalPaye] = useState(0);
  const [montantFrais, setMontantFrais] = useState(0);
const API_URL = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eleveRes = await axios.get(`${API_URL}/api/eleves/${id}`);
        setEleve(eleveRes.data);
        setMontantFrais(parseFloat(eleveRes.data.montant_frais) || 0);

        const paiementRes = await axios.get(`${API_URL}/api/paiements/eleve/${id}`);
        setPaiements(paiementRes.data);

        const total = paiementRes.data.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
        setTotalPaye(total);
      } catch (error) {
        console.error("Erreur lors du chargement :", error);
      }
    };

    fetchData();
  }, [id]);

  const montantRestant = montantFrais - totalPaye;
const handlePrint = () => {
  window.print();
};

const exportPDF = () => {
  const doc = new jsPDF();
  doc.text("Historique des paiements", 14, 10);
  autoTable(doc, {
    startY: 20,
    head: [["Date", "Montant", "Mode de paiement", "Commentaire"]],
    body: paiements.map(p => [
      new Date(p.date_paiement).toLocaleDateString(),
      `${p.montant} FCFA`,
      p.mode_paiement,
      p.commentaire,
    ]),
  });
  doc.save(`paiements-${eleve.nom}-${eleve.prenom}.pdf`);
};

const exportExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(
    paiements.map(p => ({
      Date: new Date(p.date_paiement).toLocaleDateString(),
      Montant: p.montant,
      "Mode de paiement": p.mode_paiement,
      Commentaire: p.commentaire,
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Paiements");
  XLSX.writeFile(workbook, `paiements-${eleve.nom}-${eleve.prenom}.xlsx`);
};

  return (
    <Container>
      <h3 className="mt-4 mb-3">Historique des paiements</h3>

      {eleve && (
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col><strong>Nom :</strong> {eleve.nom} {eleve.prenom}</Col>
              <Col><strong>Classe :</strong> {eleve.classe?.nom}</Col>
              <Col><strong>Année scolaire :</strong> {eleve.annee_scolaire}</Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Montant</th>
            <th>Mode de paiement</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          {paiements.map((p, index) => (
            <tr key={index}>
              <td>{new Date(p.date_paiement).toLocaleDateString()}</td>
              <td>{p.montant} FCFA</td>
              <td>{p.mode_paiement}</td>
              <td>{p.commentaire}</td>
            </tr>
          ))}
          {paiements.length === 0 && (
            <tr><td colSpan="4" className="text-center">Aucun paiement enregistré</td></tr>
          )}
        </tbody>
      </Table>

      <Row className="mt-4">
        <Col md={4}><strong>Montant des frais :</strong> {montantFrais} FCFA</Col>
        <Col md={4}><strong>Total payé :</strong> {totalPaye} FCFA</Col>
        <Col md={4}><strong>Reste à payer :</strong> {montantRestant > 0 ? montantRestant : 0} FCFA</Col>
      </Row>

      <div className="mt-4">
        <Button variant="outline-primary" className="me-2">Imprimer</Button>
        <Button variant="outline-success" className="me-2">Exporter PDF</Button>
        <Button variant="outline-secondary">Exporter Excel</Button>
      </div>
    </Container>
  );
};

export default HistoriquePaiements;
