import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const OfficerDashboard = () => {
  const { user, logout } = useAuth();

  const managementCards = [
    {
      title: 'Students',
      description: 'Manage student records and enrollments',
      link: '/students',
      icon: '👨‍🎓'
    },
    {
      title: 'Subjects',
      description: 'Manage subjects and curriculum',
      link: '/subjects',
      icon: '📚'
    },
    {
      title: 'Courses',
      description: 'Manage courses and academic programs',
      link: '/courses',
      icon: '🎓'
    },
    {
      title: 'Tests',
      description: 'Manage tests and examinations',
      link: '/tests',
      icon: '📝'
    },
    {
      title: 'Student Courses',
      description: 'Manage student course enrollments',
      link: '/student-courses',
      icon: '📋'
    },
    {
      title: 'Subject Enrollments',
      description: 'Manage student subject enrollments',
      link: '/subject-enrollments',
      icon: '📖'
    },
    {
      title: 'Course Subjects',
      description: 'Manage course subject assignments',
      link: '/course-subjects',
      icon: '🔗'
    },
    {
      title: 'Test Enrollments',
      description: 'Manage test enrollments',
      link: '/test-enrollments',
      icon: '✅'
    }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Officer Dashboard</h1>
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
          {managementCards.map((card, index) => (
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

export default OfficerDashboard;
