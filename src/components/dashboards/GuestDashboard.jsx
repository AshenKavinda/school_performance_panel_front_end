import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const GuestDashboard = () => {
  const { user, logout } = useAuth();

  const guestCards = [
    {
      title: 'My Profile',
      description: 'View and update your profile information',
      link: '/profile',
      icon: '👤'
    },
    {
      title: 'My Marks',
      description: 'View your academic performance',
      link: '/my-marks',
      icon: '📊'
    },
    {
      title: 'Academic Progress',
      description: 'Track your progress over time',
      link: '/my-progress',
      icon: '📈'
    },
    {
      title: 'Help & Support',
      description: 'Get help and contact support',
      link: '/help',
      icon: '❓'
    }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Student Portal</h1>
            <p>Welcome back, {user?.email}!</p>
          </div>
          <div className="header-actions">
            <Link to="/profile" className="profile-btn">
              Profile
            </Link>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid guest-grid">
          {guestCards.map((card, index) => (
            <Link to={card.link} key={index} className="dashboard-card">
              <div className="card-icon">{card.icon}</div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default GuestDashboard;
