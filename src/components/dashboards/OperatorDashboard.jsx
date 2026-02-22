import DashboardLayout from '../layout/DashboardLayout';

const OperatorDashboard = () => {
  return (
    <DashboardLayout title="Operator Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            { label: 'Clusters', value: '—', color: 'bg-teal-50 text-teal-700 border-teal-200' },
            { label: 'Classes', value: '—', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Teachers', value: '—', color: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'Students', value: '—', color: 'bg-lime-50 text-lime-700 border-lime-200' },
            { label: 'Subjects', value: '—', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
              <p className="text-xs font-medium opacity-80">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Operator Dashboard — Phase 5 will add full management features.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OperatorDashboard;
