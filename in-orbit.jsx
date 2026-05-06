/* global React */
/* In Orbit — Studio page community section.
   Sits between Bookings and Closing CTA.
   Two halves:
   (A) Constellation — typographic field of existing collaborators,
       softly drifting like stars, hover lifts a name + draws faint
       lines to others sharing a discipline.
   (B) Open invitation — a "join the family" form: who you are,
       what you make, what you'd want to collaborate on.
   Plus a recently-joined ticker so the section feels inhabited. */

const { useEffect, useRef, useState, useMemo } = React;
const FM_O = window.framerMotion || window.Motion || {};
const motionO = FM_O.motion;

const oEase = [0.22, 1, 0.36, 1];
const oFadeUp = (delay = 0, y = 22) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-10% 0px' },
  transition: { duration: 1.1, ease: oEase, delay },
});
const oFadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-10% 0px' },
  transition: { duration: 1.1, ease: oEase, delay },
});

/* ---------- Existing collaborators (the constellation) ----------
   x/y are % of the field. Mixed sizes for visual rhythm.
   Discipline drives the hover-lines: hovering one name highlights
   everyone in the same discipline. */
const orbiters = [
  { name: 'Adaeze Okafor',     role: 'Director',      city: 'Lagos',    size: 'lg', x: 12, y: 18 },
  { name: 'Yusuf Bamidele',    role: 'DP',            city: 'Lagos',    size: 'md', x: 28, y: 36 },
  { name: 'Niko Tanaka',       role: 'Composer',      city: 'Tokyo',    size: 'lg', x: 68, y: 12 },
  { name: 'Maïa Diallo',       role: 'Editor',        city: 'Dakar',    size: 'md', x: 82, y: 30 },
  { name: 'Sebastián Ruiz',    role: 'Colorist',      city: 'Mexico C.',size: 'sm', x: 46, y: 22 },
  { name: 'Tunde Akinwale',    role: 'Sound',         city: 'Lagos',    size: 'md', x: 8,  y: 52 },
  { name: 'Hana Park',         role: 'Producer',      city: 'Seoul',    size: 'sm', x: 36, y: 64 },
  { name: 'Ifeoma Eze',        role: 'Stylist',       city: 'Abuja',    size: 'md', x: 58, y: 50 },
  { name: 'Marco Lenz',        role: 'DP',            city: 'Berlin',   size: 'sm', x: 88, y: 56 },
  { name: 'Renata Vasco',      role: 'Director',      city: 'Lisbon',   size: 'md', x: 22, y: 80 },
  { name: 'Khalid Bensaïd',    role: 'Composer',      city: 'Casablanca',size:'sm', x: 50, y: 84 },
  { name: 'Chiamaka Nnadi',    role: 'Producer',      city: 'Lagos',    size: 'lg', x: 74, y: 74 },
  { name: 'Olu Adebayo',       role: 'Writer',        city: 'Ibadan',   size: 'sm', x: 92, y: 82 },
  { name: 'Sara Klein',        role: 'Editor',        city: 'Brooklyn', size: 'sm', x: 14, y: 36 },
  { name: 'Damilare Sote',     role: 'Sound',         city: 'Lagos',    size: 'sm', x: 64, y: 36 },
  { name: 'Léa Forestier',     role: 'Stylist',       city: 'Paris',    size: 'sm', x: 40, y: 44 },
  { name: 'Jomo Mwangi',       role: 'Writer',        city: 'Nairobi',  size: 'md', x: 78, y: 90 },
  { name: 'Ana Lúcia Pires',   role: 'Colorist',      city: 'São Paulo',size: 'sm', x: 30, y: 6  },
];

const sizeClass = {
  sm: 'text-[14px] md:text-[16px]',
  md: 'text-[18px] md:text-[22px]',
  lg: 'text-[24px] md:text-[30px]',
};

function Constellation() {
  const fieldRef = useRef(null);
  const [hovered, setHovered] = useState(null); // index
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hoveredOrbiter = hovered != null ? orbiters[hovered] : null;

  return (
    <div
      ref={fieldRef}
      className="relative h-[640px] md:h-[720px] w-full overflow-hidden constellation-field"
      onMouseLeave={() => setHovered(null)}>
      {/* faint grid background */}
      <div aria-hidden className="absolute inset-0 constellation-grid" />

      {/* names */}
      {orbiters.map((o, i) => {
        const isHovered = hovered === i;
        const isRelated = hoveredOrbiter && hoveredOrbiter.role === o.role && !isHovered;
        const dim = hovered != null && !isHovered && !isRelated;
        return (
          <button
            key={o.name}
            type="button"
            data-hover
            onMouseEnter={() => setHovered(i)}
            onFocus={() => setHovered(i)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 group orbiter ${sizeClass[o.size]}`}
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              animationDelay: `${(i * 0.37) % 6}s`,
            }}>
            <span
              className={`block font-display font-light tracking-[-0.01em] whitespace-nowrap transition-all duration-500
                ${isHovered ? 'text-white' : isRelated ? 'text-white/85' : dim ? 'text-white/20' : 'text-white/55'}`}>
              {o.name}
            </span>
            {/* role + city — only revealed on hover */}
            <span
              className={`absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono uppercase tracking-[0.28em] transition-all duration-500
                ${isHovered ? 'opacity-100 text-white/80 translate-y-0' : 'opacity-0 -translate-y-1 text-white/0'}`}>
              {o.role} · {o.city}
            </span>
            {/* tiny star dot */}
            <span
              aria-hidden
              className={`absolute left-1/2 -top-3 h-[3px] w-[3px] -translate-x-1/2 rounded-full transition-all duration-500
                ${isHovered ? 'bg-[#e6d9c5] scale-150 shadow-[0_0_8px_rgba(230,217,197,0.7)]' : isRelated ? 'bg-white/60' : 'bg-white/25'}`}
            />
          </button>
        );
      })}

      {/* legend */}
      <div className="absolute left-0 bottom-0 text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/40">
        <div className="text-white/65 mb-1.5">→ Hover a name</div>
        <div>To meet a kindred soul</div>
      </div>
      <div className="absolute right-0 bottom-0 text-right text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/40">
        <div className="text-white/65 mb-1.5">{orbiters.length} orbiters</div>
        <div>· 11 cities · 7 disciplines</div>
      </div>
    </div>
  );
}

/* ---------- Recently joined ticker ---------- */
const recentJoiners = [
  { name: 'Amaka',  role: 'Director',     note: 'looking for a sound collaborator' },
  { name: 'Theo',   role: 'Composer',     note: 'open to long-form documentary' },
  { name: 'Junie',  role: 'Producer',     note: 'wants to host a screening night' },
  { name: 'Rashid', role: 'DP',           note: 'available for Lagos shoots in May' },
  { name: 'Mira',   role: 'Writer',       note: 'pitching a short about her grandmother' },
  { name: 'Ola',    role: 'Stylist',      note: 'curating a wardrobe archive' },
  { name: 'Siyabonga', role: 'Editor',    note: 'wants to cut a music film' },
];

function Ticker() {
  const items = [...recentJoiners, ...recentJoiners]; // duplicate for seamless loop
  return (
    <div className="relative overflow-hidden border-y border-white/10 py-5 ticker-wrap">
      <div className="flex gap-12 ticker-track whitespace-nowrap">
        {items.map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            className="flex items-center gap-4 text-[12px] font-mono uppercase tracking-[0.24em] text-white/55">
            <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#e6d9c5]/70" />
            <span className="text-white/85">Just joined ·</span>
            <span className="text-white">{p.name}</span>
            <span className="text-white/40">— {p.role}</span>
            <span className="italic-accent normal-case tracking-normal text-[14px] text-white/70 lowercase">"{p.note}"</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Invitation form ---------- */
const roleOptions = [
  'Director', 'DP', 'Editor', 'Composer', 'Sound', 'Colorist',
  'Writer', 'Producer', 'Stylist', 'Photographer', 'Other',
];

function InvitationForm() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [pitch, setPitch] = useState('');
  const [link, setLink] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-12 gap-6 md:gap-8 mt-16 border-t border-white/10 pt-14">

      {/* left: meta */}
      <div className="col-span-12 md:col-span-3">
        <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 mb-4">
          → Open invitation
        </div>
        <div className="font-display font-light text-[28px] md:text-[32px] leading-[1.1] text-white max-w-[14ch]">
          Pull up a cha<span className="italic-accent">i</span>r.
        </div>
        <p className="mt-5 text-[14px] leading-[1.65] text-white/60 max-w-[30ch]">
          Tell us who you are and what you're chasing. We read every note —
          collaborators, friends-of-the-room, people we haven't met yet.
        </p>
        <div className="mt-8 text-[10.5px] font-mono uppercase tracking-[0.28em] text-white/45 leading-[1.9]">
          <div>No application · No portfolio gate</div>
          <div>We just want to know you</div>
        </div>
      </div>

      {/* right: inputs */}
      <div className="col-span-12 md:col-span-9 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OField label="Your name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What people call you"
              required
              className="studio-input"
            />
          </OField>
          <OField label="Where you're based">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City, country, or a feeling"
              className="studio-input"
            />
          </OField>
        </div>

        <OField label="What you make">
          <div className="flex flex-wrap gap-2 pt-2">
            {roleOptions.map((r) => {
              const active = role === r;
              return (
                <button
                  type="button"
                  key={r}
                  data-hover
                  onClick={() => setRole(active ? '' : r)}
                  className={`px-4 py-2 text-[11px] uppercase tracking-[0.22em] border transition-all duration-300
                    ${active
                      ? 'border-[#e6d9c5] text-white bg-[#e6d9c5]/10'
                      : 'border-white/15 text-white/55 hover:border-white/35 hover:text-white/85'}`}>
                  {r}
                </button>
              );
            })}
          </div>
        </OField>

        <OField
          label="What you'd love to collaborate on"
          hint="A film you can't shake, a sound you keep hearing, a question you want to chase. Two sentences is plenty.">
          <textarea
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={4}
            placeholder="I've been wanting to make a documentary about my grandmother's record collection. I'm looking for a sound person who treats vinyl as memory…"
            className="studio-input resize-none"
            required
          />
        </OField>

        <OField label="A link, if you have one" hint="Reel, Instagram, Are.na, a single image — anything that feels like you. Optional.">
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
            className="studio-input"
          />
        </OField>

        <div className="flex items-center justify-between pt-2 gap-6 flex-wrap">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 max-w-[44ch]">
            {submitted
              ? 'Welcome — you\'re in. We\'ll write back when there\'s something to share.'
              : 'You\'ll get an email back · No newsletter · No spam ever'}
          </div>
          <button
            type="submit"
            data-hover
            disabled={submitted}
            className="group inline-flex items-center gap-4 text-[12px] uppercase tracking-[0.32em] text-white/90 hover:text-white transition-colors disabled:opacity-60">
            <span className="inline-block h-px w-10 bg-white/50 group-hover:w-16 transition-[width] duration-500" />
            <span>{submitted ? 'You\'re in orbit' : 'Join the family'}</span>
            <svg width="22" height="10" viewBox="0 0 22 10" className="transition-transform duration-500 group-hover:translate-x-1.5">
              <path d="M1 5 H21 M16 1 L21 5 L16 9" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}

function OField({ label, hint, children }) {
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

/* ---------- The section ---------- */
function InOrbit() {
  return (
    <section className="relative bg-black text-white px-10 pt-24 pb-28 md:pt-28 md:pb-32 overflow-hidden">
      {/* section header — matches the others' rhythm */}
      <div className="grid grid-cols-12 items-end mb-14 md:mb-20">
        <motionO.div {...oFadeIn(0)} className="col-span-12 md:col-span-2">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            → 04 · In Orbit
          </div>
        </motionO.div>
        <motionO.div {...oFadeUp(0.1)} className="col-span-12 md:col-span-8 md:col-start-3 mt-6 md:mt-0">
          <h2 className="font-display font-light tracking-[-0.02em] text-[40px] md:text-[64px] lg:text-[78px] leading-[1.02] text-white max-w-[18ch]">
            The studio <span className="italic-accent">i</span>s a room,
            but the family is <span className="italic-accent">e</span>verywhere.
          </h2>
          <p className="mt-8 text-[15px] md:text-[16px] leading-[1.7] text-white/60 max-w-[58ch]">
            Related has never been just us. Every film we make passes through
            the hands of directors, composers, editors, stylists, friends —
            people who say yes when the work needs them. This is who we move with.
            And if you'd like to move with us, the door is open.
          </p>
        </motionO.div>
        <div className="hidden md:flex md:col-span-2 md:col-start-11 justify-end text-[10.5px] uppercase tracking-[0.28em] text-white/45 text-right leading-[1.9]">
          <div>
            <div className="text-white/70">{orbiters.length} kindred</div>
            <div>+ counting</div>
          </div>
        </div>
      </div>

      {/* constellation */}
      <motionO.div {...oFadeIn(0.2)} className="relative">
        <Constellation />
      </motionO.div>

      {/* ticker — recently joined */}
      <motionO.div {...oFadeIn(0.1)} className="mt-16">
        <Ticker />
      </motionO.div>

      {/* invitation form */}
      <motionO.div {...oFadeUp(0.05)} className="relative">
        <InvitationForm />
      </motionO.div>
    </section>
  );
}

window.InOrbit = InOrbit;
