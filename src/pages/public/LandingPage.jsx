import { Link } from 'react-router-dom';

// ── Icons ─────────────────────────────────────────────────────────────────────
const AcademicCapIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);
const ChartIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const features = [
  {
    icon: <AcademicCapIcon />,
    title: 'Academic Tracking',
    desc: 'Track student marks, grades, and GPA across subjects and modules in real-time.',
  },
  {
    icon: <ChartIcon />,
    title: 'Performance Analytics',
    desc: 'Comprehensive analytics dashboards for teachers, managers, and administrators.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Role-Based Access',
    desc: 'Secure, role-specific dashboards for admins, operators, teachers, students, and managers.',
  },
  {
    icon: <UsersIcon />,
    title: 'Multi-School Support',
    desc: 'Platform supports multiple schools with independent data, operators, and grading configs.',
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      {/* ── Navbar ── */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            School Performance Panel
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/student-lookup"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 transition"
            >
              <SearchIcon />
              Student Lookup
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Empowering Schools with
            <span className="text-indigo-600"> Data-Driven Insights</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto">
            A comprehensive school performance management system that connects administrators, 
            teachers, students, and parents through transparent academic tracking and analytics.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md hover:shadow-lg"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/student-lookup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
            >
              <SearchIcon />
              Look Up Student Results
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA for Schools ── */}
      <section className="bg-indigo-600 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to transform your school&apos;s performance tracking?
          </h2>
          <p className="text-indigo-200 mb-6 max-w-xl mx-auto">
            Register as a School Admin to set up your institution, configure grading, and start tracking student performance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register?tab=school"
              className="px-6 py-3 text-base font-medium text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl transition shadow"
            >
              Register as School
            </Link>
            <Link
              to="/register?tab=student"
              className="px-6 py-3 text-base font-medium text-white border border-white/40 hover:bg-white/10 rounded-xl transition"
            >
              Register as Student
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} School Performance Panel. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/student-lookup" className="hover:text-white transition">Student Lookup</Link>
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
