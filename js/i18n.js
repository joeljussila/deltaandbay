/* English / 中文 switch for every page.
   The English is in the HTML. js/i18n-zh.js maps each English string
   (whitespace collapsed, trimmed) to its Chinese. In Chinese mode this swaps
   text nodes and the alt, aria-label, placeholder, title and data-label
   attributes, plus the page title and meta description; switching back
   restores the English. A string missing from the dictionary stays English.
   Language: ?lang=zh or ?lang=en in the URL, else the last choice (saved in
   this browser), else English. Load after js/i18n-zh.js, as a
   blocking script in <head>, so Chinese visitors don't see English first.
   python3 i18n/extract.py lists strings the dictionary doesn't cover yet. */
(function () {
  'use strict';
  var KEY = 'db-lang';
  var html = document.documentElement;
  var EN_LANG = html.getAttribute('lang') || 'en-GB';
  var ATTRS = ['alt', 'aria-label', 'placeholder', 'title', 'data-label'];
  var dict = window.DB_ZH || {};
  var origText = new WeakMap();
  var origAttr = new WeakMap();
  var origTitle = null, origDesc = null;
  // Chinese punctuation that should sit flush against what comes before or after it
  var CJK_START = /^[　-〿一-鿿＀-￯“”]/;
  var CJK_END = /[　-〿一-鿿＀-￯“”]$/;

  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }
  function pick() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'zh' || q === 'en') { store(q); return q; }
    } catch (e) { /* old browser */ }
    try {
      var s = localStorage.getItem(KEY);
      if (s === 'zh' || s === 'en') return s;
    } catch (e) { /* storage blocked */ }
    return 'en';
  }
  var lang = pick();

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function zh(s) {
    var k = norm(s);
    if (Object.prototype.hasOwnProperty.call(dict, k)) return dict[k];
    if (k === '.') return '。';
    return null;
  }
  // for strings scripts create: t('Sending') gives 发送中 in Chinese mode
  function t(s) { if (lang !== 'zh') return s; var z = zh(s); return z === null ? s : z; }

  function swapText(node) {
    var en = origText.has(node) ? origText.get(node) : node.nodeValue;
    if (lang === 'en') { if (origText.has(node)) node.nodeValue = en; return; }
    var z = zh(en);
    if (z === null) return;
    origText.set(node, en);
    var lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
    if (CJK_START.test(z)) lead = '';
    if (CJK_END.test(z)) trail = '';
    node.nodeValue = lead + z + trail;
  }
  function swapAttrs(el) {
    var saved = origAttr.get(el);
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var en = saved && a in saved ? saved[a] : el.getAttribute(a);
      if (lang === 'en') { if (saved && a in saved) el.setAttribute(a, en); return; }
      var z = zh(en);
      if (z === null) return;
      if (!saved) { saved = {}; origAttr.set(el, saved); }
      saved[a] = en;
      el.setAttribute(a, z);
    });
  }
  function apply() {
    html.setAttribute('lang', lang === 'zh' ? 'zh-CN' : EN_LANG);
    if (origTitle === null) origTitle = document.title;
    document.title = lang === 'zh' ? (zh(origTitle) || origTitle) : origTitle;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      if (origDesc === null) origDesc = desc.getAttribute('content');
      desc.setAttribute('content', lang === 'zh' ? (zh(origDesc) || origDesc) : origDesc);
    }
    if (!document.body) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('svg, [data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
        return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(swapText);
    var sel = ATTRS.map(function (a) { return '[' + a + ']'; }).join(',');
    Array.prototype.forEach.call(document.body.querySelectorAll(sel), function (el) {
      if (!el.closest('[data-i18n-skip]')) swapAttrs(el);
    });
    syncButton();
  }

  /* ---- the switch in the header ---- */
  var btn = null;
  function syncButton() {
    if (!btn) return;
    btn.textContent = lang === 'zh' ? 'EN' : '中文';
    btn.setAttribute('lang', lang === 'zh' ? 'en' : 'zh-CN');
    btn.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
  }
  function addButton() {
    var bar = document.querySelector('.edge-in');
    if (!bar || btn) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-switch';
    btn.setAttribute('data-i18n-skip', '');
    btn.addEventListener('click', function () {
      lang = lang === 'zh' ? 'en' : 'zh';
      store(lang);
      try {
        var u = new URL(location.href);
        if (u.searchParams.has('lang')) { u.searchParams.set('lang', lang); history.replaceState(history.state, '', u); }
      } catch (e) { /* old browser */ }
      apply();
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
    });
    bar.appendChild(btn);
    syncButton();
  }

  window.DB_I18N = { t: t, lang: function () { return lang; } };

  // hide the page for a moment so Chinese visitors don't see a flash of English
  if (lang === 'zh') {
    html.classList.add('i18n-wait');
    var st = document.createElement('style');
    st.textContent = '.i18n-wait body{opacity:0}';
    document.head.appendChild(st);
    setTimeout(function () { html.classList.remove('i18n-wait'); }, 1500);
  }
  function start() {
    addButton();
    apply();
    html.classList.remove('i18n-wait');
  }
  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
