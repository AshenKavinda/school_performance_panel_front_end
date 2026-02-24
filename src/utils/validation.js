// ─── Field validators ──────────────────────────────────────────────────────

export const isRequired = (value) =>
  !value || !String(value).trim() ? 'This field is required.' : '';

export const isValidEmail = (value) => {
  if (!value || !String(value).trim()) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(value).toLowerCase()) ? '' : 'Enter a valid email address.';
};

export const isValidPassword = (value) => {
  if (!value) return 'Password is required.';
  if (value.length < 6) return 'Password must be at least 6 characters.';
  return '';
};

export const isValidUsername = (value) => {
  if (!value || !String(value).trim()) return 'Username is required.';
  if (value.trim().length < 3) return 'Username must be at least 3 characters.';
  if (/\s/.test(value)) return 'Username cannot contain spaces.';
  return '';
};

export const isValidPhone = (value) => {
  if (!value) return ''; // optional field
  const re = /^[+]?[\d\s\-().]{7,20}$/;
  return re.test(value) ? '' : 'Enter a valid phone number.';
};

export const isValidDOB = (value) => {
  if (!value) return 'Date of birth is required.';
  const dob = new Date(value);
  const now = new Date();
  if (isNaN(dob.getTime())) return 'Enter a valid date.';
  if (dob >= now) return 'Date of birth must be in the past.';
  const age = now.getFullYear() - dob.getFullYear();
  if (age > 120) return 'Enter a realistic date of birth.';
  return '';
};

export const isValidOtp = (value) => {
  if (!value || !String(value).trim()) return 'OTP is required.';
  if (!/^\d{4,10}$/.test(value.trim())) return 'OTP must be 4–10 digits.';
  return '';
};

export const passwordsMatch = (pass, confirm) => {
  if (!confirm) return 'Please confirm your password.';
  return pass !== confirm ? 'Passwords do not match.' : '';
};

// ─── API error parser ──────────────────────────────────────────────────────
/**
 * Extracts a human-readable message and per-field errors from an Axios error.
 *
 * Handles ASP.NET Core validation shape:
 *   { title, errors: { FieldName: ["msg1"] } }
 * and simple shapes:
 *   { message: "..." }  /  plain string
 *
 * Returns: { apiError: string, fieldErrors: { fieldName: string } }
 *   fieldNames are lowercased for easy comparison
 */
export const parseApiError = (err) => {
  const data = err?.response?.data;

  if (!data) {
    return err?.message || 'An unexpected error occurred. Please try again.';
  }

  // ASP.NET ModelState: { errors: { Email: ["..."], Password: ["..."] } }
  if (data.errors && typeof data.errors === 'object') {
    const messages = [];
    Object.entries(data.errors).forEach(([key, msgs]) => {
      const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
      if (msg) messages.push(msg);
    });

    if (messages.length) return messages.join(' ');
    if (data.title) return data.title;
    return 'Validation failed. Please check your inputs.';
  }

  // Simple message or title
  return (
    data.message ||
    data.title ||
    (typeof data === 'string' ? data : 'Something went wrong. Please try again.')
  );
};
