/* global React */
const { useState } = React;
const FM_T = window.framerMotion || window.Motion || {};
const motionT = FM_T.motion;

const teamEase = [0.22, 1, 0.36, 1];

const teamMembers = [
  { name: 'Ayo Okafor',        role: 'Founder, Creative Director' },
  { name: 'Ima Benson',        role: 'Executive Producer' },
  { name: 'Kola Adebayo',      role: 'Design Lead' },
  { name: 'Tobi Eze',          role: 'Motion Director' },
  { name: 'Zainab Ahmed',      role: '3D & Simulation' },
  { name: 'Femi Olajide',      role: 'Sound Designer' },
  { name: 'Chidera Okonkwo',   role: 'Studio Manager' },
];

function Team() {
  const [hovered, setHovered] = useState(null);

  return (
    <section
      data-screen-label="Team"
      className="relative bg-black text-white overflow-hidden">
      <div className="relative px-10 pt-40 pb-40">
        {/* Intro */}
        <div className="grid grid-cols-12 items-baseline mb-24 md:mb-32">
          <div className="col-span-12 md:col-span-2">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
              → The team
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-4 mt-10 md:mt-0">
            <p className="font-display font-light tracking-[-0.01em] text-[28px] md:text-[40px] leading-[1.15] text-white/85 max-w-[24ch]">
              Seven people.
              <br />
              One long conversat<span className="italic-accent">i</span>on about making th<span className="italic-accent">i</span>ngs better.
            </p>
          </div>
          <div className="hidden md:block md:col-span-2 md:col-start-11 text-right text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            07 / 07
          </div>
        </div>

        {/* Hero group photo with big "RELATED" word behind */}
        <motionT.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1.2, ease: teamEase }}
          className="relative mx-auto max-w-[1200px] aspect-[4/5] md:aspect-[3/2] overflow-hidden bg-black">
          {/* Giant word behind */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="font-display font-light tracking-[-0.04em] text-white/10 leading-none select-none"
              style={{ fontSize: 'clamp(160px, 26vw, 420px)' }}>
              related
            </span>
          </div>
          {/* Photo */}
          <div className="absolute inset-0">
            <img
              src="assets/team.jpg"
              alt="The Related Motion Studio team"
              className="h-full w-full object-contain md:object-cover object-center select-none"
              style={{ mixBlendMode: 'normal' }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)',
              }}
            />
          </div>
          {/* Bottom caption */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[10.5px] uppercase tracking-[0.28em] text-white/75">
            <span>→ The Studio, 2026</span>
            <span>Shot in Lagos</span>
          </div>
        </motionT.div>

        {/* Name list */}
        <div className="mt-28">
          {teamMembers.map((m, i) => (
            <motionT.div
              key={m.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5% 0px' }}
              transition={{ duration: 0.8, ease: teamEase, delay: i * 0.04 }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              className="group relative border-t border-white/10 last:border-b"
              data-hover>
              <div className="grid grid-cols-12 items-baseline gap-6 py-6 md:py-8 px-2 md:px-4">
                <div className="col-span-1 text-[10.5px] uppercase tracking-[0.28em] text-white/45">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <motionT.h3
                  animate={{
                    opacity: hovered === null || hovered === i ? 1 : 0.35,
                    x: hovered === i ? 8 : 0,
                  }}
                  transition={{ duration: 0.4, ease: teamEase }}
                  className="col-span-11 md:col-span-6 font-display font-light tracking-[-0.01em] text-white text-[28px] md:text-[36px] leading-[1.05]">
                  {m.name.split(' ').map((part, idx) => (
                    <span key={idx}>
                      {idx > 0 && ' '}
                      {part.includes('i') ? (
                        <>
                          {part.split('i').map((seg, si, arr) => (
                            <React.Fragment key={si}>
                              {seg}
                              {si < arr.length - 1 && <span className="italic-accent">i</span>}
                            </React.Fragment>
                          ))}
                        </>
                      ) : (
                        part
                      )}
                    </span>
                  ))}
                </motionT.h3>
                <motionT.div
                  animate={{
                    opacity: hovered === null || hovered === i ? 0.6 : 0.25,
                  }}
                  transition={{ duration: 0.4, ease: teamEase }}
                  className="col-span-12 md:col-span-4 md:col-start-8 text-[12px] md:text-[13px] text-white/65 uppercase tracking-[0.18em]">
                  {m.role}
                </motionT.div>
                <motionT.div
                  aria-hidden
                  animate={{
                    opacity: hovered === i ? 1 : 0,
                    rotate: hovered === i ? 0 : -15,
                  }}
                  transition={{ duration: 0.4, ease: teamEase }}
                  className="hidden md:block md:col-span-1 md:col-start-12 text-right text-white text-[18px]">
                  →
                </motionT.div>
              </div>
            </motionT.div>
          ))}
        </div>

        {/* Closer */}
        <div className="mt-20 flex items-end justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/45">
            → Always hiring the curious
          </div>
          <a
            href="#"
            data-hover
            className="group inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.28em] text-white">
            <span>See open roles</span>
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

window.Team = Team;
