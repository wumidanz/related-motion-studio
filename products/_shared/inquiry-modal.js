/* ============================================================
   RMS Inquiry/Booking Modal — shared logic.
   Reads window.INQUIRY_CONFIG, renders the modal, wires up
   all [data-open-form] triggers, handles submit (FormSubmit
   AJAX + mailto fallback) and WhatsApp hand-off.

   Config schema:
   {
     email: 'space@relatedmotionstudios.com',           // where submissions go
     whatsapp: '2348112225555',                         // digits only, country code first, no +
     whatsappPrefill: 'Hi RMS Space — …',               // prefilled WA message
     productLabel: 'RMS Space',                         // appears in subject line
     metaLabel: 'N° 026 — Intake',                      // small meta line above title
     defaultTitle: 'Book the studio. <em>Briefly.</em>',
     defaultSub: 'Five quick fields. We confirm within 24 hours.',
     waLabel: 'Or — direct line',                       // label on WhatsApp row
     waDesc: 'Chat with us on WhatsApp <em>— faster, more personal.</em>',
     // optional: intent-specific copy overrides keyed by data-open-form value
     intents: {
       book:    { title: '…', sub: '…', intentValue: 'Booking' },
       inquire: { title: '…', sub: '…', intentValue: 'Inquiry' },
     },
     fields: [
       // standard fields
       { id, label, type, required, placeholder, autocomplete, options, row, full }
       // row: integer — fields with the same row group into a 2-up row
       // full: true — span the full row alone
       // type: text | email | tel | number | date | textarea | select | options
       // options (for select): ['A', 'B'] OR [{label, value}]
       // options (for type='options'): [{tag, name, meta}] — radio cards
     ],
   }
   ============================================================ */

(function () {
  'use strict';

  const CFG = window.INQUIRY_CONFIG;
  if (!CFG) {
    console.warn('[inquiry-modal] No window.INQUIRY_CONFIG set — skipping.');
    return;
  }

  // ---------- Build modal DOM ----------
  const modalRoot = document.createElement('div');
  modalRoot.className = 'inquiry-modal';
  modalRoot.id = 'inquiryModal';
  modalRoot.setAttribute('role', 'dialog');
  modalRoot.setAttribute('aria-modal', 'true');
  modalRoot.setAttribute('aria-hidden', 'true');
  modalRoot.setAttribute('aria-labelledby', 'imTitle');

  const fieldsHTML = renderFields(CFG.fields || []);

  modalRoot.innerHTML = `
    <div class="im-scrim" data-close></div>
    <div class="im-card" role="document">
      <div class="im-head">
        <div>
          <div class="im-meta">${esc(CFG.metaLabel || 'New inquiry')}</div>
          <h3 class="im-title" id="imTitle">${CFG.defaultTitle || 'Get in touch. <em>Briefly.</em>'}</h3>
          <p class="im-sub" id="imSub">${esc(CFG.defaultSub || 'A few quick fields.')}</p>
        </div>
        <button type="button" class="im-close" data-close aria-label="Close">✕</button>
      </div>

      <div class="im-form-wrap">
        <form class="im-form" id="imForm" novalidate>
          <div class="im-grid">
            ${fieldsHTML}
            <!-- Submission config (Web3Forms + FormSubmit-compatible) -->
            <input type="hidden" name="subject" value="${esc(CFG.productLabel || 'RMS')} — New inquiry" />
            <input type="hidden" name="from_name" value="${esc(CFG.productLabel || 'RMS')} website" />
            <input type="hidden" name="_subject" value="${esc(CFG.productLabel || 'RMS')} — New inquiry" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_product" value="${esc(CFG.productLabel || 'RMS')}" />
            <input type="hidden" name="product" value="${esc(CFG.productLabel || 'RMS')}" />
            <input type="hidden" name="intent" id="imIntent" value="" />
            <!-- honeypots (FormSubmit + Web3Forms) -->
            <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" />
            <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" />
          </div>

          <div class="im-actions">
            <button type="submit" class="im-btn im-submit">Send inquiry <span class="arr"></span></button>
            <span class="im-note" id="imNote">By submitting, you agree to be reviewed.</span>
          </div>
        </form>

        ${CFG.whatsapp ? `
        <div class="im-wa">
          <div class="im-wa-text">
            <div class="im-wa-lbl">${esc(CFG.waLabel || 'Or — direct line')}</div>
            <div class="im-wa-desc">${CFG.waDesc || 'Chat with us on WhatsApp <em>— faster, more personal.</em>'}</div>
          </div>
          <button type="button" class="im-wa-btn" id="imWaBtn">WhatsApp <span class="arr"></span></button>
        </div>` : ''}
      </div>

      <div class="im-success" aria-live="polite">
        <div class="im-success-inner">
          <div class="im-meta">Received</div>
          <h3>Your inquiry is in. <em>We'll be in touch.</em></h3>
          <p>We read every serious inquiry. Expect a reply within 24 hours — sometimes much sooner.</p>
          <button type="button" class="im-btn" data-close>Close <span class="arr"></span></button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalRoot);

  // ---------- References ----------
  const card    = modalRoot.querySelector('.im-card');
  const form    = modalRoot.querySelector('#imForm');
  const title   = modalRoot.querySelector('#imTitle');
  const sub     = modalRoot.querySelector('#imSub');
  const note    = modalRoot.querySelector('#imNote');
  const intent  = modalRoot.querySelector('#imIntent');
  const waBtn   = modalRoot.querySelector('#imWaBtn');

  // ---------- WhatsApp ----------
  let WA_URL = null;
  function openWhatsApp() {
    if (!WA_URL) return;
    const w = window.open(WA_URL, '_blank', 'noopener,noreferrer');
    if (!w) {
      try { window.top.location.href = WA_URL; } catch (_) { window.location.href = WA_URL; }
    }
  }
  if (CFG.whatsapp) {
    WA_URL = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(CFG.whatsappPrefill || 'Hello!');
    if (waBtn) {
      waBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openWhatsApp();
      });
    }
    // Wire any [data-whatsapp] element on the page to open WhatsApp directly
    document.querySelectorAll('[data-whatsapp]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openWhatsApp();
      });
      if (el.tagName === 'A') el.setAttribute('href', WA_URL);
    });
  }

  // ---------- Open / close ----------
  function openModal(intentKey) {
    // restore submit button if it was swapped to a mailto fallback last time
    restoreSubmitButton();

    const intentCfg = (CFG.intents && CFG.intents[intentKey]) || null;
    if (intentCfg) {
      title.innerHTML = intentCfg.title || (CFG.defaultTitle || '');
      sub.textContent = intentCfg.sub || (CFG.defaultSub || '');
      intent.value = intentCfg.intentValue || intentKey || '';
    } else {
      title.innerHTML = CFG.defaultTitle || 'Get in touch. <em>Briefly.</em>';
      sub.textContent = CFG.defaultSub || 'A few quick fields.';
      intent.value = intentKey || 'General';
    }
    note.textContent = 'By submitting, you agree to be reviewed.';
    note.style.color = '';

    card.classList.remove('is-success');
    modalRoot.classList.add('open');
    modalRoot.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-locked');

    setTimeout(() => {
      const firstInput = form.querySelector('input:not([type="hidden"]):not([type="radio"]), select, textarea');
      if (firstInput) firstInput.focus();
    }, 350);
  }
  function closeModal() {
    modalRoot.classList.remove('open');
    modalRoot.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-locked');
  }
  function restoreSubmitButton() {
    const fb = modalRoot.querySelector('.im-mailto-fallback');
    if (fb) {
      fb.outerHTML = '<button type="submit" class="im-btn im-submit">Send inquiry <span class="arr"></span></button>';
    }
    const live = form.querySelector('.im-submit');
    if (live) {
      live.disabled = false;
      live.innerHTML = 'Send inquiry <span class="arr"></span>';
    }
  }

  // wire any element with [data-open-form] — value is the intent key
  function bindOpener(el) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(el.getAttribute('data-open-form') || 'default');
    });
  }
  document.querySelectorAll('[data-open-form]').forEach(bindOpener);

  // close handlers
  modalRoot.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalRoot.classList.contains('open')) closeModal();
  });

  // "Other" reveal — when a select with [data-other-toggle="true"] picks Other,
  // show & require the sibling text input. Hide & clear it otherwise.
  modalRoot.addEventListener('change', (e) => {
    if (e.target.tagName !== 'SELECT') return;
    const field = e.target.closest('.im-field[data-other-toggle="true"]');
    if (!field) return;
    const other = field.querySelector('.im-other-input');
    if (!other) return;
    const isOther = /^(other|something else)$/i.test(String(e.target.value).trim());
    other.style.display = isOther ? '' : 'none';
    if (isOther) {
      other.required = e.target.required;
    } else {
      other.required = false;
      other.value = '';
    }
  });

  // ---------- Submit ----------
  function buildMailto() {
    const d = new FormData(form);
    const lines = [];
    (CFG.fields || []).forEach(f => {
      let v = d.get(f.id);
      if (v == null || v === '') return;
      // Combine with the "_other" free-text input when "Other" was picked
      if (/^(other|something else)$/i.test(String(v).trim())) {
        const other = d.get(f.id + '_other');
        if (other) v = 'Other — ' + other;
      }
      lines.push((f.label || f.id) + ': ' + v);
    });
    const intentVal = d.get('intent');
    if (intentVal) lines.unshift('Intent: ' + intentVal);
    return 'mailto:' + CFG.email
      + '?subject=' + encodeURIComponent((CFG.productLabel || 'RMS') + ' — New inquiry')
      + '&body='    + encodeURIComponent(lines.join('\n'));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const liveBtn = form.querySelector('.im-submit');
    liveBtn.disabled = true;
    liveBtn.textContent = 'Sending…';
    note.textContent = '';

    const data = new FormData(form);

    // Choose submission backend: Web3Forms (preferred) or FormSubmit
    let endpoint, isOk;
    if (CFG.accessKey) {
      data.append('access_key', CFG.accessKey);
      endpoint = 'https://api.web3forms.com/submit';
      isOk = (res, json) => res.ok && (json.success === true || json.success === 'true');
    } else {
      endpoint = 'https://formsubmit.co/ajax/' + CFG.email;
      isOk = (res, json) => res.ok && (json.success === 'true' || json.success === true);
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (isOk(res, json)) {
        card.classList.add('is-success');
        form.reset();
      } else {
        throw new Error(json.message || 'Submission failed');
      }
    } catch (err) {
      // Swap submit into a mailto fallback so the inquiry never gets lost
      liveBtn.outerHTML = '<a href="' + buildMailto() + '" class="im-btn im-mailto-fallback">Send via email <span class="arr"></span></a>';
      note.style.color = '#c98a6a';
      note.textContent = 'Direct submit unavailable here. Use email or WhatsApp — both work.';
      console.error('[inquiry-modal] submit error', err);
    }
  });

  // ---------- Field rendering ----------
  function renderFields(fields) {
    if (!fields || !fields.length) return '';
    // Group by row index
    const rows = [];
    fields.forEach(f => {
      const r = (f.row == null) ? rows.length : f.row;
      rows[r] = rows[r] || [];
      rows[r].push(f);
    });
    return rows.filter(Boolean).map(rowFields => {
      const isSingle = rowFields.length === 1 || rowFields.some(f => f.full);
      return `<div class="im-row${isSingle ? ' single' : ''}">${
        rowFields.map(renderField).join('')
      }</div>`;
    }).join('');
  }

  function renderField(f) {
    if (f.type === 'options') return renderOptionCards(f);
    if (f.type === 'select')  return renderSelect(f);
    if (f.type === 'textarea') return renderTextarea(f);
    return renderInput(f);
  }

  function renderInput(f) {
    const reqStar = f.required ? '<span class="req">*</span>' : '';
    const attrs = [
      'type="' + (f.type || 'text') + '"',
      'id="im-' + f.id + '"',
      'name="' + f.id + '"',
      f.required ? 'required' : '',
      f.autocomplete ? 'autocomplete="' + f.autocomplete + '"' : '',
      f.placeholder ? 'placeholder="' + esc(f.placeholder) + '"' : '',
      f.min != null ? 'min="' + f.min + '"' : '',
      f.max != null ? 'max="' + f.max + '"' : '',
    ].filter(Boolean).join(' ');
    return `
      <div class="im-field">
        <label for="im-${f.id}">${esc(f.label)} ${reqStar}</label>
        <input ${attrs} />
      </div>
    `;
  }

  function renderTextarea(f) {
    const reqStar = f.required ? '<span class="req">*</span>' : '';
    return `
      <div class="im-field">
        <label for="im-${f.id}">${esc(f.label)} ${reqStar}</label>
        <textarea id="im-${f.id}" name="${f.id}" rows="${f.rows || 3}" ${f.required ? 'required' : ''} placeholder="${esc(f.placeholder || '')}"></textarea>
      </div>
    `;
  }

  function renderSelect(f) {
    const reqStar = f.required ? '<span class="req">*</span>' : '';
    const opts = (f.options || []).map(o => {
      const v = (typeof o === 'string') ? o : o.value;
      const l = (typeof o === 'string') ? o : (o.label || o.value);
      return '<option value="' + esc(v) + '">' + esc(l) + '</option>';
    }).join('');
    // If any option is "Other" / "Something else", render a follow-up text input
    // that becomes visible (and required) when that option is selected.
    const hasOther = (f.options || []).some(o => {
      const v = (typeof o === 'string') ? o : (o.value || o.label || '');
      return /^(other|something else)$/i.test(String(v).trim());
    });
    const otherField = hasOther ? `
        <input type="text" id="im-${f.id}__other" name="${f.id}_other"
          class="im-other-input" placeholder="${esc(f.otherPlaceholder || 'Please specify…')}"
          style="display:none; margin-top:10px;" autocomplete="off" />
    ` : '';
    return `
      <div class="im-field" data-other-toggle="${hasOther ? 'true' : 'false'}">
        <label for="im-${f.id}">${esc(f.label)} ${reqStar}</label>
        <select id="im-${f.id}" name="${f.id}" ${f.required ? 'required' : ''}>
          <option value="" disabled selected>${esc(f.placeholder || 'Select one')}</option>
          ${opts}
        </select>${otherField}
      </div>
    `;
  }

  function renderOptionCards(f) {
    const reqStar = f.required ? '<span class="req">*</span>' : '';
    const opts = (f.options || []).map((o, i) => {
      const v = o.value || o.name;
      const checked = (i === 0 && f.required) ? 'checked' : '';
      return `
        <label class="im-option">
          <input type="radio" name="${f.id}" value="${esc(v)}" ${f.required ? 'required' : ''} ${checked} />
          <div class="tag">${esc(o.tag || '')}</div>
          <div class="name">${o.name || ''}</div>
          <div class="meta">${esc(o.meta || '')}</div>
        </label>
      `;
    }).join('');
    return `
      <div class="im-field" style="grid-column: 1 / -1;">
        <label>${esc(f.label)} ${reqStar}</label>
        <div class="im-options">${opts}</div>
      </div>
    `;
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Expose for debugging / programmatic opening
  window.openInquiryModal = openModal;
  window.closeInquiryModal = closeModal;
  window.openInquiryWhatsApp = openWhatsApp;
})();
