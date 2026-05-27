/**
 * FormInput — Reusable form input
 * -------------------------------
 * Props:
 *   label        - input label
 *   name         - field name (matches state key)
 *   type         - "text", "email", "password", etc.
 *   value        - controlled value
 *   onChange     - change handler
 *   error        - optional error message
 *   placeholder  - optional placeholder
 *   ...rest      - any other input attrs (required, minLength, etc.)
 */

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  hint,
  placeholder,
  ...rest
}) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"
        } disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`}

        {...rest}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!error && hint && (
        <p id={`${name}-hint`} className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

export default FormInput;
