/**
 * Home — Landing page
 * -------------------
 * Smart CTAs: different buttons depending on auth state.
 */

import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 py-16">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
          <span className="text-3xl">🫶</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
          {isAuthenticated ? `Welcome back, ${user.name.split(" ")[0]}!` : "CareAble"}
        </h1>

        <p className="text-lg md:text-xl text-indigo-600 font-medium mb-6">
          Supporting hidden caregiving workers
        </p>

        <p className="text-gray-600 leading-relaxed mb-8">
          A platform for unpaid carers to self-assess their caregiving skills,
          align with the Australian Skills Classification, and receive a digital
          certificate recognising their valuable contribution.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Home;