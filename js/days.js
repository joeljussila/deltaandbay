/* The 10 days: each card opens its full day.
   Mouse: hover shows it (CSS). Tap or click: pins it open (.is-open).
   Click outside or Escape closes it. Without JS, hover and keyboard focus still work. */
(function () {
  'use strict';
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-day]'));
  if (!cards.length) return;
  function set(card, open) {
    card.classList.toggle('is-open', open);
    var b = card.querySelector('.dcard-more');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeAll(except) { cards.forEach(function (c) { if (c !== except) set(c, false); }); }
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.dpop') && !e.target.closest('.dcard-more')) return;
      var open = !card.classList.contains('is-open');
      closeAll(card);
      set(card, open);
    });
    card.addEventListener('mouseenter', function () { closeAll(card); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('[data-day]')) closeAll(null); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = cards.filter(function (c) { return c.classList.contains('is-open'); })[0];
    closeAll(null);
    if (open) { var b = open.querySelector('.dcard-more'); if (b) b.focus(); }
  });
})();
