/* 첫 화면 배경의 결이 천천히 흐르게 한다.
   그림(img/hero-bg.jpg)과 같은 식을 화면에서 직접 그린다. 움직임을 줄이도록 설정한 기기,
   WebGL 을 쓸 수 없는 기기에서는 아무것도 하지 않고 정지 그림이 그대로 보인다. */
(function () {
  var hero = document.querySelector('.hero');
  var canvas = hero && hero.querySelector('.hero-flow');
  var button = hero && hero.querySelector('.hero-pause');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  var vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var frag = [
    'precision highp float;',
    'uniform vec2 res;uniform float T;',
    'float hgt(vec2 q,float asp){',
    '  vec2 d=vec2((q.x-1.25)*asp,q.y-1.55);',
    '  float r=length(d);float a=atan(d.y,d.x);',
    '  float t=r+0.06*sin(a*3.1+0.7+T)+0.035*sin(a*7.3+2.1-T);',
    '  float ridge=pow(0.5+0.5*sin(58.0*pow(t,0.78)-T*3.0),1.6);',
    '  float broad=0.5+0.5*sin(4.2*t+1.3+0.6*sin(T));',
    '  return 0.030*ridge*(0.25+0.75*broad)+0.13*broad;',
    '}',
    'void main(){',
    '  vec2 q=vec2(gl_FragCoord.x/res.x,1.0-gl_FragCoord.y/res.y);',
    '  float asp=max(res.x/res.y,1.3);',
    '  float e=0.0012;',
    '  float h0=hgt(q,asp);',
    '  float gx=(hgt(q+vec2(e,0.),asp)-h0)/e*0.55;',
    '  float gy=(hgt(q+vec2(0.,e),asp)-h0)/e*0.55;',
    '  vec3 n=normalize(vec3(-gx,-gy,1.0));',
    '  float diff=clamp(dot(n,vec3(-0.4511,-0.5514,0.7018)),0.,1.);',
    '  float s=pow(clamp((diff-0.17)/0.793,0.,1.),1.15);',
    '  vec3 col=mix(vec3(0.690,0.741,0.812),vec3(1.0),s);',
    '  float f=0.12+0.88*smoothstep(0.18,0.68,q.x);',
    '  gl_FragColor=vec4(mix(vec3(1.0),col,f),1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = compile(gl.VERTEX_SHADER, vert);
  var fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(prog, 'res');
  var uT = gl.getUniformLocation(prog, 'T');

  function resize() {
    var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.round(canvas.clientWidth * ratio);
    var h = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  var paused = false;   // 사용자가 멈춤 단추를 눌렀는지
  var visible = true;   // 첫 화면이 보이는 중인지
  var clock = 0;        // 흐른 시간(초). 멈춘 동안은 늘지 않는다
  var last = 0;
  var frame = 0;
  var shown = false;

  function draw(now) {
    frame = 0;
    if (paused || !visible || document.hidden) return;
    if (last) clock += Math.min((now - last) / 1000, 0.1);
    last = now;
    resize();
    gl.uniform1f(uT, clock * 0.22);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!shown) { shown = true; canvas.classList.add('is-on'); if (button) button.hidden = false; }
    frame = requestAnimationFrame(draw);
  }
  function wake() {
    last = 0;
    if (!frame) frame = requestAnimationFrame(draw);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', wake);
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); canvas.classList.remove('is-on'); paused = true; });

  if (button) {
    button.addEventListener('click', function () {
      paused = !paused;
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? '배경 움직임 다시 재생' : '배경 움직임 멈추기');
      if (!paused) wake();
    });
  }
  wake();
})();
