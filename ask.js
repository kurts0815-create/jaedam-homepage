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
