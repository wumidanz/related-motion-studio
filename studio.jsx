/* global React, ReactDOM */
/* Studio page — dark cinematic editorial. Five sections:
   (1) Masthead: full-bleed title + "the studio" overline, scroll cue.
   (2) Manifesto: large type paragraph, signature-feeling.
   (3) Capabilities: numbered index list with disciplines.
   (4) Process: four-step horizontal timeline.
   (5) Closing CTA → Contact on Hero page. */

const { useEffect, useRef, useState } = React;
const FM_S = window.framerMotion || window.Motion || {};
const motionS = FM_S.motion;

const sEase = [0.22, 1, 0.36, 1];
const fadeUp = (delay = 0, y = 22) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-10% 0px' },
  transition: { duration: 1.1, ease: sEase, delay },
});
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-10% 0px' },
  transition: { duration: 1.1, ease: sEase, delay },
});

/* ---------- Custom cursor (mirrors hero) ---------- */
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
      if (t && t.closest && t.closest('a, button, [data-hover]')) el.classList.add('hover');
      else el.classList.remove('hover');
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

/* ---------- Shared top bar ---------- */
function TopBar() {
  const navLinks = [
    { label: 'WORK',      href: 'index.html' },
    { label: 'MANIFESTO', href: 'index.html#manifesto' },
    { label: 'STUDIO',    href: 'Studio.html', active: true },
    { label: 'PRODUCTS',  href: 'products/index.html' },
    { label: 'CONTACT',   href: 'index.html#contact' },
  ];
  const langs = ['EN'];
  const [activeLang, setActiveLang] = useState('EN');
  return (
    <header className="absolute top-0 inset-x-0 z-40 px-10 pt-8 grid grid-cols-3 items-start">
      <a href="index.html" className="inline-flex items-baseline gap-2 select-none" data-hover>
        <span className="text-[18px] font-semibold tracking-tight text-white">related</span>
        <span className="text-[13px] tracking-[0.14em] uppercase text-white/70">motion studio</span>
      </a>
      <div className="flex items-center justify-center gap-4 pt-1 text-[11px] tracking-[0.22em] uppercase">
        {langs.flatMap((l, i) => {
          const out = [];
          if (i > 0) {
            out.push(
              <span key={`sep-${i}`} className="text-white/25">|</span>
            );
          }
          out.push(
            <button
              key={`lang-${l}`}
              onClick={() => setActiveLang(l)}
              className={`${activeLang === l ? 'text-white' : 'text-white/45 hover:text-white/80'} transition-colors`}>
              {l}
            </button>
          );
          return out;
        })}
      </div>
      <nav className="flex flex-col items-end gap-2 text-[11px] tracking-[0.22em] uppercase">
        {navLinks.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className={`inline-flex items-center gap-2 ${l.active ? 'text-white' : 'text-white/70 hover:text-white'} transition-colors`}>
            {l.active && <span aria-hidden className="text-white">→</span>}
            <span>{l.label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}

/* ---------- BlurLetters — per-letter rise + blur-clear, page-load only ----------
   Each letter mounts into a keyframe that rises from below with blur
   that clears as it settles. Staggered via CSS custom-property delay,
   so earlier letters are already crisp while later ones are still
   clearing — matches the "as the blur hits U, S is already clear"
   feel requested. Fires on mount, not on scroll. */
function BlurLetters({ text, baseDelay = 0, step = 0.06, duration = 1.1, italicIndices = [], smallCaps = false }) {
  const chars = Array.from(text);
  const italicSet = new Set(italicIndices);
  const keyPrefix = React.useId();
  return (
    <span className="blur-letters-wrap" aria-label={text}>
      {chars.map((ch, i) => {
        const delay = baseDelay + i * step;
        const isSpace = ch === ' ';
        const isItalic = italicSet.has(i);
        return (
          <span
            key={`${keyPrefix}-${i}`}
            aria-hidden
            className={`blur-letter ${isItalic ? 'italic-accent' : ''}`}
            style={{
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}>
            {isSpace ? '\u00A0' : ch}
          </span>
        );
      })}
    </span>
  );
}

/* ---------- Aurora — three drifting blobs, JS-driven (rAF) so they animate
   reliably in any environment (some preview iframes don't advance CSS
   animation timelines). ---------- */
function Aurora({ intensity = 1 }) {
  const warmRef  = React.useRef(null);
  const coolRef  = React.useRef(null);
  const emberRef = React.useRef(null);

  React.useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) / 1000; // seconds

      // Bigger amplitudes + faster base frequencies — the blobs travel
      // across more of the viewport and pulse more noticeably.
      if (warmRef.current) {
        const x = Math.sin(t * 0.42) * 42 + Math.sin(t * 0.18) * 14;
        const y = Math.sin(t * 0.31 + 1.3) * 22 + Math.cos(t * 0.12) * 9;
        const s = 1 + Math.sin(t * 0.24) * 0.22;
        warmRef.current.style.transform =
          `translate(${x}vw, ${y}vh) scale(${s})`;
      }
      if (coolRef.current) {
        const x = Math.sin(t * 0.36 + 2.1) * -48 + Math.cos(t * 0.17) * 12;
        const y = Math.cos(t * 0.28 + 0.7) * 26 + Math.sin(t * 0.1) * 8;
        const s = 1 + Math.cos(t * 0.21) * 0.25;
        coolRef.current.style.transform =
          `translate(${x}vw, ${y}vh) scale(${s})`;
      }
      if (emberRef.current) {
        const x = Math.sin(t * 0.27 + 0.4) * 36 + Math.cos(t * 0.09) * 10;
        const y = Math.cos(t * 0.33 + 1.9) * -30 + Math.sin(t * 0.16) * 12;
        const s = 1 + Math.sin(t * 0.26 + 0.8) * 0.28;
        emberRef.current.style.transform =
          `translate(${x}vw, ${y}vh) scale(${s})`;
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="studio-aurora" style={{ opacity: intensity }}>
        <div ref={warmRef}  className="aurora-blob warm" />
        <div ref={coolRef}  className="aurora-blob cool" />
        <div ref={emberRef} className="aurora-blob ember" />
        <div className="aurora-vignette" />
      </div>
      <div className="absolute inset-0 noise opacity-60" />
    </div>
  );
}

/* ---------- Section 1 · Masthead ---------- */
function Masthead() {
  return (
    <section className="relative min-h-[100vh] w-full overflow-hidden bg-black text-white">
      <TopBar />

      <Aurora intensity={1} />

      {/* section index */}
      <motionS.div
        {...fadeIn(0.25)}
        className="absolute left-10 top-[42%] z-30 text-[10.5px] uppercase tracking-[0.38em] text-white/45">
        → The studio · 01 / 05
      </motionS.div>

      {/* huge title */}
      <div className="relative z-20 flex min-h-[100vh] items-center justify-center px-10">
        <h1 className="text-center font-display font-light tracking-[-0.03em] leading-[0.9] text-white text-[17vw] md:text-[13vw] lg:text-[200px]">
          <span className="block">
            <BlurLetters
              text="Studio"
              italicIndices={[3]} /* the 'i' */
              baseDelay={0.15}
              step={0.09}
            />
          </span>
          <span className="block font-display font-light text-white/45 text-[2.2vw] md:text-[1.6vw] lg:text-[22px] tracking-[0.38em] uppercase mt-8">
            <BlurLetters
              text="Est. 2024 · Lagos & Remote"
              baseDelay={0.75}
              step={0.035}
              duration={0.9}
              smallCaps
            />
          </span>
        </h1>
      </div>

      {/* bottom meta — tiny filmic credit row */}
      <motionS.div
        {...fadeIn(0.9)}
        className="absolute bottom-12 inset-x-10 z-30 flex items-end justify-between text-[10.5px] uppercase tracking-[0.28em] text-white/50">
        <div className="leading-[1.9]">
          <div className="text-white/75">Reel Index</div>
          <div>01 Manifesto</div>
          <div>02 Capabilities</div>
          <div>03 Process</div>
          <div>04 Encounter</div>
        </div>
        <div className="leading-[1.9] text-right">
          <div className="text-white/75">Frame · 24fps</div>
          <div>ISO 400 · 2.39 : 1</div>
        </div>
      </motionS.div>

      {/* bottom blend to manifesto */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[20vh]"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 100%)' }} />
    </section>
  );
}

/* ---------- Section 2 · Manifesto ---------- */
function ManifestoS() {
  return (
    <section className="relative bg-black text-white px-10 py-48 md:py-56">
      <div className="grid grid-cols-12 gap-8">
        <motionS.div
          {...fadeIn(0)}
          className="col-span-12 md:col-span-2">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            → 02 · Manifesto
          </div>
        </motionS.div>
        <motionS.div
          {...fadeUp(0.1)}
          className="col-span-12 md:col-span-9 md:col-start-3">
          <p className="font-display font-light tracking-[-0.015em] leading-[1.25] text-[32px] md:text-[52px] lg:text-[60px] text-white/90 max-w-[22ch]">
            We make f<span className="italic-accent">i</span>lms the slow way.
            Frame by frame, conversation by conversation, until the{' '}
            <span className="italic-accent">i</span>mage finally holds its breath.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[56ch]">
            <p className="text-[15px] md:text-[17px] leading-[1.7] text-white/65">
              Related is a small motion studio working at the intersection of
              direction, edit, and sound. We care about the long shape of a
              story — the silences, the edges, the weather inside a scene.
            </p>
            <p className="text-[15px] md:text-[17px] leading-[1.7] text-white/65">
              We are not a factory. We take on the work we can hold, and we
              hold it until it feels true. Brand films, short documentary,
              motion identity — the format is the last decision, not the first.
            </p>
          </div>
          <div className="mt-14 flex items-center gap-4 text-[10.5px] uppercase tracking-[0.32em] text-white/45">
            <span className="inline-block h-px w-10 bg-white/30" />
            <span>Signed · The studio</span>
          </div>
        </motionS.div>
      </div>
    </section>
  );
}

/* ---------- Section 3 · Studio (cinematic image tiles) ----------
   Wide landscape placeholder tiles representing the physical space.
   Each tile is a labelled gradient field — user will swap in real photos.
   Layout: one hero-width tile + an asymmetric grid below. */
const studioTiles = [
  { id: 'hero',     label: 'The Room — wide',        ratio: '21/9',  tone: 'warm',   meta: 'A · 45m²',       image: 'assets/studio-room.jpg', focus: 'center 55%' },
];

const tileBg = {
  warm:   'radial-gradient(120% 80% at 30% 35%, #4a2f1e 0%, #1c100a 45%, #080402 100%)',
  cool:   'radial-gradient(120% 80% at 70% 40%, #2a3a52 0%, #0e1724 50%, #05080d 100%)',
  golden: 'radial-gradient(120% 80% at 40% 25%, #6b4621 0%, #2a1a0b 55%, #0a0604 100%)',
  ember:  'radial-gradient(120% 80% at 60% 60%, #5a2a18 0%, #1c0b06 55%, #07030 100%)',
  mauve:  'radial-gradient(120% 80% at 50% 45%, #3a2432 0%, #190d16 55%, #070308 100%)',
  steel:  'radial-gradient(120% 80% at 45% 50%, #29323a 0%, #10141a 55%, #05070a 100%)',
};

function StudioTile({ tile, className = '' }) {
  return (
    <motionS.figure
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1.0, ease: sEase }}
      className={`group relative overflow-hidden bg-black ${className}`}
      style={{ aspectRatio: tile.ratio }}
      data-hover>
      {/* real photo, when provided — otherwise painted placeholder */}
      {tile.image ? (
        <img
          src={tile.image}
          alt={tile.label}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          style={{ objectPosition: tile.focus || 'center 50%', filter: 'saturate(0.96) contrast(1.04)' }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: tileBg[tile.tone] }} />
      )}
      <div className="absolute inset-0 noise opacity-45" />
      {/* soft highlight sweep */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-90"
        style={{ background: 'linear-gradient(115deg, rgba(255,240,220,0.08) 0%, rgba(255,240,220,0) 45%)' }}
      />
      {/* corner marks */}
      <span aria-hidden className="absolute left-4 top-4 text-[9.5px] font-mono uppercase tracking-[0.3em] text-white/55">
        ⊹ {tile.id.toUpperCase()}
      </span>
      <figcaption className="absolute left-5 right-5 bottom-4 flex items-end justify-between text-white/75 text-[10.5px] uppercase tracking-[0.28em]">
        <span className="font-display font-light normal-case tracking-tight text-[18px] md:text-[22px] text-white">
          {tile.label}
        </span>
        <span className="text-white/50 whitespace-nowrap pb-[3px]">{tile.meta}</span>
      </figcaption>
      {/* cinematic letterbox tint */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-[6%] bg-black/80" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[6%] bg-black/80" />
    </motionS.figure>
  );
}

function StudioImages() {
  const hero = studioTiles[0];
  return (
    <section className="relative bg-black text-white px-10 pt-28 pb-20 md:pt-32 md:pb-24">
      <div className="grid grid-cols-12 items-end mb-12 md:mb-16">
        <motionS.div {...fadeIn(0)} className="col-span-12 md:col-span-2">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            → 03 · The Space
          </div>
        </motionS.div>
        <motionS.div {...fadeUp(0.1)} className="col-span-12 md:col-span-7 md:col-start-3 mt-6 md:mt-0">
          <p className="font-display font-light tracking-[-0.01em] text-[26px] md:text-[38px] leading-[1.2] text-white/85 max-w-[28ch]">
            A room built for sl<span className="italic-accent">o</span>w images.
            Natural light, soft walls, an infinity cyc, and every tool within arm's reach.
          </p>
        </motionS.div>
        <div className="hidden md:flex md:col-span-2 md:col-start-11 justify-end text-[10.5px] uppercase tracking-[0.28em] text-white/45">
          Lagos · by appt.
        </div>
      </div>

      {/* hero wide tile */}
      <StudioTile tile={hero} className="" />

      <div className="mt-10 flex items-center gap-4 text-[10.5px] uppercase tracking-[0.32em] text-white/45">
        <span className="inline-block h-px w-10 bg-white/30" />
        <span>Placeholder imagery — swap for stills · 02 frames</span>
      </div>
    </section>
  );
}

/* ---------- Section 4 · Bookings (tiers + form) ----------
   Three tiers (Space / Space+Stylist / Full Direction) and a booking form
   with date range, tier, equipment list (textarea + file upload), contact. */
const tiers = [
  {
    n: '01',
    name: 'Space Only',
    sub: 'Entry point',
    ideal: 'Photographers · Creators · DIY brands',
    includes: ['The room + cyc', 'Natural + tungsten baseline', 'Styling table, steamer, rack', 'Wi-Fi, tea, playback monitor'],
    accent: '#e6d9c5',
  },
  {
    n: '02',
    name: 'Space + Stylist',
    sub: 'Add-on module',
    ideal: 'Lookbooks · E-commerce · Small campaigns',
    includes: ['Everything in Space Only', 'Stylist, MUA, or set designer', 'Mood + shot list alignment', 'On-set art direction'],
    accent: '#d3b88a',
    featured: true,
  },
  {
    n: '03',
    name: 'Full Direction',
    sub: 'Premium · End-to-end',
    ideal: 'Brand films · Campaigns · Launches',
    includes: ['Concept + treatment', 'Casting, styling, crew', 'Shoot · edit · color · sound', 'Delivery in every cut-down'],
    accent: '#c48a5a',
  },
];

function TierCard({ tier, onSelect, selected }) {
  const isSel = selected === tier.n;
  return (
    <motionS.button
      type="button"
      onClick={() => onSelect(tier.n)}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, ease: sEase }}
      data-hover
      className={`group relative text-left p-8 md:p-10 border transition-colors duration-500
        ${isSel ? 'border-white/60 bg-white/[0.04]' : tier.featured ? 'border-white/25 bg-white/[0.015]' : 'border-white/10 hover:border-white/30'}`}>
      {/* selected tick */}
      {isSel && (
        <span className="absolute right-5 top-5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: tier.accent }}>
          <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L4 7L9 1" fill="none" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      )}
      {tier.featured && !isSel && (
        <span className="absolute right-5 top-5 text-[9.5px] font-mono uppercase tracking-[0.3em] text-white/55">Most booked</span>
      )}

      <div className="text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/45">
        Tier {tier.n} · {tier.sub}
      </div>
      <h3 className="mt-4 font-display font-light tracking-[-0.01em] text-[30px] md:text-[36px] leading-[1.05] text-white">
        {tier.name}
      </h3>
      <div className="mt-2 text-[13px] text-white/60">{tier.ideal}</div>

      <ul className="mt-8 space-y-2.5 border-t border-white/10 pt-6">
        {tier.includes.map((inc, i) => (
          <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.55] text-white/70">
            <span className="mt-[8px] inline-block h-px w-3 shrink-0" style={{ background: tier.accent, opacity: 0.7 }} />
            <span>{inc}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex items-center gap-3 text-[10.5px] uppercase tracking-[0.3em]" style={{ color: tier.accent }}>
        <span>{isSel ? 'Selected' : 'Select tier'}</span>
        <svg width="18" height="8" viewBox="0 0 18 8"><path d="M1 4 H17 M13 1 L17 4 L13 7" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </motionS.button>
  );
}

function BookingForm({ selectedTier, setSelectedTier }) {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate]     = React.useState('');
  const [name, setName]           = React.useState('');
  const [email, setEmail]         = React.useState('');
  const [equipment, setEquipment] = React.useState('');
  const [fileName, setFileName]   = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const days = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const a = new Date(startDate); const b = new Date(endDate);
    const d = Math.round((b - a) / 86400000) + 1;
    return d > 0 ? d : 0;
  }, [startDate, endDate]);

  const tier = tiers.find((t) => t.n === selectedTier) || tiers[0];

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setFileName(f.name);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-12 gap-6 md:gap-8 mt-14 border-t border-white/10 pt-14">

      {/* left: meta */}
      <div className="col-span-12 md:col-span-3">
        <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 mb-4">
          → Booking
        </div>
        <div className="font-display font-light text-[28px] md:text-[32px] leading-[1.1] text-white max-w-[14ch]">
          Reserve the r<span className="italic-accent">o</span>om.
        </div>
        <p className="mt-5 text-[14px] leading-[1.65] text-white/60 max-w-[28ch]">
          Tell us the dates, the tier, and the equipment you'll bring or need. We'll write back within 24 hours with a hold + quote.
        </p>
        <div className="mt-8 text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/45 leading-[1.9]">
          <div>Selected · Tier {tier.n} — {tier.name}</div>
          <div>Duration · {days ? `${days} day${days > 1 ? 's' : ''}` : '—'}</div>
        </div>
      </div>

      {/* right: inputs */}
      <div className="col-span-12 md:col-span-9 space-y-8">
        {/* dates */}
        <div className="grid grid-cols-2 gap-6">
          <LabeledField label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="studio-input"
            />
          </LabeledField>
          <LabeledField label="End date">
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="studio-input"
            />
          </LabeledField>
        </div>

        {/* name + email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LabeledField label="Your name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name or studio"
              required
              className="studio-input"
            />
          </LabeledField>
          <LabeledField label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="studio-input"
            />
          </LabeledField>
        </div>

        {/* equipment list */}
        <LabeledField
          label="Equipment list"
          hint="List what you need from us (lights, lenses, grip, stylist add-ons) or upload a full breakdown (PDF / DOCX / PPT).">
          <textarea
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            rows={5}
            placeholder="e.g. 2× Aputure 600x, 35mm + 85mm primes, C-stands (4), apple boxes, stylist for day 2…"
            className="studio-input resize-none"
          />
          {/* upload */}
          <label
            data-hover
            className="mt-4 flex items-center justify-between gap-4 border border-dashed border-white/20 px-5 py-4 cursor-pointer hover:border-white/45 transition-colors">
            <div className="flex items-center gap-4">
              <svg width="18" height="18" viewBox="0 0 18 18" className="text-white/60">
                <path d="M9 13V3M4 8l5-5 5 5M3 15h12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div className="text-[13px] text-white/80">
                  {fileName || 'Upload equipment breakdown'}
                </div>
                <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/40 mt-1">
                  PDF · DOCX · PPT · up to 20MB
                </div>
              </div>
            </div>
            <span className="text-[10.5px] uppercase tracking-[0.3em] text-white/55">
              Choose file →
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={onFile}
              className="hidden"
            />
          </label>
        </LabeledField>

        {/* submit */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 max-w-[40ch]">
            {submitted
              ? 'Thank you — we have your request and will write back within 24h.'
              : 'We review every booking by hand · No automated slotting.'}
          </div>
          <button
            type="submit"
            data-hover
            disabled={submitted}
            className="group inline-flex items-center gap-4 text-[12px] uppercase tracking-[0.32em] text-white/90 hover:text-white transition-colors disabled:opacity-60">
            <span className="inline-block h-px w-10 bg-white/50 group-hover:w-16 transition-[width] duration-500" />
            <span>{submitted ? 'Request sent' : 'Request booking'}</span>
            <svg width="22" height="10" viewBox="0 0 22 10" className="transition-transform duration-500 group-hover:translate-x-1.5">
              <path d="M1 5 H21 M16 1 L21 5 L16 9" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}

function LabeledField({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/45 mb-3">
        {label}
      </div>
      {children}
      {hint && <div className="mt-2 text-[12px] leading-[1.55] text-white/45">{hint}</div>}
    </label>
  );
}

function Bookings() {
  const [selectedTier, setSelectedTier] = React.useState('02');
  return (
    <section className="relative bg-black text-white px-10 pt-20 pb-24 md:pt-24 md:pb-28 overflow-hidden">
      <div className="grid grid-cols-12 items-end mb-12 md:mb-16">
        <motionS.div {...fadeIn(0)} className="col-span-12 md:col-span-2">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            → 04 · Bookings
          </div>
        </motionS.div>
        <motionS.div {...fadeUp(0.1)} className="col-span-12 md:col-span-7 md:col-start-3 mt-6 md:mt-0">
          <p className="font-display font-light tracking-[-0.01em] text-[26px] md:text-[38px] leading-[1.2] text-white/85 max-w-[30ch]">
            Three ways to w<span className="italic-accent">o</span>rk with us.
            Start small, or hand us the whole thing.
          </p>
        </motionS.div>
        <div className="hidden md:flex md:col-span-2 md:col-start-11 justify-end text-[10.5px] uppercase tracking-[0.28em] text-white/45">
          03 tiers
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <TierCard
            key={t.n}
            tier={t}
            selected={selectedTier}
            onSelect={setSelectedTier}
          />
        ))}
      </div>

      <BookingForm selectedTier={selectedTier} setSelectedTier={setSelectedTier} />
    </section>
  );
}

/* ---------- Section 5 · Closing CTA ---------- */
function ClosingCTA() {
  return (
    <section className="relative bg-black text-white px-10 pt-24 pb-24 md:pt-28 md:pb-32 overflow-hidden">
      <Aurora intensity={0.55} />

      <div className="relative grid grid-cols-12 items-end">
        <motionS.div {...fadeUp(0)} className="col-span-12 md:col-span-9">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 mb-8">
            → 05 · Encounter
          </div>
          <h2 className="font-display font-light tracking-[-0.02em] leading-[1.02] text-[44px] md:text-[88px] lg:text-[110px] text-white max-w-[16ch]">
            Br<span className="italic-accent">i</span>ng us the film you can't quite see yet.
          </h2>
        </motionS.div>
        <motionS.div {...fadeIn(0.3)} className="col-span-12 md:col-span-3 mt-12 md:mt-0 md:text-right">
          <a
            href="index.html#contact"
            data-hover
            className="group relative inline-flex items-center gap-4 text-[12px] uppercase tracking-[0.32em] text-white/85 hover:text-white transition-colors">
            <span className="inline-block h-px w-10 bg-white/50 group-hover:w-16 transition-[width] duration-500" />
            <span>Start a conversation</span>
            <svg width="22" height="10" viewBox="0 0 22 10" className="transition-transform duration-500 group-hover:translate-x-1.5">
              <path d="M1 5 H21 M16 1 L21 5 L16 9" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <div className="mt-10 text-[10.5px] uppercase tracking-[0.28em] text-white/45 md:text-right leading-[1.9]">
            <div>info@relatedmotionstudios.com</div>
            <div>bookings@relatedmotionstudios.com</div>
            <div>support@relatedmotionstudios.com</div>
          </div>
        </motionS.div>
      </div>

      {/* tiny footer line */}
      <div className="relative mt-28 flex items-end justify-between text-[10.5px] uppercase tracking-[0.28em] text-white/35">
        <div>© Related Motion Studio, 2026</div>
        <div className="flex items-center gap-5">
          <a href="index.html" className="hover:text-white/80 transition-colors" data-hover>↖ Back to work</a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
const InOrbit = window.InOrbit;
function StudioPage() {
  return (
    <>
      <Cursor />
      <div className="bg-black">
        <div data-screen-label="Studio · Masthead"><Masthead /></div>
        <div data-screen-label="Studio · Bookings"><Bookings /></div>
        <div data-screen-label="Studio · The Space"><StudioImages /></div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StudioPage />);
