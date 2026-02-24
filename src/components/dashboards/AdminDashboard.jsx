import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import AdminOverview           from '../../pages/admin/AdminOverview';
import ApplicationAdminsPage  from '../../pages/admin/ApplicationAdminsPage';
import TimeSlotsPage           from '../../pages/admin/TimeSlotsPage';
import AdminAccountsPage      from '../../pages/admin/AdminAccountsPage';
import PackagesPage            from '../../pages/admin/PackagesPage';
import PaymentsPage            from '../../pages/admin/PaymentsPage';
import UsersPage               from '../../pages/admin/UsersPage';
import GpaGradingPage          from '../../pages/admin/GpaGradingPage';
import SubjectGradingPage      from '../../pages/admin/SubjectGradingPage';

const AdminDashboard = () => (
  <DashboardLayout title="Admin Dashboard">
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"           element={<AdminOverview />} />
      <Route path="application-admins"  element={<ApplicationAdminsPage />} />
      <Route path="admins"              element={<AdminAccountsPage />} />
      <Route path="packages"            element={<PackagesPage />} />
      <Route path="payments"            element={<PaymentsPage />} />
      <Route path="users"               element={<UsersPage />} />
      <Route path="gpa-grading"         element={<GpaGradingPage />} />
      <Route path="subject-grading"     element={<SubjectGradingPage />} />      <Route path="timeslots"             element={<TimeSlotsPage />} />    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;
