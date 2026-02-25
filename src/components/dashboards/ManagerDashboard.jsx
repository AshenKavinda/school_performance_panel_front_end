import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout       from '../layout/DashboardLayout';
import { ManagerProvider }   from '../../context/ManagerContext';
import ManagerOverview       from '../../pages/manager/ManagerOverview';
import ViewOperators         from '../../pages/manager/ViewOperators';
import ViewTeachers          from '../../pages/manager/ViewTeachers';
import ViewStudents          from '../../pages/manager/ViewStudents';
import ViewClasses           from '../../pages/manager/ViewClasses';
import ManagerAnalytics      from '../../pages/manager/ManagerAnalytics';
import ManagerProfilePage    from '../../pages/manager/ManagerProfilePage';

const ManagerDashboard = () => (
  <ManagerProvider>
    <DashboardLayout title="Manager Dashboard">
      <Routes>
        <Route index                    element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<ManagerOverview />} />
        <Route path="operators"         element={<ViewOperators />} />
        <Route path="teachers"          element={<ViewTeachers />} />
        <Route path="students"          element={<ViewStudents />} />
        <Route path="classes"           element={<ViewClasses />} />
        <Route path="analytics"         element={<ManagerAnalytics />} />
        <Route path="profile"           element={<ManagerProfilePage />} />
      </Routes>
    </DashboardLayout>
  </ManagerProvider>
);

export default ManagerDashboard;
