import { Link } from "react-router-dom";

function Register() {
  return (
    <section className="flex-1 flex items-center justify-center p-4 py-16">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 mb-8">Start supporting your caregiving journey.</p>

        <div className="text-gray-400 italic mb-6">
          🚧 Register form coming in Phase 5
        </div>

        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Register;