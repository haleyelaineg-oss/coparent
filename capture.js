// ── QUICK CAPTURE + INBOX ─────────────────────────────────────────────────────
// Injects QC modal + Inbox page HTML, handles all quick-capture logic.

// ── STATE ─────────────────────────────────────────────────────────────────────
var qcActiveForm = '';
var qcMaryCat = '';
var qcMarySev = 0;
var qcBoysSelected = [];
var qcBoysMoods = {};
var qcMemKids = [];
var qcMemType = '';
var qcMemTypeName = '';
var qcHealthKid = '';
var qcHealthSymptoms = [];
var inboxEntries = [];
var inboxFilter = 'all';

// ── ICONS ─────────────────────────────────────────────────────────────────────
var QC_ICONS = {
  swap:    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px;height:22px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>',
  smile:   '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px;height:22px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"/></svg>',
  heart:   '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px;height:22px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>',
  pencil:  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px;height:22px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>',
  medical: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px;height:22px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>',
  list:    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px;height:22px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>',
  back:    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>',
  xmark:   '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>',
  expand:  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:13px;height:13px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/></svg>',
};

// ── INJECT HTML ON LOAD ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.main').insertAdjacentHTML('beforeend', buildInboxPageHTML());
  document.getElementById('screen-app').insertAdjacentHTML('beforeend', buildQCModalHTML());
});

// ── PAGE HTML ─────────────────────────────────────────────────────────────────
function buildInboxPageHTML() {
  return [
    '<div class="pg" id="pg-inbox">',
    '<h1 class="pg-title">Inbox</h1>',
    '<p class="pg-sub">Quick-captured entries — review, expand, or archive.</p>',
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1.1rem;" id="inbox-filters">',
    '  <button class="fpill active" id="ibf-all" onclick="setInboxFilter(\'all\',this)">All</button>',
    '  <button class="fpill" id="ibf-kids" onclick="setInboxFilter(\'kids\',this)">Boys</button>',
    '  <button class="fpill" id="ibf-mary" onclick="setInboxFilter(\'mary\',this)">Mary</button>',
    '  <button class="fpill" id="ibf-memories" onclick="setInboxFilter(\'memories\',this)">Memories</button>',
    '  <button class="fpill" id="ibf-note" onclick="setInboxFilter(\'note\',this)">Notes</button>',
    '</div>',
    '<div id="inbox-list"></div>',
    '</div>',
  ].join('');
}

// ── MODAL HTML ────────────────────────────────────────────────────────────────
function buildQCModalHTML() {
  var memCat = (ENTRY_CATEGORIES || []).find(function (c) { return c.id === 'memories'; });
  var memTypes = memCat ? memCat.types : [];

  var memTypeChips = memTypes.map(function (t) {
    return '<div class="kchip" id="qcmt-' + t.id + '" onclick="setQCMemType(\'' + t.id + '\',\'' + t.name.replace(/'/g, "\\'") + '\',this)">' + t.name + '</div>';
  }).join('');

  var healthKidChips = (KIDS || []).map(function (k) {
    return '<div class="kchip" id="qchk-' + k + '" onclick="setQCHealthKid(\'' + k + '\',this)">' + k + '</div>';
  }).join('');

  var healthSymChips = (HEALTH_SYMPTOMS || []).filter(function (s) { return s !== 'Other'; }).map(function (s) {
    var sid = 'qchs-' + s.replace(/\W+/g, '');
    return '<div class="kchip" id="' + sid + '" onclick="toggleQCSymptom(\'' + s.replace(/'/g, "\\'") + '\',this)">' + s + '</div>';
  }).join('');

  return [
    '<div class="cf-overlay" id="qc-overlay" onclick="closeQCOverlay(event)">',
    '<div class="cf-modal" onclick="event.stopPropagation()" style="max-width:520px;">',

    // ── Header
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">',
    '  <div style="display:flex;align-items:center;gap:10px;">',
    '    <button id="qc-back-btn" onclick="backToQCHub()" style="display:none;background:none;border:none;cursor:pointer;color:var(--text2);padding:2px;line-height:1;">' + QC_ICONS.back + '</button>',
    '    <div class="ct" style="margin:0;" id="qc-title">Quick Capture</div>',
    '  </div>',
    '  <button onclick="closeQC()" style="background:none;border:none;cursor:pointer;color:var(--text3);padding:2px;line-height:1;">' + QC_ICONS.xmark + '</button>',
    '</div>',

    // ── Hub: 6 tiles
    '<div id="qc-hub">',
    '<div class="qc-grid">',
    qcTile('mary',    QC_ICONS.swap,    'Mary Interaction',  'Communication or co-parenting moment'),
    qcTile('boys',    QC_ICONS.smile,   'Boys Check-In',     'Quick mood + notes per kid'),
    qcTile('memory',  QC_ICONS.heart,   'Positive Moment',   'Memory, milestone, proud moment'),
    qcTile('note',    QC_ICONS.pencil,  'Note to Self',      'Quick note or reminder'),
    qcTile('health',  QC_ICONS.medical, 'Health Record',     'Track illness or injury'),
    qcTile('grocery', QC_ICONS.list,    'Grocery Item',      'Add to the grocery list'),
    '</div>',
    '</div>',

    // ── Mary form
    '<div id="qc-form-mary" class="qc-form" style="display:none;">',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Category</label>',
    '    <div class="source-row" style="margin-top:6px;" id="qc-mary-cats">',
    '      <div class="kchip" id="qcmc-coparenting" onclick="setQCMaryCat(\'coparenting\',this)">Co-Parenting Concern</div>',
    '      <div class="kchip" id="qcmc-parenting" onclick="setQCMaryCat(\'parenting\',this)">Parenting Concern</div>',
    '      <div class="kchip" id="qcmc-coparenting-positive" onclick="setQCMaryCat(\'coparenting-positive\',this)">Positive</div>',
    '    </div>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">How\'d it go?</label>',
    '    <div class="sev-track" style="margin-top:6px;" id="qc-mary-sev">',
    '      <button class="sev-btn" onclick="setQCMarySev(5,this)">Pleasant</button>',
    '      <button class="sev-btn" onclick="setQCMarySev(4,this)">Okay</button>',
    '      <button class="sev-btn" onclick="setQCMarySev(3,this)">Tense</button>',
    '      <button class="sev-btn" onclick="setQCMarySev(2,this)">Difficult</button>',
    '      <button class="sev-btn" onclick="setQCMarySev(1,this)">Distressing</button>',
    '    </div>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">What happened? <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <textarea id="qc-mary-facts" style="margin-top:6px;min-height:70px;" placeholder="Brief, objective description..."></textarea>',
    '  </div>',
    '  <div id="qc-mary-msg" style="font-size:13px;min-height:18px;margin-bottom:4px;"></div>',
    '  <div class="btn-row">',
    '    <button class="btn" onclick="backToQCHub()">Cancel</button>',
    '    <button class="btn btn-p" onclick="saveQCMary()">Save to Inbox</button>',
    '  </div>',
    '</div>',

    // ── Boys form
    '<div id="qc-form-boys" class="qc-form" style="display:none;">',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Who\'s home?</label>',
    '    <div class="source-row" style="margin-top:6px;" id="qc-boys-kids"></div>',
    '  </div>',
    '  <div id="qc-boys-moods"></div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Notes <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <textarea id="qc-boys-notes" style="margin-top:6px;min-height:60px;" placeholder="Anything worth noting..."></textarea>',
    '  </div>',
    '  <div id="qc-boys-msg" style="font-size:13px;min-height:18px;margin-bottom:4px;"></div>',
    '  <div class="btn-row">',
    '    <button class="btn" onclick="backToQCHub()">Cancel</button>',
    '    <button class="btn btn-p" onclick="saveQCBoys()">Save to Inbox</button>',
    '  </div>',
    '</div>',

    // ── Memory form
    '<div id="qc-form-memory" class="qc-form" style="display:none;">',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Who\'s it about? <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <div class="source-row" style="margin-top:6px;" id="qc-mem-kids"></div>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Type <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <div class="source-row" style="margin-top:6px;flex-wrap:wrap;" id="qc-mem-types">' + memTypeChips + '</div>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">What happened?</label>',
    '    <textarea id="qc-mem-facts" style="margin-top:6px;min-height:70px;" placeholder="Describe the moment..."></textarea>',
    '  </div>',
    '  <div id="qc-mem-msg" style="font-size:13px;min-height:18px;margin-bottom:4px;"></div>',
    '  <div class="btn-row">',
    '    <button class="btn" onclick="backToQCHub()">Cancel</button>',
    '    <button class="btn btn-p" onclick="saveQCMemory()">Save to Inbox</button>',
    '  </div>',
    '</div>',

    // ── Note form
    '<div id="qc-form-note" class="qc-form" style="display:none;">',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Note</label>',
    '    <textarea id="qc-note-text" style="margin-top:6px;min-height:100px;" placeholder="Write anything — reminders, observations, things to follow up on..."></textarea>',
    '  </div>',
    '  <div id="qc-note-msg" style="font-size:13px;min-height:18px;margin-bottom:4px;"></div>',
    '  <div class="btn-row">',
    '    <button class="btn" onclick="backToQCHub()">Cancel</button>',
    '    <button class="btn btn-p" onclick="saveQCNote()">Save to Inbox</button>',
    '  </div>',
    '</div>',

    // ── Health form
    '<div id="qc-form-health" class="qc-form" style="display:none;">',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Which kid?</label>',
    '    <div class="source-row" style="margin-top:6px;" id="qc-health-kids">' + healthKidChips + '</div>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Symptoms <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <div class="source-row" style="margin-top:6px;flex-wrap:wrap;" id="qc-health-syms">' + healthSymChips + '</div>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Notes <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <textarea id="qc-health-notes" style="margin-top:6px;min-height:60px;" placeholder="Temp, meds given, anything else..."></textarea>',
    '  </div>',
    '  <div id="qc-health-msg" style="font-size:13px;min-height:18px;margin-bottom:4px;"></div>',
    '  <div class="btn-row">',
    '    <button class="btn" onclick="backToQCHub()">Cancel</button>',
    '    <button class="btn btn-p" onclick="saveQCHealth()">Save</button>',
    '  </div>',
    '</div>',

    // ── Grocery form
    '<div id="qc-form-grocery" class="qc-form" style="display:none;">',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Item</label>',
    '    <input type="text" id="qc-grocery-name" style="margin-top:6px;" placeholder="e.g. Milk">',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">Quantity <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <input type="text" id="qc-grocery-qty" style="margin-top:6px;" placeholder="e.g. 1 gallon">',
    '  </div>',
    '  <div id="qc-grocery-msg" style="font-size:13px;min-height:18px;margin-bottom:4px;"></div>',
    '  <div class="btn-row">',
    '    <button class="btn" onclick="backToQCHub()">Cancel</button>',
    '    <button class="btn btn-p" onclick="saveQCGrocery()">Add to List</button>',
    '  </div>',
    '</div>',

    '</div></div>', // .cf-modal / .cf-overlay
  ].join('');
}

function qcTile(id, icon, label, sub) {
  return '<button class="qc-tile" onclick="showQCForm(\'' + id + '\')">' +
    '<div class="qc-tile-icon">' + icon + '</div>' +
    '<div class="qc-tile-label">' + label + '</div>' +
    '<div class="qc-tile-sub">' + sub + '</div>' +
    '</button>';
}

// ── OPEN / CLOSE / NAV ────────────────────────────────────────────────────────
function openQuickCapture() {
  backToQCHub();
  document.getElementById('qc-overlay').classList.add('open');
}

function closeQC() {
  document.getElementById('qc-overlay').classList.remove('open');
}

function closeQCOverlay(e) {
  if (e.target === document.getElementById('qc-overlay')) closeQC();
}

function backToQCHub() {
  qcActiveForm = '';
  document.querySelectorAll('.qc-form').forEach(function (f) { f.style.display = 'none'; });
  document.getElementById('qc-hub').style.display = '';
  document.getElementById('qc-title').textContent = 'Quick Capture';
  document.getElementById('qc-back-btn').style.display = 'none';
}

var QC_TITLES = {
  mary: 'Mary Interaction', boys: 'Boys Check-In', memory: 'Positive Moment',
  note: 'Note to Self', health: 'Health Record', grocery: 'Grocery Item',
};

function showQCForm(id) {
  qcActiveForm = id;
  document.getElementById('qc-hub').style.display = 'none';
  document.querySelectorAll('.qc-form').forEach(function (f) { f.style.display = 'none'; });
  document.getElementById('qc-form-' + id).style.display = '';
  document.getElementById('qc-title').textContent = QC_TITLES[id] || 'Quick Capture';
  document.getElementById('qc-back-btn').style.display = 'flex';

  if (id === 'mary') resetQCMary();
  if (id === 'boys') initQCBoysForm();
  if (id === 'memory') initQCMemoryForm();
  if (id === 'note') { document.getElementById('qc-note-text').value = ''; setQCMsg('note', ''); }
  if (id === 'health') resetQCHealth();
  if (id === 'grocery') {
    document.getElementById('qc-grocery-name').value = '';
    document.getElementById('qc-grocery-qty').value = '';
    setQCMsg('grocery', '');
  }
}

function setQCMsg(form, text, isErr) {
  var el = document.getElementById('qc-' + form + '-msg');
  if (!el) return;
  el.textContent = text;
  el.style.color = isErr ? 'var(--danger)' : 'var(--sage)';
}

// ── MARY FORM ─────────────────────────────────────────────────────────────────
function resetQCMary() {
  qcMaryCat = ''; qcMarySev = 0;
  document.querySelectorAll('#qc-mary-cats .kchip').forEach(function (c) { c.classList.remove('on'); });
  document.querySelectorAll('#qc-mary-sev .sev-btn').forEach(function (b) { b.className = 'sev-btn'; });
  document.getElementById('qc-mary-facts').value = '';
  setQCMsg('mary', '');
}

function setQCMaryCat(cat, el) {
  qcMaryCat = cat;
  document.querySelectorAll('#qc-mary-cats .kchip').forEach(function (c) { c.classList.remove('on'); });
  el.classList.add('on');
}

function setQCMarySev(v, btn) {
  qcMarySev = v;
  document.querySelectorAll('#qc-mary-sev .sev-btn').forEach(function (b) { b.className = 'sev-btn'; });
  // Map: 5=pleasant(green), 4=okay(amber), 3=tense(pink), 2=difficult(rose), 1=distressing(red)
  var cls = ['', 'on-5', 'on-4', 'on-3', 'on-2', 'on-1'][v] || '';
  btn.classList.add(cls);
}

async function saveQCMary() {
  if (!qcMaryCat) { setQCMsg('mary', 'Please select a category.', true); return; }
  setQCMsg('mary', '');
  var facts = document.getElementById('qc-mary-facts').value.trim();
  var entry = {
    entry_date: new Date().toISOString(),
    entry_type: 'quick-capture',
    category: qcMaryCat,
    logger: ls('logger') || 'Haley',
    people: ['Mary'],
    facts: facts || null,
    severity: qcMarySev || null,
  };
  var { error } = await sb.from('entries').insert(entry);
  if (error) { setQCMsg('mary', 'Save failed: ' + error.message, true); return; }
  setQCMsg('mary', 'Saved!');
  await updateInboxBadge();
  setTimeout(backToQCHub, 800);
}

// ── BOYS FORM ─────────────────────────────────────────────────────────────────
function initQCBoysForm() {
  qcBoysSelected = KIDS.slice();
  qcBoysMoods = {};
  document.getElementById('qc-boys-kids').innerHTML = KIDS.map(function (k) {
    return '<div class="kchip on" id="qcbk-' + k + '" onclick="toggleQCBoyKid(\'' + k + '\',this)">' + k + '</div>';
  }).join('');
  document.getElementById('qc-boys-notes').value = '';
  setQCMsg('boys', '');
  renderQCBoysMoods();
}

function toggleQCBoyKid(kid, el) {
  el.classList.toggle('on');
  if (qcBoysSelected.includes(kid)) {
    qcBoysSelected = qcBoysSelected.filter(function (k) { return k !== kid; });
    delete qcBoysMoods[kid];
  } else {
    qcBoysSelected.push(kid);
  }
  renderQCBoysMoods();
}

function renderQCBoysMoods() {
  var el = document.getElementById('qc-boys-moods');
  if (!qcBoysSelected.length) { el.innerHTML = ''; return; }
  el.innerHTML = qcBoysSelected.map(function (kid) {
    var btns = MOODS.map(function (m) {
      var on = qcBoysMoods[kid] === m.label;
      return '<button onclick="setQCBoyMood(\'' + kid + '\',\'' + m.label + '\')" title="' + m.label + '"' +
        ' style="font-size:18px;padding:5px 7px;border:1px solid ' + (on ? 'var(--accent)' : 'var(--border)') + ';' +
        'border-radius:8px;background:' + (on ? 'var(--accent-l)' : 'var(--surface)') + ';cursor:pointer;">' + m.emoji + '</button>';
    }).join('');
    return '<div class="fg1" style="margin-bottom:10px;"><label class="fgl">' + kid + '</label>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;">' + btns + '</div></div>';
  }).join('');
}

function setQCBoyMood(kid, mood) {
  qcBoysMoods[kid] = qcBoysMoods[kid] === mood ? undefined : mood;
  if (!qcBoysMoods[kid]) delete qcBoysMoods[kid];
  renderQCBoysMoods();
}

async function saveQCBoys() {
  if (!qcBoysSelected.length) { setQCMsg('boys', 'Please select at least one kid.', true); return; }
  setQCMsg('boys', '');
  var notes = document.getElementById('qc-boys-notes').value.trim();
  var entry = {
    entry_date: new Date().toISOString(),
    entry_type: 'quick-capture',
    category: 'kids',
    logger: ls('logger') || 'Haley',
    people: qcBoysSelected,
    moods: Object.keys(qcBoysMoods).length ? qcBoysMoods : null,
    facts: notes || null,
  };
  var { error } = await sb.from('entries').insert(entry);
  if (error) { setQCMsg('boys', 'Save failed: ' + error.message, true); return; }
  setQCMsg('boys', 'Saved!');
  await updateInboxBadge();
  setTimeout(backToQCHub, 800);
}

// ── MEMORY FORM ───────────────────────────────────────────────────────────────
function initQCMemoryForm() {
  qcMemKids = []; qcMemType = ''; qcMemTypeName = '';
  document.getElementById('qc-mem-kids').innerHTML = KIDS.map(function (k) {
    return '<div class="kchip" id="qcmk-' + k + '" onclick="toggleQCMemKid(\'' + k + '\',this)">' + k + '</div>';
  }).join('');
  document.querySelectorAll('#qc-mem-types .kchip').forEach(function (c) { c.classList.remove('on'); });
  document.getElementById('qc-mem-facts').value = '';
  setQCMsg('mem', '');
}

function toggleQCMemKid(kid, el) {
  el.classList.toggle('on');
  if (qcMemKids.includes(kid)) { qcMemKids = qcMemKids.filter(function (k) { return k !== kid; }); }
  else { qcMemKids.push(kid); }
}

function setQCMemType(typeId, typeName, el) {
  qcMemType = typeId; qcMemTypeName = typeName;
  document.querySelectorAll('#qc-mem-types .kchip').forEach(function (c) { c.classList.remove('on'); });
  el.classList.add('on');
}

async function saveQCMemory() {
  var facts = document.getElementById('qc-mem-facts').value.trim();
  if (!facts) { setQCMsg('mem', 'Please describe what happened.', true); return; }
  setQCMsg('mem', '');
  var entry = {
    entry_date: new Date().toISOString(),
    entry_type: 'quick-capture',
    category: 'memories',
    entry_subtype: qcMemType || null,
    entry_subtype_name: qcMemTypeName || null,
    logger: ls('logger') || 'Haley',
    people: qcMemKids.length ? qcMemKids : null,
    facts: facts,
    severity: 5,
  };
  var { error } = await sb.from('entries').insert(entry);
  if (error) { setQCMsg('mem', 'Save failed: ' + error.message, true); return; }
  setQCMsg('mem', 'Saved!');
  await updateInboxBadge();
  setTimeout(backToQCHub, 800);
}

// ── NOTE FORM ─────────────────────────────────────────────────────────────────
async function saveQCNote() {
  var text = document.getElementById('qc-note-text').value.trim();
  if (!text) { setQCMsg('note', 'Please write something.', true); return; }
  setQCMsg('note', '');
  var entry = {
    entry_date: new Date().toISOString(),
    entry_type: 'quick-capture',
    category: 'note',
    logger: ls('logger') || 'Haley',
    facts: text,
  };
  var { error } = await sb.from('entries').insert(entry);
  if (error) { setQCMsg('note', 'Save failed: ' + error.message, true); return; }
  setQCMsg('note', 'Saved!');
  await updateInboxBadge();
  setTimeout(backToQCHub, 800);
}

// ── HEALTH FORM ───────────────────────────────────────────────────────────────
function resetQCHealth() {
  qcHealthKid = ''; qcHealthSymptoms = [];
  document.querySelectorAll('#qc-health-kids .kchip').forEach(function (c) { c.classList.remove('on'); });
  document.querySelectorAll('#qc-health-syms .kchip').forEach(function (c) { c.classList.remove('on'); });
  document.getElementById('qc-health-notes').value = '';
  setQCMsg('health', '');
}

function setQCHealthKid(kid, el) {
  qcHealthKid = kid;
  document.querySelectorAll('#qc-health-kids .kchip').forEach(function (c) { c.classList.remove('on'); });
  el.classList.add('on');
}

function toggleQCSymptom(sym, el) {
  el.classList.toggle('on');
  if (qcHealthSymptoms.includes(sym)) { qcHealthSymptoms = qcHealthSymptoms.filter(function (s) { return s !== sym; }); }
  else { qcHealthSymptoms.push(sym); }
}

async function saveQCHealth() {
  if (!qcHealthKid) { setQCMsg('health', 'Please select a kid.', true); return; }
  var notes = document.getElementById('qc-health-notes').value.trim();
  if (!qcHealthSymptoms.length && !notes) { setQCMsg('health', 'Please add symptoms or notes.', true); return; }
  setQCMsg('health', '');
  var { error } = await sb.from('health_log').insert({
    kid: qcHealthKid,
    logged_by: ls('logger') || 'Haley',
    started_date: new Date().toISOString().slice(0, 10),
    symptoms: qcHealthSymptoms.map(function (s) { return { name: s }; }),
    notes: notes || null,
    status: 'active',
  });
  if (error) { setQCMsg('health', 'Save failed: ' + error.message, true); return; }
  setQCMsg('health', 'Saved!');
  setTimeout(closeQC, 800);
}

// ── GROCERY FORM ──────────────────────────────────────────────────────────────
async function saveQCGrocery() {
  var name = document.getElementById('qc-grocery-name').value.trim();
  if (!name) { setQCMsg('grocery', 'Please enter an item name.', true); return; }
  setQCMsg('grocery', '');
  var qty = document.getElementById('qc-grocery-qty').value.trim();
  var { error } = await sb.from('grocery_list').insert({ name: name, quantity: qty || null, checked: false });
  if (error) { setQCMsg('grocery', 'Save failed: ' + error.message, true); return; }
  setQCMsg('grocery', 'Added to grocery list!');
  setTimeout(backToQCHub, 800);
}

// ── INBOX ─────────────────────────────────────────────────────────────────────
async function initInbox() {
  document.getElementById('inbox-list').innerHTML = '<div class="empty" style="color:var(--text3);font-size:13px;">Loading...</div>';
  await loadInboxEntries();
  renderInbox();
}

async function loadInboxEntries() {
  var { data, error } = await sb.from('entries').select('*')
    .eq('entry_type', 'quick-capture')
    .order('entry_date', { ascending: false });
  if (!error && data) inboxEntries = data;
}

function setInboxFilter(filter, btn) {
  inboxFilter = filter;
  document.querySelectorAll('#inbox-filters .fpill').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderInbox();
}

var CAT_LABEL = {
  kids: 'Boys', parenting: 'Parenting', coparenting: 'Co-Parenting Concern',
  'coparenting-positive': 'Co-Parenting +', memories: 'Memory', note: 'Note',
};
var CAT_CLASS = {
  kids: 'b-kids', parenting: 'b-parenting', coparenting: 'b-coparenting',
  'coparenting-positive': 'b-memories', memories: 'b-memories', note: 'b-source',
};

function renderInbox() {
  var el = document.getElementById('inbox-list');
  if (!el) return;

  var filtered = inboxEntries.filter(function (e) {
    if (inboxFilter === 'all') return true;
    if (inboxFilter === 'mary') return e.category === 'coparenting' || e.category === 'coparenting-positive' || e.category === 'parenting';
    return e.category === inboxFilter;
  });

  if (!filtered.length) {
    el.innerHTML = '<div class="empty">No entries here yet.</div>';
    return;
  }

  el.innerHTML = filtered.map(function (entry) {
    var catLabel = CAT_LABEL[entry.category] || entry.category;
    var catCls = CAT_CLASS[entry.category] || 'b-source';
    var date = entry.entry_date
      ? new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : '';
    var people = Array.isArray(entry.people) && entry.people.length ? entry.people.join(', ') : '';
    var moodsHtml = '';
    if (entry.moods && typeof entry.moods === 'object' && Object.keys(entry.moods).length) {
      var pairs = Object.entries(entry.moods).map(function (kv) {
        var m = (MOODS || []).find(function (mo) { return mo.label === kv[1]; });
        return (m ? m.emoji + ' ' : '') + kv[0] + ': ' + kv[1];
      });
      moodsHtml = '<div style="font-size:12px;color:var(--text3);margin-top:5px;">' + pairs.join(' · ') + '</div>';
    }
    var subBadge = entry.entry_subtype_name
      ? '<span class="bdg b-tag" style="margin-left:2px;">' + entry.entry_subtype_name + '</span>' : '';
    var peopleBadge = people
      ? '<span style="font-size:12px;color:var(--text3);margin-left:4px;">' + people + '</span>' : '';
    var factsHtml = entry.facts
      ? '<div style="margin-top:7px;font-size:14px;color:var(--text);line-height:1.55;">' + entry.facts + '</div>' : '';

    return '<div class="ecard" style="margin-bottom:9px;">' +
      '<div class="ehdr">' +
        '<div class="badges">' +
          '<span class="bdg ' + catCls + '">' + catLabel + '</span>' +
          subBadge + peopleBadge +
        '</div>' +
        '<div class="edate-wrap">' +
          '<span class="edate">' + date + '</span>' +
          '<span class="edate-logged">' + (entry.logger || '') + '</span>' +
        '</div>' +
      '</div>' +
      factsHtml + moodsHtml +
      '<div style="display:flex;gap:8px;margin-top:10px;">' +
        '<button class="btn btn-sm" onclick="expandInboxEntry(\'' + entry.id + '\')" style="display:flex;align-items:center;gap:5px;">' +
          QC_ICONS.expand + 'Expand to full entry' +
        '</button>' +
        '<button class="btn btn-sm" onclick="archiveInboxEntry(\'' + entry.id + '\')" style="color:var(--text3);">Archive</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

async function archiveInboxEntry(id) {
  var { error } = await sb.from('entries').update({ entry_type: 'archived' }).eq('id', id);
  if (!error) {
    inboxEntries = inboxEntries.filter(function (e) { return e.id !== id; });
    renderInbox();
    updateInboxBadge();
  }
}

function expandInboxEntry(id) {
  var entry = inboxEntries.find(function (e) { return e.id === id; });
  if (!entry) return;

  // Store id so saveEntry can archive after save
  window.promotingFromQCId = id;

  // Navigate to appropriate full-entry page
  nav('capture', null);

  // Pre-fill after DOM settles
  setTimeout(function () {
    // Select the category
    if (entry.category && document.getElementById('catbtn-' + entry.category)) {
      selectCategory(entry.category);
    }
    // Fill facts
    var factsEl = document.getElementById('cap-facts');
    if (factsEl && entry.facts) factsEl.value = entry.facts;
  }, 150);
}

async function updateInboxBadge() {
  var { count } = await sb.from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('entry_type', 'quick-capture');
  var badge = document.getElementById('inbox-badge');
  if (badge) {
    badge.textContent = count || '';
    badge.style.display = count ? '' : 'none';
  }
}
