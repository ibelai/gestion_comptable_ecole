import React from 'react';
import AdminDashboard from './AdminDashboard';
import ComptableDashboard from './ComptableDashboard';

const Dashboard = ({ role }) => {
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'comptable':
      return <ComptableDashboard />;
    default:
      return <div>Rôle inconnu</div>;
  }
};

export default Dashboard;
