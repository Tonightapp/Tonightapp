// ============================================================
// Tonight App — Master Webhook
// Handles: guestlist joins, community sign-ups, event listings,
//          pro sign-ups, deal claims — saves to Sheets + emails guest
//
// SETUP (one time):
//  1. Go to script.google.com → New project → paste this whole file
//  2. Replace SHEET_ID with your Google Sheet ID
//     (from URL: docs.google.com/spreadsheets/d/SHEET_ID/edit)
//  3. Deploy → New deployment → Web app
//     - Execute as: Me
//     - Who has access: Anyone
//  4. Copy Web App URL → paste into index.html as COMMUNITY_WEBHOOK
//  5. On first POST it will ask for Gmail permission — click Allow
// ============================================================

const SHEET_ID    = 'YOUR_GOOGLE_SHEET_ID_HERE'; // ← replace with your Sheet ID
const ADMIN_EMAIL = 'app.tonight1@gmail.com';     // ← your admin email for alerts
const APP_NAME    = 'Tonight Vietnam';
const APP_URL     = 'https://www.tonightvietnam.com';

// ── Router ───────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    switch (data.source) {
      case 'guestlist-join':
        saveGuestlistJoin(data);
        sendGuestlistConfirmation(data);   // QR email to guest
        sendGuestlistAlert(data);          // alert to admin
        break;
      case 'pro-event-submission':
        saveProEvent(data);
        sendProAlert(data);
        break;
      case 'pro-signup':
        saveProSignup(data);
        sendProSignupAlert(data);
        break;
      case 'deal-claim':
        saveDealClaim(data);
        break;
      default:
        saveToSheet(data);
        sendAlert(data);
    }
    return jsonOk({ status: 'ok' });
  } catch (err) {
    return jsonOk({ status: 'error', message: err.message });
  }
}

function doGet() {
  return jsonOk({ status: 'ok', service: 'Tonight Webhook', time: new Date().toISOString() });
}

// ═══════════════════════════════════════════════════════════════
// GUESTLIST JOINS
// ═══════════════════════════════════════════════════════════════
const GL_TAB = 'Guestlist Joins';
const GL_HEADERS = [
  'Timestamp', 'Ref', 'Status',
  'Guest Name', 'Email', 'Phone',
  'Event', 'Date', 'Venue', 'City',
  'Ticket Type', 'Guests (qty)',
  'Device', 'Source'
];

function saveGuestlistJoin(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(GL_TAB);
  if (!tab) {
    tab = ss.insertSheet(GL_TAB);
    tab.appendRow(GL_HEADERS);
    tab.getRange(1, 1, 1, GL_HEADERS.length)
       .setFontWeight('bold')
       .setBackground('#0a1828')
       .setFontColor('#00d084');
    tab.setFrozenRows(1);
    tab.setColumnWidth(1, 160);
    tab.setColumnWidth(4, 160);
    tab.setColumnWidth(5, 200);
    tab.setColumnWidth(7, 200);
  }
  tab.appendRow([
    new Date(),
    data.ref            || '',
    'Valid',
    data.buyerName      || '',
    data.buyerEmail     || '',
    data.buyerPhone     || '',
    data.eventTitle     || '',
    data.date           || '',
    data.venue          || '',
    data.city           || '',
    data.ticketType     || 'Guestlist',
    data.qty            || 1,
    data.deviceType     || '',
    data.source         || 'guestlist-join'
  ]);
}

// Send branded HTML email with QR code to the guest
function sendGuestlistConfirmation(data) {
  if (!data.buyerEmail) return;

  const ref       = data.ref        || 'TN-XXXX-XXXX-XXXX';
  const name      = data.buyerName  || 'Guest';
  const firstName = name.split(' ')[0];
  const event     = data.eventTitle || 'Your Event';
  const date      = data.date       || '';
  const venue     = data.venue      || '';
  const city      = data.city       || '';
  const qty       = data.qty        || 1;
  const type      = data.ticketType || 'Guestlist';

  // QR image URL — encodes TONIGHT:TN-REF for the scanner to read
  const qrData    = encodeURIComponent('TONIGHT:' + ref);
  const qrUrl     = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=000000&bgcolor=ffffff&data=' + qrData;

  const subject = '🎟 Your Tonight Ticket — ' + event;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0b14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b14;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0f1020;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);max-width:520px;width:100%">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0a1828,#0d2040);padding:28px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07)">
          <div style="font-size:28px;font-weight:900;letter-spacing:4px;color:#f5c842;font-family:Georgia,serif">TONIGHT</div>
          <div style="font-size:11px;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-top:4px;text-transform:uppercase">Vietnam · Southeast Asia</div>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:28px 32px 0">
          <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:6px">You're on the list, ${firstName}! 🎉</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6">Your guestlist spot is confirmed. Show the QR code at the door — staff will scan it to check you in instantly.</div>
        </td></tr>

        <!-- Event info bar -->
        <tr><td style="padding:20px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,208,132,0.07);border:1px solid rgba(0,208,132,0.2);border-radius:10px;padding:16px">
            <tr>
              <td style="font-size:16px;font-weight:700;color:#ffffff;padding-bottom:10px">${event}</td>
            </tr>
            <tr><td>
              <table cellpadding="0" cellspacing="0">
                ${date   ? `<tr><td style="font-size:12px;color:rgba(255,255,255,0.45);padding-right:8px;padding-bottom:5px">📅</td><td style="font-size:13px;color:rgba(255,255,255,0.8);padding-bottom:5px">${date}</td></tr>` : ''}
                ${venue  ? `<tr><td style="font-size:12px;color:rgba(255,255,255,0.45);padding-right:8px;padding-bottom:5px">📍</td><td style="font-size:13px;color:rgba(255,255,255,0.8);padding-bottom:5px">${venue}${city ? ', ' + city : ''}</td></tr>` : ''}
                <tr><td style="font-size:12px;color:rgba(255,255,255,0.45);padding-right:8px;padding-bottom:5px">🎟</td><td style="font-size:13px;color:rgba(255,255,255,0.8);padding-bottom:5px">${type} × ${qty} ${qty == 1 ? 'person' : 'people'}</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- QR Code ticket -->
        <tr><td style="padding:0 32px 24px;text-align:center">
          <div style="background:#ffffff;border-radius:12px;padding:20px;display:inline-block;margin:0 auto">
            <img src="${qrUrl}" width="220" height="220" alt="Your Tonight QR Code" style="display:block;border-radius:4px"/>
            <div style="margin-top:10px;font-size:10px;font-weight:700;letter-spacing:2px;color:#666;font-family:monospace">${ref}</div>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:12px">Show this QR at venue entry · Staff will scan to check you in</div>
        </td></tr>

        <!-- Steps -->
        <tr><td style="padding:0 32px 28px">
          <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:12px">How it works</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="28" valign="top" style="padding-bottom:10px"><div style="width:22px;height:22px;border-radius:50%;background:rgba(245,200,66,0.15);border:1px solid rgba(245,200,66,0.3);text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#f5c842">1</div></td>
              <td style="font-size:13px;color:rgba(255,255,255,0.65);padding-left:10px;padding-bottom:10px">Save this email or screenshot your QR code</td>
            </tr>
            <tr>
              <td width="28" valign="top" style="padding-bottom:10px"><div style="width:22px;height:22px;border-radius:50%;background:rgba(245,200,66,0.15);border:1px solid rgba(245,200,66,0.3);text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#f5c842">2</div></td>
              <td style="font-size:13px;color:rgba(255,255,255,0.65);padding-left:10px;padding-bottom:10px">Arrive at the venue and head to the entrance</td>
            </tr>
            <tr>
              <td width="28" valign="top"><div style="width:22px;height:22px;border-radius:50%;background:rgba(0,208,132,0.15);border:1px solid rgba(0,208,132,0.3);text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#00d084">3</div></td>
              <td style="font-size:13px;color:rgba(255,255,255,0.65);padding-left:10px">Show your QR — staff scans and you're in ✓</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.06);padding:18px 32px;text-align:center">
          <div style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.7">
            This is a free guestlist request — entry is subject to venue confirmation.<br>
            Tonight does not charge for guestlist spots.<br>
            <a href="${APP_URL}" style="color:rgba(255,255,255,0.35)">${APP_URL}</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  MailApp.sendEmail({
    to:       data.buyerEmail,
    subject:  subject,
    htmlBody: html,
    name:     APP_NAME
  });
}

function sendGuestlistAlert(data) {
  const subject = `🎟 New Guestlist Join: ${data.buyerName || '?'} → ${data.eventTitle || '?'}`;
  const body = `
New guestlist registration on Tonight Vietnam.

GUEST
  Name   : ${data.buyerName  || '—'}
  Email  : ${data.buyerEmail || '—'}
  Phone  : ${data.buyerPhone || '—'}

EVENT
  Title  : ${data.eventTitle || '—'}
  Date   : ${data.date       || '—'}
  Venue  : ${data.venue      || '—'}
  City   : ${data.city       || '—'}

TICKET
  Type   : ${data.ticketType || 'Guestlist'}
  Guests : ${data.qty        || 1}
  Ref    : ${data.ref        || '—'}

Device   : ${data.deviceType || '—'}
Time     : ${new Date().toLocaleString()}
`.trim();
  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
}

// ═══════════════════════════════════════════════════════════════
// DEAL CLAIMS
// ═══════════════════════════════════════════════════════════════
const DEAL_TAB     = 'Deal Claims';
const DEAL_HEADERS = ['Timestamp', 'Code', 'Deal Title', 'Venue', 'City', 'Discount', 'Guest Name', 'Guest Email', 'Device'];

function saveDealClaim(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(DEAL_TAB);
  if (!tab) {
    tab = ss.insertSheet(DEAL_TAB);
    tab.appendRow(DEAL_HEADERS);
    tab.getRange(1, 1, 1, DEAL_HEADERS.length)
       .setFontWeight('bold').setBackground('#1a0828').setFontColor('#c084fc');
    tab.setFrozenRows(1);
  }
  tab.appendRow([
    new Date(),
    data.code       || '',
    data.dealTitle  || '',
    data.venueName  || '',
    data.city       || '',
    data.discount   || '',
    data.guestName  || '',
    data.guestEmail || '',
    data.deviceType || ''
  ]);
}

// ═══════════════════════════════════════════════════════════════
// COMMUNITY SIGN-UPS
// ═══════════════════════════════════════════════════════════════
const TAB_NAME = 'Tonight Community';
const HEADERS  = ['Timestamp','Full Name','Phone','Email','City','Genre 1','Genre 2','Genre 3','Message','Source','User Agent'];

function saveToSheet(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(TAB_NAME);
  if (!tab) {
    tab = ss.insertSheet(TAB_NAME);
    tab.appendRow(HEADERS);
    tab.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#0a0b14').setFontColor('#f5c842');
    tab.setFrozenRows(1);
  }
  const genres = data.genres || [];
  tab.appendRow([new Date(), data.name||'', data.phone||'', data.email||'', data.city||'', genres[0]||'', genres[1]||'', genres[2]||'', data.message||'', data.source||'tonight-app', data.userAgent||'']);
  tab.autoResizeColumns(1, HEADERS.length);
}

function sendAlert(data) {
  const subject = `🎉 New Tonight sign-up: ${data.name || 'Unknown'} — ${data.city || '?'}`;
  MailApp.sendEmail(ADMIN_EMAIL, subject,
    `Name: ${data.name||'—'}\nPhone: ${data.phone||'—'}\nEmail: ${data.email||'—'}\nCity: ${data.city||'—'}\nGenres: ${(data.genres||[]).join(', ')||'—'}\nTime: ${new Date().toLocaleString()}`);
}

// ═══════════════════════════════════════════════════════════════
// PRO EVENT SUBMISSIONS
// ═══════════════════════════════════════════════════════════════
const PRO_TAB     = 'Pro Event Submissions';
const PRO_HEADERS = ['Timestamp','Status','Business Name','Venue Type','City','Address','Event Title','Date','Doors Open','Genre','Capacity','Description','Special Offer','Contact Name','Phone','Email','Instagram','Website','Submitted At'];

function saveProEvent(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(PRO_TAB);
  if (!tab) {
    tab = ss.insertSheet(PRO_TAB);
    tab.appendRow(PRO_HEADERS);
    tab.getRange(1,1,1,PRO_HEADERS.length).setFontWeight('bold').setBackground('#0a1828').setFontColor('#00d084');
    tab.setFrozenRows(1);
  }
  tab.appendRow([new Date(),'Pending Review',data.businessName||'',data.venueType||'',data.city||'',data.address||'',data.eventTitle||'',data.date||'',data.doorsOpen||'',data.genre||'',data.capacity||'',data.description||'',data.specialOffer||'',data.contactName||'',data.phone||'',data.email||'',data.instagram||'',data.website||'',data.submittedAt||'']);
  tab.autoResizeColumns(1, PRO_HEADERS.length);
}

function sendProAlert(data) {
  const subject = `🎉 New Event Submission: ${data.eventTitle||'?'} — ${data.city||'?'}`;
  MailApp.sendEmail(ADMIN_EMAIL, subject,
    `BUSINESS: ${data.businessName||'—'} (${data.venueType||'—'})\nEVENT: ${data.eventTitle||'—'}\nDATE: ${data.date||'—'} at ${data.doorsOpen||'—'}\nCITY: ${data.city||'—'}\nCONTACT: ${data.contactName||'—'} · ${data.phone||'—'} · ${data.email||'—'}\n\nSubmitted: ${new Date().toLocaleString()}\n→ Review in Google Sheets.`);
}

// ═══════════════════════════════════════════════════════════════
// PRO ACCOUNT SIGN-UPS
// ═══════════════════════════════════════════════════════════════
const PRO_SIGNUP_TAB     = 'Pro Account Sign-Ups';
const PRO_SIGNUP_HEADERS = ['Timestamp','Name','Business Name','Email','Source','User Agent'];

function saveProSignup(data) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let   tab = ss.getSheetByName(PRO_SIGNUP_TAB);
  if (!tab) {
    tab = ss.insertSheet(PRO_SIGNUP_TAB);
    tab.appendRow(PRO_SIGNUP_HEADERS);
    tab.getRange(1,1,1,PRO_SIGNUP_HEADERS.length).setFontWeight('bold').setBackground('#0a1828').setFontColor('#f5c842');
    tab.setFrozenRows(1);
  }
  tab.appendRow([new Date(),data.name||'',data.businessName||'',data.email||'',data.source||'pro-signup',data.userAgent||'']);
}

function sendProSignupAlert(data) {
  MailApp.sendEmail(ADMIN_EMAIL, `🏢 New Business Sign-Up: ${data.name||'?'} — ${data.businessName||'?'}`,
    `Name: ${data.name||'—'}\nBusiness: ${data.businessName||'—'}\nEmail: ${data.email||'—'}\nTime: ${new Date().toLocaleString()}`);
}

// ── Helper ────────────────────────────────────────────────────
function jsonOk(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
