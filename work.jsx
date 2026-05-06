/* global React */
const { useEffect, useRef } = React;
const FM_W = window.framerMotion || window.Motion || {};
const motionW = FM_W.motion;
const useScrollW = FM_W.useScroll;
const useTransformW = FM_W.useTransform;

const workEase = [0.22, 1, 0.36, 1];

/* Cinematic placeholder tile — gradient + noise + label */
function PlaceholderTile({ n, tone = 'warm', aspect = 'aspect-[4/5]', src, title }) {
  const grads = {
    warm: 'radial-gradient(120% 90% at 30% 20%, #3a2a1f 0%, #1a120c 55%, #050403 100%)',
    cool: 'radial-gradient(120% 90% at 70% 20%, #1c2a36 0%, #0d141b 55%, #03060a 100%)',
    mono: 'radial-gradient(120% 90% at 50% 30%, #2a2a2a 0%, #111 55%, #000 100%)',
    ember: 'radial-gradient(120% 90% at 35% 70%, #4a2315 0%, #1d0d07 55%, #050201 100%)',
    dusk:  'radial-gradient(120% 90% at 65% 60%, #33263a 0%, #14101c 55%, #040308 100%)',
    /* "noir" — neutral near-black with a faint cool bias. No brown. */
    noir:  'radial-gradient(120% 90% at 50% 40%, #14161a 0%, #0a0b0e 55%, #020204 100%)',
  };

  /* Per-tone overlay treatments — "warm" tones get the amber wash +
     ember highlight; "noir" stays neutral so dark photos (Dan mask,
     archival) aren't forced into sepia. */
  const warmToneSet = new Set(['warm', 'ember', 'dusk']);
  const isWarm = warmToneSet.has(tone);
  const washGrad = isWarm
    ? 'radial-gradient(120% 100% at 50% 45%, rgba(58,42,31,0) 0%, rgba(40,26,16,0.35) 60%, rgba(14,8,4,0.85) 100%)'
    : 'radial-gradient(120% 100% at 50% 45%, rgba(14,16,20,0) 0%, rgba(10,11,14,0.30) 60%, rgba(2,2,4,0.85) 100%)';
  const edgeGrad = isWarm
    ? 'radial-gradient(130% 95% at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,6,3,0.55) 78%, rgba(5,3,2,0.95) 100%)'
    : 'radial-gradient(130% 95% at 50% 45%, rgba(0,0,0,0) 45%, rgba(4,5,8,0.60) 78%, rgba(1,1,3,0.96) 100%)';
  const highlightGrad = isWarm
    ? 'radial-gradient(45% 45% at 52% 42%, rgba(160,92,48,0.22) 0%, rgba(80,44,22,0.08) 55%, rgba(0,0,0,0) 100%)'
    : 'radial-gradient(55% 50% at 50% 42%, rgba(210,215,225,0.14) 0%, rgba(140,150,170,0.05) 55%, rgba(0,0,0,0) 100%)';
  const hoverGlowGrad = isWarm
    ? 'radial-gradient(60% 70% at var(--mx,50%) var(--my,45%), rgba(210,140,80,0.18) 0%, rgba(0,0,0,0) 60%)'
    : 'radial-gradient(60% 70% at var(--mx,50%) var(--my,45%), rgba(200,210,225,0.16) 0%, rgba(0,0,0,0) 60%)';

  const ref = useRef(null);
  const imgRef = useRef(null);
  const washRef = useRef(null);
  const edgeRef = useRef(null);
  const badgeRef = useRef(null);
  const tlRef = useRef(null); const trRef = useRef(null);
  const blRef = useRef(null); const brRef = useRef(null);
  const [hover, setHover] = React.useState(false);

  // mouse-tracking transforms — refs applied via rAF to avoid React churn
  const stateRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, raf: 0, active: 0, tActive: 0 });

  useEffect(() => {
    const st = stateRef.current;
    function tick() {
      st.x += (st.tx - st.x) * 0.12;
      st.y += (st.ty - st.y) * 0.12;
      st.active += (st.tActive - st.active) * 0.12;

      // centered -0.5..0.5
      const nx = st.x - 0.5, ny = st.y - 0.5;

      if (imgRef.current) {
        // image zooms + parallax-tilts opposite to cursor for depth
        const s = 1.04 + st.active * 0.08;                // 1.04 → 1.12
        const tx = -nx * 14 * st.active;                  // px
        const ty = -ny * 14 * st.active;
        imgRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
        // On hover: blend multiply → normal so the photo reaches full
        // brightness; combined filter boost makes the reveal feel alive.
        const blendMix = st.active;
        imgRef.current.style.mixBlendMode = blendMix > 0.5 ? 'normal' : 'multiply';
        imgRef.current.style.filter = `contrast(${1.08 + st.active*0.10}) saturate(${0.92 + st.active*0.55}) brightness(${1.02 + st.active*0.22})`;
      }
      if (washRef.current) {
        // warm wash lifts on hover, revealing more of the photo
        washRef.current.style.opacity = String(1 - st.active * 0.88);
      }
      if (edgeRef.current) {
        // edge dissolve also fades so the subject can truly pop
        edgeRef.current.style.opacity = String(1 - st.active * 0.65);
      }
      if (badgeRef.current) {
        // "View" badge follows the cursor inside the tile
        const rect = ref.current.getBoundingClientRect();
        const px = st.x * rect.width;
        const py = st.y * rect.height;
        badgeRef.current.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%) scale(${st.active})`;
        badgeRef.current.style.opacity = String(st.active);
      }
      // corner ticks extend on hover
      const cornerLen = 12 + st.active * 22;
      if (tlRef.current) tlRef.current.style.setProperty('--len', cornerLen + 'px');
      if (trRef.current) trRef.current.style.setProperty('--len', cornerLen + 'px');
      if (blRef.current) blRef.current.style.setProperty('--len', cornerLen + 'px');
      if (brRef.current) brRef.current.style.setProperty('--len', cornerLen + 'px');

      st.raf = requestAnimationFrame(tick);
    }
    st.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(st.raf);
  }, []);

  function onMove(e) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const st = stateRef.current;
    st.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    st.ty = Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height));
    st.tActive = 1;
  }
  function onEnter() { stateRef.current.tActive = 1; setHover(true); }
  function onLeave() { stateRef.current.tActive = 0; setHover(false); }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative ${aspect} w-full overflow-hidden group`}
      style={{
        background: grads[tone] || grads.warm,
        isolation: 'isolate',
        contain: 'paint',
      }}>
      {src && (
        <>
          <img
            ref={imgRef}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover select-none will-change-transform"
            style={{
              mixBlendMode: 'multiply',
              transformOrigin: '50% 50%',
              transition: 'filter 600ms cubic-bezier(0.22,1,0.36,1)',
              backfaceVisibility: 'hidden',
            }}
          />
          {/* Per-tone wash — warm amber for brown tiles, neutral ink for noir */}
          <div
            ref={washRef}
            aria-hidden
            className="absolute inset-0"
            style={{
              background: washGrad,
              mixBlendMode: 'multiply',
              transition: 'opacity 600ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />
          {/* Soft edge dissolve — fades on hover so subject reaches the frame */}
          <div
            ref={edgeRef}
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: edgeGrad,
              transition: 'opacity 600ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />
          {/* Subject highlight — ember for warm, cool silver for noir */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: highlightGrad,
              mixBlendMode: 'screen',
            }}
          />
          {/* Hover-only edge glow — sweeps in from the cursor side */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              opacity: hover ? 1 : 0,
              background: hoverGlowGrad,
              mixBlendMode: 'screen',
            }}
          />
          {/* Hairline inner frame — fades in on hover */}
          <div
            aria-hidden
            className="absolute inset-[10px] pointer-events-none border border-white/0 transition-[border-color,inset] duration-700"
            style={{ borderColor: hover ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0)' }}
          />

          {/* Corner ticks — extend on hover */}
          <span ref={tlRef} aria-hidden className="tile-corner tile-corner-tl" />
          <span ref={trRef} aria-hidden className="tile-corner tile-corner-tr" />
          <span ref={blRef} aria-hidden className="tile-corner tile-corner-bl" />
          <span ref={brRef} aria-hidden className="tile-corner tile-corner-br" />

          {/* Cursor-following "View" badge */}
          <div
            ref={badgeRef}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-30 h-[72px] w-[72px] rounded-full backdrop-blur-sm flex items-center justify-center"
            style={{
              background: 'rgba(255,245,232,0.88)',
              color: '#1a120c',
              transform: 'translate(-9999px,-9999px)',
              opacity: 0,
              transition: 'opacity 350ms cubic-bezier(0.22,1,0.36,1)',
              mixBlendMode: 'normal',
            }}>
            <span className="text-[9px] uppercase tracking-[0.32em] font-medium">View</span>
          </div>
        </>
      )}
      <div className="absolute inset-0 noise opacity-60 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'
      }} />
      <div className="absolute top-4 left-4 text-[10.5px] uppercase tracking-[0.28em] text-white/75 mix-blend-difference z-20 pointer-events-none">
        Project {String(n).padStart(2, '0')}
      </div>
    </div>
  );
}

/* One work row — staggered with scroll-linked y offset */
function WorkRow({ project, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScrollW({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // Parallax drift for image
  const y = useTransformW(scrollYProgress, [0, 1], [60, -60]);

  const isRight = index % 2 === 1;
  const wide = index % 3 === 2;

  return (
    <motionW.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20% 0px' }}
      transition={{ duration: 1.1, ease: workEase }}
      className={`relative grid grid-cols-12 gap-6 items-end ${index > 0 ? 'mt-40 md:mt-56' : ''}`}>
      <motionW.div
        style={{ y }}
        className={`${isRight ? 'col-start-6 md:col-start-7 col-end-13' : 'col-start-1 col-end-8'} ${wide ? 'col-start-2 col-end-12 md:col-start-3 md:col-end-11' : ''}`}
        data-hover>
        <PlaceholderTile n={project.n} tone={project.tone} aspect={project.aspect} src={project.src} />
      </motionW.div>

      <div className={`${isRight ? 'col-start-1 col-end-6 md:pl-2' : 'col-start-8 col-end-13 md:text-right'} ${wide ? 'col-start-2 col-end-12 md:text-left md:col-start-3' : ''} pb-2`}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            {String(project.year)}
          </span>
          <span className="text-white/25">/</span>
          <span className="text-[10.5px] uppercase tracking-[0.28em] text-white/55">
            {project.tags.join(' · ')}
          </span>
        </div>
        <h3 className="mt-3 font-display font-light tracking-[-0.01em] leading-[1.05] text-white text-[34px] md:text-[44px]">
          {project.title}
        </h3>
      </div>
    </motionW.div>
  );
}

/* ---------- Selected Work eyebrow mask — sits where the 00/00 counter was ---------- */
function MaskEyebrow() {
  const ref = useRef(null);
  const sheenRef = useRef(null);
  const rimRef = useRef(null);
  const revealRef = useRef(null);
  const [entered, setEntered] = React.useState(true);
  const stateRef = useRef({ x: 1, y: 0.5, tx: 1, ty: 0.5, a: 0, ta: 0, raf: 0 });

  // One-shot clip-path reveal on first viewport entry — the image
  // "develops" from a centered horizontal slit, scales 1.08 → 1.0 and
  // saturates up. Feels like a photograph being printed.
  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setEntered(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.25) {
          setEntered(true);
          io.disconnect();
        }
      });
    }, { threshold: [0.25, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    function tick() {
      st.x += (st.tx - st.x) * 0.10;
      st.y += (st.ty - st.y) * 0.10;
      st.a += (st.ta - st.a) * 0.10;

      if (sheenRef.current) {
        sheenRef.current.style.setProperty('--mx', (st.x * 100).toFixed(2) + '%');
        sheenRef.current.style.setProperty('--my', (st.y * 100).toFixed(2) + '%');
        sheenRef.current.style.opacity = String(0.35 + st.a * 0.55);
      }
      if (rimRef.current) {
        rimRef.current.style.opacity = String(0.25 + st.a * 0.50);
      }
      st.raf = requestAnimationFrame(tick);
    }
    st.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(st.raf);
  }, []);

  function onMove(e) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const st = stateRef.current;
    st.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    st.ty = Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height));
    st.ta = 1;
  }
  function onLeave() { stateRef.current.ta = 0; }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full h-[560px]"
      style={{ isolation: 'isolate' }}>
      {/* Reveal wrapper — clip-path slit opens + scales + saturates
          on first entry. Wraps the photo only; sheen/rim/motes
          continue to use their own existing layers. */}
      <div
        ref={revealRef}
        className="absolute inset-0"
        style={{
          clipPath: entered
            ? 'inset(0% 0% 0% 0%)'
            : 'inset(46% 8% 46% 8%)',
          transform: entered ? 'scale(1)' : 'scale(1.08)',
          transformOrigin: '55% 50%',
          transition:
            'clip-path 1400ms cubic-bezier(0.22,1,0.36,1), transform 1600ms cubic-bezier(0.22,1,0.36,1)',
          willChange: 'clip-path, transform',
        }}>
      {/* base photo — feathered via CSS mask so the rectangle edge
          truly dissolves into the surrounding black instead of cutting */}
      <img
        src="assets/sw-mask.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-contain select-none"
        style={{
          objectPosition: '50% 50%',
          filter: entered
            ? 'contrast(1.15) brightness(1.35) saturate(1)'
            : 'contrast(1.2) brightness(1.1) saturate(0.5)',
          transition: 'filter 1400ms cubic-bezier(0.22,1,0.36,1)',
          /* The mask sculpture is dark-on-black, so no blend mode —
             we need the actual pixels to show. Feather edges with
             a radial alpha mask only. */
          WebkitMaskImage:
            'radial-gradient(130% 130% at 50% 50%, #000 75%, rgba(0,0,0,0.85) 88%, rgba(0,0,0,0.35) 96%, rgba(0,0,0,0) 100%)',
          maskImage:
            'radial-gradient(130% 130% at 50% 50%, #000 75%, rgba(0,0,0,0.85) 88%, rgba(0,0,0,0.35) 96%, rgba(0,0,0,0) 100%)',
        }}
      />
      </div>
      {/* Cursor-following light sheen — traces along the lit half-face
          like a lamp drifting past. Also masked so the glow feathers
          to nothing at the frame edge instead of cutting. */}
      <div
        ref={sheenRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(36% 28% at var(--mx,70%) var(--my,45%), rgba(255,236,210,0.28) 0%, rgba(200,170,130,0.10) 45%, rgba(0,0,0,0) 75%)',
          mixBlendMode: 'screen',
          transition: 'opacity 500ms cubic-bezier(0.22,1,0.36,1)',
          WebkitMaskImage:
            'radial-gradient(120% 105% at 50% 50%, #000 35%, rgba(0,0,0,0.6) 62%, rgba(0,0,0,0) 95%)',
          maskImage:
            'radial-gradient(120% 105% at 50% 50%, #000 35%, rgba(0,0,0,0.6) 62%, rgba(0,0,0,0) 95%)',
        }}
      />
      {/* Rim light — subtle warm edge along the nose/cheek ridge */}
      <div
        ref={rimRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(100deg, rgba(0,0,0,0) 48%, rgba(255,225,188,0.22) 52%, rgba(0,0,0,0) 56%)',
          mixBlendMode: 'screen',
          transition: 'opacity 600ms cubic-bezier(0.22,1,0.36,1)',
          WebkitMaskImage:
            'radial-gradient(120% 105% at 50% 50%, #000 30%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 95%)',
          maskImage:
            'radial-gradient(120% 105% at 50% 50%, #000 30%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 95%)',
        }}
      />
      {/* Tiny floating motes — ambient "dust in the light" micro-interaction */}
      <span className="mask-mote mask-mote-1" aria-hidden />
      <span className="mask-mote mask-mote-2" aria-hidden />
      <span className="mask-mote mask-mote-3" aria-hidden />
      <span className="mask-mote mask-mote-4" aria-hidden />
      {/* Edge dissolve removed — CSS-masking on the image + sheen layers
          handles the fade cleanly on all sides without a boxed gradient. */}
      {/* Hairline caption below */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 text-right text-[9.5px] uppercase tracking-[0.32em] text-white/45">
        Archive №.07
      </div>
    </div>
  );
}


function SwapWord({ words, interval = 2200, className = '', italic = false }) {
  const [i, setI] = React.useState(0);
  const [prev, setPrev] = React.useState(null);
  const [phase, setPhase] = React.useState('idle'); // idle | swapping
  const running = useRef(true);

  useEffect(() => {
    running.current = true;
    let swapT, idleT;
    const tick = () => {
      if (!running.current) return;
      setPhase('swapping');
      setPrev(i);
      setI((v) => (v + 1) % words.length);
      swapT = setTimeout(() => { setPhase('idle'); setPrev(null); }, 720);
      idleT = setTimeout(tick, interval);
    };
    idleT = setTimeout(tick, interval);
    return () => { running.current = false; clearTimeout(swapT); clearTimeout(idleT); };
  // eslint-disable-next-line
  }, [words, interval]);

  // use the widest word as the layout template so surrounding text doesn't jitter
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), '');
  const cur = words[i];
  const out = prev == null ? null : words[prev];

  return (
    <span className={`swap-word ${italic ? 'italic-accent' : ''} ${className}`}>
      {/* invisible sizer — reserves max width + height so the line is stable */}
      <span className="swap-sizer" aria-hidden>{widest}</span>
      {/* outgoing word slides up + blurs out */}
      {out && (
        <span key={`out-${prev}`} className="swap-slot swap-out" aria-hidden>{out}</span>
      )}
      {/* incoming word rises in + de-blurs */}
      <span key={`in-${i}-${phase}`} className={`swap-slot ${phase === 'swapping' ? 'swap-in' : 'swap-rest'}`}>
        {cur}
      </span>
    </span>
  );
}

function SelectedWork() {
  /* Projects are parked for a future section — do not delete.
     Re-enable by replacing `projects` below with `_PARKED_PROJECTS`. */
  const _PARKED_PROJECTS = [
    { n: 1, title: 'Lagos After Dark',           year: 2026, tags: ['Creative Direction', '3D', 'Motion'],   tone: 'warm',  aspect: 'aspect-[4/5]',   src: 'assets/project-01.jpg' },
    { n: 2, title: 'A Quiet Rebellion',          year: 2025, tags: ['Brand Film', 'Sound Design'],           tone: 'ember', aspect: 'aspect-[4/3]',   src: 'assets/project-02.jpg' },
    { n: 3, title: 'Pilgrim / Chapter One',      year: 2025, tags: ['Identity', 'Motion System'],            tone: 'noir',  aspect: 'aspect-[16/10]', src: 'assets/project-03.jpg' },
  ];
  void _PARKED_PROJECTS;

  const projects = [];

  return (
    <section
      data-screen-label="Selected Work"
      className="relative bg-black text-white overflow-hidden">
      {/* Top blend-in: hero already arrives at solid black, so this just
          softens the handoff — no double-darkening at the seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[14vh]"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%)',
        }}
      />
      {/* Section intro — standalone teaser; splits here so the next
          idea can slot in directly after this. */}
      <div className="relative px-10 pt-40 pb-16 md:pb-20">
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-12 md:col-span-2">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
              → Selected work
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-3 mt-10 md:mt-0">
            <p className="font-display font-light tracking-[-0.01em] text-[24px] md:text-[32px] leading-[1.15] text-white/85 max-w-[20ch]">
              A handful of the{' '}
              <SwapWord
                words={['moments', 'chapters', 'ìtàn', 'whispers', 'rituals', 'ìran', 'orin']}
                interval={2600}
              />
              <br />
              we helped br<span className="italic-accent">i</span>ng into the{' '}
              <SwapWord
                words={['world', 'light', 'ìmọ́lẹ̀', 'frame', 'open', 'ojú']}
                interval={2900}
                italic
              />
              .
            </p>
          </div>
          <div className="hidden md:block md:col-span-6 md:col-start-7">
            <MaskEyebrow />
          </div>
        </div>
      </div>
    </section>
  );
}

window.SelectedWork = SelectedWork;
