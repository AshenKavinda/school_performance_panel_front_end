import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout       from '../layout/DashboardLayout';
import { StudentProvider }   from '../../context/StudentContext';
import StudentOverview       from '../../pages/student/StudentOverview';
import StudentProfilePage    from '../../pages/student/StudentProfilePage';
import StudentEnrollments    from '../../pages/student/StudentEnrollments';
import StudentMarks          from '../../pages/student/StudentMarks';
import StudentTimetable      from '../../pages/student/StudentTimetable';
import StudentAnalytics      from '../../pages/student/StudentAnalytics';

const StudentDashboard = () => (
  <StudentProvider>
    <DashboardLayout title="Student Dashboard">
      <Routes>
        <Route index                    element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<StudentOverview />} />
        <Route path="profile"           element={<StudentProfilePage />} />
        <Route path="enrollments"       element={<StudentEnrollments />} />
        <Route path="marks"             element={<StudentMarks />} />
        <Route path="timetable"         element={<StudentTimetable />} />
        <Route path="analytics"         element={<StudentAnalytics />} />
      </Routes>
    </DashboardLayout>
  </StudentProvider>
);

export default StudentDashboard;
