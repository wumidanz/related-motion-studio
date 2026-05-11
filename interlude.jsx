/* global React */
/* Film Interlude — a full-viewport video moment between Manifesto and
   Services. The video plays at its native aspect (object-contain) so
   no part is cropped. Autoplays muted + looped; click to pause. */

const { useRef, useState, useEffect } = React;

function Interlude() {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Lazy-load: only attach the heavy mp4 once the section nears the viewport.
  useEffect(() => {
    if (loaded) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { setLoaded(true); io.disconnect(); break; }
      }
    }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    const v = videoRef.current;
    if (v) { v.play().catch(() => {}); }
  }, [loaded]);

  const toggleSound = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };

  return (
    <section
      ref={sectionRef}
      data-screen-label="Interlude"
      className="relative w-full bg-black text-white overflow-hidden">

      {/* Full-bleed stage — video plays at its native aspect, letterboxed
          against black as needed so the whole frame is always visible. */}
      <div
        className="relative w-full min-h-screen flex items-center justify-center"
        onClick={togglePlay}
        data-hover>
        <video
          ref={videoRef}
          src={loaded ? "assets/interlude-film.mp4" : undefined}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="block max-h-screen max-w-full h-auto w-auto object-contain"
          style={{ filter: 'saturate(0.95) contrast(1.04)', minHeight: loaded ? undefined : '60vh' }}
        />

        {/* grain continuity with the rest of the site */}
        <div aria-hidden className="noise absolute inset-0 opacity-40 pointer-events-none" />

        {/* bottom-right sound toggle — minimal, only UI on the frame */}
        <div className="absolute bottom-8 right-8 flex items-center gap-4 z-10">
          <button
            onClick={toggleSound}
            data-hover
            className="group inline-flex items-center gap-3 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/85 backdrop-blur-sm hover:border-white/70 hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
              {muted ? (
                <>
                  <path d="M2 5v4h2.5L8 12V2L4.5 5H2z" />
                  <path d="M10.5 5l2.5 4M13 5l-2.5 4" />
                </>
              ) : (
                <>
                  <path d="M2 5v4h2.5L8 12V2L4.5 5H2z" />
                  <path d="M10 4c1 1 1 5 0 6" />
                  <path d="M11.8 2.5c2 1.8 2 7.2 0 9" />
                </>
              )}
            </svg>
            <span>{muted ? 'Tap for sound' : 'Sound on'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

window.Interlude = Interlude;
