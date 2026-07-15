const SGT = 'Asia/Singapore';

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: SGT,
  });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${fmtDate(iso)}, ${d.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SGT,
  })}`;
}

export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}
