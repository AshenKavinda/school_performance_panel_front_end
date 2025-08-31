import React from 'react';
import { useAuth } from '../hooks/useAuth';
import '../components/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return '#667eea';
      case 'teacher':
        return '#48bb78';
      case 'officer':
        return '#ed8936';
      case 'guest':
        return '#9f7aea';
      default:
        return '#718096';
    }
  };

  const getRoleDisplayName = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>School Performance Panel</h1>
          <div className="header-actions">
            <div className="user-info">
              <span className="user-name">Welcome, {user?.email}</span>
              <span 
                className="user-role" 
                style={{ backgroundColor: getRoleColor(user?.role) }}
              >
                {getRoleDisplayName(user?.role || 'guest')}
              </span>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Dashboard</h2>
            <p>Welcome to the School Performance Panel. Your role: <strong>{getRoleDisplayName(user?.role || 'guest')}</strong></p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Reports</h3>
                <p>View performance reports</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Students</h3>
                <p>Manage student records</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <h3>Subjects</h3>
                <p>Manage subjects</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-content">
                <h3>Courses</h3>
                <p>Manage courses</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>Tests</h3>
                <p>Manage tests and exams</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚙️</div>
              <div className="stat-content">
                <h3>Settings</h3>
                <p>Configure system settings</p>
              </div>
            </div>
          </div>

          <div className="role-info">
            <h3>Available Features for {getRoleDisplayName(user?.role || 'guest')}</h3>
            <div className="feature-list">
              {user?.role === 'manager' && (
                <div className="feature-group">
                  <h4>Manager Features:</h4>
                  <ul>
                    <li>View all reports and analytics</li>
                    <li>Access teacher performance reports</li>
                    <li>View student progress across terms</li>
                    <li>Analyze top performing students and courses</li>
                  </ul>
                </div>
              )}
              
              {user?.role === 'officer' && (
                <div className="feature-group">
                  <h4>Officer Features:</h4>
                  <ul>
                    <li>Manage students, subjects, and courses</li>
                    <li>Create and manage tests</li>
                    <li>Handle enrollments</li>
                    <li>Update user profiles</li>
                  </ul>
                </div>
              )}
              
              {user?.role === 'teacher' && (
                <div className="feature-group">
                  <h4>Teacher Features:</h4>
                  <ul>
                    <li>View assigned courses and subjects</li>
                    <li>Access student performance data</li>
                    <li>Manage class enrollments</li>
                  </ul>
                </div>
              )}
              
              {user?.role === 'guest' && (
                <div className="feature-group">
                  <h4>Guest Features:</h4>
                  <ul>
                    <li>Limited access to public information</li>
                    <li>Request access to additional features</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
