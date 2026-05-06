/* global React */
/* BlobLight — intermission section.
   Word-by-word rise + blur release, driven directly by React state so
   there are no CSS-animation sync issues across re-renders. Each word's
   visible state flips on a stagger timer; the CSS just transitions
   between those two states. */

const { useEffect, useState, useRef } = React;

const BL_QUOTES = [
  { text: 'Less, but better.',                            who: 'Dieter Rams' },
  { text: 'God is in the details.',                       who: 'Mies van der Rohe' },
  { text: 'Simplicity is the ultimate sophistication.',   who: 'Leonardo da Vinci' },
  { text: 'Form follows function.',                       who: 'Louis Sullivan' },
  { text: 'Art is the lie that tells the truth.',         who: 'Pablo Picasso' },
  { text: 'Make it simple, but significant.',             who: 'Don Draper' },
  { text: 'Design is thinking made visible.',             who: 'Saul Bass' },
  { text: 'Good design is obvious. Great design is transparent.', who: 'Joe Sparano' },
];

const WORD_STAGGER_IN  = 80;   // ms between each word entering
const WORD_STAGGER_OUT = 35;   // ms between each word leaving
const WORD_ANIM_MS     = 850;  // transition duration per word
const HOLD_MS          = 3800; // how long to rest once fully visible

function BlobLight() {
  const [idx, setIdx] = useState(0);
  const current = BL_QUOTES[idx];
  const words = current.text.split(' ');

  // Per-word visibility. 1 = in resting state, 0 = hidden/blurred.
  // Attribution visibility is a separate flag so it can type independently.
  const [wordsVisible, setWordsVisible] = useState(() => words.map(() => false));
  const [leaving,       setLeaving]      = useState(false);
  const [typed,         setTyped]        = useState(0);
  const [showAttr,      setShowAttr]     = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    // Clear any carry-over timers from the previous quote.
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const T = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id); };

    // Reset state for the new quote.
    setWordsVisible(words.map(() => false));
    setLeaving(false);
    setTyped(0);
    setShowAttr(false);

    // Stagger each word in.
    words.forEach((_, i) => {
      T(() => {
        setWordsVisible((prev) => {
          const next = prev.slice();
          next[i] = true;
          return next;
        });
      }, i * WORD_STAGGER_IN + 20);
    });

    // Once all words have finished their transition, reveal attribution.
    const quoteInDone = words.length * WORD_STAGGER_IN + WORD_ANIM_MS;
    T(() => setShowAttr(true), quoteInDone + 180);

    // Start the attribution typewriter a touch later.
    T(() => {
      let i = 0;
      const step = () => {
        i += 1;
        setTyped(i);
        if (i < current.who.length) {
          const id = setTimeout(step, 55 + Math.random() * 20);
          timers.current.push(id);
        }
      };
      step();
    }, quoteInDone + 240);

    // Hold, then stagger each word out in reverse order.
    const holdStart = quoteInDone + 240 + current.who.length * 60 + 200;
    T(() => {
      setLeaving(true);
      words.forEach((_, i) => {
        T(() => {
          setWordsVisible((prev) => {
            const next = prev.slice();
            next[i] = false;
            return next;
          });
        }, i * WORD_STAGGER_OUT);
      });
      // Hide attribution with the first word leaving.
      T(() => setShowAttr(false), 0);
    }, holdStart + HOLD_MS);

    // After the out-stagger finishes, swap to the next quote.
    const outTotal = words.length * WORD_STAGGER_OUT + WORD_ANIM_MS + 120;
    T(() => setIdx((i) => (i + 1) % BL_QUOTES.length), holdStart + HOLD_MS + outTotal);

    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <section
      data-screen-label="Blob Light"
      className="relative w-full overflow-hidden"
      style={{ background: '#edeae4', height: '100vh' }}>
      {/* Top bleed feathers the warm field into the dark section above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-10"
        style={{
          top: '-22vh',
          height: '22vh',
          background:
            'linear-gradient(to top, #edeae4 0%, rgba(237,234,228,0.85) 40%, rgba(237,234,228,0.35) 75%, rgba(237,234,228,0) 100%)',
        }}
      />
      <div className="blobs blobs-light">
        <div className="b b1" />
        <div className="b b2" />
        <div className="b b3" />
        <div className="b b4" />
        <div className="b b5" />
      </div>

      {/* Corner anchors */}
      <div className="absolute top-10 left-10 z-20 text-[10.5px] uppercase tracking-[0.3em] text-black/55 leading-[1.9]">
        <div className="flex items-center gap-3">
          <span className="block h-[6px] w-[6px] rounded-full bg-black/60" />
          <span>Intermission · Voices</span>
        </div>
        <div className="mt-1 text-black/40">A small canon we keep near</div>
      </div>

      <div className="absolute top-10 right-10 z-20 text-right text-[10.5px] uppercase tracking-[0.3em] text-black/45 leading-[1.9]">
        <div className="text-black/70">Related Motion</div>
        <div>A studio in colour</div>
      </div>

      {/* Centered rotating quote — absolute overlay so centering is
          reliable regardless of sibling absolute layers. */}
      <div className="absolute inset-0 z-20 flex items-center justify-center px-6 md:px-10 pointer-events-none">
        <figure
          className="w-full max-w-[92vw] text-center"
          style={{ mixBlendMode: 'multiply' }}>
          <blockquote
            className="font-display tracking-[-0.035em] text-black leading-[1.02]"
            style={{ fontWeight: 700, fontSize: 'clamp(40px, 6.4vw, 104px)' }}>
            {words.map((w, wi) => {
              const visible = wordsVisible[wi];
              const dy = visible ? '0' : (leaving ? '-0.4em' : '0.6em');
              return (
                <span
                  key={`${idx}-${wi}`}
                  style={{
                    display: 'inline-block',
                    marginRight: '0.22em',
                    opacity: visible ? 1 : 0,
                    filter: visible ? 'blur(0px)' : 'blur(14px)',
                    transform: `translateY(${dy})`,
                    transition: `opacity ${WORD_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${WORD_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${WORD_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                    willChange: 'opacity, filter, transform',
                  }}>
                  {w}
                </span>
              );
            })}
          </blockquote>

          <figcaption
            className="mt-10 md:mt-14 flex items-center justify-center gap-5 text-[12px] md:text-[13px] uppercase tracking-[0.34em] text-black/70"
            style={{
              opacity: showAttr ? 1 : 0,
              filter: showAttr ? 'blur(0px)' : 'blur(8px)',
              transform: showAttr ? 'translateY(0)' : 'translateY(0.4em)',
              transition: 'opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), filter 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
            <span className="block h-px w-12 bg-black/35" />
            <span className="font-medium text-black/90 tracking-[0.28em]">
              {current.who.slice(0, typed)}
              {typed < current.who.length && showAttr && (
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: 2,
                    height: '1em',
                    background: 'currentColor',
                    marginLeft: 3,
                    verticalAlign: '-0.1em',
                    animation: 'blCaret 1s steps(2,end) infinite',
                  }}
                />
              )}
            </span>
            <span className="block h-px w-12 bg-black/35" />
          </figcaption>
        </figure>
      </div>

      {/* caret keyframe is global — inject once */}
      <style>{`@keyframes blCaret { 50% { opacity: 0; } }`}</style>

      {/* Bottom-left index */}
      <div className="absolute bottom-10 left-10 z-20 font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 leading-[1.9]">
        <div className="flex items-center gap-3">
          <span className="block h-px w-8 bg-black/40" />
          <span className="text-black/75">
            Voice · {String(idx + 1).padStart(2, '0')} / {String(BL_QUOTES.length).padStart(2, '0')}
          </span>
        </div>
        <div className="mt-1 text-black/40">
          {current.who} — held briefly, returned
        </div>
      </div>

      {/* Bottom-right transition signpost */}
      <div className="absolute bottom-10 right-10 z-20 text-right text-[10.5px] uppercase tracking-[0.3em] text-black/45 leading-[1.9]">
        <div className="text-black/75">The studio thinks</div>
        <div>in colour, then form</div>
      </div>
    </section>
  );
}

window.BlobLight = BlobLight;
