/* Delta & Bay booklet: shared behaviour for every page.
   - seats each step's new piece when the step comes into view
   - lets Enter start a request from the opening field
   No scroll listeners: IntersectionObserver only. */
(function () {
  'use strict';

  /* ---- the signature: seat the new piece as its step comes into view ---- */
  function initSeats() {
    var items = document.querySelectorAll('[data-seat]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('seated'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('seated');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.18 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- the opening request field: Enter starts the request ---- */
  function initAsk() {
    var box = document.getElementById('ask-text');
    if (!box || !box.form) return;
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (box.form.requestSubmit) box.form.requestSubmit();
        else box.form.submit();
      }
    });
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    initSeats();
    initAsk();
  });
})();
