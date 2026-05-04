export const COLORS = [
  '#6c63ff','#22c98e','#f5a623','#f55050',
  '#4bb8ff','#d463ff','#ff6363','#63ffd4',
];

export function colorFor(str = '') {
  let n = 0;
  for (const c of str) n += c.charCodeAt(0);
  return COLORS[n % COLORS.length];
}

export function initials(name = '') {
  return name.split(' ').map((x) => x[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function fmtDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export function daysLeft(dueDate) {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate) - Date.now()) / 86400000);
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

export function getErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0]?.message ||
    err?.message ||
    'Something went wrong'
  );
}
