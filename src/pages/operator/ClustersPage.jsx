import { useCallback, useEffect, useState } from 'react';
import {
  getClustersByOperator, createCluster, updateCluster, deleteCluster,
} from '../../services/managementService';
import { useOperator }   from '../../context/OperatorContext';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

// ── Validation ────────────────────────────────────────────────────────────────
const validate = (f) => {
  const errs = {};
  if (!f.name.trim()) errs.name = 'Cluster name is required';
  return errs;
};

// ── Form field components — MODULE LEVEL to prevent remounting on re-renders ──
const ClusterFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput label="Cluster Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Science Cluster"
    />
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'name',
    header: 'Cluster Name',
    render: (row) => <span className="font-semibold text-gray-800 dark:text-gray-200">{row.name ?? '—'}</span>,
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
  },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => onEdit(row)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          Edit
        </button>
        <button onClick={() => onDelete(row)}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition">
          Delete
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const ClustersPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search,   setSearch]   = useState('');

  // Create modal
  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [creating,     setCreating]     = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const { operatorId } = useOperator();

  const fetchList = useCallback(async () => {
    if (!operatorId) { setLoading(false); return; }
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getClustersByOperator(operatorId);
      setRows(Array.isArray(data) ? data.filter(r => !r.isDeleted) : []);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const setField = (setter) => (e) => {
    const { name, value } = e.target;
    setter((f) => ({ ...f, [name]: value }));
  };

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name?.toLowerCase().includes(q);
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_FORM); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createCluster({ name: createForm.name.trim() });
      success('Cluster created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit  = (row) => { setEditTarget(row); setEditForm({ name: row.name ?? '' }); setEditErrors({}); };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validate(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateCluster(editTarget.id, { name: editForm.name.trim() });
      success('Cluster updated successfully');
      closeEdit();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDelete  = (row) => setDeleteTarget(row);
  const closeDelete = () => setDeleteTarget(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCluster(deleteTarget.id);
      success('Cluster deleted');
      closeDelete();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(openEdit, openDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clusters"
        subtitle="Manage academic clusters for your school"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Cluster
          </button>
        }
      />

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          placeholder="Search clusters…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {fetchErr ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <DataTable columns={columns} data={filteredRows} loading={loading} emptyMessage="No clusters found." />
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Add Cluster"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Cluster'}
            </button>
          </div>
        }
      >
        <ClusterFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title="Edit Cluster"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <ClusterFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Cluster"
        message={`Are you sure you want to delete cluster "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ClustersPage;
