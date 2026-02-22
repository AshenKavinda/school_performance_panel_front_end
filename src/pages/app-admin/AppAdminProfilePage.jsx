import { useCallback, useEffect, useState } from 'react';
import { getApplicationAdminByUser, updateApplicationAdmin } from '../../services/managementService';
import { useAuth }       from '../../context/AuthContext';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { FormInput, LoadingSpinner, PageHeader } from '../../components/common';

// ── Application type options ─────────────────────────────────────────────────
const APP_TYPE_OPTIONS = [
  { value: 'SUBJECT_BASE', label: 'Subject Base' },
  { value: 'MODULE_BASE',  label: 'Module Base' },
  { value: 'BOTH',         label: 'Both' },
];

const APP_TYPE_LABELS = {
  SUBJECT_BASE: 'Subject Base',
  MODULE_BASE:  'Module Base',
  BOTH:         'Both',
};

// ── Edit form fields — MODULE LEVEL ───────────────────────────────────────────
const ProfileEditFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput
      label="NIC"
      name="nic"
      value={form.nic}
      onChange={onChange}
      error={errors.nic}
      placeholder="National Identity Card number"
    />
    <FormInput
      label="Application Type"
      name="applicationType"
      type="select"
      value={form.applicationType}
      onChange={onChange}
      error={errors.applicationType}
      options={APP_TYPE_OPTIONS}
    />
  </div>
);

// ── Read-only detail field ────────────────────────────────────────────────────
const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 py-3 border-b border-gray-100 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value ?? '—'}</span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AppAdminProfilePage = () => {
  const { user }                       = useAuth();
  const { success, error: toastError } = useToast();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  // Edit state
  const [editing,    setEditing]    = useState(false);
  const [editForm,   setEditForm]   = useState({ nic: '', applicationType: 'SUBJECT_BASE' });
  const [editErrors, setEditErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getApplicationAdminByUser(user.id);
      setProfile(data);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Field helper ──────────────────────────────────────────────────────────
  const setField = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  // ── Open edit ─────────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({
      nic:             profile?.nic             ?? '',
      applicationType: profile?.applicationType ?? 'SUBJECT_BASE',
    });
    setEditErrors({});
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const updated = await updateApplicationAdmin(profile.id, {
        nic:             editForm.nic || undefined,
        applicationType: editForm.applicationType,
      });
      setProfile((prev) => ({ ...prev, ...updated }));
      success('Profile updated successfully');
      setEditing(false);
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="View and update your school administration profile."
      />

      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && fetchErr && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{fetchErr}</span>
          <button onClick={fetchProfile} className="ml-auto text-sm font-medium underline hover:no-underline">Retry</button>
        </div>
      )}

      {!loading && !fetchErr && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Avatar card ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-600 select-none">
                {(profile.username ?? user?.username ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">{profile.username ?? user?.username ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{profile.email ?? user?.email ?? '—'}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                profile.isActive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {/* ── Details card ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {!editing ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-purple-50">
                  <h2 className="text-sm font-semibold text-purple-800">Profile Details</h2>
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
                <div className="px-5">
                  <Field label="Username"         value={profile.username} />
                  <Field label="Email"            value={profile.email} />
                  <Field label="NIC"              value={profile.nic} />
                  <Field label="Application Type" value={APP_TYPE_LABELS[profile.applicationType] ?? profile.applicationType} />
                  <Field label="Account Status"   value={profile.isActive ? 'Active' : 'Inactive'} />
                  <Field label="Member Since"     value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : null} />
                  <Field label="Last Updated"     value={profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : null} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-purple-50">
                  <h2 className="text-sm font-semibold text-purple-800">Edit Profile</h2>
                </div>
                <div className="px-5 py-5">
                  <ProfileEditFields form={editForm} errors={editErrors} onChange={setField} />
                </div>
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppAdminProfilePage;
