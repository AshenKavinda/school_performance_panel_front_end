import DashboardLayout from '../layout/DashboardLayout';

const AppAdminDashboard = () => {
  return (
    <DashboardLayout title="School Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { label: 'Managers', value: '—', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'Operators', value: '—', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { label: 'Subscription Status', value: '—', color: 'bg-green-50 text-green-700 border-green-200' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm">Application Admin Dashboard — Phase 4 will add full functionality.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppAdminDashboard;
