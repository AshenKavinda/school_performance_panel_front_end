import Badge from './Badge';

/**
 * StatusTag — maps common API status/type strings to coloured badges.
 *
 * Usage: <StatusTag value="ACTIVE" /> · <StatusTag value="SUBJECT_BASE" />
 */

const STATUS_MAP = {
  // boolean-like
  ACTIVE:       { label: 'Active',        variant: 'success' },
  INACTIVE:     { label: 'Inactive',      variant: 'error'   },
  ENABLED:      { label: 'Enabled',       variant: 'success' },
  DISABLED:     { label: 'Disabled',      variant: 'error'   },
  VERIFIED:     { label: 'Verified',      variant: 'success' },
  UNVERIFIED:   { label: 'Unverified',    variant: 'warning' },
  DELETED:      { label: 'Deleted',       variant: 'error'   },

  // classType / applicationType
  SUBJECT_BASE: { label: 'Subject Base',  variant: 'info'    },
  MODULE_BASE:  { label: 'Module Base',   variant: 'purple'  },
  BOTH:         { label: 'Both',          variant: 'teal'    },

  // termTest
  FIRST_TERM:   { label: '1st Term',      variant: 'info'    },
  SECOND_TERM:  { label: '2nd Term',      variant: 'purple'  },
  FINAL_TERM:   { label: 'Final Term',    variant: 'orange'  },

  // payment
  PAID:         { label: 'Paid',          variant: 'success' },
  PENDING:      { label: 'Pending',       variant: 'warning' },
  FAILED:       { label: 'Failed',        variant: 'error'   },
  EXPIRED:      { label: 'Expired',       variant: 'error'   },

  // roles
  ADMIN:             { label: 'Admin',           variant: 'error'   },
  APPLICATION_ADMIN: { label: 'School Admin',    variant: 'purple'  },
  MANAGER:           { label: 'Manager',         variant: 'info'    },
  OPERATOR:          { label: 'Operator',        variant: 'teal'    },
  TEACHER:           { label: 'Teacher',         variant: 'orange'  },
  STUDENT:           { label: 'Student',         variant: 'emerald' },
  GUEST:             { label: 'Guest',           variant: 'default' },
};

const StatusTag = ({ value, dot = true, size = 'md', fallbackLabel }) => {
  if (value === null || value === undefined) return null;

  // Support boolean shortcuts
  const key = value === true  ? 'ACTIVE'
            : value === false ? 'INACTIVE'
            : String(value).toUpperCase();

  const mapped = STATUS_MAP[key];
  const label  = mapped?.label ?? fallbackLabel ?? String(value);
  const variant = mapped?.variant ?? 'default';

  return <Badge variant={variant} size={size} dot={dot}>{label}</Badge>;
};

export default StatusTag;
