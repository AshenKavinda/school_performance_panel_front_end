import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout       from '../layout/DashboardLayout';
import { TeacherProvider }   from '../../context/TeacherContext';
import TeacherOverview       from '../../pages/teacher/TeacherOverview';
import TeacherTimetable      from '../../pages/teacher/TeacherTimetable';
import MyAssignments         from '../../pages/teacher/MyAssignments';
import ClassStudents         from '../../pages/teacher/ClassStudents';
import MarkEntry             from '../../pages/teacher/MarkEntry';
import TeacherAnalytics      from '../../pages/teacher/TeacherAnalytics';
import TeacherProfilePage    from '../../pages/teacher/TeacherProfilePage';

const TeacherDashboard = () => (
  <TeacherProvider>
    <DashboardLayout title="Teacher Dashboard">
      <Routes>
        <Route index                    element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<TeacherOverview />} />
        <Route path="timetable"         element={<TeacherTimetable />} />
        <Route path="assignments"       element={<MyAssignments />} />
        <Route path="students"          element={<ClassStudents />} />
        <Route path="mark-entry"        element={<MarkEntry />} />
        <Route path="analytics"         element={<TeacherAnalytics />} />
        <Route path="profile"           element={<TeacherProfilePage />} />
      </Routes>
    </DashboardLayout>
  </TeacherProvider>
);

export default TeacherDashboard;
