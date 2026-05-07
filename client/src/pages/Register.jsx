// client/src/pages/Register.jsx

/**
 * Register Page
 * -------------
 * Phase 12-A: Role selection checklist added.
 * Users can select Carer, Employer, or both.
 * Admin is not self-selectable — only promotable by existing admins.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";

// Available roles at signup. Admin is intentionally excluded.
const SIGNUP_ROLES = [
  {
    key: "carer",
    label: "Carer",
    description: "I provide informal care for a family member or friend and want to assess my skills.",
    icon: "🤝",
  },
  {
    key: "employer",
    label: "Employer",
    description: "I represent an organisation and want to verify caregiver certificates.",
    icon: "🏢",
  },
];

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedRoles, setSelectedRoles] = useState(["carer"]); // default
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleRole = (roleKey) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleKey)) {
        // Don't allow deselecting all roles
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== roleKey);
      }
      return [...prev, roleKey];
    });
    if (errors.roles) setErrors((prev) => ({ ...prev, roles: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (selectedRoles.length === 0) {
      newErrors.roles = "Please select at least one role";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await register(
        formData.name.trim(),
        formData.email.trim().toLowerCase(),
        formData.password,
        selectedRoles
      );
      toast.success(`Welcome, ${user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
      if (err.message.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: err.message }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 mb-8">Start recognising your caregiving skills.</p>

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Full name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Jane Doe"
            autoComplete="name"
          />
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
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <FormInput
            label="Confirm password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Re-enter password"
            autoComplete="new-password"
          />

          <label className="flex items-center gap-2 mb-6 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show password
          </label>

          {/* Role selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              I am joining as <span className="text-gray-400 font-normal">(select all that apply)</span>
            </p>
            <div className="space-y-2">
              {SIGNUP_ROLES.map((role) => {
                const selected = selectedRoles.includes(role.key);
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => toggleRole(role.key)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${
                      selected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{role.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${selected ? "text-indigo-700" : "text-gray-900"}`}>
                            {role.label}
                          </p>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                            selected
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-gray-300"
                          }`}>
                            {selected && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.roles && (
              <p className="text-red-600 text-xs mt-1">{errors.roles}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
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