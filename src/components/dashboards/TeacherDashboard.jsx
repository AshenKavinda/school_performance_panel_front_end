import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();

  const teacherCards = [
    {
      title: 'My Courses',
      description: 'View courses assigned to me',
      link: '/my-courses',
      icon: '📚'
    },
    {
      title: 'Update Student Marks',
      description: 'Update marks for student tests',
      link: '/update-marks',
      icon: '✏️'
    },
    {
      title: 'Class Lists',
      description: 'View students in my courses',
      link: '/class-lists',
      icon: '👥'
    },
    {
      title: 'Test Schedules',
      description: 'View upcoming tests and schedules',
      link: '/test-schedules',
      icon: '📅'
    }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Teacher Dashboard</h1>
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
          {teacherCards.map((card, index) => (
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

export default TeacherDashboard;
