/* Build Sprint application: inline checks, then save to the Google Sheet
   (through the Apps Script web app) and to Supabase site_requests as a backup.
   The thank-you shows once either save goes through. */
(function () {
  'use strict';

  // Paste the Apps Script web app URL here (see apps-script/Code.gs).
  var SHEET_URL = '';
  // Public, insert-only key: row level security lets it add rows, never read them.
  var SB_URL = 'https://mlovfbrycwvzyiugczoi.supabase.co/rest/v1/site_requests';
  var SB_KEY = 'sb_publishable_1nGzPV-LVDN52y7qwKPz_g_LjpVe2wO';

  var form = document.getElementById('apply-form');
  if (!form) return;
  function $(id) { return document.getElementById(id); }
  function val(el) { return el ? el.value.trim() : ''; }
  var f = { name: $('a-name'), email: $('a-email'), building: $('a-building'), link: $('a-link'), want: $('a-want'), more: $('a-more') };
  var send = $('a-send'), summary = $('a-summary'), thanks = $('a-thanks'), failed = $('a-failed');

  function payer() {
    var c = form.querySelector('input[name="payer"]:checked');
    return c ? c.value : '';
  }
  function setErr(el, msg) {
    var err = $(el.id + '-err');
    if (msg) { el.setAttribute('aria-invalid', 'true'); if (err) { err.hidden = false; err.querySelector('span').textContent = msg; } }
    else { el.removeAttribute('aria-invalid'); if (err) err.hidden = true; }
  }
  function check() {
    var problems = [];
    var rules = [
      [f.name, 'Add your name.'],
      [f.email, 'Add an email we can reply to.'],
      [f.building, 'Tell us what you’re building, in a line.'],
      [f.want, 'Tell us what you want from Shenzhen.']
    ];
    rules.forEach(function (r) {
      var bad = !val(r[0]);
      if (r[0] === f.email && !bad && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val(f.email))) { bad = true; r[1] = 'That email doesn’t look complete.'; }
      setErr(r[0], bad ? r[1] : '');
      if (bad) problems.push([r[0], r[1]]);
    });
    var pErr = $('a-payer-err');
    if (!payer()) { pErr.hidden = false; problems.push([form.querySelector('input[name="payer"]'), 'Choose who would pay.']); }
    else pErr.hidden = true;
    return problems;
  }
  function showSummary(problems) {
    var ul = summary.querySelector('ul');
    ul.innerHTML = '';
    problems.forEach(function (p) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + p[0].id; a.textContent = p[1];
      li.appendChild(a); ul.appendChild(li);
    });
    summary.hidden = false;
    summary.focus();
  }
  function data() {
    return {
      name: val(f.name), email: val(f.email), building: val(f.building), link: val(f.link),
      want: val(f.want), payer: payer(), more: val(f.more), page: location.pathname
    };
  }
  function toSheet(d) {
    if (!SHEET_URL || !window.fetch) return Promise.reject(new Error('no sheet'));
    // no-cors: Apps Script answers with a redirect we can't read, so a sent request counts as saved
    return fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(d) });
  }
  function toSupabase(d) {
    if (!window.fetch) return Promise.reject(new Error('no fetch'));
    var row = {
      channel: 'form', needs: ['sprint-application'], need_labels: 'Build Sprint application',
      building: d.building.slice(0, 500), other: d.link.slice(0, 500),
      more: ('Wants from Shenzhen: ' + d.want + (d.more ? '\n\nAnything else: ' + d.more : '')).slice(0, 5000),
      payer: d.payer.slice(0, 100), name: d.name.slice(0, 200), email: d.email.slice(0, 320),
      page: d.page.slice(0, 500), user_agent: navigator.userAgent.slice(0, 500)
    };
    return fetch(SB_URL, {
      method: 'POST', keepalive: true,
      headers: { apikey: SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    }).then(function (r) { if (!r.ok) throw new Error('save failed ' + r.status); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var problems = check();
    if (problems.length) { showSummary(problems); return; }
    summary.hidden = true; failed.hidden = true;
    send.setAttribute('aria-busy', 'true'); send.disabled = true;
    var d = data();
    var ok = false;
    var a = toSheet(d).then(function () { ok = true; }, function () {});
    var b = toSupabase(d).then(function () { ok = true; }, function () {});
    Promise.all([a, b]).then(function () {
      send.removeAttribute('aria-busy'); send.disabled = false;
      if (ok) {
        $('a-thanks-name').textContent = d.name.split(' ')[0];
        form.hidden = true; thanks.hidden = false; thanks.focus();
      } else {
        var msg = 'Build Sprint application\nName: ' + d.name + '\nEmail: ' + d.email + '\nBuilding: ' + d.building + '\nLink: ' + d.link + '\nFrom Shenzhen: ' + d.want + '\nWho pays: ' + d.payer + '\nAnything else: ' + d.more;
        $('a-fail-wa').href = 'https://wa.me/447376975831?text=' + encodeURIComponent(msg);
        $('a-fail-em').href = 'mailto:info@deltaandbay.com?subject=' + encodeURIComponent('Build Sprint application') + '&body=' + encodeURIComponent(msg);
        failed.hidden = false; failed.focus();
      }
    });
  });
  [f.name, f.email, f.building, f.want].forEach(function (el) {
    el.addEventListener('blur', function () { if (el.getAttribute('aria-invalid')) check(); });
  });
})();
