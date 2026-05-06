/* global React */
const { useRef } = React;
const FM_M = window.framerMotion || window.Motion || {};
const motionM = FM_M.motion;
const useScrollM = FM_M.useScroll;
const useTransformM = FM_M.useTransform;

const manifestoEase = [0.22, 1, 0.36, 1];

/* Word-level scroll-linked opacity — current word bright, rest dimmed */
function Word({ progress, range, children }) {
  const opacity = useTransformM(progress, range, [0.18, 1]);
  return (
    <motionM.span style={{ opacity }} className="inline-block mr-[0.24em]">
      {children}
    </motionM.span>
  );
}

function Manifesto() {
  const ref = useRef(null);
  const { scrollYProgress } = useScrollM({
    target: ref,
    offset: ['start 0.85', 'end 0.2'],
  });

  const copy =
    'We are a studio built for the long arc. We make films, identities and moving images that try to earn their place — work that refuses the short loop of the feed, and instead asks to be remembered. We are small on purpose. Every frame passes through our hands. Every idea, tested against the only question that matters: will this still mean something in ten years.';

  const words = copy.split(' ');
  const step = 1 / words.length;

  return (
    <section
      ref={ref}
      data-screen-label="Manifesto"
      className="relative bg-black text-white overflow-hidden">
      <div className="relative px-10 pt-40 pb-48">
        <div className="grid grid-cols-12 items-start">
          <div className="col-span-12 md:col-span-2">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45 md:sticky md:top-40">
              <window.EyebrowStagger text="→ Manifesto" />
            </div>
          </div>

          <window.BlurSettle
            as="p"
            threshold={0.25}
            className="col-span-12 md:col-span-9 md:col-start-4 mt-10 md:mt-0 font-display font-light tracking-[-0.005em] leading-[1.25] text-[28px] md:text-[44px] text-white">
            {words.map((w, i) => {
              const start = Math.max(0, i * step - step * 2);
              const end = Math.min(1, i * step + step * 2);
              // Italic accent on a few key letters for monopo flavor
              const accented = w
                .split('')
                .map((c, ci) =>
                  c === 'i' && (w === 'films,' || w === 'identities' || w === 'mean' || w === 'remembered.')
                    ? <span key={ci} className="italic-accent">{c}</span>
                    : c
                );
              return (
                <Word key={i} progress={scrollYProgress} range={[start, end]}>
                  {accented}
                </Word>
              );
            })}
          </window.BlurSettle>
        </div>

        {/* Signature row */}
        <div className="mt-32 grid grid-cols-12 items-end">
          <div className="col-span-6 text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            <window.EyebrowStagger text="→ Signed by the studio" />
          </div>
          <div className="col-span-6 text-right font-serif italic text-[28px] md:text-[36px] text-white/80">
            — Related, 2026
          </div>
        </div>
      </div>
    </section>
  );
}

window.Manifesto = Manifesto;
