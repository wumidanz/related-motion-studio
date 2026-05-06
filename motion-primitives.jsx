/* global React */
/* Shared entry-motion primitives for Related Motion Studio.
   - BlurSettle: blur(px)+translateY settle on first viewport entry (one-shot).
   - EyebrowStagger: per-character rise + unblur for small uppercase labels.
   Reads tweak config from window.__RMS_TWEAKS (live) with sensible fallbacks. */

const { useEffect, useRef, useState, useMemo } = React;

function getTweaks() {
  return (typeof window !== 'undefined' && window.__RMS_TWEAKS) || {
    blurEnabled: true,
    blurIntensity: 13,
    blurDuration: 1300,
    eyebrowStaggerEnabled: true,
  };
}

/* ---------------- BlurSettle ----------------
   Wraps any children. On first intersect (>=threshold) it transitions from
   blurred+offset to crisp. One-shot; ignores subsequent scrolls.
   Props: as, delay, threshold, className, style, children */
function BlurSettle({
  as: Tag = 'div',
  delay = 0,
  threshold = 0.15,
  className = '',
  style = {},
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  const [tick, setTick] = useState(0); // re-read tweaks when panel updates

  useEffect(() => {
    const onTweak = () => setTick((t) => t + 1);
    window.addEventListener('rms-tweaks-change', onTweak);
    return () => window.removeEventListener('rms-tweaks-change', onTweak);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setEntered(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= threshold) {
            setEntered(true);
            io.disconnect();
          }
        });
      },
      { threshold: [threshold, Math.min(threshold + 0.1, 1)] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const tw = getTweaks();
  const enabled = tw.blurEnabled;
  const blur = Math.max(0, tw.blurIntensity || 9);
  const dur = Math.max(200, tw.blurDuration || 900);

  const baseStyle = enabled
    ? {
        filter: entered ? 'blur(0px)' : `blur(${blur}px)`,
        transform: entered ? 'translateY(0)' : 'translateY(14px)',
        opacity: entered ? 1 : 0.35,
        transition: `filter ${dur}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${dur}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity ${Math.round(
          dur * 0.9
        )}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'filter, transform, opacity',
      }
    : {};

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...baseStyle, ...style }}
      data-tick={tick}
      {...rest}>
      {children}
    </Tag>
  );
}

/* -------------- EyebrowStagger --------------
   Per-character reveal for short uppercase eyebrows like "→ Manifesto".
   Kerning-safe (chars remain inline, no word-splitting). */
function EyebrowStagger({ text, className = '', delayBase = 0 }) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onTweak = () => setTick((t) => t + 1);
    window.addEventListener('rms-tweaks-change', onTweak);
    return () => window.removeEventListener('rms-tweaks-change', onTweak);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setEntered(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setEntered(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tw = getTweaks();
  const enabled = tw.eyebrowStaggerEnabled;

  const chars = useMemo(() => Array.from(text), [text]);

  if (!enabled) {
    return <span ref={ref} className={className} data-tick={tick}>{text}</span>;
  }

  return (
    <span
      ref={ref}
      className={className}
      data-tick={tick}
      style={{ display: 'inline-block', whiteSpace: 'pre' }}
      aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            transform: entered ? 'translateY(0)' : 'translateY(0.6em)',
            filter: entered ? 'blur(0)' : 'blur(4px)',
            opacity: entered ? 1 : 0,
            transition: `transform 620ms cubic-bezier(0.22,1,0.36,1) ${delayBase + i * 22}ms, filter 520ms cubic-bezier(0.22,1,0.36,1) ${delayBase + i * 22}ms, opacity 520ms cubic-bezier(0.22,1,0.36,1) ${delayBase + i * 22}ms`,
            willChange: 'transform, filter, opacity',
          }}>
          {c === ' ' ? '\u00A0' : c}
        </span>
      ))}
    </span>
  );
}

window.BlurSettle = BlurSettle;
window.EyebrowStagger = EyebrowStagger;

/* -------------- ScrollCharReveal --------------
   Characters un-blur progressively as their parent section crosses the
   viewport. Left-to-right, per-character, tied to scroll progress so the
   user sees letters clearing as they scroll. By the time the element is
   ~centered the whole line is crisp.

   Props:
     text          — the string to render
     className     — applied to wrapping <span>
     startOffset   — scroll progress (0..1) where reveal begins (default 0)
     endOffset     — scroll progress (0..1) where reveal completes (default 0.65)
     blurMax       — max blur in px when a char is unrevealed (default 14)
     italicIndices — optional array of char indices that should render as italic-accent
*/
function ScrollCharReveal({
  text,
  className = '',
  startOffset = 0,
  endOffset = 0.65,
  blurMax = 14,
  italicIndices = [],
  style = {},
}) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const chars = useMemo(() => Array.from(text), [text]);
  const italicSet = useMemo(() => new Set(italicIndices), [italicIndices]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setProgress(1); return; }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 when element's top reaches bottom of viewport,
        // 1 when element's bottom reaches top of viewport.
        const total = rect.height + vh;
        const traveled = vh - rect.top;
        const p = Math.max(0, Math.min(1, traveled / total));
        setProgress(p);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const n = chars.length;
  const span = Math.max(0.0001, endOffset - startOffset);
  // Normalise progress inside the reveal window.
  const localP = Math.max(0, Math.min(1, (progress - startOffset) / span));
  // Each char gets a small sub-range so the reveal is gradual per-letter.
  const charSpan = 1 / Math.max(1, n * 0.55);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-label={text}>
      {chars.map((c, i) => {
        const charStart = (i / n) * (1 - charSpan);
        const charEnd = charStart + charSpan;
        const cp = Math.max(0, Math.min(1, (localP - charStart) / Math.max(0.0001, charEnd - charStart)));
        // Ease-out cubic on per-char progress for a softer settle.
        const eased = 1 - Math.pow(1 - cp, 3);
        const blur = blurMax * (1 - eased);
        const opacity = 0.18 + eased * 0.82;
        const useItalic = italicSet.has(i);
        return (
          <span
            key={i}
            aria-hidden="true"
            className={useItalic ? 'italic-accent' : ''}
            style={{
              display: 'inline-block',
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none',
              opacity,
              willChange: 'filter, opacity',
              whiteSpace: 'pre',
            }}>
            {c === ' ' ? '\u00A0' : c}
          </span>
        );
      })}
    </span>
  );
}

window.ScrollCharReveal = ScrollCharReveal;
