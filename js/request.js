/* The request form: prefill from the URL, inline checks, a readable message
   for WhatsApp or email, the thank-you state, and the tray that seats each
   answered field. On send, the request is saved to Supabase (table
   public.site_requests, insert-only for the public key), then the button opens
   WhatsApp or the visitor's mail app with the message ready. */
(function () {
  'use strict';

  var PHONE = '447376975831';
  var EMAIL = 'info@deltaandbay.com';
  // Public, insert-only key: row level security lets it add rows, never read them.
  var SB_URL = 'https://mlovfbrycwvzyiugczoi.supabase.co/rest/v1/site_requests';
  var SB_KEY = 'sb_publishable_1nGzPV-LVDN52y7qwKPz_g_LjpVe2wO';
  var form = document.getElementById('req-form');
  if (!form) return;

  function $(id) { return document.getElementById(id); }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var f = {
    building: $('f-building'), other: $('f-other'), more: $('f-more'), when: $('f-when'),
    name: $('f-name'), email: $('f-email'), whatsapp: $('f-whatsapp')
  };
  var needs = all('input[name="need"]', form);
  var payers = all('input[name="payer"]', form);
  var otherBox = $('other-box');
  var noPartHelp = $('f-more-help2');
  var fields = $('req-fields');
  var send = form.querySelector('.send');
  var thanks = $('thanks');
  var summary = $('err-summary');
  var errList = $('err-list');
  var sendWa = $('send-wa');
  var sendEm = $('send-em');
  var tried = false;
  var lastMessage = '';
  var savedMessage = '';

  function val(el) { return el ? (el.value || '').trim() : ''; }

  /* ---- prefill: request.html?need=part&text=words ---- */
  function prefill() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    var keys = [];
    params.getAll('need').forEach(function (v) {
      v.split(',').forEach(function (k) { k = k.trim().toLowerCase(); if (k) keys.push(k); });
    });
    // older links still land on the right option
    var alias = { dates: 'sprint', data: 'buydata', components: 'part', supplier: 'part', lab: 'intro', rig: 'hardware' };
    keys = keys.map(function (k) { return alias[k] || k; });
    needs.forEach(function (box) { if (keys.indexOf(box.value) !== -1) box.checked = true; });
    var text = params.get('text');
    if (text && text.trim()) f.more.value = text.trim();
  }

  /* ---- reveals: "What else?" and the no-part help ---- */
  function syncReveals() {
    var other = needs.filter(function (n) { return n.value === 'other'; })[0];
    otherBox.hidden = !(other && other.checked);
    var sprintish = needs.some(function (n) { return n.value === 'sprint' && n.checked; });
    noPartHelp.hidden = !sprintish;
  }

  /* ---- the message ---- */
  function needList() {
    return needs.filter(function (n) { return n.checked; }).map(function (n) {
      var label = n.getAttribute('data-label');
      if (n.value === 'other' && val(f.other)) label += ' (' + val(f.other) + ')';
      return label;
    }).join(', ');
  }
  function payer() {
    var p = payers.filter(function (r) { return r.checked; })[0];
    return p ? p.value : '';
  }
  function message() {
    var rows = [
      ['What I’m working on', val(f.building)],
      ['What I need', needList()],
      ['More', val(f.more)],
      ['When', val(f.when)],
      ['Who would pay', payer()],
      ['Name', val(f.name)],
      ['Email', val(f.email)],
      ['WhatsApp', val(f.whatsapp)]
    ];
    var lines = ['Hi Shawn, here’s my request.', ''];
    rows.forEach(function (r) { if (r[1]) lines.push(r[0] + ': ' + r[1]); });
    lines.push('', 'Sent from the Delta & Bay website');
    return lines.join('\n');
  }
  function subject() {
    var n = needList();
    return 'Request from ' + val(f.name) + (n ? ': ' + n : '');
  }

  /* ---- checks: inline, label above, error below ---- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function whatsappOk(w) { return /^\+[1-9]\d{6,14}$/.test(w.replace(/[\s().-]/g, '')); }
  function mark(input, errEl, on) {
    if (errEl) errEl.hidden = !on;
    if (input) {
      if (on) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }
  function check() {
    var problems = [];
    var building = val(f.building);
    mark(f.building, $('f-building-err'), !building);
    if (!building) problems.push(['f-building', $('f-building-err').textContent]);

    var name = val(f.name);
    mark(f.name, $('f-name-err'), !name);
    if (!name) problems.push(['f-name', $('f-name-err').textContent]);

    var email = val(f.email);
    var wa = val(f.whatsapp);
    var emailBad = !!email && !EMAIL_RE.test(email);
    var waBad = !!wa && !whatsappOk(wa);
    var neither = !email && !wa;
    mark(f.email, $('f-email-err'), emailBad);
    mark(f.whatsapp, $('f-whatsapp-err'), waBad);
    $('f-reach-err').hidden = !neither;
    if (neither) {
      f.email.setAttribute('aria-invalid', 'true');
      f.whatsapp.setAttribute('aria-invalid', 'true');
      problems.push(['f-email', $('f-reach-err').textContent]);
    }
    if (emailBad) problems.push(['f-email', $('f-email-err').textContent]);
    if (waBad) problems.push(['f-whatsapp', $('f-whatsapp-err').textContent]);
    return problems;
  }
  function showSummary(problems) {
    errList.innerHTML = '';
    problems.forEach(function (p) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + p[0];
      a.textContent = p[1].trim();
      a.addEventListener('click', function (e) { e.preventDefault(); $(p[0]).focus(); });
      li.appendChild(a);
      errList.appendChild(li);
    });
    summary.hidden = false;
    summary.focus();
  }

  /* ---- the tray: each answered field seats its piece ----
     When the tray is on screen (beside the form on wide screens) a new piece
     clicks into its seat at once. When it is not (below the form on phones),
     the piece waits and seats with the others when the tray comes into view. */
  var slots = {};
  all('[data-slot]').forEach(function (s) { slots[s.getAttribute('data-slot')] = s; });
  var tray = document.querySelector('[data-tray]');
  var trayInView = true;
  var queue = [];
  function play(s) {
    s.classList.remove('is-queued', 'just-seated');
    void s.offsetWidth;
    s.classList.add('just-seated');
  }
  function flush() {
    var list = queue.slice();
    queue = [];
    list.forEach(function (s, i) {
      window.setTimeout(function () {
        if (s.classList.contains('is-seated')) play(s);
        else s.classList.remove('is-queued');
      }, 160 + i * 120);
    });
  }
  if (tray && 'IntersectionObserver' in window && !reduce) {
    trayInView = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        trayInView = en.isIntersecting;
        if (trayInView && queue.length) flush();
      });
    }, { threshold: 0.3 }).observe(tray);
  }
  var stepFor = { building: 'building', need: 'need', more: 'more', when: 'when', payer: 'payer', name: 'contact', reach: 'contact' };
  function slotValue(key) {
    switch (key) {
      case 'building': return val(f.building);
      case 'need': return needList();
      case 'more': return val(f.more).replace(/\s+/g, ' ');
      case 'when': return val(f.when);
      case 'payer': return payer();
      case 'name': return val(f.name);
      case 'reach': return [val(f.email), val(f.whatsapp)].filter(Boolean).join(', ');
    }
    return '';
  }
  function seat(key, animate) {
    var s = slots[key];
    if (!s) return;
    var v = slotValue(key);
    var seated = s.classList.contains('is-seated');
    s.querySelector('[data-value]').textContent = v;
    if (v && !seated) {
      s.classList.add('is-seated');
      if (animate && !reduce) {
        if (trayInView) play(s);
        else {
          s.classList.add('is-queued');
          if (queue.indexOf(s) === -1) queue.push(s);
        }
      }
    } else if (!v && seated) {
      s.classList.remove('is-seated', 'just-seated', 'is-queued');
      var qi = queue.indexOf(s);
      if (qi !== -1) queue.splice(qi, 1);
    }
    var step = form.querySelector('[data-step="' + stepFor[key] + '"]');
    if (step) {
      var done = key === 'name' || key === 'reach' ? !!(slotValue('name') && slotValue('reach')) : !!v;
      step.classList.toggle('is-done', done);
    }
  }
  function seatAll(animate) { Object.keys(slots).forEach(function (k) { seat(k, animate); }); }

  function keyFor(el) {
    if (!el) return null;
    if (el.name === 'need' || el.id === 'f-other') return 'need';
    if (el.name === 'payer') return 'payer';
    if (el.id === 'f-email' || el.id === 'f-whatsapp') return 'reach';
    return { 'f-building': 'building', 'f-more': 'more', 'f-when': 'when', 'f-name': 'name' }[el.id] || null;
  }
  // live: keep a seated piece's words current, unseat when cleared
  form.addEventListener('input', function (e) {
    var key = keyFor(e.target);
    if (!key) return;
    var s = slots[key];
    if (s && s.classList.contains('is-seated')) seat(key, false);
    else if (s && !slotValue(key)) seat(key, false);
    if (tried) check();
  });
  // committed: a filled field seats its piece with the click-down
  form.addEventListener('change', function (e) {
    var key = keyFor(e.target);
    if (e.target.name === 'need') syncReveals();
    if (key) seat(key, true);
    if (tried) check();
  });
  // Enter in a one-line field does not submit anything
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---- sending ---- */
  function showThanks(kind) {
    fields.hidden = true;
    send.hidden = true;
    summary.hidden = true;
    thanks.hidden = false;
    all('[data-for]', thanks).forEach(function (el) { el.hidden = el.getAttribute('data-for') !== kind; });
    $('copied').textContent = '';
    thanks.focus({ preventScroll: true });
    thanks.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function cut(s, n) { return s ? String(s).slice(0, n) : null; }
  function save(kind) {
    if (!window.fetch) return Promise.reject(new Error('no fetch'));
    var row = {
      channel: kind,
      needs: needs.filter(function (n) { return n.checked; }).map(function (n) { return n.value; }),
      need_labels: cut(needList(), 600),
      building: cut(val(f.building), 500),
      other: cut(val(f.other), 500),
      more: cut(val(f.more), 5000),
      when_needed: cut(val(f.when), 300),
      payer: cut(payer(), 100),
      name: cut(val(f.name), 200),
      email: cut(val(f.email), 320),
      whatsapp: cut(val(f.whatsapp), 40),
      page: cut(location.pathname + location.search, 500),
      user_agent: cut(navigator.userAgent, 500)
    };
    try {
      // keepalive lets the save finish even if the page hands over to WhatsApp or mail
      return fetch(SB_URL, {
        method: 'POST', keepalive: true,
        headers: { apikey: SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row)
      }).then(function (r) { if (!r.ok) throw new Error('save failed ' + r.status); return r; });
    } catch (err) { return Promise.reject(err); }
  }
  function onSend(kind, e) {
    tried = true;
    var problems = check();
    if (problems.length) {
      e.preventDefault();
      showSummary(problems);
      return;
    }
    summary.hidden = true;
    lastMessage = message();
    if (lastMessage !== savedMessage) { save(kind).catch(function () { /* the WhatsApp or email copy still reaches us */ }); savedMessage = lastMessage; }
    seatAll(false);
    if (kind === 'whatsapp') {
      sendWa.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lastMessage);
    } else {
      sendEm.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject()) +
        '&body=' + encodeURIComponent(lastMessage.replace(/\n/g, '\r\n'));
    }
    window.setTimeout(function () { showThanks(kind); }, 80);
  }
  sendWa.addEventListener('click', function (e) { onSend('whatsapp', e); });
  // "Send request": saves only, waits for Supabase, then shows the thank-you (or an error).
  var sendForm = $('send-form');
  var sendErr = $('send-err');
  if (sendForm) sendForm.addEventListener('click', function () {
    if (sendForm.getAttribute('aria-busy') === 'true') return;
    tried = true;
    var problems = check();
    if (problems.length) { showSummary(problems); return; }
    summary.hidden = true;
    sendErr.hidden = true;
    lastMessage = message();
    if (lastMessage === savedMessage) { showThanks('form'); return; }
    var label = sendForm.querySelector('span');
    sendForm.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending';
    seatAll(false);
    save('form').then(function () {
      savedMessage = lastMessage;
      showThanks('form');
    }, function () {
      sendErr.hidden = false;
    }).then(function () {
      sendForm.removeAttribute('aria-busy');
      label.textContent = 'Send request';
    });
  });
  sendEm.addEventListener('click', function (e) { onSend('email', e); });

  $('back-form').addEventListener('click', function () {
    thanks.hidden = true;
    fields.hidden = false;
    send.hidden = false;
    sendWa.href = 'https://wa.me/' + PHONE;
    sendEm.href = 'mailto:' + EMAIL;
    f.building.focus();
  });
  $('copy-req').addEventListener('click', function () {
    var text = lastMessage || message();
    function done() { $('copied').textContent = 'Copied'; }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* nothing to do */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });

  /* ---- start ---- */
  prefill();
  syncReveals();
  // pieces already answered from the link seat once the tray is in view
  seatAll(true);
})();
