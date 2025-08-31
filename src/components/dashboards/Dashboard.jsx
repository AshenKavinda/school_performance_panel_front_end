import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import ManagerDashboard from './ManagerDashboard';
import OfficerDashboard from './OfficerDashboard';
import TeacherDashboard from './TeacherDashboard';
import GuestDashboard from './GuestDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <p>User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'manager':
      return <ManagerDashboard />;
    case 'officer':
      return <OfficerDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'guest':
      return <GuestDashboard />;
    default:
      return (
        <div className="dashboard-container">
          <div className="error-message">
            <p>Unknown user role: {user.role}</p>
            <p>Please contact administrator for assistance.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;
