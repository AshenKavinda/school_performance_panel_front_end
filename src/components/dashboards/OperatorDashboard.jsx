import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout           from '../layout/DashboardLayout';
import { OperatorProvider }      from '../../context/OperatorContext';
import OperatorOverview          from '../../pages/operator/OperatorOverview';
import ClustersPage              from '../../pages/operator/ClustersPage';
import SectionsPage              from '../../pages/operator/SectionsPage';
import ClassesPage               from '../../pages/operator/ClassesPage';
import SubjectsPage              from '../../pages/operator/SubjectsPage';
import ModulesPage               from '../../pages/operator/ModulesPage';
import TeachersPage              from '../../pages/operator/TeachersPage';
import StudentsPage              from '../../pages/operator/StudentsPage';
import EnrollmentsPage           from '../../pages/operator/EnrollmentsPage';
import TeacherAssignmentsPage    from '../../pages/operator/TeacherAssignmentsPage';
import TimeSlotsPage             from '../../pages/operator/TimeSlotsPage';
import TimetablePage             from '../../pages/operator/TimetablePage';
import OperatorProfilePage       from '../../pages/operator/OperatorProfilePage';

const OperatorDashboard = () => (
  <OperatorProvider>
    <DashboardLayout title="Operator Dashboard">
      <Routes>
        <Route index                    element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<OperatorOverview />} />
        <Route path="clusters"          element={<ClustersPage />} />
        <Route path="sections"          element={<SectionsPage />} />
        <Route path="classes"           element={<ClassesPage />} />
        <Route path="subjects"          element={<SubjectsPage />} />
        <Route path="modules"           element={<ModulesPage />} />
        <Route path="teachers"          element={<TeachersPage />} />
        <Route path="students"          element={<StudentsPage />} />
        <Route path="enrollments"       element={<EnrollmentsPage />} />
        <Route path="teacher-assignments" element={<TeacherAssignmentsPage />} />
        <Route path="timeslots"         element={<TimeSlotsPage />} />
        <Route path="timetable"         element={<TimetablePage />} />
        <Route path="profile"           element={<OperatorProfilePage />} />
      </Routes>
    </DashboardLayout>
  </OperatorProvider>
);

export default OperatorDashboard;
