/**
 * Login Page
 * ----------
 * Uses AuthContext to log in users.
 */

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "../utils/toast";

import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || "/dashboard";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await login(
        formData.email.trim().toLowerCase(),
        formData.password
      );
      toast.success(`Welcome back, ${user.name}!`);

      // Role-aware redirect:
      // If they were sent here from a specific page, honour that.
      // Otherwise, employer-only users land on employer dashboard.
      const isEmployerOnly =
        Array.isArray(user.roles) &&
        user.roles.includes("employer") &&
        !user.roles.includes("carer") &&
        !user.roles.includes("admin");

      const destination =
        from !== "/dashboard" ? from : isEmployerOnly ? "/employer/dashboard" : "/dashboard";

      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8">Log in to continue your journey.</p>

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormInput
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {/* NEW: Forgot password link */}
          <div className="text-right -mt-2 mb-2">
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <label className="flex items-center gap-2 mb-6 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show password
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
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