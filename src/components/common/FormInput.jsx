/**
 * FormInput — labelled input/select/textarea with per-field error support.
 *
 * Props:
 *   label        — Field label string
 *   name         — input name attribute
 *   type         — input type (default: 'text'). Use 'select' for <select>, 'textarea' for <textarea>
 *   value        — controlled value
 *   onChange     — change handler
 *   onBlur       — blur handler (for on-blur validation)
 *   error        — error string; shows red border + message when truthy
 *   required     — shows asterisk next to label
 *   placeholder  — input placeholder
 *   options      — [{ value, label }] array — only used when type='select'
 *   rows         — number of rows — only used when type='textarea'
 *   disabled     — disables the input
 *   hint         — small helper text below input (shown when no error)
 *   className    — extra classes on the wrapper div
 *   inputProps   — extra props spread onto the input element
 */

const baseCls = (error) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
    error
      ? 'border-red-400 bg-red-50 focus:ring-red-400'
      : 'border-gray-300 bg-white focus:ring-indigo-500'
  }`;

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  options = [],
  rows = 3,
  disabled = false,
  hint,
  className = '',
  inputProps = {},
}) => {
  const commonProps = {
    id: name,
    name,
    value,
    onChange,
    onBlur,
    disabled,
    placeholder,
    ...inputProps,
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select {...commonProps} className={`${baseCls(error)} cursor-pointer`}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea {...commonProps} rows={rows} className={baseCls(error)} />
      ) : (
        <input {...commonProps} type={type} className={baseCls(error)} />
      )}

      {error ? (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
};

export default FormInput;
