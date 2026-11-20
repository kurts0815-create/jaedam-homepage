/* "상담 문의" 단추를 누르면 연락 방법을 고르는 창을 연다.
   창을 열 수 없는 브라우저에서는 단추가 원래 주소(오시는 길 구역)로 간다. */
(function () {
  var box = document.getElementById('ask');
  if (!box || !box.showModal) return;
  document.querySelectorAll('[data-ask]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      box.showModal();
    });
  });
  // 창 바깥(어두운 부분)을 누르면 닫는다
  box.addEventListener('click', function (e) {
    if (e.target === box) box.close();
  });
  // 연락 방법을 고르면 창을 닫는다
  box.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { box.close(); });
  });
})();

/* 간편 상담 양식: 페이지를 떠나지 않고 접수하고, 결과를 단추 옆에 알려 준다. */
(function () {
  var form = document.querySelector('[data-consult]');
  if (!form || !window.fetch || !window.FormData) return;
  var msg = form.querySelector('.form-msg');
  var btn = form.querySelector('button[type="submit"]');
  function say(text, bad) {
    msg.textContent = text;
    msg.classList.toggle('is-bad', !!bad);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    btn.disabled = true;
    say('접수하는 중입니다…');
    // 한글 항목 이름이 깨지지 않도록 JSON 으로 보내고, 비워 둔 칸(이메일 등)은 보내지 않는다
    var data = {};
    new FormData(form).forEach(function (v, k) { if (String(v).trim() !== '') data[k] = v; });
    fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.success) throw new Error(d.message || 'fail');
        form.reset();
        say('접수되었습니다. 확인하는 대로 연락드리겠습니다.');
      })
      .catch(function () {
        say('접수하지 못했습니다. 잠시 뒤 다시 시도하시거나 031-8023-9870으로 전화해 주세요.', true);
      })
      .then(function () { btn.disabled = false; });
  });
})();

/* 첫 페이지: 메뉴로 구역을 옮겨 다녀도 주소에 #구역 표시를 남기지 않고,
   새로 고침하면 항상 맨 위에서 시작한다. */
(function () {
  if (!document.body.classList.contains('home')) return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  var clean = location.pathname + location.search;
  if (nav && nav.type === 'reload') {
    if (location.hash) history.replaceState(null, '', clean);
    window.scrollTo(0, 0);
  } else if (location.hash) {
    // 다른 페이지에서 구역을 찍어 들어온 경우: 그 구역을 보여 준 뒤 주소만 정리한다
    window.addEventListener('load', function () { history.replaceState(null, '', clean); });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-ask') || a.classList.contains('skip')) return;
    var id = a.getAttribute('href').slice(1);
    var to = id && document.getElementById(id);
    if (!to) return;
    e.preventDefault();
    to.scrollIntoView();
  });
})();

/* 업무 목록: 하나를 열면 나머지는 닫는다(같은 기능이 없는 오래된 브라우저용). */
(function () {
  var items = document.querySelectorAll('.svc-list details');
  items.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
