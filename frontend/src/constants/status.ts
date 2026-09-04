/* Central status → appearance mapping.
   Every status label and semantic tone in the app is defined here once,
   so a status never gets re-coloured differently across modules. */

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'processing'
  | 'neutral';

export interface StatusMeta {
  variant: StatusVariant;
  label: string;
}

export const STATUS_META: Record<string, StatusMeta> = {
  /* Appointments */
  scheduled: { variant: 'info', label: 'Scheduled' },
  waiting: { variant: 'warning', label: 'Waiting' },
  in_progress: { variant: 'processing', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },

  /* People */
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'neutral', label: 'Inactive' },
  on_leave: { variant: 'warning', label: 'On Leave' },
  admitted: { variant: 'info', label: 'Admitted' },
  discharged: { variant: 'neutral', label: 'Discharged' },
  available: { variant: 'success', label: 'Available' },
  busy: { variant: 'warning', label: 'Busy' },
  away: { variant: 'neutral', label: 'Away' },

  /* Beds */
  occupied: { variant: 'processing', label: 'Occupied' },
  maintenance: { variant: 'warning', label: 'Maintenance' },

  /* Billing */
  paid: { variant: 'success', label: 'Paid' },
  pending: { variant: 'warning', label: 'Pending' },
  partial: { variant: 'info', label: 'Partially Paid' },
  overdue: { variant: 'danger', label: 'Overdue' },

  /* Pharmacy */
  in_stock: { variant: 'success', label: 'In Stock' },
  low_stock: { variant: 'warning', label: 'Low Stock' },
  out_of_stock: { variant: 'danger', label: 'Out of Stock' },
  expired: { variant: 'danger', label: 'Expired' },

  /* Laboratory */
  requested: { variant: 'info', label: 'Requested' },
  collected: { variant: 'processing', label: 'Sample Collected' },
  processing: { variant: 'processing', label: 'Processing' },

  /* Prescriptions */
  dispensed: { variant: 'success', label: 'Dispensed' },

  /* Priorities */
  routine: { variant: 'info', label: 'Routine' },
  urgent: { variant: 'warning', label: 'Urgent' },
  stat: { variant: 'danger', label: 'STAT' },

  /* Patient type */
  new: { variant: 'info', label: 'New' },
  returning: { variant: 'neutral', label: 'Returning' },

  /* Departments */
  operational: { variant: 'success', label: 'Operational' },
};

/** Tinted badge classes — light and dark variants, AA-friendly text shades. */
export const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-destructive-soft text-destructive-strong',
  info: 'bg-info-soft text-info-strong',
  processing: 'bg-processing-soft text-processing-strong',
  neutral: 'bg-muted text-muted-foreground',
};

export const VARIANT_DOT: Record<StatusVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  processing: 'bg-processing',
  neutral: 'bg-muted-foreground',
};
