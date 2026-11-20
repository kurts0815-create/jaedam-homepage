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
    fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
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
