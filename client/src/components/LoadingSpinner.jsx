/**
 * LoadingSpinner — Full-page loading indicator
 * --------------------------------------------
 * Used while the AuthContext checks for a saved session on app load.
 */

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16 min-h-[240px]" role="status" aria-live="polite">
      <div className="text-center">
        {/* Pure-CSS spinner */}
        <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" aria-hidden="true" />
        <p className="text-base text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
