/* global React */
/* Reels — a motion reel index in the visual language of the rest of the
   studio site. Left: large "now playing" feature panel with scrubber,
   timecode, scanlines, and a blinking REC dot. Right: vertical index of
   reel entries; hover to preview, click to make it the feature.

   No invented imagery — each reel is a tonal placeholder with a label,
   same as the Selected Work tiles. Real video drops replace the
   placeholder via the `src` field (mp4) or `poster` (jpg). */

const FM_R = window.framerMotion || window.Motion || {};
const motionR = FM_R.motion;

const reelsEase = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Tonal placeholder — matches the PlaceholderTile language in work.jsx */
/* ------------------------------------------------------------------ */
function ReelStill({ tone = 'warm', label, timecode, src, poster, playing }) {
  const videoRef = React.useRef(null);
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    let cancelled = false;
    const tryPlay = () => {
      if (cancelled || !playing) return;
      const p = v.play();
      if (p && p.catch) p.catch(() => {
        // Retry once after a short delay — browsers sometimes reject
        // the first play() call before data is ready.
        setTimeout(() => { if (!cancelled && playing) v.play().catch(() => {}); }, 250);
      });
    };
    // Chrome pauses muted video-only media after a few seconds to save
    // power. Our reels have no audio track, so we get paused even when
    // visible. Re-kick playback whenever that happens.
    const onPause = () => {
      if (cancelled || !playing || v.ended) return;
      setTimeout(() => {
        if (!cancelled && playing && !v.ended && v.paused) {
          v.play().catch(() => {});
        }
      }, 120);
    };
    if (playing) {
      try { v.currentTime = 0; } catch (_) {}
      if (v.readyState >= 2) {
        tryPlay();
      } else {
        v.addEventListener('loadeddata', tryPlay, { once: true });
        v.addEventListener('canplay',    tryPlay, { once: true });
        try { v.load(); } catch (_) {}
      }
      v.addEventListener('pause', onPause);
    } else {
      v.pause();
    }
    return () => {
      cancelled = true;
      v.removeEventListener('loadeddata', tryPlay);
      v.removeEventListener('canplay', tryPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [playing, src]);
  const grads = {
    warm:  'radial-gradient(120% 90% at 30% 25%, #3a2a1f 0%, #1a120c 55%, #050403 100%)',
    ember: 'radial-gradient(120% 90% at 35% 70%, #4a2315 0%, #1d0d07 55%, #050201 100%)',
    dusk:  'radial-gradient(120% 90% at 65% 60%, #33263a 0%, #14101c 55%, #040308 100%)',
    noir:  'radial-gradient(120% 90% at 50% 40%, #14161a 0%, #0a0b0e 55%, #020204 100%)',
    cool:  'radial-gradient(120% 90% at 70% 30%, #1c2a36 0%, #0d141b 55%, #03060a 100%)',
  };
  const isWarm = new Set(['warm', 'ember', 'dusk']).has(tone);
  const highlight = isWarm
    ? 'radial-gradient(45% 45% at 50% 42%, rgba(160,92,48,0.22) 0%, rgba(80,44,22,0.08) 55%, rgba(0,0,0,0) 100%)'
    : 'radial-gradient(55% 50% at 50% 42%, rgba(210,215,225,0.14) 0%, rgba(140,150,170,0.05) 55%, rgba(0,0,0,0) 100%)';
  const edge = isWarm
    ? 'radial-gradient(130% 95% at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,6,3,0.55) 78%, rgba(5,3,2,0.95) 100%)'
    : 'radial-gradient(130% 95% at 50% 45%, rgba(0,0,0,0) 45%, rgba(4,5,8,0.60) 78%, rgba(1,1,3,0.96) 100%)';

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: grads[tone] || grads.noir, isolation: 'isolate' }}>
      {src && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: 'contrast(1.06) saturate(1.05) brightness(0.98)',
          }}
        />
      )}
      {!src && (
        <>
          <div className="absolute inset-0" style={{ background: highlight, mixBlendMode: 'screen' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: edge }} />
          {/* scanlines — cheap "video" read */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)',
              mixBlendMode: 'overlay',
              opacity: 0.55,
            }}
          />
          <div className="absolute inset-0 noise opacity-60 pointer-events-none" />
          {/* CRT-ish flicker band */}
          <div
            aria-hidden
            className="absolute inset-x-0 h-[18%] pointer-events-none reel-flicker"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)',
              mixBlendMode: 'screen',
            }}
          />
          {/* Corner: timecode badge */}
          {timecode && (
            <div className="absolute top-5 right-5 text-[10.5px] uppercase tracking-[0.28em] text-white/70 font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e06a3c] mr-2 align-middle reel-rec" />
              {timecode}
            </div>
          )}
          {/* Frame label */}
          {label && (
            <div className="absolute top-5 left-5 text-[10.5px] uppercase tracking-[0.28em] text-white/70">
              {label}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature panel — large "now playing" */
/* ------------------------------------------------------------------ */
function FeaturePanel({ reel, progress, onPrev, onNext, shown, total: reelCount, frameRef }) {
  // progress is a 0..1 number we animate to simulate a timeline
  const pct = Math.round(progress * 100);
  // timecode based on progress + reel.duration (seconds)
  const total = reel.duration;
  const cur = Math.min(total, progress * total);
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ff = Math.floor((s % 1) * 24); // 24fps
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full" data-hover>
      {/* Film-leader header row */}
      <div className="flex items-baseline justify-between text-[10.5px] uppercase tracking-[0.28em] text-white/55 mb-5">
        <div className="flex items-center gap-4">
          <span className="text-white/75">Reel · {String(reel.n).padStart(2, '0')}</span>
          <span className="text-white/25">/</span>
          <span>{reel.year}</span>
          <span className="text-white/25">/</span>
          <span>{reel.format}</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <span>{reel.aspect}</span>
          <span className="text-white/25">·</span>
          <span>{reel.sound}</span>
        </div>
      </div>

      {/* The frame */}
      <div
        ref={frameRef}
        data-reel-frame
        className="relative w-full aspect-[16/9] overflow-hidden"
        style={{ transformOrigin: '50% 50%', willChange: 'transform, filter, opacity' }}
        key={reel.n /* re-mount so the flicker re-cues on reel change */}>
        <ReelStill tone={reel.tone} label={reel.label} timecode={fmt(cur)} src={reel.src} poster={reel.poster} playing={true} />

        {!reel.src && (
          <>
            {/* hairline inner frame */}
            <div aria-hidden className="absolute inset-[10px] pointer-events-none border border-white/10" />

            {/* Corner ticks */}
            <span aria-hidden className="tile-corner tile-corner-tl" style={{ ['--len']: '22px' }} />
            <span aria-hidden className="tile-corner tile-corner-tr" style={{ ['--len']: '22px' }} />
            <span aria-hidden className="tile-corner tile-corner-bl" style={{ ['--len']: '22px' }} />
            <span aria-hidden className="tile-corner tile-corner-br" style={{ ['--len']: '22px' }} />
          </>
        )}
      </div>

      {/* Transport row — title + scrubber + time */}
      <div className="mt-6 grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 md:col-span-6">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            {reel.client}
          </div>
          <h3 className="mt-2 font-display font-light tracking-[-0.01em] leading-[1.05] text-white text-[30px] md:text-[38px]">
            {reel.title}
          </h3>
        </div>
        <div className="col-span-12 md:col-span-6">
          {/* scrubber */}
          <div className="relative h-[2px] w-full bg-white/15 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[#e6d9c5]"
              style={{ width: pct + '%', transition: 'width 140ms linear' }}
            />
            <div
              className="absolute top-1/2 h-2 w-[1px] bg-white"
              style={{ left: pct + '%', transform: 'translate(-0.5px, -50%)' }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/55">
            <span className="text-white/80">{fmt(cur)}</span>
            <div className="flex items-center gap-3 text-white/45">
              <span>—</span>
              {reel.tags.map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <span className="text-white/20">·</span>}
                  <span>{t}</span>
                </React.Fragment>
              ))}
              <span>—</span>
            </div>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Minimalist nav — prev / index / next */}
      <div className="mt-10 flex items-center justify-center gap-10 select-none">
        <button
          onClick={onPrev}
          data-hover
          aria-label="Previous reel"
          className="reel-nav group relative flex items-center gap-3 text-[10.5px] uppercase tracking-[0.32em] text-white/55 hover:text-white transition-colors duration-500">
          <span className="reel-nav-line reel-nav-line-l" aria-hidden />
          <svg width="22" height="10" viewBox="0 0 22 10" className="reel-nav-arrow reel-nav-arrow-l">
            <path d="M21 5 H1 M6 1 L1 5 L6 9" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Prev</span>
        </button>

        <div className="font-mono text-[10.5px] uppercase tracking-[0.32em] text-white/35 min-w-[6ch] text-center">
          {String(shown + 1).padStart(2, '0')} <span className="text-white/15">/</span> {String(reelCount).padStart(2, '0')}
        </div>

        <button
          onClick={onNext}
          data-hover
          aria-label="Next reel"
          className="reel-nav group relative flex items-center gap-3 text-[10.5px] uppercase tracking-[0.32em] text-white/55 hover:text-white transition-colors duration-500">
          <span>Next</span>
          <svg width="22" height="10" viewBox="0 0 22 10" className="reel-nav-arrow reel-nav-arrow-r">
            <path d="M1 5 H21 M16 1 L21 5 L16 9" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="reel-nav-line reel-nav-line-r" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Index row — right column list */
/* ------------------------------------------------------------------ */
function IndexRow({ reel, active, onHover, onClick, i }) {
  return (
    <motionR.button
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.8, ease: reelsEase, delay: 0.05 * i }}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      data-hover
      className={`group relative w-full text-left block border-t border-white/10 py-5 transition-colors duration-500
        ${active ? 'text-white' : 'text-white/55 hover:text-white'}`}>
      {/* Active indicator — thin amber bar on the left */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px] transition-all duration-500"
        style={{
          background: active ? '#e6d9c5' : 'rgba(255,255,255,0.0)',
          boxShadow: active ? '0 0 14px rgba(230,217,197,0.55)' : 'none',
        }}
      />
      <div className="pl-5 pr-2 flex items-baseline gap-4">
        <span className="text-[10.5px] uppercase tracking-[0.28em] font-mono text-white/45 w-[2.5ch] shrink-0">
          {String(reel.n).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-light tracking-[-0.01em] text-[20px] md:text-[24px] leading-[1.15] truncate">
            {reel.title}
          </div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.28em] text-white/40">
            {reel.client} <span className="text-white/20">·</span> {reel.format}
          </div>
        </div>
        <div className="shrink-0 text-right text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/55">
          {(() => {
            const m = Math.floor(reel.duration / 60);
            const s = Math.floor(reel.duration % 60);
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          })()}
        </div>
      </div>
      {/* Hover underline rail, extended when active */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-px bg-white/30 transition-[width] duration-700"
        style={{ width: active ? '100%' : '0%' }}
      />
    </motionR.button>
  );
}

/* ------------------------------------------------------------------ */
/* Section */
/* ------------------------------------------------------------------ */
function Reels() {
  const sectionRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const bleedRef = React.useRef(null);

  // Scroll-linked exit morph: as section leaves viewport, scale up +
  // blur + fade video, and fade the shared bleed gradient from
  // black → warm off-white.
  React.useEffect(() => {
    let raf = 0;
    function update() {
      const sec = sectionRef.current;
      if (!sec) { raf = requestAnimationFrame(update); return; }
      const frame = sec.querySelector('[data-reel-frame]');
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 1.2;
      const end   = vh * 0.2;
      const prog = Math.max(0, Math.min(1, (start - r.bottom) / (start - end)));
      if (frame) {
        const s = 1 + prog * 0.22;
        const b = prog * 22;
        const ty = prog * -40;
        frame.style.transform = `translateY(${ty}px) scale(${s})`;
        frame.style.filter = `blur(${b}px)`;
        frame.style.opacity = String(1 - prog * 0.92);
      }
      if (bleedRef.current) {
        bleedRef.current.style.opacity = String(prog);
      }
      raf = requestAnimationFrame(update);
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  const reels = [
    { n: 1, title: 'Tide Lines',            client: 'Okurase Rum',       year: 2026, format: 'Brand Film',     duration: 108, aspect: '2.39 : 1', sound: 'Dolby 5.1', label: 'Roll A · Take 07', tone: 'warm',  tags: ['Direction', 'Color', 'Sound'],   src: 'assets/reel-fixed.mp4' },
    { n: 2, title: 'A Quiet Rebellion',     client: 'Akoya Studios',     year: 2025, format: 'Short',          duration:  92, aspect: '1.85 : 1', sound: 'Stereo',    label: 'Roll C · Take 02', tone: 'ember', tags: ['Narrative', 'Sound Design'],     src: 'assets/reel-02.mp4' },
    { n: 3, title: 'Pilgrim / Chapter One', client: 'Pilgrim',           year: 2025, format: 'Motion System',  duration: 142, aspect: '16 : 9',   sound: 'Stereo',    label: 'Roll F · Take 01', tone: 'noir',  tags: ['Identity', 'Motion'],            src: 'assets/reel-02.mp4' },
    { n: 4, title: 'Salt Month',            client: 'Manta Island',      year: 2024, format: 'Documentary',    duration: 214, aspect: '2.39 : 1', sound: 'Atmos',     label: 'Roll B · Take 11', tone: 'dusk',  tags: ['Doc', 'Edit'],                   src: 'assets/reel-fixed.mp4' },
    { n: 5, title: 'After Hours',           client: 'Lumen & Co',        year: 2024, format: 'Campaign',       duration:  66, aspect: '9 : 16',   sound: 'Stereo',    label: 'Roll E · Take 03', tone: 'cool',  tags: ['Vertical', 'Edit'],              src: 'assets/reel-02.mp4' },
  ];

  const [active, setActive] = React.useState(0);
  const [hover, setHover] = React.useState(null);
  const shown = hover ?? active;
  const reel = reels[shown];

  // Auto-rotate silently through reels every 8s.
  React.useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % reels.length);
    }, 8000);
    return () => clearInterval(id);
  }, [reels.length]);

  // Animated fake scrub progress for the feature reel. Resets on reel change.
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    setProgress(0.02);
    let raf = 0;
    let t0 = performance.now();
    const dur = reel.duration * 1000;
    function tick(now) {
      const p = Math.min(0.96, (now - t0) / dur + 0.02);
      setProgress(p);
      if (p < 0.96) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown]);

  return (
    <section
      ref={sectionRef}
      data-screen-label="Reels"
      className="relative bg-black text-white overflow-hidden">
      {/* Local style block for reel-specific motion */}
      <style>{`
        @keyframes reelFlicker {
          0%, 100% { transform: translateY(-40%); opacity: 0.00; }
          10%      { opacity: 0.85; }
          50%      { transform: translateY(120%); opacity: 0.25; }
          90%      { opacity: 0.65; }
        }
        .reel-flicker { animation: reelFlicker 5.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; top: 0; }

        @keyframes reelRec { 0%, 60% { opacity: 1; } 75%, 100% { opacity: 0.15; } }
        .reel-rec { animation: reelRec 1.4s ease-in-out infinite; }

        /* Minimalist nav */
        .reel-nav { padding: 6px 2px; }
        .reel-nav-arrow { transition: transform 600ms cubic-bezier(0.22,1,0.36,1); color: currentColor; }
        .reel-nav:hover .reel-nav-arrow-l { transform: translateX(-6px); }
        .reel-nav:hover .reel-nav-arrow-r { transform: translateX(6px); }
        .reel-nav-line {
          display: inline-block;
          height: 1px;
          width: 0px;
          background: currentColor;
          opacity: 0.6;
          transition: width 600ms cubic-bezier(0.22,1,0.36,1);
        }
        .reel-nav:hover .reel-nav-line { width: 28px; }
      `}</style>

      {/* Seam bleed — feathered gradient that fades black → warm off-white
          as the section exits. Overlaps into BlobLight so there's no
          visible edge. */}
      <div
        ref={bleedRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-40"
        style={{
          bottom: '-28vh',
          height: '56vh',
          opacity: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(20,16,12,0.35) 18%, rgba(80,68,56,0.55) 42%, rgba(180,168,152,0.72) 68%, rgba(237,234,228,0.95) 90%, #edeae4 100%)',
          transition: 'opacity 120ms linear',
        }}
      />

      {/* Seam blend from preceding section. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[14vh]"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%)' }}
      />

      <div className="relative px-10 pt-16 md:pt-20 pb-48 md:pb-56">
        {/* Section header — matches Selected Work intro rhythm */}
        <div className="grid grid-cols-12 items-baseline mb-20 md:mb-28">
          <div className="col-span-12 md:col-span-2">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
              → Motion reel
            </div>
          </div>
          <div className="col-span-12 md:col-span-6 md:col-start-4 mt-8 md:mt-0">
            <p className="font-display font-light tracking-[-0.01em] text-[28px] md:text-[40px] leading-[1.15] text-white/85 max-w-[22ch]">
              Twenty-four frames a second,
              <br />
              the rest is pat<span className="italic-accent">i</span>ence.
            </p>
          </div>
          <div className="hidden md:flex md:col-span-3 md:col-start-10 justify-end items-center gap-3 text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e06a3c] reel-rec" />
            <span>REC · 2026</span>
            <span className="text-white/20">/</span>
            <span>{String(reels.length).padStart(2, '0')} reels</span>
          </div>
        </div>

        {/* Main — full-width feature, auto-rotating silently */}
        <div className="grid grid-cols-12 gap-10">
          <motionR.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 1.0, ease: reelsEase }}
            className="col-span-12">
            <FeaturePanel
              reel={reel}
              progress={progress}
              shown={shown}
              total={reels.length}
              onPrev={() => setActive((i) => (i - 1 + reels.length) % reels.length)}
              onNext={() => setActive((i) => (i + 1) % reels.length)}
              frameRef={frameRef}
            />
          </motionR.div>
        </div>
      </div>
    </section>
  );
}

window.Reels = Reels;
