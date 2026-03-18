// src/components/dashboard/dashboardUtils.js

/** Returns Monday 00:00:00 of the week containing `date` */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns array of 5 Date objects [Mon, Tue, Wed, Thu, Fri] for the given weekStart */
export function getWeekDays(weekStart) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Format date as "Tue 18" */
export function formatDayLabel(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

/** Is date today? */
export function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/** Is a timestamp within [weekStart, weekStart+5days)? */
export function isInWeek(timestamp, weekStart) {
  const d = new Date(timestamp);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 5);
  return d >= weekStart && d < end;
}

/**
 * Derive engineer status from engineers array + schedules array.
 * Returns 'on_case' | 'travelling' | 'available'
 */
export function getEngineerStatus(engineer, schedules) {
  const now = new Date();
  const activeSchedule = schedules.find(s =>
    s.engineer_id === engineer.id &&
    new Date(s.start_time) <= now &&
    new Date(s.end_time) >= now
  );
  if (activeSchedule) return 'on_case';
  if (engineer.current_location_id && engineer.current_location_id !== engineer.location_id) return 'travelling';
  return 'available';
}

export const STATUS_COLORS = {
  completed:   { bar: 'rgba(52,211,153,0.35)',  border: '#34d399', tag: 'tag-g', label: 'Done'     },
  in_progress: { bar: 'rgba(251,191,36,0.35)',  border: '#fbbf24', tag: 'tag-y', label: 'Active'   },
  assigned:    { bar: 'rgba(96,165,250,0.35)',   border: '#60a5fa', tag: 'tag-b', label: 'Upcoming' },
  open:        { bar: 'rgba(167,139,250,0.35)', border: '#a78bfa', tag: 'tag-p', label: 'Open'     },
  on_hold:     { bar: 'rgba(251,191,36,0.2)',   border: '#fbbf24', tag: 'tag-y', label: 'On Hold'  },
  cancelled:   { bar: 'rgba(156,163,175,0.2)',  border: '#6b7280', tag: 'tag-d', label: 'Cancelled'},
};

export const ENGINEER_STATUS_CONFIG = {
  available:  { color: '#34d399', label: 'Available',  glow: '0 0 5px #34d399' },
  on_case:    { color: '#f87171', label: 'On Case',    glow: '0 0 5px #f87171' },
  travelling: { color: '#fbbf24', label: 'Travelling', glow: '0 0 5px #fbbf24' },
};

/** Get engineer initials from name */
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Gradient backgrounds for avatars, cycling by index */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#a78bfa,#60a5fa)',
  'linear-gradient(135deg,#f43f5e,#fb923c)',
  'linear-gradient(135deg,#34d399,#06b6d4)',
  'linear-gradient(135deg,#fbbf24,#f59e0b)',
  'linear-gradient(135deg,#ec4899,#a78bfa)',
  'linear-gradient(135deg,#60a5fa,#34d399)',
];
export function avatarGradient(index) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

/** Format ISO timestamp as "9:00 AM" */
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Format ISO date as "Mar 18" */
export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
