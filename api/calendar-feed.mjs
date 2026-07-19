// /api/calendar-feed — Barry Burris, NMD · read-only iCalendar (.ics) feed.
//
// This is what Apple Calendar / Google Calendar "subscribe by URL" points at. Standard
// pattern for every calendar app's "secret address in iCal format": no login, just an
// unguessable token in the URL (issued + stored once by /api/calendar's feedUrl action).
// Auto-refreshes on the subscriber's own schedule (Apple/Google poll it periodically —
// this hub doesn't control that cadence, it just serves the current list every time).
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// dependency-free. Degrades to 404 if KV isn't connected yet or the token doesn't match —
// never leaks the event list to a guess.

const NS = 'bb:cal:';
const EVENTS_KEY = NS + 'events';
const TOKEN_KEY = NS + 'feedtoken';

function kvCreds() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && tok ? { url, tok } : null;
}
async function kv(cmd) {
  const c = kvCreds();
  if (!c) throw new Error('no_kv');
  const r = await fetch(c.url, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + c.tok, 'content-type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((j && j.error) || ('kv ' + r.status)); e.status = r.status; throw e; }
  return j ? j.result : null;
}
const getJSON = async (k, d) => { try { const v = await kv(['GET', k]); return v == null ? d : JSON.parse(v); } catch { return d; } };

// ---- US Pacific Time (Coeur d'Alene, ID observes Pacific Time) DST math ----
// Events are stored as naive local "YYYY-MM-DDTHH:MM" strings (no timezone attached — the
// calendar UI just uses whatever the browser's datetime-local input gives it). To publish a
// standards-correct .ics we convert that local time to real UTC using the actual US DST
// rules (2nd Sunday of March -> 1st Sunday of November) rather than a hardcoded offset.
function nthSundayOfMonth(year, month /*1-12*/, n) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstDow = first.getUTCDay();
  const firstSunday = 1 + ((7 - firstDow) % 7);
  return firstSunday + (n - 1) * 7;
}
function isPacificDST(y, m, d) {
  if (m < 3 || m > 11) return false;
  if (m > 3 && m < 11) return true;
  const marchSecondSunday = nthSundayOfMonth(y, 3, 2);
  const novFirstSunday = nthSundayOfMonth(y, 11, 1);
  if (m === 3) return d >= marchSecondSunday;
  return d < novFirstSunday; // m === 11
}
function pacificOffsetHours(y, m, d) { return isPacificDST(y, m, d) ? -7 : -8; }
function localPacificToUTC(localStr) {
  const [datePart, timePart] = String(localStr || '').split('T');
  const [y, mo, da] = (datePart || '').split('-').map(Number);
  const [h, mi] = (timePart || '00:00').split(':').map(Number);
  if (!y || !mo || !da) return null;
  const offset = pacificOffsetHours(y, mo, da); // negative
  return new Date(Date.UTC(y, mo - 1, da, (h || 0) - offset, mi || 0));
}
const pad = (n) => String(n).padStart(2, '0');
function icsUTC(date) {
  return date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) + 'T' +
    pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + pad(date.getUTCSeconds()) + 'Z';
}
function icsDateOnly(localStr) {
  const [datePart] = String(localStr || '').split('T');
  return (datePart || '').replace(/-/g, '');
}
function addDaysToDateOnly(dateOnlyStr) {
  const y = +dateOnlyStr.slice(0, 4), m = +dateOnlyStr.slice(4, 6), d = +dateOnlyStr.slice(6, 8);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate());
}
function fold(line) {
  // RFC 5545 line folding at 75 octets, continuation lines start with a single space.
  if (line.length <= 75) return line;
  let out = line.slice(0, 75), rest = line.slice(75);
  while (rest.length) { out += '\r\n ' + rest.slice(0, 74); rest = rest.slice(74); }
  return out;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
const TYPELABEL = { consult: 'Discovery consult', followup: 'Follow-up', telehealth: 'Telehealth', labs: 'Labs / blood draw', iv: 'IV therapy', procedure: 'Procedure', meeting: 'Meeting', block: 'Blocked / OOO', personal: 'Personal' };

function eventToVEVENT(e) {
  const uid = e.id + '@barry-burris-hub.vercel.app';
  const stamp = icsUTC(new Date());
  const typeLabel = TYPELABEL[e.type] || e.type || '';
  const summaryBits = [e.title, e.resource && e.resource !== 'Barry Burris, NMD' ? e.resource : null].filter(Boolean);
  const lines = ['BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + stamp];

  if (e.allDay) {
    const dOnly = icsDateOnly(e.start);
    const dEnd = e.end ? icsDateOnly(e.end) : addDaysToDateOnly(dOnly);
    lines.push('DTSTART;VALUE=DATE:' + dOnly, 'DTEND;VALUE=DATE:' + dEnd);
  } else {
    const s = localPacificToUTC(e.start);
    const en = e.end ? localPacificToUTC(e.end) : null;
    if (!s) return null;
    lines.push('DTSTART:' + icsUTC(s));
    lines.push('DTEND:' + icsUTC(en || new Date(s.getTime() + 30 * 60000)));
  }
  lines.push('SUMMARY:' + esc(summaryBits.join(' · ')));
  const descBits = [typeLabel, e.mode, e.notes].filter(Boolean);
  if (descBits.length) lines.push('DESCRIPTION:' + esc(descBits.join('\\n')));
  if (e.resource) lines.push('LOCATION:' + esc(e.resource));
  lines.push('END:VEVENT');
  return lines.map(fold).join('\r\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!kvCreds()) { res.statusCode = 404; res.end('Not found'); return; }

  const url = new URL(req.url, 'http://x');
  const key = url.searchParams.get('key') || '';
  const realToken = await getJSON(TOKEN_KEY, null);
  if (!realToken || key !== realToken) { res.statusCode = 404; res.end('Not found'); return; }

  const events = await getJSON(EVENTS_KEY, []);
  const vevents = events.map(eventToVEVENT).filter(Boolean);

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Accelerated Experiences, LLC//Barry Burris NMD Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Barry Burris, NMD — Practice Calendar',
    'X-WR-TIMEZONE:America/Los_Angeles',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
    ...vevents,
    'END:VCALENDAR'
  ].map(fold).join('\r\n');

  res.statusCode = 200;
  res.setHeader('content-type', 'text/calendar; charset=utf-8');
  res.setHeader('content-disposition', 'inline; filename="barry-burris-calendar.ics"');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}
