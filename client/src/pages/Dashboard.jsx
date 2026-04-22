function Dashboard() {
  return (
    <section className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your Dashboard
          </h1>
          <p className="text-gray-500 mb-8">
            Welcome back! Here's your caregiving journey at a glance.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 bg-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-600 font-medium">Assessments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="p-6 bg-purple-50 rounded-xl">
              <p className="text-sm text-purple-600 font-medium">Skills Mapped</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">—</p>
            </div>
            <div className="p-6 bg-pink-50 rounded-xl">
              <p className="text-sm text-pink-600 font-medium">Certificates</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
            </div>
          </div>

          <div className="text-gray-400 italic">
            🚧 Full dashboard coming in Phase 6
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;