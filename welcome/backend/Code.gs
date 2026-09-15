/**
 * RMS Welcome kiosk — guest list backend (Google Sheets + Apps Script).
 * Setup steps: welcome/backend/README.md
 *
 * Two tabs are created automatically:
 *   Guests — one row per person (matched by WhatsApp number), with booking count and every date booked.
 *   Visits — one row per check-in, so nothing is ever overwritten.
 * The kiosk only ever learns "known or not" and a first name. Counts and history stay in the sheet.
 */

const NOTIFY_EMAIL = '';        // who gets the "new / returning guest" email. Empty = the Google account that deployed this.
const TZ = 'Africa/Lagos';

const GUEST_HEADERS = ['Phone', 'Name', 'Email', 'Brand', 'Instagram', 'Interests', 'Consent', 'Bookings', 'First visit', 'Last visit', 'Booking dates', 'Spaces booked'];
const VISIT_HEADERS = ['Checked in at', 'Phone', 'Name', 'Booking date', 'Space', 'Returning', 'Booking no.', 'Kiosk ID'];

function doGet() {
  return json({ ok: true, service: 'rms-welcome' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (_) { return json({ ok: false, error: 'bad json' }); }
  if (body.action === 'lookup') return json(lookup(body.phone));
  if (body.action !== 'checkin') return json({ ok: false, error: 'unknown action' });
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // two tablets checking in at once must not double-count
  try { return json(checkin(body)); } finally { lock.releaseLock(); }
}

function lookup(rawPhone) {
  const phone = normPhone(rawPhone);
  if (!phone) return { ok: true, known: false };
  const sh = tab('Guests', GUEST_HEADERS);
  const row = findRow(sh, 1, phone);
  if (!row) return { ok: true, known: false };
  const name = String(sh.getRange(row, 2).getValue() || '');
  return { ok: true, known: true, first: name.trim().split(/\s+/)[0] || '' };
}

function checkin(b) {
  const phone = normPhone(b.phone);
  if (!phone) return { ok: false, error: 'phone' };
  const guests = tab('Guests', GUEST_HEADERS);
  const visits = tab('Visits', VISIT_HEADERS);

  // A retry from the kiosk's offline queue must not count the same visit twice.
  if (b.id && recentIdExists(visits, String(b.id))) return { ok: true };

  const now = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
  const date = clean(b.booking_date).slice(0, 10) || Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const space = clean(b.space_booked);
  const row = findRow(guests, 1, phone);
  let count, name;

  if (row) {
    const r = guests.getRange(row, 1, 1, GUEST_HEADERS.length).getValues()[0];
    count = Number(r[7] || 0) + 1;
    name = clean(b.name) || r[1];
    const dates = r[10] ? String(r[10]).split(', ') : [];
    const spaces = r[11] ? String(r[11]).split(', ') : [];
    dates.push(date);
    if (space) spaces.push(space);
    guests.getRange(row, 1, 1, GUEST_HEADERS.length).setValues([[
      phone, name, clean(b.email) || r[2], clean(b.brand) || r[3], clean(b.instagram) || r[4],
      clean(b.interests) || r[5], b.consent ? 'Yes' : r[6], count, r[8], now, dates.join(', '), spaces.join(', '),
    ]]);
  } else {
    count = 1;
    name = clean(b.name);
    guests.appendRow([phone, name, clean(b.email), clean(b.brand), clean(b.instagram), clean(b.interests), b.consent ? 'Yes' : '', 1, now, now, date, space]);
  }

  visits.appendRow([now, phone, name, date, space, count > 1 ? 'Yes' : 'No', count, clean(b.id)]);
  notify({ count, name, phone, date, space, b });
  return { ok: true };
}

function notify(v) {
  const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;
  const returning = v.count > 1;
  const subject = returning
    ? `Returning guest · ${v.name || v.phone} · booking #${v.count}`
    : `New guest checked in · ${v.name || v.phone}`;
  const lines = [
    returning ? `${v.name || 'A guest'} is back — this is booking #${v.count}. No form needed, new date added to their file.` : 'A new guest checked in at the studio kiosk.',
    '',
    `Name: ${v.name || '—'}`,
    `WhatsApp: +${v.phone}`,
    `Booking date: ${v.date}`,
    `Space: ${v.space || '—'}`,
  ];
  if (!returning) {
    lines.push(`Email: ${clean(v.b.email) || '—'}`, `Brand: ${clean(v.b.brand) || '—'}`, `Instagram: ${clean(v.b.instagram) || '—'}`, `Interests: ${clean(v.b.interests) || '—'}`);
  }
  lines.push('', 'Guest list: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  MailApp.sendEmail(to, subject, lines.join('\n'));
}

// ---------- helpers ----------
function tab(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(name === 'Guests' ? 'A:A' : 'B:B').setNumberFormat('@'); // keep phone numbers as text
  }
  return sh;
}

function findRow(sh, col, value) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const hit = sh.getRange(2, col, last - 1, 1).createTextFinder(value).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function recentIdExists(visits, id) {
  const last = visits.getLastRow();
  if (last < 2 || !id) return false;
  const from = Math.max(2, last - 300);
  return visits.getRange(from, 8, last - from + 1, 1).getValues().some((r) => String(r[0]) === id);
}

function normPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && d[0] === '0') d = '234' + d.slice(1);
  return d.length >= 10 && d.length <= 15 ? d : '';
}

// Stops a typed "=..." being run as a spreadsheet formula.
function clean(v) {
  const s = String(v == null ? '' : v).trim().slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
