import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
const API_URL = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/dashboard/admin`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats(res.data);
      } catch (err) {
        setError("Erreur lors du chargement du tableau de bord.");
      }
    };

    fetchStats();
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stats) return <div>Chargement...</div>;

  // Préparation des données pour le graphique
  const chartData = Object.entries(stats).map(([key, value]) => ({
    name: key,
    value: typeof value === 'number' ? value : parseInt(value.toString().replace(/[^\d]/g, '')) || 0,
  }));

  return (
    <div className="container-fluid mt-4 px-4">

      <h2 className="mb-4">Tableau de bord Administrateur</h2>

      <div className="row">
        {Object.entries(stats).map(([key, value]) => (
          <div className="col-md-3 mb-3" key={key}>
            <div className="card text-white bg-primary h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-capitalize">{key.replace(/_/g, ' ')}</h5>
                <p className="card-text fs-4">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h5>Statistiques Graphiques</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#0d6efd" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AdminDashboard;
