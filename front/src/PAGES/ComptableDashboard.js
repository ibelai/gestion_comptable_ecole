import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

function ComptableDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const COLORS = ['#28a745', '#ffc107', '#dc3545'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/dashboard/comptable', {
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

  // Données pour PieChart
  const pieData = Object.entries(stats).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    value: typeof value === 'number' ? value : parseInt(value.toString().replace(/[^\d]/g, '')) || 0,
  }));

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Tableau de bord Comptable</h2>

      <div className="row">
        {Object.entries(stats).map(([key, value]) => (
          <div className="col-md-4 mb-3" key={key}>
            <div className="card text-white bg-success h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-capitalize">{key.replace(/_/g, ' ')}</h5>
                <p className="card-text fs-4">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h5>Répartition des paiements</h5>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={100} label>
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ComptableDashboard;
