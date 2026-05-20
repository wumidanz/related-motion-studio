/* ========================================================================
   mobile-preview.js — shared "Device" tweak
   ------------------------------------------------------------------------
   Adds a Tweaks panel with a PC / Phone toggle. When Phone is selected,
   shows the current page inside a centered 390×844 phone frame so you
   can preview the real mobile layout (CSS media queries fire correctly
   because the iframe has its own viewport).
   ------------------------------------------------------------------------
   Drop a <script src="..../mobile-preview.js"></script> on any page.
   No dependencies. Single file. Safe to load from any depth.
   ======================================================================== */
(function () {
  // ── Don't recurse: the preview iframe loads the page with #__phone-preview,
  // which tells the script to render plain content and skip the chrome.
  if (location.hash === '#__phone-preview') return;

  const STORAGE_KEY = 'rms-device-preview';
  let panelEl = null;
  let stageEl = null;
  let editMode = false;

  // ── Restore last device on load
  let device = localStorage.getItem(STORAGE_KEY) || 'pc';

  // ── If the user closed the tab in phone mode, re-open the stage immediately
  //    (without waiting for them to re-toggle edit mode).
  function applyDevice(next, { animate = true } = {}) {
    device = next;
    localStorage.setItem(STORAGE_KEY, device);
    if (device === 'phone') openStage(animate);
    else closeStage(animate);
    updatePanelUI();
  }

  // ── PANEL ───────────────────────────────────────────────────────────────
  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.id = '__rms-tweaks';
    panelEl.setAttribute('data-no-export', '');
    panelEl.innerHTML = `
      <style>
        #__rms-tweaks {
          position: fixed; right: 20px; bottom: 20px; z-index: 2147483646;
          font-family: ui-sans-serif, -apple-system, system-ui, sans-serif;
          font-size: 12px;
          color: #f6f4ef;
          background: rgba(14,12,10,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 14px;
          padding: 14px 14px 12px;
          width: 248px;
          box-shadow: 0 24px 60px -16px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
          display: none;
          user-select: none;
        }
        #__rms-tweaks.is-open { display: block; }
        #__rms-tweaks .__rt-head {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom: 10px;
        }
        #__rms-tweaks .__rt-title {
          font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(246,244,239,0.55); font-weight: 500;
        }
        #__rms-tweaks .__rt-close {
          all: unset; cursor: pointer; padding: 2px 6px; border-radius: 6px;
          color: rgba(246,244,239,0.55); font-size: 14px; line-height: 1;
        }
        #__rms-tweaks .__rt-close:hover { color: #fff; background: rgba(255,255,255,0.06); }
        #__rms-tweaks .__rt-row {
          display: grid; gap: 6px;
        }
        #__rms-tweaks .__rt-label {
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(246,244,239,0.45);
        }
        #__rms-tweaks .__rt-seg {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 3px;
        }
        #__rms-tweaks .__rt-seg button {
          all: unset; cursor: pointer; text-align: center;
          padding: 8px 10px; border-radius: 7px;
          font-size: 12px; font-weight: 500;
          color: rgba(246,244,239,0.65);
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          transition: background 160ms ease, color 160ms ease;
        }
        #__rms-tweaks .__rt-seg button:hover { color: #fff; }
        #__rms-tweaks .__rt-seg button.is-on {
          background: #f6f4ef; color: #0e0c0a;
        }
        #__rms-tweaks .__rt-hint {
          margin-top: 10px;
          font-size: 10.5px; line-height: 1.5;
          color: rgba(246,244,239,0.4);
        }
        #__rms-tweaks .__rt-seg svg { width: 13px; height: 13px; }
      </style>
      <div class="__rt-head">
        <span class="__rt-title">Tweaks</span>
        <button class="__rt-close" aria-label="Close">✕</button>
      </div>
      <div class="__rt-row">
        <span class="__rt-label">Device preview</span>
        <div class="__rt-seg" role="tablist">
          <button data-d="pc" role="tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="2.5" y="4" width="19" height="13" rx="1.5"/>
              <path d="M9 21h6M12 17v4"/>
            </svg>
            Desktop
          </button>
          <button data-d="phone" role="tab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/>
              <path d="M10.5 19h3"/>
            </svg>
            Phone
          </button>
        </div>
        <div class="__rt-hint">Phone shows a live 390×844 preview of this page.</div>
      </div>
    `;
    document.body.appendChild(panelEl);
    panelEl.querySelector('.__rt-close').addEventListener('click', () => {
      hidePanel();
      window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
    });
    panelEl.querySelectorAll('.__rt-seg button').forEach(btn => {
      btn.addEventListener('click', () => applyDevice(btn.dataset.d));
    });
    updatePanelUI();
    return panelEl;
  }

  function updatePanelUI() {
    if (!panelEl) return;
    panelEl.querySelectorAll('.__rt-seg button').forEach(btn => {
      btn.classList.toggle('is-on', btn.dataset.d === device);
    });
  }

  function showPanel() { ensurePanel().classList.add('is-open'); }
  function hidePanel() { if (panelEl) panelEl.classList.remove('is-open'); }

  // ── PHONE STAGE ─────────────────────────────────────────────────────────
  function openStage(animate = true) {
    if (stageEl) return;
    stageEl = document.createElement('div');
    stageEl.id = '__rms-phone-stage';
    stageEl.setAttribute('data-no-export', '');
    const url = location.href.split('#')[0] + '#__phone-preview';
    stageEl.innerHTML = `
      <style>
        #__rms-phone-stage {
          position: fixed; inset: 0; z-index: 2147483645;
          background: #0a0908;
          background-image:
            radial-gradient(1200px 800px at 50% 30%, rgba(80,70,55,0.18), transparent 70%),
            linear-gradient(180deg, #0a0908 0%, #050402 100%);
          display: grid; place-items: center;
          opacity: 0;
          transition: opacity 220ms ease;
        }
        #__rms-phone-stage.is-in { opacity: 1; }
        #__rms-phone-stage .__rps-wrap {
          position: relative;
          /* phone canvas — fits inside any viewport, max 390x844 */
          width: min(390px, calc(100vw - 80px));
          height: min(844px, calc(100vh - 120px));
          aspect-ratio: 390 / 844;
        }
        @media (max-height: 700px) {
          #__rms-phone-stage .__rps-wrap {
            width: min(360px, calc(100vw - 60px));
            height: min(780px, calc(100vh - 60px));
          }
        }
        #__rms-phone-stage .__rps-bezel {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, #14110d 0%, #0a0908 100%);
          border-radius: 44px;
          padding: 12px;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.05),
            inset 0 1px 0 rgba(255,255,255,0.04),
            0 30px 80px -20px rgba(0,0,0,0.7),
            0 6px 20px rgba(0,0,0,0.4);
        }
        #__rms-phone-stage .__rps-screen {
          position: relative;
          width: 100%; height: 100%;
          border-radius: 32px;
          overflow: hidden;
          background: #000;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
        }
        #__rms-phone-stage iframe {
          position: absolute; inset: 0;
          width: 390px; height: 844px;
          border: 0;
          transform-origin: top left;
          background: #000;
        }
        #__rms-phone-stage .__rps-notch {
          position: absolute; left: 50%; top: 22px;
          transform: translateX(-50%);
          width: 110px; height: 28px;
          background: #0a0908; border-radius: 18px;
          z-index: 2; pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
        }
        #__rms-phone-stage .__rps-meta {
          position: absolute; left: 0; right: 0; bottom: -44px;
          text-align: center;
          font-family: ui-monospace, monospace;
          font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(246,244,239,0.4);
        }
        #__rms-phone-stage .__rps-close {
          position: fixed; top: 22px; right: 22px;
          all: unset; cursor: pointer;
          padding: 10px 16px; border-radius: 999px;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(246,244,239,0.8);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(8px);
          z-index: 3;
        }
        #__rms-phone-stage .__rps-close:hover {
          color: #fff; background: rgba(255,255,255,0.10);
        }
      </style>
      <button class="__rps-close" aria-label="Exit phone preview">← Back to desktop</button>
      <div class="__rps-wrap">
        <div class="__rps-bezel">
          <div class="__rps-screen">
            <div class="__rps-notch"></div>
            <iframe title="Phone preview" src="${url}"></iframe>
          </div>
        </div>
        <div class="__rps-meta">iPhone · 390 × 844</div>
      </div>
    `;
    document.body.appendChild(stageEl);
    // Scale iframe to fit the screen area
    const fitIframe = () => {
      const screen = stageEl.querySelector('.__rps-screen');
      const iframe = stageEl.querySelector('iframe');
      if (!screen || !iframe) return;
      const rect = screen.getBoundingClientRect();
      const sx = rect.width / 390;
      const sy = rect.height / 844;
      const s = Math.min(sx, sy);
      iframe.style.transform = `scale(${s})`;
      iframe.style.width = '390px';
      iframe.style.height = '844px';
      // center
      iframe.style.left = ((rect.width - 390 * s) / 2) + 'px';
      iframe.style.top = ((rect.height - 844 * s) / 2) + 'px';
    };
    requestAnimationFrame(() => {
      fitIframe();
      if (animate) stageEl.classList.add('is-in');
      else stageEl.style.transition = 'none', stageEl.classList.add('is-in');
    });
    window.addEventListener('resize', fitIframe);
    stageEl._fitIframe = fitIframe;

    stageEl.querySelector('.__rps-close').addEventListener('click', () => applyDevice('pc'));
  }

  function closeStage(animate = true) {
    if (!stageEl) return;
    const el = stageEl;
    stageEl = null;
    if (!animate) { el.remove(); return; }
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 240);
  }

  // ── EDIT-MODE PROTOCOL ─────────────────────────────────────────────────
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === '__activate_edit_mode') {
      editMode = true;
      showPanel();
    } else if (d.type === '__deactivate_edit_mode') {
      editMode = false;
      hidePanel();
    }
  });
  // Tell the host that an edit-mode panel exists for this page
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (_) {}

  // ── Restore phone stage if last session ended in phone mode
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (device === 'phone') openStage(false);
    });
  } else {
    if (device === 'phone') openStage(false);
  }
})();
