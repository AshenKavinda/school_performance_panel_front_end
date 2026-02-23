import { useCallback, useEffect, useState } from 'react';
import {
  getSectionsByOperator, createSection, updateSection, deleteSection,
  getClustersByOperator,
} from '../../services/managementService';
import { useOperator }   from '../../context/OperatorContext';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

// ── Validation ────────────────────────────────────────────────────────────────
const validateCreate = (f) => {
  const errs = {};
  if (!f.name.trim())    errs.name      = 'Section name is required';
  if (!f.clusterId)      errs.clusterId = 'Please select a cluster';
  return errs;
};
const validateEdit = (f) => {
  const errs = {};
  if (!f.name.trim()) errs.name = 'Section name is required';
  return errs;
};

// ── Form field components — MODULE LEVEL to prevent remounting on re-renders ──
const CreateFormFields = ({ form, errors, onChange, clusters }) => (
  <div className="space-y-4">
    <FormInput label="Section Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Section A"
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Cluster <span className="text-red-500">*</span>
      </label>
      <select
        name="clusterId"
        value={form.clusterId}
        onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.clusterId ? 'border-red-400' : 'border-gray-200'}`}
      >
        <option value="">Select a cluster…</option>
        {clusters.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {errors.clusterId && <p className="mt-1 text-xs text-red-500">{errors.clusterId}</p>}
    </div>
  </div>
);

const EditFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput label="Section Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Section A"
    />
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_CREATE = { name: '', clusterId: '' };
const EMPTY_EDIT   = { name: '' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (clusters, onEdit, onDelete) => [
  {
    key: 'name',
    header: 'Section Name',
    render: (row) => <span className="font-semibold text-gray-800">{row.name ?? '—'}</span>,
  },
  {
    key: 'clusterId',
    header: 'Cluster',
    render: (row) => {
      const cluster = clusters.find(c => c.id === row.clusterId);
      return cluster
        ? <span className="text-sm text-gray-600">{cluster.name}</span>
        : <span className="text-gray-400 italic text-sm">—</span>;
    },
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
          className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-100 transition">
          Edit
        </button>
        <button onClick={() => onDelete(row)}
          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition">
          Delete
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const SectionsPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search,        setSearch]        = useState('');
  const [filterCluster, setFilterCluster] = useState('');

  // Create modal
  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [creating,     setCreating]     = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT);
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
      const [secData, clusData] = await Promise.all([
        getSectionsByOperator(operatorId),
        getClustersByOperator(operatorId),
      ]);
      setRows(Array.isArray(secData)  ? secData.filter(r => !r.isDeleted)  : []);
      setClusters(Array.isArray(clusData) ? clusData.filter(r => !r.isDeleted) : []);
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
    const matchSearch = !q || r.name?.toLowerCase().includes(q);
    const matchCluster = !filterCluster || String(r.clusterId) === filterCluster;
    return matchSearch && matchCluster;
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateCreate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createSection({ name: createForm.name.trim(), clusterId: createForm.clusterId });
      success('Section created successfully');
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
    const errs = validateEdit(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateSection(editTarget.id, { name: editForm.name.trim() });
      success('Section updated successfully');
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
      await deleteSection(deleteTarget.id);
      success('Section deleted');
      closeDelete();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(clusters, openEdit, openDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        subtitle="Manage sections within your clusters"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Section
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search sections…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] sm:w-60 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
        <select
          value={filterCluster}
          onChange={(e) => setFilterCluster(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        >
          <option value="">All clusters</option>
          {clusters.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {fetchErr ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <DataTable columns={columns} data={filteredRows} loading={loading} emptyMessage="No sections found." />
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={closeCreate} title="Add Section"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Section'}
            </button>
          </div>
        }
      >
        <CreateFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} clusters={clusters} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={closeEdit} title="Edit Section"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <EditFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Section"
        message={`Are you sure you want to delete section "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default SectionsPage;
