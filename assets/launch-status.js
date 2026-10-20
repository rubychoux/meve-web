(function(root){
  'use strict';
  var OPENS_AT = Date.parse('2026-10-20T11:00:00Z');
  function copy(now) {
    var open = now >= OPENS_AT;
    return {
      open: open,
      headline: open ? '미브, 오픈했어요' : '오늘 오후 8시 오픈',
      status: open ? '미브가 오픈했어요. 지금 입장해 주세요.' : '오늘 오후 8시(KST) 오픈 예정이에요.',
      ticket: open ? '지금 신청한 이메일로 로그인해 입장 상태를 확인해 주세요.' : '오늘 오후 8시(KST)부터 신청한 이메일로 로그인해 입장 상태를 확인해 주세요.',
      share: open ? 'MEVE가 오픈했어요. 티켓 1~100번·인증된 이벤트 참여자는 지금 입장해 주세요. 좋아하는 나를, 나의 방법으로.' : '오늘 오후 8시(KST), MEVE가 열려요. 티켓 1~100번·인증된 이벤트 참여자 우선 입장. 좋아하는 나를, 나의 방법으로.'
    };
  }
  function mount(doc, clock) {
    clock = clock || root;
    var timer, disposed = false;
    function render() {
      if (disposed) return;
      var now = clock.Date.now(), text = copy(now);
      doc.querySelectorAll('[data-launch-copy]').forEach(function(el){
        var value = text[el.getAttribute('data-launch-copy')];
        if (typeof value === 'string' && el.textContent !== value) el.textContent = value;
      });
      doc.documentElement.setAttribute('data-launch-state',text.open ? 'open' : 'scheduled');
      if (timer) clock.clearTimeout(timer);
      if (!text.open) timer = clock.setTimeout(render, Math.min(30000,Math.max(50,OPENS_AT-now+20)));
    }
    function visible(){if(!doc.hidden)render();}
    doc.addEventListener('visibilitychange',visible);
    render();
    return function(){disposed=true;if(timer)clock.clearTimeout(timer);doc.removeEventListener('visibilitychange',visible);};
  }
  var api={opensAt:OPENS_AT,copy:copy,mount:mount};
  if(typeof module==='object' && module.exports)module.exports=api;
  else {root.MeveLaunchStatus=api;if(root.document)mount(root.document);}
})(typeof globalThis!=='undefined'?globalThis:this);
