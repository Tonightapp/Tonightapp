// ============================================================
// Tonight App — Community Sign-Up Webhook
// Deploy as: Google Apps Script → Web App
//   Execute as: Me
//   Who has access: Anyone
// ============================================================
//
// SETUP (one time):
//  1. Go to script.google.com → New project → paste this code
//  2. Replace SHEET_ID below with your Google Sheet ID
//     (from the URL: docs.google.com/spreadsheets/d/SHEET_ID/edit)
//  3. Click Deploy → New deployment → Web app
//     - Execute as: Me
//     - Who has access: Anyone
//  4. Copy the Web App URL → paste into index.html as WEBHOOK_URL
// ============================================================

const SHEET_ID   = 'YOUR_GOOGLE_SHEET_ID_HERE'; // ← replace this
const TAB_NAME   = 'Tonight Community';           // sheet tab name (auto-created)
const ALERT_EMAIL = 'app.tonight1@gmail.com';       // ← your email for new sign-up alerts

// Column headers (in order)
const HEADERS = [
  'Timestamp',
  'Full Name',
  'Phone',
  'Email',
  'City',
  'Genre 1',
  'Genre 2',
  'Genre 3',
  'Message',
  'Source',
  'User Agent'
];

// ── Entry point for POST requests ────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    // Route to correct sheet tab based on source
    if (data.source === 'pro-event-submission') {
      saveProEvent(data);
      if (ALERT_EMAIL) sendProAlert(data);
    } else if (data.source === 'pro-signup') {
      saveProSignup(data);
      if (ALERT_EMAIL) sendProSignupAlert(data);
    } else {
      saveToSheet(data);
      if (ALERT_EMAIL) sendAlert(data);
    }
    return jsonOk({ status: 'ok', message: 'Saved successfully' });
  } catch (err) {
    return jsonOk({ status: 'error', message: err.message });
  }
}

// ── Entry point for GET (health check) ───────────────────────
function doGet(e) {
  return jsonOk({ status: 'ok', service: 'Tonight Webhook', time: new Date().toISOString() });
}

// ── Save row to sheet ─────────────────────────────────────────
function saveToSheet(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(TAB_NAME);

  // Auto-create tab with headers if it doesn't exist
  if (!tab) {
    tab = ss.insertSheet(TAB_NAME);
    tab.appendRow(HEADERS);
    tab.getRange(1, 1, 1, HEADERS.length)
       .setFontWeight('bold')
       .setBackground('#0a0b14')
       .setFontColor('#f5c842');
    tab.setFrozenRows(1);
  }

  const genres = data.genres || [];
  const row = [
    new Date(),
    data.name        || '',
    data.phone       || '',
    data.email       || '',
    data.city        || '',
    genres[0]        || '',
    genres[1]        || '',
    genres[2]        || '',
    data.message     || '',
    data.source      || 'tonight-app',
    data.userAgent   || ''
  ];

  tab.appendRow(row);

  // Auto-resize columns for readability
  tab.autoResizeColumns(1, HEADERS.length);
}

// ── Email alert on new sign-up ────────────────────────────────
function sendAlert(data) {
  const subject = `🎉 New Tonight sign-up: ${data.name || 'Unknown'} — ${data.city || '?'}`;
  const body = `
New community member signed up on Tonight app.

Name:    ${data.name  || '—'}
Phone:   ${data.phone || '—'}
Email:   ${data.email || '—'}
City:    ${data.city  || '—'}
Genres:  ${(data.genres || []).join(', ') || '—'}
Message: ${data.message || '—'}

Time: ${new Date().toLocaleString()}
  `.trim();

  MailApp.sendEmail(ALERT_EMAIL, subject, body);
}

// ── Save pro event submission ─────────────────────────────────
const PRO_TAB     = 'Pro Event Submissions';
const PRO_HEADERS = [
  'Timestamp', 'Status',
  'Business Name', 'Venue Type', 'City', 'Address',
  'Event Title', 'Date', 'Doors Open', 'Genre', 'Capacity',
  'Description', 'Special Offer',
  'Contact Name', 'Phone', 'Email', 'Instagram', 'Website',
  'Submitted At'
];

function saveProEvent(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(PRO_TAB);

  if (!tab) {
    tab = ss.insertSheet(PRO_TAB);
    tab.appendRow(PRO_HEADERS);
    tab.getRange(1, 1, 1, PRO_HEADERS.length)
       .setFontWeight('bold')
       .setBackground('#0a1828')
       .setFontColor('#00d084');
    tab.setFrozenRows(1);
  }

  tab.appendRow([
    new Date(),
    'Pending Review',           // Status — you update this manually
    data.businessName  || '',
    data.venueType     || '',
    data.city          || '',
    data.address       || '',
    data.eventTitle    || '',
    data.date          || '',
    data.doorsOpen     || '',
    data.genre         || '',
    data.capacity      || '',
    data.description   || '',
    data.specialOffer  || '',
    data.contactName   || '',
    data.phone         || '',
    data.email         || '',
    data.instagram     || '',
    data.website       || '',
    data.submittedAt   || ''
  ]);

  tab.autoResizeColumns(1, PRO_HEADERS.length);
}

// ── Email alert for new pro event submission ──────────────────
function sendProAlert(data) {
  const subject = `🎉 New Event Submission: ${data.eventTitle || '?'} — ${data.city || '?'}`;
  const body = `
New event submitted on Tonight app for review.

BUSINESS  : ${data.businessName || '—'} (${data.venueType || '—'})
EVENT     : ${data.eventTitle || '—'}
DATE      : ${data.date || '—'} at ${data.doorsOpen || '—'}
CITY      : ${data.city || '—'}
ADDRESS   : ${data.address || '—'}
GENRE     : ${data.genre || '—'}
CAPACITY  : ${data.capacity || '—'}
OFFER     : ${data.specialOffer || '—'}

CONTACT
  Name    : ${data.contactName || '—'}
  Phone   : ${data.phone || '—'}
  Email   : ${data.email || '—'}
  IG      : ${data.instagram || '—'}
  Website : ${data.website || '—'}

DESCRIPTION:
${data.description || '—'}

Submitted: ${new Date().toLocaleString()}

→ Review in Google Sheets and update Status to "Listed" or "Rejected".
  `.trim();

  MailApp.sendEmail(ALERT_EMAIL, subject, body);
}

// ── Save pro account sign-up ──────────────────────────────────
const PRO_SIGNUP_TAB     = 'Pro Account Sign-Ups';
const PRO_SIGNUP_HEADERS = ['Timestamp', 'Name', 'Business Name', 'Email', 'Source', 'User Agent'];

function saveProSignup(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(PRO_SIGNUP_TAB);
  if (!tab) {
    tab = ss.insertSheet(PRO_SIGNUP_TAB);
    tab.appendRow(PRO_SIGNUP_HEADERS);
    tab.getRange(1, 1, 1, PRO_SIGNUP_HEADERS.length)
       .setFontWeight('bold').setBackground('#0a1828').setFontColor('#f5c842');
    tab.setFrozenRows(1);
  }
  tab.appendRow([new Date(), data.name || '', data.businessName || '', data.email || '', data.source || 'pro-signup', data.userAgent || '']);
  tab.autoResizeColumns(1, PRO_SIGNUP_HEADERS.length);
}

function sendProSignupAlert(data) {
  const subject = `🏢 New Business Sign-Up: ${data.name || '?'} — ${data.businessName || '?'}`;
  const body = `
New business account created on Tonight.

Name:          ${data.name         || '—'}
Business:      ${data.businessName || '—'}
Email:         ${data.email        || '—'}
Signed up at:  ${new Date().toLocaleString()}
  `.trim();
  MailApp.sendEmail(ALERT_EMAIL, subject, body);
}

// ── Helper: return JSON response with CORS headers ────────────
function jsonOk(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
