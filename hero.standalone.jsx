/* global React, ReactDOM */
const { useEffect, useRef, useState } = React;
const FM = window.framerMotion || window.Motion || {};
const motion = FM.motion;

const easeOut = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0, y = 18) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.1, ease: easeOut, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 1.1, ease: easeOut, delay },
});

/* ---------- Custom cursor (unchanged from RMS) ---------- */

function Cursor() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    const onOver = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest('a, button, [data-hover]')) {
        el.classList.add('hover');
      } else {
        el.classList.remove('hover');
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, []);
  return <div ref={ref} className="cursor-dot" />;
}

/* ---------- WebGL glossy-water reveal background ----------
   Two image sources: assets/fog.jpg (rest state) and assets/detail.jpg
   (revealed state). A wobbling circular mask around the cursor cross-
   blends fog → detail, with boundary ripple, procedural fbm mist and
   gentle zoom-toward-cursor for the glossy water feel. */

function RevealCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return;

    const VS = `
      attribute vec2 a_p;
      varying vec2 v_uv;
      void main(){ v_uv = (a_p + 1.0) * 0.5; gl_Position = vec4(a_p, 0.0, 1.0); }
    `;

    const FS = `
      precision highp float;
      varying vec2 v_uv;
      uniform sampler2D u_fog;
      uniform sampler2D u_detail;
      uniform vec2  u_res;
      uniform vec2  u_mouse;
      uniform float u_time;
      uniform float u_active;

      float hash(vec2 p){ p = fract(p*vec2(127.1, 311.7)); p += dot(p, p.yx + 19.19); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.1 + vec2(1.7, 9.2); a *= 0.5; } return v; }

      void main(){
        /* flip Y so mouse(px) and uv share the same convention */
        vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
        vec2 mUV = u_mouse / u_res;

        float t = u_time;

        /* cover UV — fit 1920x1080 sources to viewport */
        float sc = max(u_res.x/1920.0, u_res.y/1080.0);
        float visW = u_res.x / (sc*1920.0);
        float visH = u_res.y / (sc*1080.0);
        vec2 cUV = vec2((uv.x - 0.5)*visW + 0.5, (uv.y - 0.5)*visH + 0.5);

        /* --- reveal circle with angular wobble (water-lens lip) --- */
        float mDist  = length(uv - mUV);
        float revR   = 0.22;
        float angle  = atan(uv.y - mUV.y, uv.x - mUV.x);
        float wobble = 1.0 + sin(angle*4.0 + t*1.1)*0.035 + sin(angle*7.0 - t*0.9)*0.018;
        float reveal = pow(smoothstep(revR*wobble, 0.012, mDist), 2.0);
        reveal *= u_active;

        /* --- zoom-toward-cursor (figure presses forward) --- */
        float globalZoom = u_active * 0.08;
        float localZoom  = reveal * 0.14;
        float totalZoom  = globalZoom + localZoom;
        vec2 figCenter   = vec2(0.615, 0.44);
        vec2 zoomCenter  = mix(figCenter, mUV, smoothstep(0.0, 1.0, reveal));
        vec2 zCUV = cUV + totalZoom * (zoomCenter - cUV);

        /* --- ripple distortion at reveal boundary (glossy water band) --- */
        float band = smoothstep(0.0, revR, mDist) * smoothstep(revR + 0.06, revR - 0.01, mDist);
        vec2 rDir = (mDist > 0.001) ? normalize(uv - mUV) : vec2(0.0);
        float rip  = sin(mDist*62.0 - t*5.6) * 0.010 * band;
        vec2 sUV = clamp(zCUV + rDir*rip, 0.001, 0.999);

        /* --- sample both textures at identical UV --- */
        vec3 fogPx    = texture2D(u_fog,    sUV).rgb;
        vec3 detailPx = texture2D(u_detail, sUV).rgb;

        /* --- procedural living mist --- */
        vec2 fUV = uv*2.5 + vec2(sin(t*0.020)*0.05, t*0.007);
        float f1 = fbm(fUV);
        float f2 = fbm(fUV + vec2(f1*0.75, f1*0.55) + 2.1);
        float mist = fbm(fUV + vec2(f2*0.65, f2*0.45) + 4.2);
        vec3 mistCol = mix(vec3(0.868, 0.862, 0.850), vec3(0.955, 0.950, 0.940), mist);
        float mistAmt = clamp((1.0 - reveal*0.98)*0.48 + sin(t*0.30)*0.012, 0.0, 1.0);

        /* cross-blend fog → detail as reveal grows, mist on top */
        vec3 col = mix(fogPx, detailPx, smoothstep(0.0, 1.0, reveal));
        col = mix(col, mistCol, mistAmt * (1.0 - reveal*0.9));

        /* warmth lift inside revealed zone */
        col = mix(col, col * vec3(1.05, 1.015, 0.96), reveal*0.15);

        /* vignette */
        float vig = dot(uv - 0.5, uv - 0.5);
        col *= mix(0.48, 1.0, clamp(1.0 - vig*1.92, 0.0, 1.0));

        /* film grain */
        float grain = (hash(uv*394.0 + fract(t*0.24)) - 0.5) * 0.020;
        col = clamp(col + grain, 0.0, 1.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function mkShader(type, src){
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, 'a_p');
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const uRes    = gl.getUniformLocation(prog, 'u_res');
    const uMouse  = gl.getUniformLocation(prog, 'u_mouse');
    const uTime   = gl.getUniformLocation(prog, 'u_time');
    const uActive = gl.getUniformLocation(prog, 'u_active');
    const uFog    = gl.getUniformLocation(prog, 'u_fog');
    const uDetail = gl.getUniformLocation(prog, 'u_detail');

    function mkTex(unit){
      gl.activeTexture(gl.TEXTURE0 + unit);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 16, 12, 255]));
      return t;
    }
    const fogTex = mkTex(0);
    const detailTex = mkTex(1);

    function loadImg(src, tex, unit){
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      };
      img.src = src;
    }
    loadImg(window.__resources.fogImg, fogTex, 0);
    loadImg(window.__resources.detailImg, detailTex, 1);

    let mouse = { x: -9999, y: -9999 };
    let sm    = { x: -9999, y: -9999 };
    let tActive = 0, active = 0;
    const t0 = performance.now();
    let raf = 0;

    function resize(){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.floor(window.innerWidth  * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    function onMove(e){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mouse.x = e.clientX * dpr;
      mouse.y = e.clientY * dpr;
      tActive = 1;
    }
    function onLeave(){ tActive = 0; }
    function onTouch(e){
      if(!e.touches[0]) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mouse.x = e.touches[0].clientX * dpr;
      mouse.y = e.touches[0].clientY * dpr;
      tActive = 1;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    document.addEventListener('touchmove', onTouch, { passive: true });
    document.addEventListener('touchend',   onLeave);

    function frame(){
      sm.x += (mouse.x - sm.x) * 0.085;
      sm.y += (mouse.y - sm.y) * 0.085;
      active += (tActive - active) * (tActive > active ? 0.025 : 0.055);

      const t = (performance.now() - t0) / 1000;
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, sm.x, sm.y);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uActive, active);
      gl.uniform1i(uFog, 0);
      gl.uniform1i(uDetail, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('touchmove', onTouch);
      document.removeEventListener('touchend', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full block"
    />
  );
}

/* ---------- Scroll badge (unchanged from RMS) ---------- */

function ScrollBadge() {
  const text = 'SCROLL DOWN • SCROLL DOWN • ';
  const chars = text.split('');
  const radius = 44;
  return (
    <motion.div
      {...fadeIn(0.9)}
      className="absolute bottom-10 left-10 z-40 h-[112px] w-[112px] select-none"
      data-hover>
      <div className="relative h-full w-full">
        <svg viewBox="0 0 112 112" className="spin-slow absolute inset-0 h-full w-full text-white/85">
          <defs>
            <path id="circ" d={`M 56 56 m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`} />
          </defs>
          <text fontSize="9" letterSpacing="3" fill="currentColor" fontFamily="Manrope" fontWeight="500">
            <textPath href="#circ" startOffset="0">{chars.join('')}</textPath>
          </text>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/85">
            <path d="M7 2v10M3 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  const navLinks = [
    { label: 'WORK', active: true },
    { label: 'MANIFESTO' },
    { label: 'STUDIO' },
    { label: 'TEAM' },
    { label: 'CONTACT' },
  ];
  const langs = ['EN'];
  const [activeLang, setActiveLang] = useState('EN');

  return (
    <section className="relative min-h-[100vh] w-full overflow-hidden bg-black text-white">
      {/* Glossy water reveal canvas */}
      <RevealCanvas />

      {/* Subtle noise overlay for film grain continuity */}
      <div aria-hidden className="noise absolute inset-0 z-[1] pointer-events-none" />

      {/* "Move to reveal" hint — tucked discreetly above scroll badge */}
      <motion.p
        {...fadeIn(1.6)}
        className="absolute bottom-[168px] left-[30px] z-40 text-[9px] uppercase tracking-[0.38em] text-white/35 hint-breath">
        Move to reveal
      </motion.p>

      {/* Top bar */}
      <motion.header
        {...fadeIn(0.1)}
        className="absolute top-0 inset-x-0 z-40 px-10 pt-8 grid grid-cols-3 items-start">
        <a href="#" className="inline-flex items-baseline gap-2 select-none">
          <span className="text-[18px] font-semibold tracking-tight text-white">related</span>
          <span className="text-[13px] tracking-[0.14em] uppercase text-white/70">motion studio</span>
        </a>

        <div className="flex items-center justify-center gap-4 pt-1 text-[11px] tracking-[0.22em] uppercase">
          {langs.map((l, i) => (
            <React.Fragment key={l}>
              {i > 0 && <span className="text-white/25">|</span>}
              <button
                onClick={() => setActiveLang(l)}
                className={`${activeLang === l ? 'text-white' : 'text-white/45 hover:text-white/80'} transition-colors`}>
                {l}
              </button>
            </React.Fragment>
          ))}
        </div>

        <nav className="flex flex-col items-end gap-2 text-[11px] tracking-[0.22em] uppercase">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href="#"
              className={`inline-flex items-center gap-2 ${l.active ? 'text-white' : 'text-white/70 hover:text-white'} transition-colors`}>
              {l.active && <span aria-hidden className="text-white">→</span>}
              <span>{l.label}</span>
            </a>
          ))}
        </nav>
      </motion.header>

      {/* Headline — bottom-right editorial block, leaves the hero open to breathe */}
      <div className="relative z-20 flex min-h-[100vh] items-end justify-end px-10 pb-[140px] md:pb-[160px] pointer-events-none">
        <h1 className="text-right text-white font-display font-light tracking-[-0.02em] leading-[1.04] text-[32px] md:text-[42px] lg:text-[48px] max-w-[16ch]">
          <motion.span {...fadeUp(0.25)} className="inline-block drop-shadow-[0_2px_40px_rgba(0,0,0,0.6)]">
            They called it emerging, we say it beg<span className="italic-accent">i</span>ns here
          </motion.span>
        </h1>
      </div>

      {/* Scroll badge BL */}
      <ScrollBadge />

      {/* Small meta BR */}
      <motion.div
        {...fadeIn(0.9)}
        className="absolute bottom-12 right-10 z-40 text-right text-[10.5px] uppercase tracking-[0.28em] text-white/50 leading-[1.9]">
        <div>Est. 2024</div>
        <div>Lagos · Remote</div>
      </motion.div>

      {/* Bottom blend-out: fades hero fully to black so it meets the
          dark area of the next section without a visible seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[28vh]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.9) 92%, #000 100%)',
        }}
      />
    </section>
  );
}

function App() {
  return (
    <>
      <Cursor />
      <div className="bg-black">
        <div data-screen-label="Hero">
          <Hero />
        </div>
        {window.SelectedWork && <window.SelectedWork />}
        {window.Reels && <window.Reels />}
        {window.BlobLight && <window.BlobLight />}
        {window.Manifesto && <window.Manifesto />}
        {window.Services && <window.Services />}
        {window.Team && <window.Team />}
        {window.Contact && <window.Contact />}
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
