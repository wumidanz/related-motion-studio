/* global React */
const { useState, useEffect, useRef } = React;
const FM_S = window.framerMotion || window.Motion || {};
const motionS = FM_S.motion;

const svcEase = [0.22, 1, 0.36, 1];

/* ---------- Data ----------
   One entry per service. Swap `image` as the user sends each vertical
   portrait; the rest of the layout is image-agnostic. Use `placeholder`
   as a fallback gradient signature when no image exists yet. */
const SERVICES = [
  {
    n: '01',
    title: 'Creative Direction',
    tagline: 'The first decision, made slowly.',
    blurb: 'We shape the idea before anyone opens a camera — casting, narrative, the weather of a brand. Strategy as a tone of voice, not a deck.',
    items: ['Strategy', 'Narrative', 'Art Direction', 'Casting'],
    image: 'assets/service-01-creative-direction.png',
    focus: 'center 22%',
    placeholder: null,
    accent: '#e6d9c5',
  },
  {
    n: '02',
    title: 'Brand Identity',
    tagline: 'Systems that survive the first season.',
    blurb: 'Wordmarks, rhythm, a full visual language. We draw the marks, then we tune them until every surface reads like one voice.',
    items: ['Wordmarks', 'Systems', 'Guidelines', 'Applications'],
    image: 'assets/service-02-brand-identity.png',
    focus: 'center 38%',
    placeholder: null,
    accent: '#d3b88a',
  },
  {
    n: '03',
    title: 'Motion & Film',
    tagline: 'Frame by frame, until it breathes.',
    blurb: 'Brand film, short documentary, motion identity. A small crew and a camera that listens. We cut for silence and the turn.',
    items: ['Brand Film', 'Documentary', 'Motion Identity', 'Post'],
    image: 'assets/service-03-motion-film.png',
    focus: 'center 22%',
    placeholder: null,
    accent: '#c4b8a6',
  },
  {
    n: '04',
    title: 'Digital Experiences',
    tagline: 'Interfaces that hold their breath.',
    blurb: 'Editorial sites, immersive experiences, and the motion that stitches them together. Built to be felt, not only clicked.',
    items: ['Editorial Sites', 'Interactions', 'Immersive', '3D / WebGL'],
    image: 'assets/service-04-digital-experiences.png',
    focus: '40% 35%',
    placeholder: null,
    accent: '#a8b9c8',
  },
  {
    n: '05',
    title: 'Sound & Music',
    tagline: 'Room tone, then everything else.',
    blurb: 'Score, sound design, mix. We start with the room the film lives in — score and foley sit inside it, never in front of it.',
    items: ['Score', 'Design', 'Mix', 'Dolby 5.1'],
    image: 'assets/service-05-sound-music.png',
    focus: '70% 38%',
    placeholder: 'linear-gradient(180deg, #1e1418 0%, #0d0709 55%, #040203 100%)',
    accent: '#c48a8a',
  },
];

/* ---------- Single panel ----------
   Two columns: left text, right full-height image. The text has a fade
   to black gradient extending over ~40% of the panel so copy stays
   legible on any image. Ken-Burns drift on the active image. */
function ServicePanel({ svc, progress /* 0..1 active progress */ }) {
  const hasImage = !!svc.image;

  // Small parallax on the image itself as the panel is traversed.
  // progress 0 = entering, 0.5 = centered, 1 = exiting.
  const imgY = (progress - 0.5) * 40;      // vh
  const imgScale = 1.04 + progress * 0.06; // slow Ken Burns
  const textY = (progress - 0.5) * -24;    // opposite direction of image
  const textOpacity = 1 - Math.abs(progress - 0.5) * 0.9; // dimmed at edges

  return (
    <article
      className="relative h-screen w-full overflow-hidden bg-black text-white"
      data-hover>
      {/* image / placeholder */}
      <div className="absolute inset-0">
        {hasImage ? (
          <img
            src={svc.image}
            alt={svc.title}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              // Anchor to top so portraits keep the face visible when the
              // image is cropped to fill a full-height panel.
              objectPosition: svc.focus || 'center 18%',
              transform: `translateY(${imgY * 0.3}px) scale(${imgScale})`,
              transformOrigin: 'center top',
              willChange: 'transform',
              filter: 'saturate(0.92) contrast(1.04)',
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: svc.placeholder }}
          />
        )}

        {/* text-side gradient scrim — keeps left half legible */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 30%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0.05) 80%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* top & bottom filmic letterbox */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[8vh] bg-gradient-to-b from-black/60 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[14vh] bg-gradient-to-t from-black to-transparent" />
        {/* grain */}
        <div aria-hidden className="absolute inset-0 noise opacity-50" />
      </div>

      {/* left text column */}
      <div
        className="relative z-10 grid h-full grid-cols-12 px-10 md:px-16"
        style={{
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
          willChange: 'transform, opacity',
        }}>
        <div className="col-span-12 md:col-span-6 flex h-full flex-col justify-center pr-6 md:pr-10 pb-32 md:pb-36">
          {/* number + tagline row */}
          <div className="mb-8 flex items-center gap-4">
            <span
              className="font-mono text-[10.5px] uppercase tracking-[0.3em]"
              style={{ color: svc.accent }}>
              — {svc.n} / 05
            </span>
            <span className="italic-accent text-[18px] md:text-[22px] text-white/70">
              {svc.tagline}
            </span>
          </div>

          <h2 className="font-display font-light tracking-[-0.02em] leading-[0.94] text-white text-[56px] md:text-[96px] lg:text-[120px]">
            {svc.title.split(' ').map((w, i) => (
              <span key={i} className="block">{w}</span>
            ))}
          </h2>

          <p className="mt-10 max-w-[42ch] text-[15px] md:text-[17px] leading-[1.65] text-white/75">
            {svc.blurb}
          </p>

          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-2">
            {svc.items.map((it) => (
              <li
                key={it}
                className="group/item flex items-center gap-3 text-[12.5px] uppercase tracking-[0.24em] text-white/60 hover:text-white transition-colors">
                <span
                  className="inline-block h-px w-5 transition-all duration-500 group-hover/item:w-8"
                  style={{ background: svc.accent, opacity: 0.85 }}
                />
                <span>{it}</span>
              </li>
            ))}
          </ul>

          <div className="mt-14">
            <a
              href="index.html#contact"
              data-hover
              className="group inline-flex items-center gap-4 text-[11px] uppercase tracking-[0.3em] text-white/85 hover:text-white transition-colors">
              <span className="inline-block h-px w-10 bg-white/50 group-hover:w-16 transition-[width] duration-500" />
              <span>Commission this practice</span>
              <svg width="22" height="10" viewBox="0 0 22 10" className="transition-transform duration-500 group-hover:translate-x-1.5">
                <path d="M1 5 H21 M16 1 L21 5 L16 9" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* right corner chip (meta) */}
      <div className="absolute right-8 top-8 z-10 text-right text-[10.5px] uppercase tracking-[0.3em] text-white/55 leading-[1.9]">
        <div className="text-white/80">{svc.title}</div>
        <div>Related · Studio</div>
      </div>
    </article>
  );
}

/* ---------- Section wrapper ----------
   Uses a sticky container (1 viewport tall) riding on top of a tall
   scroll track (5 × 100vh). As the user scrolls through the track, we
   compute which service is active and how far through it, then drive
   the single pinned panel's transforms. This creates the "pin + swap"
   feel without any layout thrash. */
function Services() {
  const trackRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [panelProgress, setPanelProgress] = useState(0);

  // Panel count for the scroll track height.
  const N = SERVICES.length;

  useEffect(() => {
    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Total scrollable distance inside the track.
      // Track height is N * 100vh — the first vh is panel 0 entering,
      // the last vh is panel N-1 fully visible before unpinning.
      const total = el.offsetHeight - vh;
      // How far into the track we are, 0..1.
      const raw = Math.min(1, Math.max(0, -rect.top / total));
      const slot = raw * N; // which panel are we on (0..N)
      const idx = Math.min(N - 1, Math.floor(slot));
      const within = slot - idx; // 0..1 inside current panel
      setActiveIdx(idx);
      setPanelProgress(within);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [N]);

  const active = SERVICES[activeIdx];

  return (
    <section
      data-screen-label="Services"
      className="relative bg-black text-white">

      {/* intro strip */}
      <div className="relative px-10 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="grid grid-cols-12 items-baseline">
          <div className="col-span-12 md:col-span-2 text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            → Services · 05 / 05
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-4 mt-6 md:mt-0">
            <p className="font-display font-light tracking-[-0.01em] text-[28px] md:text-[40px] leading-[1.15] text-white/85 max-w-[24ch]">
              Five disciplines, one studio.
              <br />
              Nothing outsourced, every<span className="italic-accent">i</span>nch considered.
            </p>
          </div>
          <div className="hidden md:block md:col-span-2 md:col-start-11 text-right text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            Scroll ↓
          </div>
        </div>
      </div>

      {/* pinned scroll track — height = N viewports, the pinned panel sits inside */}
      <div ref={trackRef} className="relative" style={{ height: `${N * 100}vh` }}>
        <div className="sticky top-0 h-screen w-full">
          {/* stacked panels, only the active one visible via opacity mask */}
          {SERVICES.map((svc, i) => {
            const isActive = i === activeIdx;
            return (
              <div
                key={svc.n}
                className="absolute inset-0"
                style={{
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  transition: 'opacity 350ms ease',
                }}>
                <ServicePanel
                  svc={svc}
                  progress={isActive ? panelProgress : 0.5}
                />
              </div>
            );
          })}

          {/* top progress rail */}
          <div className="pointer-events-none absolute left-10 right-10 top-6 z-20 flex items-center gap-3">
            {SERVICES.map((s, i) => (
              <div key={s.n} className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] tracking-[0.3em]"
                  style={{
                    color: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.32)',
                  }}>
                  {s.n}
                </span>
                {i < SERVICES.length - 1 && (
                  <span
                    className="block h-px w-12 md:w-20"
                    style={{
                      background:
                        i < activeIdx
                          ? '#e6d9c5'
                          : i === activeIdx
                          ? `linear-gradient(90deg, #e6d9c5 0%, #e6d9c5 ${panelProgress * 100}%, rgba(255,255,255,0.15) ${panelProgress * 100}%)`
                          : 'rgba(255,255,255,0.15)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* bottom-left tiny ambient caption */}
          <div className="pointer-events-none absolute bottom-10 left-10 z-20 text-[10.5px] uppercase tracking-[0.32em] text-white/45 leading-[1.9]">
            <div className="text-white/75">Now · {active.title}</div>
            <div>Scroll to advance ·  {String(activeIdx + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Services = Services;
