import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();

  const reportCards = [
    {
      title: 'Top Students',
      description: 'View top performing students by year and term',
      link: '/reports/top-students',
      icon: '🏆'
    },
    {
      title: 'Average Marks',
      description: 'View average marks per subject',
      link: '/reports/average-marks',
      icon: '📊'
    },
    {
      title: 'Teacher Performance',
      description: 'View teacher performance reports',
      link: '/reports/teacher-performance',
      icon: '👨‍🏫'
    },
    {
      title: 'Student Progress',
      description: 'Track student progress across terms',
      link: '/reports/student-progress',
      icon: '📈'
    },
    {
      title: 'Low Performing Subjects',
      description: 'Identify subjects with low performance',
      link: '/reports/low-performing-subjects',
      icon: '⚠️'
    },
    {
      title: 'Top Courses',
      description: 'View top performing courses',
      link: '/reports/top-courses',
      icon: '🎓'
    }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Manager Dashboard</h1>
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
        <div className="dashboard-grid">
          {reportCards.map((card, index) => (
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

export default ManagerDashboard;
