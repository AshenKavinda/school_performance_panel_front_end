import { useCallback, useEffect, useState } from 'react';
import { useManager } from '../../context/ManagerContext';
import { getOperatorsByAppAdmin } from '../../services/managementService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const ViewOperators = () => {
  const { managerProfile, loading: ctxLoading } = useManager();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');

  const fetchOperators = useCallback(async () => {
    if (!managerProfile?.createdBy) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOperatorsByAppAdmin(managerProfile.createdBy);
      setOperators(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[ViewOperators] fetch failed', e);
      setError('Failed to load operators.');
    } finally {
      setLoading(false);
    }
  }, [managerProfile?.createdBy]);

  useEffect(() => { fetchOperators(); }, [fetchOperators]);

  const filtered = operators.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.username?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.nic?.toLowerCase().includes(q)
    );
  });

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Operators" subtitle="Data-entry operators under your institution" />

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or NIC…"
          className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          {search ? 'No operators match your search.' : 'No operators found.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium">NIC</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((op, i) => (
                  <tr key={op.id} className="border-b border-gray-100 hover:bg-indigo-50/40 transition">
                    <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{op.username ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{op.email ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{op.phoneNumber ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{op.nic ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} operator{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOperators;
