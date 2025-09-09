import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
     const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000' ;

  const COLORS = {
    totalEleves: '#0d6efd',
    totalComptables: '#6f42c1',
    totalClasses: '#20c997',
    totalFrais: '#ffc107',
    totalAttendu: '#fd7e14',
    totalPaye: '#198754',
    soldeRestant: '#dc3545',
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/dashboard/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement du tableau de bord.");
      }
    };
    fetchStats();
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stats) return <div>Chargement...</div>;

  // Données pour les cartes générales
  const generalData = [
    { name: 'Élèves', value: stats.totalEleves, color: COLORS.totalEleves },
    { name: 'Comptables', value: stats.totalComptables, color: COLORS.totalComptables },
    { name: 'Classes', value: stats.totalClasses, color: COLORS.totalClasses },
    { name: 'Frais configurés', value: stats.totalFrais, color: COLORS.totalFrais },
  ];

  // Données financières (camembert)
  const financeData = [
    { name: 'Total attendu', value: stats.totalAttendu, color: COLORS.totalAttendu },
    { name: 'Total payé', value: stats.totalPaye, color: COLORS.totalPaye },
    { name: 'Solde restant', value: stats.soldeRestant, color: COLORS.soldeRestant },
  ];

  return (
    <div className="container-fluid mt-4 px-4">
      <h2 className="mb-4">Tableau de bord Comptable</h2>

      {/* Cartes générales */}
      <div className="row">
        {generalData.map(({ name, value, color }) => (
          <div className="col-md-3 mb-3" key={name}>
            <div className="card text-white h-100 shadow-sm" style={{ backgroundColor: color }}>
              <div className="card-body">
                <h5 className="card-title">{name}</h5>
                <p className="card-text fs-4">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique financier (camembert) */}
      <div className="mt-5">
        <h5>Répartition financière</h5>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={financeData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {financeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AdminDashboard;
