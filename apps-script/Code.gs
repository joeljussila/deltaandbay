/**
 * Delta & Bay Build Sprint applications -> Google Sheet.
 *
 * Setup (about 2 minutes, once):
 * 1. Open the Sheet "Delta & Bay Build Sprint applications".
 * 2. Extensions > Apps Script. Delete what's there, paste this file, save.
 * 3. Deploy > New deployment > type "Web app".
 *    Execute as: Me. Who has access: Anyone. Deploy, and allow access.
 * 4. Copy the web app URL (ends in /exec) and paste it into SHEET_URL
 *    at the top of js/apply.js.
 */
function doPost(e) {
  var p = (e && e.parameter) || {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var cut = function (s, n) { return String(s || '').slice(0, n); };
  sheet.appendRow([
    new Date(),
    cut(p.name, 200),
    cut(p.email, 320),
    cut(p.building, 500),
    cut(p.link, 500),
    cut(p.want, 3000),
    cut(p.payer, 100),
    cut(p.more, 3000),
    cut(p.page, 300),
    'New', '', '', ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
