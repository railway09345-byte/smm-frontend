/**
 * Comprehensive Timezone and Date/Time Utilities
 * Supports explicit IANA timezones (Asia/Kolkata default), zero-drift UTC conversions,
 * daylight saving transitions, and roundtrip consistency across browser and server.
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export const SUPPORTED_TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)', offset: '+05:30' },
  { id: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { id: 'America/New_York', label: 'America/New_York (US Eastern)', offset: 'ET' },
  { id: 'America/Chicago', label: 'America/Chicago (US Central)', offset: 'CT' },
  { id: 'America/Denver', label: 'America/Denver (US Mountain)', offset: 'MT' },
  { id: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific)', offset: 'PT' },
  { id: 'Europe/London', label: 'Europe/London (UK GMT/BST)', offset: 'GMT/BST' },
  { id: 'Europe/Paris', label: 'Europe/Paris (Central Europe)', offset: 'CET' },
  { id: 'Asia/Dubai', label: 'Asia/Dubai (Gulf Time, UTC+4)', offset: '+04:00' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8)', offset: '+08:00' },
  { id: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)', offset: '+09:00' },
  { id: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)', offset: 'AEST' }
];

/**
 * Ensures an ISO string without timezone indicator is treated as UTC.
 */
export function ensureUtcIso(isoString) {
  if (!isoString) return null;
  const str = String(isoString).trim();
  if (str.endsWith('Z') || str.includes('+') || (str.includes('-') && str.lastIndexOf('-') > 10)) {
    return str;
  }
  return `${str}Z`;
}

/**
 * Parses a UTC ISO timestamp (or Date) and extracts its local wall-clock components
 * in the specified target IANA timezone.
 */
export function parseUtcToLocalParts(utcInput, timeZone = DEFAULT_TIMEZONE) {
  if (!utcInput) {
    return {
      date: '',
      time: '',
      formattedDate: '—',
      formattedTime: '',
      formattedDateTime: '—',
      timeZone
    };
  }

  const validUtcIso = ensureUtcIso(utcInput);
  const d = new Date(validUtcIso);
  if (isNaN(d.getTime())) {
    return {
      date: '',
      time: '',
      formattedDate: '—',
      formattedTime: '',
      formattedDateTime: '—',
      timeZone
    };
  }

  const targetTz = timeZone || DEFAULT_TIMEZONE;

  // Extract numeric YYYY-MM-DD
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: targetTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit' });
  const dateStr = dateFmt.format(d); // "YYYY-MM-DD" // Extract 24-hour HH:mm
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: targetTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const timeStr = timeFmt.format(d); // "HH:mm" // Formatted human readable strings
  const displayDateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: targetTz,
    year: 'numeric',
    month: 'short',
    day: 'numeric' });
  const formattedDate = displayDateFmt.format(d);

  const displayTimeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: targetTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const formattedTime = displayTimeFmt.format(d);

  const formattedDateTime = `${formattedDate}, ${formattedTime}`;

  return {
    date: dateStr,
    time: timeStr,
    formattedDate,
    formattedTime,
    formattedDateTime,
    timeZone: targetTz
  };
}

/**
 * Combines local date (YYYY-MM-DD) and local time (HH:mm) in a target IANA timezone
 * into an unambiguous UTC ISO 8601 string (with 'Z').
 * Uses iterative convergence with Intl.DateTimeFormat to perfectly account for
 * local offsets and Daylight Saving Time without guessing or external dependencies.
 */
export function combineLocalToUtcIso(dateStr, timeStr, timeZone = DEFAULT_TIMEZONE) {
  if (!dateStr || !timeStr) return null;

  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h) || isNaN(min)) return null;

  const targetTz = timeZone || DEFAULT_TIMEZONE;
  const targetUtcMs = Date.UTC(y, m - 1, d, h, min, 0);

  // Initial estimate
  let guessUtc = targetUtcMs;

  const getTzMs = (epochMs) => {
    const dObj = new Date(epochMs);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23' });
    const parts = {};
    for (const p of fmt.formatToParts(dObj)) {
      if (p.type !== 'literal') parts[p.type] = parseInt(p.value, 10);
    }
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  };

  // Converge to exact millisecond offset
  for (let i = 0; i < 4; i++) {
    const tzMs = getTzMs(guessUtc);
    const diff = tzMs - targetUtcMs;
    if (diff === 0) break;
    guessUtc -= diff;
  }

  return new Date(guessUtc).toISOString();
}

/**
 * Formats a UTC timestamp into human readable text in the given timezone.
 */
export function formatUtcInTimezone(utcInput, timeZone = DEFAULT_TIMEZONE, options = {}) {
  if (!utcInput) return '—';
  const validUtcIso = ensureUtcIso(utcInput);
  const d = new Date(validUtcIso);
  if (isNaN(d.getTime())) return '—';

  const defaultOpts = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone || DEFAULT_TIMEZONE,
    ...options
  };

  return new Intl.DateTimeFormat('en-US', defaultOpts).format(d);
}

/**
 * Provides preview description and UTC instant for a user selection in the form.
 */
export function getUtcInstantDescription(dateStr, timeStr, timeZone = DEFAULT_TIMEZONE) {
  if (!dateStr || !timeStr) {
    return {
      utcIso: null,
      localPreview: '',
      utcPreview: '',
      isInPast: false
    };
  }

  const utcIso = combineLocalToUtcIso(dateStr, timeStr, timeZone);
  if (!utcIso) {
    return {
      utcIso: null,
      localPreview: '',
      utcPreview: '',
      isInPast: false
    };
  }

  const d = new Date(utcIso);
  const now = new Date();
  const isInPast = d.getTime() < now.getTime() - 60000; // 1 min grace

  const parts = parseUtcToLocalParts(utcIso, timeZone);
  const localPreview = `${parts.formattedDateTime} (${timeZone})`;

  const utcFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const utcPreview = `${utcFmt.format(d)} UTC`;

  return {
    utcIso,
    localPreview,
    utcPreview,
    isInPast
  };
}
