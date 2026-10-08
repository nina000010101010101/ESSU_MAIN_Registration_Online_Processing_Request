(() => {
'use strict';

/* =====================================================================
   CONFIG  -  edit these to match ESSU / the Registrar's actual data.
   The fees below are PLACEHOLDERS. Replace them with the official rates.
   ===================================================================== */
const CONFIG = {
  loginUrl: 'login.html',                    // where "Log out" sends the student
  storageKey: 'essu-registrar-dashboard-v1', // demo persistence (swap for your backend)
  maxCopies: 10,

  // Help links used by the search bar
  help: {
    registrarEmail: 'registrar@essu.edu.ph' // placeholder: use the real Registrar email
  },

  documents: [
    { id: 'tor',      name: 'Transcript of Records', fee: 100 },
    { id: 'cert',     name: 'Certification',         fee: 50  },
    { id: 'auth',     name: 'Authentication',        fee: 100 },
    { id: 'diploma',  name: 'Diploma',               fee: 150 },
    { id: 'hd',       name: 'Honorable Dismissal',   fee: 100 },
    { id: 'cf',       name: 'Completion Form',       fee: 50  },
    { id: 'ic',       name: 'Informative Copy',      fee: 50  },
    { id: 'others',   name: 'Others',                fee: 0, custom: true } // amount assessed by the Registrar
  ],
  reminders: [
    'Pay the assessed amount at the Cashier, then present the receipt to the Registrar.',
    'Processing usually takes 3–5 working days after payment is verified.',
    'Bring a Student ID when claiming. Representatives need an authorization letter.'
  ]
};

/* =====================================================================
   Helpers
   ===================================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const peso = n => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
const fmtDate = iso => new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso));
const fmtDateTime = iso => new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
const docById = id => CONFIG.documents.find(d => d.id === id);
const initials = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const firstName = n => (n || 'Student').replace(/,.*$/, '').split(/\s+/)[0];

const ICONS = {
  cap:     '<path d="m22 10-10-5L2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  file:    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  clock:   '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  check:   '<path d="M20 6 9 17l-5-5"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  search:  '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  x:       '<path d="M18 6 6 18M6 6l12 12"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  eye:     '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ban:     '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  info:    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  inbox:   '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  mail:    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>'
};
const ic = (n, c = 'w-5 h-5') =>
  `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const hydrate = (root = document) =>
  $$('i[data-icon]', root).forEach(el => { el.outerHTML = ic(el.dataset.icon, el.className || 'w-5 h-5'); });
const applyLinks = (root = document) =>
  $$('[data-link]', root).forEach(a => { a.setAttribute('href', CONFIG.links[a.dataset.link] || '#'); });

const STATUS = {
  submitted:  { label: 'Submitted',  desc: 'Awaiting evaluation', icon: 'file',  cls: 'bg-amber-100 text-amber-900' },
  processing: { label: 'Processing', desc: 'Ready in 3–5 days',   icon: 'clock', cls: 'bg-sky-100 text-sky-900' },
  released:   { label: 'Released',   desc: 'Ready for pick-up',   icon: 'check', cls: 'bg-emerald-100 text-emerald-900' },
  cancelled:  { label: 'Cancelled',  desc: 'Request cancelled',   icon: 'ban',   cls: 'bg-rose-100 text-rose-900' }
};
const badge = s => `<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${STATUS[s].cls}">${STATUS[s].label}</span>`;

const itemsSummary = r => r.items.map(i => `${i.name}${i.copies > 1 ? ' ×' + i.copies : ''}`).join(', ');
const totalOf = r => r.items.reduce((s, i) => s + i.amount, 0);
const hasAssessed = r => r.items.some(i => i.assessed);

/* =====================================================================
   Data layer (demo: localStorage). Replace load/save with fetch() calls
   to your backend when it is ready.
   ===================================================================== */
const year = new Date().getFullYear();
const day = n => new Date(Date.now() - n * 864e5).toISOString();
const mkItem = (id, copies, remarks = '') => { const d = docById(id); return { id, name: d.name, copies, remarks, amount: d.fee * copies }; };

function seedState() {
  return {
    seq: 3,
    user: { name: '', course: '', studentNo: '', email: '' },
    requests: [
      { id: `REQ-${year}-0003`, createdAt: day(1), status: 'submitted', payment: 'unpaid',
        items: [mkItem('ic', 1, 'For scholarship application')],
        history: [{ status: 'submitted', at: day(1), note: 'Request received. Awaiting evaluation.' }] },
      { id: `REQ-${year}-0002`, createdAt: day(3), status: 'processing', payment: 'paid',
        items: [mkItem('tor', 2, 'For employment'), mkItem('cert', 1)],
        history: [{ status: 'submitted', at: day(3), note: 'Request received.' },
                  { status: 'processing', at: day(2), note: 'Your documents are being prepared.' }] },
      { id: `REQ-${year}-0001`, createdAt: day(9), status: 'released', payment: 'paid',
        items: [mkItem('cert', 1, 'Certificate of Enrollment')],
        history: [{ status: 'submitted', at: day(9), note: 'Request received.' },
                  { status: 'processing', at: day(8), note: 'Your documents are being prepared.' },
                  { status: 'released', at: day(5), note: 'Ready for pick-up at the Registrar\u2019s Office.' }] }
    ]
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (raw) {
      const s = JSON.parse(raw);
      // drop the old "Payment verified." wording from saved history notes
      (s.requests || []).forEach(r => (r.history || []).forEach(h => {
        if (h.note) h.note = h.note.replace(/^Payment verified\.\s*/, '') || 'Your documents are being prepared.';
      }));
      return s;
    }
  } catch (e) {}
  return seedState();
}
function saveState() { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) {} }
const state = loadState();

/* =====================================================================
   UI shell: nav, breadcrumb, toast, modal
   ===================================================================== */
const ROUTES = [
  { id: 'dashboard', label: 'Home' },
  { id: 'new',       label: 'New Request' },
  { id: 'requests',  label: 'My Requests' },
  { id: 'profile',   label: 'Profile' }
];
const main = $('#view');

// Set by the search bar so New Request opens with a document already ticked
let pendingDoc = null;

function drawNav(active) {
  $('#nav').innerHTML = ROUTES.map(r => `
    <li><a href="#${r.id}" ${active === r.id ? 'aria-current="page"' : ''}
      class="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400
      ${active === r.id ? 'bg-white/15 text-gold-300' : 'text-white hover:bg-white/10'}">
      ${r.label}
    </a></li>`).join('');
  $('#navName').textContent = firstName(state.user.name);
}

function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.className = `view-in flex items-start gap-2.5 max-w-sm rounded-xl px-4 py-3 text-sm shadow-xl ${
    type === 'error' ? 'bg-rose-900 text-white' : 'bg-ess-800 text-white'}`;
  el.innerHTML = `${ic(type === 'error' ? 'info' : 'check', 'w-5 h-5 shrink-0 mt-px ' + (type === 'error' ? 'text-rose-200' : 'text-gold-300'))}<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

let lastFocus = null;
function closeModal() {
  $('#modal-root').innerHTML = '';
  document.body.classList.remove('overflow-hidden');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  lastFocus = null;
}

function viewDashboard() {
  const R = state.requests;
  const active = R.filter(r => r.status === 'submitted' || r.status === 'processing').length;
  const released = R.filter(r => r.status === 'released').length;
  const u = state.user;

  main.innerHTML = `
  <div class="view-in space-y-14">
    <section class="grid lg:grid-cols-[1.1fr_.9fr] gap-10 lg:gap-16 items-center">
      <div>
        <h1 class="font-display font-bold text-4xl sm:text-5xl leading-[1.12] text-ess-800">Welcome, Student</h1>
        <p class="mt-3 font-medium text-ess-600">ESSU Main: Registrar Online Processing System</p>
        <p class="mt-5 max-w-xl text-lg text-slate-600 leading-relaxed">
          Request documents, track the status of your application, and settle transactions with the Registrar&rsquo;s Office &mdash; without lining up.
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <a href="#new" class="btn-gold">${ic('plus', 'w-4 h-4')} New Request</a>
          <a href="#requests" class="btn-ghost">View My Requests</a>
        </div>
        <dl class="mt-12 flex flex-wrap gap-x-12 gap-y-6">
          <div><dd class="font-display font-bold text-3xl text-ess-700">${R.length}</dd><dt class="text-sm text-slate-600 mt-1">Total Requests</dt></div>
          <div><dd class="font-display font-bold text-3xl text-ess-700">${active}</dd><dt class="text-sm text-slate-600 mt-1">In Progress</dt></div>
          <div><dd class="font-display font-bold text-3xl text-ess-700">${released}</dd><dt class="text-sm text-slate-600 mt-1">Ready for Pick-up</dt></div>
        </dl>
      </div>

      <aside class="card p-7 sm:p-8" aria-labelledby="stuTitle">
        <div class="flex items-center justify-between mb-6">
          <h2 id="stuTitle" class="font-display font-semibold text-lg text-ess-800">Student information</h2>
          <a href="#profile" class="text-sm font-medium text-ess-700 hover:underline">Edit</a>
        </div>
        <dl class="space-y-5">
          <div><dt class="text-sm text-slate-500">Name</dt><dd class="font-medium text-slate-900 mt-1">${esc(u.name) || '&mdash;'}</dd></div>
          <div><dt class="text-sm text-slate-500">Course</dt><dd class="font-medium text-slate-900 mt-1">${esc(u.course) || '&mdash;'}</dd></div>
          <div><dt class="text-sm text-slate-500">Student No.</dt><dd class="font-medium text-slate-900 mt-1">${esc(u.studentNo) || '&mdash;'}</dd></div>
        </dl>
      </aside>
    </section>

    <section class="card p-6 sm:p-8" aria-labelledby="remTitle">
      <h2 id="remTitle" class="font-display font-semibold text-lg text-ess-800">Before you claim</h2>
      <ul class="mt-5 grid md:grid-cols-3 gap-6 text-sm text-slate-600">
        ${CONFIG.reminders.map(t => `<li class="flex gap-3">${ic('info', 'w-4 h-4 mt-0.5 shrink-0 text-ess-700')}<span>${esc(t)}</span></li>`).join('')}
      </ul>
    </section>
  </div>`;
}

/* =====================================================================
   VIEW: New Request  (mirrors the paper Request for Credential/Assessment Form)
   ===================================================================== */
function viewNew() {
  const u = state.user;
  main.innerHTML = `
  <div class="view-in">
    <div class="mb-9">
      <h1 class="font-display font-bold text-3xl sm:text-4xl text-ess-800">Request for Credential / Assessment</h1>
      <p class="mt-2 text-slate-600">Select the documents you need. The Cashier will collect the assessed amount.</p>
    </div>

    <form id="reqForm" class="space-y-6" novalidate>
      <div class="space-y-6 min-w-0">
        <section class="card p-6 sm:p-7">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-display font-semibold text-lg text-ess-800">Student details</h2>
            <a href="#profile" class="text-sm font-medium text-ess-700 hover:underline">Edit in profile</a>
          </div>
          <div class="grid sm:grid-cols-3 gap-4">
            <div><label class="block text-sm text-slate-600 mb-1.5" for="f-name">Name</label><input id="f-name" class="field" readonly value="${esc(u.name)}"></div>
            <div><label class="block text-sm text-slate-600 mb-1.5" for="f-course">Course</label><input id="f-course" class="field" readonly value="${esc(u.course)}"></div>
            <div><label class="block text-sm text-slate-600 mb-1.5" for="f-sn">Student No.</label><input id="f-sn" class="field" readonly value="${esc(u.studentNo)}"></div>
          </div>
        </section>

        <section class="card overflow-hidden max-w-4xl mx-auto">
          <div class="px-5 sm:px-6 pt-6 pb-4">
            <h2 class="font-display font-semibold text-lg text-ess-800">Documents</h2>
            <p class="text-sm text-slate-600 mt-1">Tick a document to set its number of copies and any remarks.</p>
          </div>
          <div class="hidden md:grid md:grid-cols-[minmax(0,1.5fr)_120px_minmax(0,1.3fr)] gap-4 px-5 sm:px-6 py-3 bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-600">
            <span>Document</span><span>No. of copies</span><span>Remarks</span>
          </div>
          ${CONFIG.documents.map(d => `
          <div class="doc-row grid md:grid-cols-[minmax(0,1.5fr)_120px_minmax(0,1.3fr)] gap-3 md:gap-4 md:items-center px-5 sm:px-6 py-4 border-t border-slate-200 first:border-t-0" data-id="${d.id}">
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" class="doc-check w-5 h-5 rounded accent-[#25604a] shrink-0">
                <span class="font-medium text-slate-900">${esc(d.name)}</span>
                ${d.custom ? '' : `<span class="text-xs text-slate-500">${peso(d.fee)} per copy</span>`}
              </label>
              ${d.custom ? `<input type="text" class="doc-other field mt-3" maxlength="80" placeholder="Specify the document" disabled aria-label="Specify other document">` : ''}
            </div>
            <div><span class="md:hidden text-xs text-slate-500 block mb-1">No. of copies</span>
              <input type="number" class="doc-copies field" min="1" max="${CONFIG.maxCopies}" value="1" disabled aria-label="Number of copies for ${esc(d.name)}"></div>
            <div><span class="md:hidden text-xs text-slate-500 block mb-1">Remarks</span>
              <input type="text" class="doc-remarks field" maxlength="120" placeholder="Optional" disabled aria-label="Remarks for ${esc(d.name)}"></div>
          </div>`).join('')}
        </section>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <button type="submit" id="submitBtn" class="btn-gold" disabled>Submit request</button>
        <button type="reset" class="btn-ghost">Clear form</button>
      </div>
      <div class="text-xs text-slate-500 leading-relaxed max-w-2xl space-y-2">
        <p>When your documents are ready, go to the Registrar&rsquo;s Office and pay at the Cashier.</p>
        <p>Your personal information is used only to process this request and is protected under the Data Privacy Act of 2012 (RA 10173).</p>
      </div>
    </form>
  </div>`;

  const form = $('#reqForm');

  function recalc() {
    let docs = 0;
    $$('.doc-row', form).forEach(row => {
      const on = $('.doc-check', row).checked;
      const cEl = $('.doc-copies', row), rEl = $('.doc-remarks', row), oEl = $('.doc-other', row);
      cEl.disabled = rEl.disabled = !on; if (oEl) oEl.disabled = !on;
      if (on) docs++;
    });
    $('#submitBtn').disabled = docs === 0;
  }

  form.addEventListener('input', recalc);
  form.addEventListener('change', e => {
    if (e.target.matches('.doc-copies')) e.target.value = Math.min(CONFIG.maxCopies, Math.max(1, parseInt(e.target.value, 10) || 1));
    recalc();
  });
  form.addEventListener('reset', () => setTimeout(recalc));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const u = state.user;
    if (!u.name || !u.course || !u.studentNo) {
      toast('Add your name, course and student number in your profile first.', 'error');
      location.hash = '#profile'; return;
    }
    const items = []; let missing = null;
    $$('.doc-row', form).forEach(row => {
      if (!$('.doc-check', row).checked) return;
      const d = docById(row.dataset.id);
      const copies = Math.min(CONFIG.maxCopies, Math.max(1, parseInt($('.doc-copies', row).value, 10) || 1));
      const remarks = $('.doc-remarks', row).value.trim();
      if (d.custom) {
        const spec = $('.doc-other', row).value.trim();
        if (!spec) { missing = row; return; }
        items.push({ id: d.id, name: `Others: ${spec}`, copies, remarks, amount: 0, assessed: true });
      } else items.push({ id: d.id, name: d.name, copies, remarks, amount: d.fee * copies });
    });
    if (missing) { toast('Specify the document under “Others”.', 'error'); $('.doc-other', missing).focus(); return; }
    if (!items.length) { toast('Select at least one document.', 'error'); return; }

    state.seq++;
    const now = new Date().toISOString();
    const req = {
      id: `REQ-${year}-${String(state.seq).padStart(4, '0')}`,
      createdAt: now, status: 'submitted', payment: 'unpaid', items,
      history: [{ status: 'submitted', at: now, note: 'Request received. Awaiting evaluation.' }]
    };
    state.requests.push(req);
    saveState();
    toast(`Request ${req.id} submitted.`);
    location.hash = '#requests';
    setTimeout(() => openRequest(req.id), 60);
  });

  // Search bar quick action: open with a document already ticked
  if (pendingDoc) {
    const row = $(`.doc-row[data-id="${pendingDoc}"]`, form);
    if (row) { $('.doc-check', row).checked = true; recalc(); $('.doc-copies', row).focus(); }
    pendingDoc = null;
  }
}

/* =====================================================================
   VIEW: My Requests
   ===================================================================== */
let reqFilter = 'all', reqQuery = '';

function viewRequests() {
  main.innerHTML = `
  <div class="view-in">
    <div class="flex flex-wrap items-end justify-between gap-5 mb-9">
      <div>
        <h1 class="font-display font-bold text-3xl sm:text-4xl text-ess-800">My Requests</h1>
        <p class="mt-2 text-slate-600">Track every credential request you have filed.</p>
      </div>
      <a href="#new" class="btn-gold">${ic('plus', 'w-4 h-4')} New Request</a>
    </div>
    <div class="card p-4 sm:p-6">
      <div class="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-5">
        <div id="chips" class="flex flex-wrap gap-2" role="group" aria-label="Filter by status"></div>
        <div class="lg:w-72"><label for="q" class="sr-only">Search requests</label>
          <input id="q" type="search" class="field" placeholder="Search request no. or document" value="${esc(reqQuery)}"></div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[560px]">
          <caption class="sr-only">Your credential requests</caption>
          <thead>
            <tr class="text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
              <th scope="col" class="py-3 pr-4">Request no.</th><th scope="col" class="py-3 pr-4">Documents</th>
              <th scope="col" class="py-3 pr-4">Status</th><th scope="col" class="py-3 pr-4">Filed</th><th scope="col" class="py-3 text-right"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody id="rows" class="divide-y divide-slate-200"></tbody>
        </table>
      </div>
      <div id="empty" class="hidden text-center py-14">
        <span class="mx-auto w-14 h-14 rounded-2xl bg-ess-700/10 grid place-items-center text-ess-700">${ic('inbox', 'w-7 h-7')}</span>
        <p class="mt-4 font-display font-semibold text-slate-900">Nothing matches</p>
        <p class="text-sm text-slate-600 mt-1">Try another status or clear your search.</p>
      </div>
    </div>
  </div>`;

  $('#q').addEventListener('input', e => { reqQuery = e.target.value; drawRows(); });
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    reqFilter = b.dataset.f; drawChips(); drawRows();
  });
  drawChips(); drawRows();
}

function drawChips() {
  const opts = [['all', 'All'], ['submitted', 'Submitted'], ['processing', 'Processing'], ['released', 'Released'], ['cancelled', 'Cancelled']];
  $('#chips').innerHTML = opts.map(([k, l]) => {
    const n = k === 'all' ? state.requests.length : state.requests.filter(r => r.status === k).length;
    const on = reqFilter === k;
    return `<button type="button" data-f="${k}" aria-pressed="${on}"
      class="rounded-full px-4 py-2 text-sm font-medium transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ess-600 focus-visible:ring-offset-1 ${on ? 'bg-ess-700 text-white border-ess-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}">${l} <span class="${on ? 'text-white/80' : 'text-slate-500'}">${n}</span></button>`;
  }).join('');
}

function drawRows() {
  const q = reqQuery.trim().toLowerCase();
  const list = state.requests
    .filter(r => reqFilter === 'all' || r.status === reqFilter)
    .filter(r => !q || r.id.toLowerCase().includes(q) || itemsSummary(r).toLowerCase().includes(q))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  $('#rows').innerHTML = list.map(r => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-4 pr-4 font-medium text-slate-900 whitespace-nowrap">${r.id}</td>
      <td class="py-4 pr-4 text-slate-700 max-w-[280px]"><span class="block truncate" title="${esc(itemsSummary(r))}">${esc(itemsSummary(r))}</span></td>
      <td class="py-4 pr-4">${badge(r.status)}</td>
      <td class="py-4 pr-4 text-slate-600 whitespace-nowrap">${fmtDate(r.createdAt)}</td>
      <td class="py-4 text-right"><button type="button" data-open="${r.id}" class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ess-600" aria-label="View request ${r.id}">${ic('eye', 'w-3.5 h-3.5')} View</button></td>
    </tr>`).join('');
  $('#empty').classList.toggle('hidden', list.length > 0);
  $('#rows').closest('.overflow-x-auto').classList.toggle('hidden', list.length === 0);
}

/* =====================================================================
   VIEW: Profile
   ===================================================================== */
function viewProfile() {
  const u = state.user;
  main.innerHTML = `
  <div class="view-in">
    <h1 class="font-display font-bold text-3xl sm:text-4xl text-ess-800">Profile</h1>
    <p class="mt-2 text-slate-600 mb-9">These details are printed on every request you file.</p>
    <form id="profForm" class="card p-6 sm:p-10 space-y-5 max-w-4xl mx-auto">
      <div><label class="block text-sm text-slate-600 mb-1.5" for="p-name">Full name</label><input id="p-name" class="field" required value="${esc(u.name)}" placeholder="Last name, First name M.I."></div>
      <div><label class="block text-sm text-slate-600 mb-1.5" for="p-course">Course</label><input id="p-course" class="field" required value="${esc(u.course)}"></div>
      <div class="grid sm:grid-cols-2 gap-5">
        <div><label class="block text-sm text-slate-600 mb-1.5" for="p-sn">Student No.</label><input id="p-sn" class="field" required value="${esc(u.studentNo)}"></div>
        <div><label class="block text-sm text-slate-600 mb-1.5" for="p-email">Email</label><input id="p-email" type="email" class="field" value="${esc(u.email)}"></div>
      </div>
      <p class="text-xs text-slate-500">Your personal information is protected under the Data Privacy Act of 2012 (RA 10173).</p>
      <div class="pt-1"><button class="btn-gold" type="submit">Save changes</button></div>
    </form>
  </div>`;
  $('#profForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = id => $(id).value.trim();
    if (!v('#p-name') || !v('#p-course') || !v('#p-sn')) { toast('Name, course and student number are required.', 'error'); return; }
    state.user = { name: v('#p-name'), course: v('#p-course'), studentNo: v('#p-sn'), email: v('#p-email') };
    saveState(); drawNav('profile');
    toast('Changes saved.');
  });
}

/* =====================================================================
   Request detail (modal styled as the paper form / claim slip)
   ===================================================================== */
function tracker(r) {
  if (r.status === 'cancelled') {
    const last = r.history[r.history.length - 1];
    return `<div class="rounded-xl bg-rose-50 text-rose-900 text-sm px-4 py-3">This request was cancelled on ${fmtDateTime(last.at)}.</div>`;
  }
  const order = ['submitted', 'processing', 'released'];
  const idx = order.indexOf(r.status);
  return `<ol class="grid grid-cols-3 gap-3">${order.map((k, i) => {
    const h = r.history.find(x => x.status === k);
    const done = i <= idx;
    return `<li>
      <div class="h-1.5 rounded-full ${done ? 'bg-ess-600' : 'bg-slate-200'}"></div>
      <p class="mt-2.5 text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-500'}">${STATUS[k].label}${done ? '<span class="sr-only"> (done)</span>' : ''}</p>
      <p class="text-xs text-slate-500">${h ? fmtDate(h.at) : STATUS[k].desc}</p>
    </li>`;
  }).join('')}</ol>`;
}

function openRequest(id) {
  const r = state.requests.find(x => x.id === id); if (!r) return;
  const u = state.user;
  const latest = r.history[r.history.length - 1];
  lastFocus = document.activeElement;
  $('#modal-root').innerHTML = `
  <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6" data-backdrop>
    <div class="modal-panel view-in w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white text-slate-800 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="mTitle">
      <div class="flex items-start justify-between gap-4 p-6 sm:p-8 border-b border-slate-200">
        <div class="flex items-center gap-4">
          <span class="shrink-0 w-12 h-12 rounded-full bg-ess-800 text-gold-300 grid place-items-center">${ic('cap', 'w-6 h-6')}</span>
          <div>
            <p class="text-sm font-semibold text-ess-700">Eastern Samar State University</p>
            <h2 id="mTitle" class="font-display font-bold text-xl text-slate-900">Request for Credential/Assessment Form</h2>
          </div>
        </div>
        <button type="button" data-close class="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ess-600" aria-label="Close">${ic('x')}</button>
      </div>

      <div class="p-6 sm:p-8 space-y-8">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><p class="text-xs text-slate-500">Request no.</p><p class="font-display font-semibold text-lg text-slate-900">${r.id}</p></div>
          <div class="text-right"><p class="text-xs text-slate-500 mb-1">Filed ${fmtDate(r.createdAt)}</p>${badge(r.status)}</div>
        </div>

        ${tracker(r)}
        <p class="text-sm text-slate-600 -mt-3">${esc(latest.note || STATUS[r.status].desc)}</p>

        <dl class="grid sm:grid-cols-3 gap-5 text-sm">
          <div><dt class="text-slate-500">Name</dt><dd class="font-medium text-slate-900 mt-0.5">${esc(u.name)}</dd></div>
          <div><dt class="text-slate-500">Course</dt><dd class="font-medium text-slate-900 mt-0.5">${esc(u.course)}</dd></div>
          <div><dt class="text-slate-500">Student No.</dt><dd class="font-medium text-slate-900 mt-0.5">${esc(u.studentNo)}</dd></div>
        </dl>

        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-sm min-w-[520px]">
            <thead class="bg-slate-50 text-left text-xs font-semibold text-slate-600">
              <tr><th scope="col" class="px-4 py-3">Document</th><th scope="col" class="px-4 py-3 text-center">No. of copies</th><th scope="col" class="px-4 py-3 text-right">Amount</th><th scope="col" class="px-4 py-3">Remarks</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${r.items.map(i => `<tr>
                <td class="px-4 py-3 font-medium text-slate-900">${esc(i.name)}</td>
                <td class="px-4 py-3 text-center">${i.copies}</td>
                <td class="px-4 py-3 text-right whitespace-nowrap">${i.assessed ? '<span class="text-slate-500">To be assessed</span>' : peso(i.amount)}</td>
                <td class="px-4 py-3 text-slate-600">${esc(i.remarks) || '&mdash;'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>

      </div>

      <div class="flex flex-wrap justify-end gap-3 px-6 sm:px-8 pb-6 sm:pb-8">
        ${r.status === 'submitted' ? `<button type="button" data-cancel="${r.id}" class="inline-flex items-center gap-2 rounded-full border border-rose-300 px-5 py-2.5 text-sm font-medium text-rose-800 hover:bg-rose-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">${ic('ban', 'w-4 h-4')} Cancel request</button>` : ''}
        <button type="button" data-close class="inline-flex items-center rounded-full bg-ess-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ess-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ess-600 focus-visible:ring-offset-2">Close</button>
      </div>
    </div>
  </div>`;
  document.body.classList.add('overflow-hidden');
  $('#modal-root [data-close]').focus();
}

/* =====================================================================
   Global events + router
   ===================================================================== */
document.addEventListener('click', e => {
  const open = e.target.closest('[data-open]');
  if (open) return openRequest(open.dataset.open);
  if (e.target.closest('[data-close]') || e.target.matches('[data-backdrop]')) return closeModal();
  const cancel = e.target.closest('[data-cancel]');
  if (cancel) {
    if (!confirm('Cancel this request? This cannot be undone.')) return;
    const r = state.requests.find(x => x.id === cancel.dataset.cancel);
    if (r && r.status === 'submitted') {
      r.status = 'cancelled';
      r.history.push({ status: 'cancelled', at: new Date().toISOString(), note: 'Cancelled by student.' });
      saveState(); toast(`Request ${r.id} cancelled.`);
      openRequest(r.id); route();
    }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal-root').firstChild) closeModal(); });

$('#logout').addEventListener('click', () => { if (confirm('Log out of the Registrar Online Processing System?')) location.replace(CONFIG.loginUrl); });

/* =====================================================================
   Site search (inline dropdown, no separate page)
   ===================================================================== */
const searchState = { items: [], active: -1 };
const norm = s => String(s || '').toLowerCase().trim();
const goTo = h => { if (location.hash === '#' + h) route(); else location.hash = '#' + h; };

const DOC_KEYS = {
  tor: ['tor'], cert: ['certificate'], auth: ['authenticate'],
  hd: ['dismissal'], cf: ['completion'], ic: ['informative', 'copy']
};
const NAV_ACTIONS = [
  { keys: ['dashboard', 'home'],                          label: 'Dashboard',   act: { type: 'go', hash: 'dashboard' } },
  { keys: ['new request', 'request', 'file'],             label: 'New Request', act: { type: 'go', hash: 'new' } },
  { keys: ['my requests', 'requests', 'track', 'status'], label: 'My Requests', act: { type: 'go', hash: 'requests' } },
  { keys: ['profile', 'account', 'edit profile'],         label: 'Profile',     act: { type: 'go', hash: 'profile' } },
  { keys: ['log out', 'logout', 'sign out'],              label: 'Log out',     act: { type: 'logout' } }
];
const HELP_KEYS = ['faq', 'faqs', 'help', 'how long', 'fee', 'fees', 'claim', 'contact', 'email',
                   'question', 'registrar', 'pay', 'payment', 'cashier'];

function helpItems() {
  const h = CONFIG.help;
  return [
    { icon: 'info', label: 'Read the FAQs', sub: 'Fees, processing time and claiming', act: { type: 'link', href: h.faqUrl } },
    { icon: 'mail', label: 'Email the Registrar', sub: h.registrarEmail,
      act: { type: 'link', href: `mailto:${h.registrarEmail}?subject=${encodeURIComponent('Registrar inquiry')}` } }
  ];
}

function closeSearch() {
  const box = $('#searchResults');
  box.classList.add('hidden'); box.innerHTML = '';
  searchState.items = []; searchState.active = -1;
}

function runSearch(raw) {
  const q = norm(raw);
  if (q.length < 2) return closeSearch();
  const words = q.split(/\s+/);
  const hit = keys => keys.some(k =>
    k.startsWith(q) || k.split(' ').some(w => w.startsWith(q)) ||
    (k.length >= 4 && q.includes(k)) || words.includes(k));
  const groups = [];

  // 1. The student's own requests
  const reqs = state.requests
    .filter(r => norm(`${r.id} ${itemsSummary(r)} ${STATUS[r.status].label} ${r.items.map(i => i.remarks).join(' ')}`).includes(q))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (reqs.length) {
    const items = reqs.slice(0, 4).map(r => ({
      icon: 'file', label: r.id, sub: `${itemsSummary(r)} · ${STATUS[r.status].label}`, act: { type: 'open', id: r.id }
    }));
    if (reqs.length > 4) items.push({ icon: 'inbox', label: `See all ${reqs.length} matching requests`, act: { type: 'requests', q: raw.trim() } });
    groups.push(['Your requests', items]);
  }

  // 2. Quick actions
  const acts = [];
  CONFIG.documents.forEach(d => {
    if (hit([norm(d.name), ...(DOC_KEYS[d.id] || [])]))
      acts.push({ icon: 'plus', label: `Request: ${d.name}`, sub: 'Opens New Request with it ticked', act: { type: 'doc', id: d.id } });
  });
  NAV_ACTIONS.forEach(n => { if (hit(n.keys)) acts.push({ icon: n.act.type === 'logout' ? 'x' : 'cap', label: n.label, act: n.act }); });
  if (acts.length) groups.push(['Quick actions', acts]);

  // 3. Help
  if (hit(HELP_KEYS)) groups.push(['Help', helpItems()]);

  // 4. No results
  let intro = '';
  if (!groups.length) {
    intro = `<p class="px-4 pt-4 pb-1 text-sm text-slate-600">No results for &ldquo;${esc(raw.trim())}&rdquo;. Need help? Try one of these:</p>`;
    groups.push(['Help', helpItems()]);
  }

  const flat = [];
  const box = $('#searchResults');
  box.innerHTML = intro + groups.map(([title, items]) => `
    <p class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">${title}</p>
    <ul class="pb-1">${items.map(it => {
      const i = flat.push(it) - 1;
      return `<li><button type="button" data-si="${i}" class="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-100 focus-visible:outline-none focus-visible:bg-slate-100">
        ${ic(it.icon, 'w-4 h-4 shrink-0 text-ess-700')}
        <span class="min-w-0"><span class="block text-sm font-medium text-slate-900 truncate">${esc(it.label)}</span>${it.sub ? `<span class="block text-xs text-slate-500 truncate">${esc(it.sub)}</span>` : ''}</span>
      </button></li>`;
    }).join('')}</ul>`).join('');
  box.classList.remove('hidden');
  searchState.items = flat; searchState.active = -1;
}

function moveActive(step) {
  const btns = $$('#searchResults [data-si]'); if (!btns.length) return;
  const n = btns.length;
  searchState.active = (searchState.active + step + n) % n;
  btns.forEach((b, i) => b.classList.toggle('bg-slate-100', i === searchState.active));
  btns[searchState.active].scrollIntoView({ block: 'nearest' });
}

function doAct(a) {
  closeSearch(); $('#siteQ').value = ''; $('#siteQ').blur();
  switch (a.type) {
    case 'open':   openRequest(a.id); break;
    case 'doc':    pendingDoc = a.id; goTo('new'); break;
    case 'go':     goTo(a.hash); break;
    case 'logout': $('#logout').click(); break;
    case 'link':   location.href = a.href; break;
    case 'requests': {
      const ql = norm(a.q);
      const st = Object.keys(STATUS).find(k => STATUS[k].label.toLowerCase().startsWith(ql));
      reqFilter = st || 'all'; reqQuery = st ? '' : a.q;
      goTo('requests'); break;
    }
  }
}

const siteQ = $('#siteQ');
siteQ.addEventListener('input', () => runSearch(siteQ.value));
siteQ.addEventListener('focus', () => runSearch(siteQ.value));
siteQ.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
  else if (e.key === 'Escape') closeSearch();
});
$('#siteSearch').addEventListener('submit', e => {
  e.preventDefault();
  if (!norm(siteQ.value)) { siteQ.focus(); return; }
  if (searchState.active >= 0) return doAct(searchState.items[searchState.active].act);
  runSearch(siteQ.value);
});
$('#searchResults').addEventListener('click', e => {
  const b = e.target.closest('[data-si]');
  if (b) doAct(searchState.items[+b.dataset.si].act);
});
document.addEventListener('click', e => { if (!e.target.closest('#siteSearch')) closeSearch(); });

function route() {
  const id = (location.hash || '#dashboard').slice(1);
  const active = ROUTES.some(r => r.id === id) ? id : 'dashboard';
  drawNav(active);
  ({ dashboard: viewDashboard, new: viewNew, requests: viewRequests, profile: viewProfile })[active]();
  applyLinks(main);
  if (!$('#modal-root').firstChild) window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', () => { closeModal(); route(); });

// Keep the Back button from leaving the dashboard (e.g. returning to the login page)
history.pushState(null, '', location.href);
window.addEventListener('popstate', () => {
  history.pushState(null, '', location.href);
  route();
});

hydrate();
applyLinks();
route();
})();
