/* Page turn between tabs: tells the cross-document view transition which way
   the booklet is turning (forward to a later tab, back to an earlier one).
   Loaded as a blocking script so the listener exists before the first render. */
(function () {
  var order = { 'index.html': 0, 'apply.html': 0, 'booking.html': 0, 'consultancy.html': 1, 'request.html': 2, 'credits.html': 3 };
  function pageIndex(url) {
    try {
      var name = (new URL(url).pathname.split('/').pop() || 'index').replace(/\.html$/, '') + '.html';
      return name in order ? order[name] : 0;
    } catch (e) {
      return 0;
    }
  }
  window.addEventListener('pagereveal', function (event) {
    var vt = event.viewTransition;
    if (!vt || !vt.types) return;
    var nav = window.navigation && window.navigation.activation;
    if (!nav || !nav.from || !nav.entry) return;
    var from = pageIndex(nav.from.url);
    var to = pageIndex(nav.entry.url);
    vt.types.add(to >= from ? 'forward' : 'back');
  });
})();
