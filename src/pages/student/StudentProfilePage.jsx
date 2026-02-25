import { useCallback, useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { updateStudentGlobal } from '../../services/managementService';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useToast } from '../../context/ToastContext';

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:w-40 mb-1 sm:mb-0">{label}</span>
    <span className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">Not set</span>}</span>
  </div>
);

const StudentProfilePage = () => {
  const { studentGlobal, studentProfile, loading: ctxLoading } = useStudent();
  const { success, error: toastError } = useToast();

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    firstName:   '',
    lastName:    '',
    phone:       '',
    dateOfBirth: '',
  });

  const openEdit = () => {
    setForm({
      firstName:   studentGlobal?.firstName ?? '',
      lastName:    studentGlobal?.lastName ?? '',
      phone:       studentGlobal?.phone ?? '',
      dateOfBirth: studentGlobal?.dateOfBirth ? studentGlobal.dateOfBirth.substring(0, 10) : '',
    });
    setEditing(true);
  };

  const handleSave = useCallback(async () => {
    if (!studentGlobal?.id) return;
    setSaving(true);
    try {
      await updateStudentGlobal(studentGlobal.id, {
        firstName:   form.firstName || undefined,
        lastName:    form.lastName || undefined,
        phone:       form.phone || undefined,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
      });
      success('Profile updated successfully');
      setEditing(false);
      // Reload page to refresh context
      window.location.reload();
    } catch (e) {
      toastError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [studentGlobal?.id, form, success, toastError]);

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  const displayName = studentGlobal ? `${studentGlobal.firstName || ''} ${studentGlobal.lastName || ''}`.trim() : '—';
  const dob = studentGlobal?.dateOfBirth ? new Date(studentGlobal.dateOfBirth).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="View and update your personal information" />

      {/* Global Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Personal Information</h3>
          {!editing && (
            <button onClick={openEdit}
              className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                <input type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                <input type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <InfoRow label="Full Name" value={displayName} />
            <InfoRow label="Email" value={studentGlobal?.email} />
            <InfoRow label="Phone" value={studentGlobal?.phone} />
            <InfoRow label="Date of Birth" value={dob} />
            <InfoRow label="Username" value={studentGlobal?.username} />
            <InfoRow label="Global Code" value={studentGlobal?.globalStudentCode} />
          </div>
        )}
      </div>

      {/* School Info Card */}
      {studentProfile && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">School Information</h3>
          <InfoRow label="Index Number" value={studentProfile.indexNumber} />
          <InfoRow label="Address" value={studentProfile.address} />
          <InfoRow label="Enrolled Since" value={studentProfile.createdAt ? new Date(studentProfile.createdAt).toLocaleDateString() : null} />
        </div>
      )}

      {/* No school record warning */}
      {!studentProfile && !ctxLoading && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Not linked to a school</p>
              <p className="text-xs text-amber-600 mt-1">Your global student account has not been linked to any school yet. Contact your school operator to register you.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
