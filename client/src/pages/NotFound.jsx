import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="flex-1 flex items-center justify-center p-4 py-16">
      <div className="text-center">
        <p className="text-indigo-600 font-semibold mb-2">404</p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          Page not found
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Sorry — the page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-lg"
        >
          ← Back to home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;