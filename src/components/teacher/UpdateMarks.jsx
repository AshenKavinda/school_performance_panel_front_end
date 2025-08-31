import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import studentMarksService from '../../services/studentMarksService';
import './Teacher.css';

const UpdateMarks = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchTeacherCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await studentMarksService.getTeacherCourses(user.user_id);
      setCourses(response.data || []);
    } catch (err) {
      setError('Failed to load your courses. Please try again.');
      console.error('Failed to fetch teacher courses:', err);
    } finally {
      setLoading(false);
    }
  }, [user.user_id]);

  useEffect(() => {
    if (user?.user_id) {
      fetchTeacherCourses();
    }
  }, [user, fetchTeacherCourses]);

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setMessage('');
    setError('');
    
    if (!courseId) return;

    // For now, we'll show a placeholder message since we need test ID as well
    setMessage('Course selected. In a full implementation, you would select a specific test to view and update student marks.');
  };

  return (
    <div className="teacher-container">
      <header className="teacher-header">
        <div className="header-content">
          <Link to="/dashboard" className="back-btn">
            ← Back to Dashboard
          </Link>
          <h1>Update Student Marks</h1>
        </div>
      </header>

      <div className="teacher-content">
        <div className="teacher-card">
          <h2>Select Course</h2>
          <p>Choose a course to view and update student marks</p>
          
          {message && (
            <div className="message success">{message}</div>
          )}
          
          {error && (
            <div className="message error">{error}</div>
          )}

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your courses...</p>
            </div>
          ) : (
            <div className="course-selection">
              <label htmlFor="course-select">Select Course:</label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="course-select"
              >
                <option value="">-- Select a Course --</option>
                {courses.map((course) => (
                  <option key={course.record_id} value={course.course_id}>
                    {course.course_name} - {course.subject_name} ({course.year})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedCourse && (
            <div className="course-info">
              <h3>Course Information</h3>
              <p>This is a placeholder for the marks update interface.</p>
              <p>In a complete implementation, you would:</p>
              <ul>
                <li>Select a specific test for the course</li>
                <li>View all enrolled students</li>
                <li>Update individual student marks</li>
                <li>Validate mark ranges (0-100)</li>
                <li>Save changes to the database</li>
              </ul>
              
              <div className="placeholder-demo">
                <h4>Demo Mark Update</h4>
                <div className="mark-input-demo">
                  <span>Student: John Doe</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="Enter mark"
                    className="mark-input"
                  />
                  <button 
                    className="update-btn"
                    onClick={() => setMessage('This is a demo. In a real implementation, the mark would be updated.')}
                  >
                    Update Mark
                  </button>
                </div>
              </div>
            </div>
          )}

          {courses.length === 0 && !loading && (
            <div className="no-courses">
              <p>No courses assigned to you yet.</p>
              <p>Contact the officer to get course assignments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateMarks;
