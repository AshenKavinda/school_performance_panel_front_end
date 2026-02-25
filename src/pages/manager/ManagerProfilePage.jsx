import { useState } from 'react';
import { updateManager } from '../../services/managementService';
import { useManager } from '../../context/ManagerContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { FormInput, LoadingSpinner, PageHeader, Modal } from '../../components/common';

// ── Edit form fields ──────────────────────────────────────────────────────────
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
  </div>
);

// ── Read-only detail row ──────────────────────────────────────────────────────
const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 py-3 border-b border-gray-100 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value ?? '—'}</span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const ManagerProfilePage = () => {
  const { managerProfile: ctxProfile, loading, error: ctxError } = useManager();
  const { success, error: toastError } = useToast();

  const [profile, setProfile]   = useState(null);
  const resolvedProfile         = profile ?? ctxProfile;

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nic: '' });
  const [editErrs, setEditErrs] = useState({});
  const [saving, setSaving]     = useState(false);

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({ nic: resolvedProfile?.nic ?? '' });
    setEditErrs({});
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
    setEditErrs(er => ({ ...er, [name]: null }));
  };

  const handleSave = async () => {
    if (!resolvedProfile) return;
    setSaving(true);
    try {
      const updated = await updateManager(resolvedProfile.id, {
        nic: editForm.nic || null,
      });
      setProfile(updated);
      success('Profile updated successfully');
      closeEdit();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Renders ───────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;
  }

  if (ctxError) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" subtitle="Your manager account details" />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{ctxError}</div>
      </div>
    );
  }

  const initials = (resolvedProfile?.username ?? 'M')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const createdDate = resolvedProfile?.createdAt
    ? new Date(resolvedProfile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Your manager account details"
        action={
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        }
      />

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{resolvedProfile?.username ?? '—'}</h3>
            <p className="text-sm text-white/80 truncate">{resolvedProfile?.email ?? '—'}</p>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-4">
          <Field label="Username" value={resolvedProfile?.username} />
          <Field label="Email" value={resolvedProfile?.email} />
          <Field label="Phone" value={resolvedProfile?.phoneNumber} />
          <Field label="NIC" value={resolvedProfile?.nic} />
          <Field label="Created By" value={resolvedProfile?.createdByUsername} />
          <Field label="Member Since" value={createdDate} />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={closeEdit}
        title="Edit Profile"
        size="sm"
        footer={
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button
              onClick={closeEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition"
            >
              {saving && <LoadingSpinner size="sm" color="border-white" inline />}
              Save Changes
            </button>
          </div>
        }
      >
        <div className="px-6 py-4">
          <ProfileEditFields form={editForm} errors={editErrs} onChange={handleFieldChange} />
        </div>
      </Modal>
    </div>
  );
};

export default ManagerProfilePage;
