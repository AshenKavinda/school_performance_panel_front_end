import { useCallback, useEffect, useState } from 'react';
import { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from '../../services/timetableService';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, ConfirmDialog, PageHeader,
} from '../../components/common';

const SLOT_NAMES = ['SEVEN', 'EIGHT'];

// ── Validation ────────────────────────────────────────────────────────────────
const validate = (f) => {
  const errs = {};
  if (!f.name)           errs.name      = 'Please select a slot name';
  if (!f.startTime)      errs.startTime = 'Start time is required';
  if (!f.endTime)        errs.endTime   = 'End time is required';
  if (f.startTime && f.endTime && f.startTime >= f.endTime)
    errs.endTime = 'End time must be after start time';
  return errs;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
// Convert HH:mm to HH:mm:ss for the API (timespan format)
const toTimeSpan = (t) => t ? `${t}:00` : '';
// Convert HH:mm:ss or HH:mm:ss.fff back to HH:mm for the input
const fromTimeSpan = (t) => {
  if (!t) return '';
  const parts = t.split(':');
  return parts.length >= 2 ? `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}` : t;
};

// ── Form field components — MODULE LEVEL ──────────────────────────────────────
const TimeSlotFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Slot Name <span className="text-red-500">*</span>
      </label>
      <select name="name" value={form.name} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.name ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select slot name…</option>
        {SLOT_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Start Time <span className="text-red-500">*</span>
      </label>
      <input type="time" name="startTime" value={form.startTime} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.startTime ? 'border-red-400' : 'border-gray-200'}`}
      />
      {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        End Time <span className="text-red-500">*</span>
      </label>
      <input type="time" name="endTime" value={form.endTime} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.endTime ? 'border-red-400' : 'border-gray-200'}`}
      />
      {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime}</p>}
    </div>
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', startTime: '', endTime: '' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'name',
    header: 'Slot Name',
    render: (row) => (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
        {row.name ?? '—'}
      </span>
    ),
  },
  {
    key: 'startTime',
    header: 'Start Time',
    render: (row) => <span className="text-sm font-medium text-gray-700">{fromTimeSpan(row.startTime) || '—'}</span>,
  },
  {
    key: 'endTime',
    header: 'End Time',
    render: (row) => <span className="text-sm font-medium text-gray-700">{fromTimeSpan(row.endTime) || '—'}</span>,
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
const TimeSlotsPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [creating,     setCreating]     = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getTimeSlots();
      setRows(Array.isArray(data) ? data.filter(r => !r.isDeleted) : []);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const setField = (setter) => (e) => {
    const { name, value } = e.target;
    setter((f) => ({ ...f, [name]: value }));
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_FORM); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createTimeSlot({
        name:      createForm.name,
        startTime: toTimeSpan(createForm.startTime),
        endTime:   toTimeSpan(createForm.endTime),
      });
      success('Time slot created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit  = (row) => {
    setEditTarget(row);
    setEditForm({
      name:      row.name ?? '',
      startTime: fromTimeSpan(row.startTime),
      endTime:   fromTimeSpan(row.endTime),
    });
    setEditErrors({});
  };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validate(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateTimeSlot(editTarget.id, {
        name:      editForm.name,
        startTime: toTimeSpan(editForm.startTime),
        endTime:   toTimeSpan(editForm.endTime),
      });
      success('Time slot updated successfully');
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
      await deleteTimeSlot(deleteTarget.id);
      success('Time slot deleted');
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
        title="Time Slots"
        subtitle="Define school period time slots"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Time Slot
          </button>
        }
      />

      {fetchErr ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <DataTable columns={columns} data={rows} loading={loading} emptyMessage="No time slots defined yet." />
        </div>
      )}

      <Modal isOpen={createOpen} onClose={closeCreate} title="Add Time Slot"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Time Slot'}
            </button>
          </div>
        }
      >
        <TimeSlotFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      <Modal isOpen={!!editTarget} onClose={closeEdit} title="Edit Time Slot"
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
        <TimeSlotFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Time Slot"
        message={`Are you sure you want to delete the "${deleteTarget?.name}" time slot? Any timetable entries using this slot will be affected.`}
      />
    </div>
  );
};

export default TimeSlotsPage;
