/* MEVE — first-party, cookie-free page analytics.
   Records: anonymous session id, path, external referrer, UTM params.
   No cookies, no personal data, nothing rendered. */
(function () {
  var SB = 'https://auyqgcppbrhjthvkkwwb.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1eXFnY3BwYnJoanRodmtrd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTY4NTAsImV4cCI6MjA4ODk3Mjg1MH0.3VjInUooRD1TahI9tgFX3G6yE5A97yAJ2sZH2YMmXLY';

  function sid() {
    try {
      var s = sessionStorage.getItem('mv-sid');
      if (!s) {
        s = (crypto.randomUUID && crypto.randomUUID()) ||
          String(Date.now()) + Math.random().toString(16).slice(2, 10);
        sessionStorage.setItem('mv-sid', s);
      }
      return s;
    } catch (e) {
      return null;
    }
  }

  function send(event) {
    var s = sid();
    if (!s) return;
    var q = new URLSearchParams(location.search);
    var ref = '';
    try {
      if (document.referrer && new URL(document.referrer).host !== location.host) {
        ref = document.referrer;
      }
    } catch (e) {}
    try {
      fetch(SB + '/rest/v1/rpc/web_track', {
        method: 'POST',
        keepalive: true,
        headers: {
          apikey: KEY,
          Authorization: 'Bearer ' + KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_sid: s,
          p_event: event,
          p_path: location.pathname,
          p_ref: ref,
          p_us: q.get('utm_source') || '',
          p_um: q.get('utm_medium') || '',
          p_uc: q.get('utm_campaign') || ''
        })
      }).catch(function () {});
    } catch (e) {}
  }

  window.mvTrack = send;
  send('pageview');
})();
