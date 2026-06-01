/* global React */
const { useEffect, useRef, useState } = React;
const FM_C = window.framerMotion || window.Motion || {};
const motionC = FM_C.motion;
const useScrollC = FM_C.useScroll;
const useTransformC = FM_C.useTransform;

const contactEase = [0.22, 1, 0.36, 1];

const STUDIO_ADDRESS = 'CGXV+3JM, Lekki - Epe Expy, Lekki Penninsula II, Lagos 106104, Lagos';
// Plus-code-friendly search URL — opens the pin reliably; user taps "Directions" from there.
const STUDIO_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('CGXV+3JM Lekki Lagos');

function StudioAddress() {
  const [copied, setCopied] = useState(false);
  const onCopy = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(STUDIO_ADDRESS);
    } catch (_) {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = STUDIO_ADDRESS;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="space-y-4 text-[13px] text-white/75 leading-[1.55]">
      <div className="text-white">Lagos</div>
      <div className="text-white/55">
        CGXV+3JM, Lekki – Epe Expy<br />
        Lekki Peninsula II<br />
        Lagos 106104, Nigeria
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[10.5px] font-mono uppercase tracking-[0.26em]">
        <button
          type="button"
          onClick={onCopy}
          data-hover
          className="group inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-80">
            <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
            <path d="M2.5 7.5V2.5h5" strokeLinecap="round" />
          </svg>
          <span>{copied ? 'Copied' : 'Copy address'}</span>
        </button>
        <a
          href={STUDIO_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-hover
          className="group inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <span>Directions</span>
          <span className="inline-block transition-transform group-hover:translate-x-0.5 text-white/55">↗</span>
        </a>
      </div>
    </div>
  );
}

function Contact() {
  const ref = useRef(null);
  const { scrollYProgress } = useScrollC({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const yHeadline = useTransformC(scrollYProgress, [0, 1], [80, -80]);

  // Booking is handled via the studio pop-up, not a raw mailto.
  // Keep general + help as the only address tiles.
  const emails = [
    { label: 'General', address: 'info@relatedmotionstudios.com' },
    { label: 'Help',    address: 'support@relatedmotionstudios.com' },
  ];
  const socials = [
    { name: 'Instagram', href: 'mailto:support@relatedmotionstudios.com' },
    { name: 'LinkedIn',  href: '#' },
  ];

  return (
    <section
      ref={ref}
      data-screen-label="Contact"
      className="relative text-white overflow-hidden min-h-[100vh] flex flex-col justify-between">
      {/* Ambient morphing blobs — dark palette. Sits behind everything. */}
      {window.BlobDark ? <window.BlobDark /> : null}
      {/* Subtle vignette over the blobs so text stays legible */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(120% 90% at 50% 50%, rgba(14,13,12,0) 0%, rgba(14,13,12,0.35) 60%, rgba(14,13,12,0.65) 100%)'
      }} />
      {/* Top meta */}
      <div className="relative z-10 px-10 pt-40">
        <div className="grid grid-cols-12 items-baseline">
          <div className="col-span-12 md:col-span-2">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
              <window.EyebrowStagger text="→ Contact" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-4 mt-10 md:mt-0">
            <p className="font-display font-light tracking-[-0.01em] text-[22px] md:text-[28px] leading-[1.25] text-white/70 max-w-[30ch]">
              If you've read this far, we probably have someth<span className="italic-accent">i</span>ng to talk about.
            </p>
          </div>
          <div className="hidden md:block md:col-span-2 md:col-start-11 text-right text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            Open for<br />2026 / 2027
          </div>
        </div>
      </div>

      {/* Giant headline — scroll-progress-driven per-character reveal.
          Letters un-blur left-to-right as the section scrolls through,
          fully crisp around viewport-center. Replaces the earlier one-shot
          BlurSettle for this headline. */}
      <div className="relative z-10 px-6 md:px-10 py-24 md:py-32 flex items-center justify-center">
        <motionC.h2
          style={{ y: yHeadline }}
          className="text-center font-display font-light tracking-[-0.04em] leading-[0.95] text-white"
        >
          <span className="block" style={{ fontSize: 'clamp(72px, 14vw, 220px)' }}>
            <window.ScrollCharReveal
              text="Let's begin"
              startOffset={0.08}
              endOffset={0.55}
              blurMax={18}
              italicIndices={[8]}
            />
          </span>
          <span className="block text-white/55" style={{ fontSize: 'clamp(56px, 11vw, 170px)' }}>
            <window.ScrollCharReveal
              text="something."
              startOffset={0.18}
              endOffset={0.7}
              blurMax={18}
              italicIndices={[5]}
            />
          </span>
        </motionC.h2>
      </div>

      {/* Address grid */}
      <div className="relative z-10 px-10 pb-16">
        <div className="grid grid-cols-12 gap-10 border-t border-white/10 pt-12">
          {/* Emails */}
          <div className="col-span-12 md:col-span-6">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 mb-6">
              <window.EyebrowStagger text="→ Say hello" />
            </div>
            <ul className="space-y-3">
              {emails.map((e) => (
                <li key={e.label} className="flex flex-col gap-0.5 md:grid md:grid-cols-12 md:items-baseline md:gap-3">
                  <span className="md:col-span-3 text-[10.5px] uppercase tracking-[0.22em] text-white/45">
                    {e.label}
                  </span>
                  <a
                    href={`mailto:${e.address}`}
                    data-hover
                    className="md:col-span-9 font-display font-light text-[13px] md:text-[17px] text-white hover:text-white/70 transition-colors break-all">
                    {e.address}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Studios */}
          <div className="col-span-6 md:col-span-3">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 mb-6">
              <window.EyebrowStagger text="→ Studio" />
            </div>
            <StudioAddress />
          </div>

          {/* Socials */}
          <div className="col-span-6 md:col-span-3">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 mb-6">
              <window.EyebrowStagger text="→ Follow the work" />
            </div>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    data-hover
                    className="group inline-flex items-center gap-2 text-[14px] text-white hover:text-white/70 transition-colors">
                    <span>{s.name}</span>
                    <span className="inline-block transition-transform group-hover:translate-x-1 text-white/50">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="relative z-10 px-10 pb-10 pt-12 border-t border-white/10">
        <div className="grid grid-cols-12 items-end gap-6">
          <div className="col-span-6 md:col-span-4 text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            © 2026 Related Motion Studio
          </div>
          <div className="hidden md:block col-span-4 text-center text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            → Made slowly, on purpose
          </div>
          <div className="col-span-6 md:col-span-4 text-right">
            <a
              href="#top"
              data-hover
              className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white">
              <span className="inline-block transition-transform group-hover:-translate-y-1">↑</span>
              <span>Back to top</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Contact = Contact;
