import { useState } from 'react';
import { updateOperator } from '../../services/managementService';
import { useOperator }    from '../../context/OperatorContext';
import { useToast }       from '../../context/ToastContext';
import { parseApiError }  from '../../utils/validation';
import { FormInput, LoadingSpinner, PageHeader, Modal } from '../../components/common';

// ── Edit form fields — MODULE LEVEL ──────────────────────────────────────────
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
const OperatorProfilePage = () => {
  const { operatorProfile: ctxProfile, loading, error: ctxError } = useOperator();
  const { success, error: toastError } = useToast();

  const [profile,  setProfile]  = useState(null);
  const [fetchErr, setFetchErr] = useState(null);

  // Sync local profile state from context
  const resolvedProfile = profile ?? ctxProfile;

  const [editOpen,  setEditOpen]  = useState(false);
  const [editForm,  setEditForm]  = useState({ nic: '' });
  const [editErrs,  setEditErrs]  = useState({});
  const [saving,    setSaving]    = useState(false);

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({ nic: resolvedProfile?.nic ?? '' });
    setEditErrs({});
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
    setEditErrs((er) => ({ ...er, [name]: null }));
  };

  const handleSave = async () => {
    if (!resolvedProfile) return;
    setSaving(true);
    try {
      const updated = await updateOperator(resolvedProfile.id, { nic: editForm.nic || null });
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

  if (ctxError || fetchErr) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" subtitle="Your operator account details" />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{ctxError ?? fetchErr}</div>
      </div>
    );
  }

  const initials = (resolvedProfile?.username ?? 'O')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const createdDate = resolvedProfile?.createdAt
    ? new Date(resolvedProfile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Your operator account details" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Avatar card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-700 select-none">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{resolvedProfile?.username ?? '—'}</h2>
            <p className="text-sm text-gray-500">{resolvedProfile?.email ?? '—'}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            resolvedProfile?.isDeleted ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
          }`}>
            {resolvedProfile?.isDeleted ? 'Inactive' : 'Active'}
          </span>
          <button
            onClick={openEdit}
            className="mt-2 w-full px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
          >
            Edit Profile
          </button>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Account Information</h3>
          <div className="divide-y divide-gray-100">
            <Field label="Username"    value={resolvedProfile?.username}          />
            <Field label="Email"       value={resolvedProfile?.email}             />
            <Field label="Phone"       value={resolvedProfile?.phoneNumber}       />
            <Field label="NIC"         value={resolvedProfile?.nic}               />
            <Field label="Account ID"  value={resolvedProfile?.id}                />
            <Field label="User ID"     value={resolvedProfile?.userId}            />
            <Field label="Created by"  value={resolvedProfile?.createdByUsername} />
            <Field label="Created at"  value={createdDate}                        />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={closeEdit}
        title="Edit Profile"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <ProfileEditFields form={editForm} errors={editErrs} onChange={handleFieldChange} />
      </Modal>
    </div>
  );
};

export default OperatorProfilePage;
