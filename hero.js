/* 첫 화면 배경의 결이 천천히 흐르게 한다.
   가는 가닥이 겹쳐 흐르는 면을 화면에서 직접 그린다(img/hero-bg.jpg 는 같은 식의 정지 장면). 움직임을 줄이도록 설정한 기기,
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
    'float hash(float n){return fract(sin(n*12.9898)*43758.5453);}',
    'float vn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(hash(i),hash(i+1.),f);}',
    '// 높이와 그늘 정보를 함께 돌려준다: x=높이, y=가닥 단면(0 골..1 등), z=겹친 판에서의 위치(0 판 시작..1 끝)',
    'vec3 surf(vec2 q,float asp){',
    '  vec2 d=vec2((q.x-0.10)*asp,q.y-2.05);',
    '  float r=length(d);float a=atan(d.x,-d.y);',
    '  float s=r+0.085*sin(a*2.3+1.0+T*0.50)+0.040*sin(a*5.1+0.4-T*0.35)+0.018*sin(a*11.0+T*0.2);',
    '  float k=s*1.55-T*0.035;',
    '  float sid=floor(k);float sheet=fract(k);',
    '  float n=2.0+floor(3.0*hash(sid+3.0));',
    '  float w=sheet*n+0.55*vn(sheet*n*0.9+sid*7.0);',
    '  float x=fract(w)-0.5;',
    '  float tube=pow(0.5+0.5*cos(6.2831853*x),0.55);',
    '  float ramp=sheet*sheet*(3.0-2.0*sheet);',
    '  float h=0.40*ramp+0.034*tube+0.05*sin(a*3.0+sid*1.7+T*0.3);',
    '  return vec3(h,tube,sheet);',
    '}',
    'void main(){',
    '  vec2 q=vec2(gl_FragCoord.x/res.x,1.0-gl_FragCoord.y/res.y);',
    '  float asp=max(res.x/res.y,1.2);',
    '  float e=0.0009;',
    '  vec3 c=surf(q,asp);',
    '  float gx=clamp((surf(q+vec2(e,0.),asp).x-c.x)/e,-6.,6.)*0.42;',
    '  float gy=clamp((surf(q+vec2(0.,e),asp).x-c.x)/e,-6.,6.)*0.42;',
    '  vec3 n=normalize(vec3(-gx,-gy,1.0));',
    '  vec3 L=normalize(vec3(-0.35,-0.62,0.70));',
    '  float diff=clamp(dot(n,L),0.,1.);',
    '  float spec=pow(clamp(dot(n,normalize(L+vec3(0.,0.,1.))),0.,1.),38.0);',
    '  float ao=mix(0.87,1.0,smoothstep(0.0,0.80,c.y));          // 가닥 사이 골의 그늘',
    '  float under=mix(0.80,1.0,smoothstep(0.0,0.50,c.z));       // 위 판이 드리우는 그늘',
    '  float lit=(0.42+0.70*diff)*ao*under+0.10*spec;',
    '  vec3 col=mix(vec3(0.790,0.815,0.855),vec3(1.0),clamp(lit,0.,1.));',
    '  float f=0.16+0.56*smoothstep(0.08,0.66,q.x);',
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
    gl.uniform1f(uT, clock * 0.3);
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
