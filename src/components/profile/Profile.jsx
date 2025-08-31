import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    dob: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getCurrentUser();
      setProfile(response.profile);
      if (response.profile) {
        setFormData({
          name: response.profile.name || '',
          phone_number: response.profile.phone_number || '',
          dob: response.profile.dob || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage('Failed to load profile information.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.phone_number && !/^\+?[\d\s-()]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }
    
    if (formData.dob && new Date(formData.dob) > new Date()) {
      newErrors.dob = 'Date of birth cannot be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setMessage('');
    
    try {
      // Call API to update profile
      const response = await fetch(`/api/user/${user.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setMessage('Profile updated successfully!');
        setEditing(false);
        await fetchProfile(); // Refresh profile data
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'manager': return 'role-badge manager';
      case 'officer': return 'role-badge officer';
      case 'teacher': return 'role-badge teacher';
      case 'guest': return 'role-badge guest';
      default: return 'role-badge';
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <Link to="/dashboard" className="back-btn">
            ← Back to Dashboard
          </Link>
          <h1>My Profile</h1>
        </div>
      </header>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-info">
            <div className="user-avatar">
              <span>{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="user-details">
              <h2>{profile?.name || 'No name set'}</h2>
              <p className="user-email">{user?.email}</p>
              <span className={getRoleBadgeClass(user?.role)}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {editing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                  disabled={saving}
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={errors.phone_number ? 'error' : ''}
                  placeholder="Enter your phone number"
                  disabled={saving}
                />
                {errors.phone_number && (
                  <span className="error-message">{errors.phone_number}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={errors.dob ? 'error' : ''}
                  disabled={saving}
                />
                {errors.dob && (
                  <span className="error-message">{errors.dob}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="cancel-btn"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              <div className="info-group">
                <label>Full Name</label>
                <p>{profile?.name || 'Not set'}</p>
              </div>

              <div className="info-group">
                <label>Phone Number</label>
                <p>{profile?.phone_number || 'Not set'}</p>
              </div>

              <div className="info-group">
                <label>Date of Birth</label>
                <p>{profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'Not set'}</p>
              </div>

              <div className="info-group">
                <label>Account Created</label>
                <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="edit-btn"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
