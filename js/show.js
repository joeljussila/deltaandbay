/* Photo slideshows: each [data-show] block has a scroll-snap track, previous
   and next buttons and a counter. Swipe or scroll works on its own; buttons
   and arrow keys step one photo at a time. No autoplay. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setup(box) {
    var track = box.querySelector('.show-track');
    var slides = Array.prototype.slice.call(track.querySelectorAll('.show-slide'));
    var out = box.querySelector('.show-n');
    function current() {
      var best = 0, d = Infinity;
      slides.forEach(function (s, i) { var x = Math.abs(s.offsetLeft - track.offsetLeft - track.scrollLeft); if (x < d) { d = x; best = i; } });
      return best;
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    }
    box.querySelectorAll('.show-btn').forEach(function (b) {
      b.addEventListener('click', function () { go(current() + Number(b.getAttribute('data-dir'))); });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
    });
    var t;
    track.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (out) out.textContent = String(current() + 1); }, 60);
    }, { passive: true });
  }
  ready(function () { document.querySelectorAll('[data-show]').forEach(setup); });
})();
