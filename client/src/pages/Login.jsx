import { Link } from "react-router-dom";

function Login() {
  return (
    <section className="flex-1 flex items-center justify-center p-4 py-16">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8">Log in to continue your journey.</p>

        <div className="text-gray-400 italic mb-6">
          🚧 Login form coming in Phase 5
        </div>

        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;