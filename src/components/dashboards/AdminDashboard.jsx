import DashboardLayout from '../layout/DashboardLayout';

const AdminDashboard = () => {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Schools', value: '—', color: 'bg-red-50 text-red-700 border-red-200' },
            { label: 'Active Subscriptions', value: '—', color: 'bg-orange-50 text-orange-700 border-orange-200' },
            { label: 'Total Packages', value: '—', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            { label: 'Total Revenue', value: '—', color: 'bg-green-50 text-green-700 border-green-200' },
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">Platform Admin Dashboard — Phase 3 will add full functionality.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
