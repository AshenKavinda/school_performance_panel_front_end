import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import AppAdminOverview    from '../../pages/app-admin/AppAdminOverview';
import SubscriptionPage    from '../../pages/app-admin/SubscriptionPage';
import ManagersPage        from '../../pages/app-admin/ManagersPage';
import OperatorsPage       from '../../pages/app-admin/OperatorsPage';
import AppAdminProfilePage from '../../pages/app-admin/AppAdminProfilePage';

const AppAdminDashboard = () => (
  <DashboardLayout title="School Admin Dashboard">
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"    element={<AppAdminOverview />} />
      <Route path="subscription" element={<SubscriptionPage />} />
      <Route path="managers"     element={<ManagersPage />} />
      <Route path="operators"    element={<OperatorsPage />} />
      <Route path="profile"      element={<AppAdminProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default AppAdminDashboard;
