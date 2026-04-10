// ── REMINDERS PAGE ────────────────────────────────────────────────────────────
// Injects pg-reminders HTML + handles all reminders logic.

// ── STATE ─────────────────────────────────────────────────────────────────────
var remAllItems      = [];
var remLists         = [];   // loaded from reminder_lists table
var remListFilter    = 'all';
var remForFilter     = 'all';
var remShowCompleted = false;
var remEditId        = null;
var remNewFor        = '';
var remNewList       = '';

// ── INJECT HTML ON LOAD ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.main').insertAdjacentHTML('beforeend', buildRemindersPageHTML());
  document.getElementById('screen-app').insertAdjacentHTML('beforeend', buildManageListsModalHTML());
});

// ── PAGE HTML ─────────────────────────────────────────────────────────────────
function buildRemindersPageHTML() {
  var forTabs = ['all'].concat(REMINDER_FOR || []);
  var forTabHTML = forTabs.map(function(f, i) {
    var label = f === 'all' ? 'Everyone' : f;
    return '<button class="fpill' + (i===0?' active':'') + '" onclick="setRemForFilter(\'' + f + '\',this)">' + label + '</button>';
  }).join('');

  var forChips = (REMINDER_FOR || []).map(function(w) {
    return '<div class="kchip" id="remnf-'+w+'" onclick="setRemNewFor(\''+w+'\',this)">'+w+'</div>';
  }).join('');

  return [
    '<div class="pg" id="pg-reminders">',
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.25rem;">',
    '  <div>',
    '    <h1 class="pg-title" style="margin-bottom:.15rem;">Reminders</h1>',
    '    <p class="pg-sub" style="margin:0;">Lists, to-dos, and things to remember.</p>',
    '  </div>',
    '  <button class="btn btn-sm" style="margin-top:.4rem;white-space:nowrap;" onclick="openManageListsModal()">⚙ Manage Lists</button>',
    '</div>',

    // ── Add reminder form
    '<div class="card" style="margin:1.1rem 0 1.25rem;" id="rem-add-card">',
    '  <div class="ct" style="font-size:15px;margin-bottom:.75rem;">Add Reminder</div>',
    '  <div class="fg1" style="margin-bottom:10px;">',
    '    <textarea id="rem-new-text" style="min-height:60px;" placeholder="What do you want to remember?"></textarea>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:10px;">',
    '    <label class="fgl">For <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <div class="source-row" style="margin-top:6px;" id="rem-new-for">' + forChips + '</div>',
    '  </div>',
    '  <div class="fg1" style="margin-bottom:12px;">',
    '    <label class="fgl">List <span style="font-weight:400;color:var(--text3);font-size:11px;">(optional)</span></label>',
    '    <div class="source-row" style="margin-top:6px;flex-wrap:wrap;" id="rem-new-list"></div>',
    '  </div>',
    '  <div id="rem-add-msg" style="font-size:13px;min-height:16px;margin-bottom:6px;"></div>',
    '  <button class="btn btn-p" onclick="saveReminder()">Add Reminder</button>',
    '</div>',

    // ── List filter tabs (rendered dynamically)
    '<div style="margin-bottom:.6rem;">',
    '  <div style="font-size:11px;color:var(--text3);margin-bottom:4px;font-weight:600;letter-spacing:.04em;">LIST</div>',
    '  <div style="display:flex;gap:6px;flex-wrap:wrap;" id="rem-list-tabs"></div>',
    '</div>',
    // ── For filter tabs
    '<div style="margin-bottom:1.1rem;">',
    '  <div style="font-size:11px;color:var(--text3);margin-bottom:4px;font-weight:600;letter-spacing:.04em;">FOR</div>',
    '  <div style="display:flex;gap:6px;flex-wrap:wrap;" id="rem-for-tabs">' + forTabHTML + '</div>',
    '</div>',

    // ── List
    '<div id="rem-list"></div>',

    // ── Completed section
    '<div id="rem-completed-section" style="margin-top:1.5rem;display:none;">',
    '  <button onclick="toggleRemCompleted()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:13px;display:flex;align-items:center;gap:5px;font-family:Jost,sans-serif;padding:0;margin-bottom:.6rem;">',
    '    <span id="rem-completed-arrow">▶</span> <span id="rem-completed-label">Show completed</span>',
    '  </button>',
    '  <div id="rem-completed-list" style="display:none;"></div>',
    '</div>',

    '</div>',
  ].join('');
}

// ── MANAGE LISTS MODAL HTML ────────────────────────────────────────────────────
function buildManageListsModalHTML() {
  return [
    '<div class="cf-overlay" id="ml-overlay" onclick="closeMLOverlay(event)">',
    '<div class="cf-modal" onclick="event.stopPropagation()" style="max-width:420px;">',
    '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem;">',
    '    <div class="ct" style="margin:0;">Manage Lists</div>',
    '    <button onclick="closeManageListsModal()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:20px;line-height:1;padding:0;">×</button>',
    '  </div>',
    '  <div id="ml-list" style="margin-bottom:1rem;display:flex;flex-direction:column;gap:6px;"></div>',
    '  <div style="display:flex;gap:8px;align-items:center;">',
    '    <input type="text" id="ml-new-name" placeholder="New list name..." style="flex:1;" onkeydown="if(event.key===\'Enter\')addReminderList()">',
    '    <button class="btn btn-p" onclick="addReminderList()">Add</button>',
    '  </div>',
    '  <div id="ml-msg" style="font-size:13px;min-height:16px;margin-top:6px;"></div>',
    '</div>',
    '</div>',
  ].join('');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function initRemindersPage() {
  remListFilter = 'all'; remForFilter = 'all'; remShowCompleted = false;
  remNewFor = ''; remNewList = '';
  var ta = document.getElementById('rem-new-text');
  if (ta) ta.value = '';
  document.querySelectorAll('#rem-new-for .kchip').forEach(function(c){ c.classList.remove('on'); });
  setRemMsg('');
  document.querySelectorAll('#rem-for-tabs .fpill').forEach(function(b,i){ b.classList.toggle('active', i===0); });

  await loadReminderLists();
  await loadReminders();
}

// ── LOAD LISTS FROM SUPABASE ──────────────────────────────────────────────────
async function loadReminderLists() {
  var { data } = await sb.from('reminder_lists').select('*').order('sort_order').order('name');
  if (data && data.length) {
    remLists = data;
  } else {
    // Fall back to config defaults (in case table not yet seeded)
    remLists = (REMINDER_LISTS || []).map(function(name, i){ return { id: null, name: name, sort_order: i }; });
  }
  renderRemListTabs();
  renderRemAddListChips();
}

function renderRemListTabs() {
  var el = document.getElementById('rem-list-tabs');
  if (!el) return;
  var allBtn = '<button class="fpill' + (remListFilter==='all'?' active':'') + '" onclick="setRemListFilter(\'all\',this)">All</button>';
  var listBtns = remLists.map(function(l) {
    var active = remListFilter === l.name ? ' active' : '';
    return '<button class="fpill' + active + '" onclick="setRemListFilter(\'' + escAttr(l.name) + '\',this)">' + escHtml(l.name) + '</button>';
  }).join('');
  el.innerHTML = allBtn + listBtns;
}

function renderRemAddListChips() {
  var el = document.getElementById('rem-new-list');
  if (!el) return;
  el.innerHTML = remLists.map(function(l) {
    var on = remNewList === l.name ? ' on' : '';
    return '<div class="kchip' + on + '" onclick="setRemNewList(\'' + escAttr(l.name) + '\',this)">' + escHtml(l.name) + '</div>';
  }).join('');
}

// ── LOAD & RENDER REMINDERS ───────────────────────────────────────────────────
async function loadReminders() {
  var { data, error } = await sb.from('reminders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('reminders load:', error); return; }
  remAllItems = data || [];
  renderReminders();
}

function renderReminders() {
  var active    = remAllItems.filter(function(r){ return !r.completed && remMatches(r); });
  var completed = remAllItems.filter(function(r){ return r.completed  && remMatches(r); });

  var listEl = document.getElementById('rem-list');
  if (listEl) listEl.innerHTML = active.length
    ? active.map(remCard).join('')
    : '<p style="color:var(--text3);font-size:14px;">Nothing here yet.</p>';

  var compEl = document.getElementById('rem-completed-list');
  if (compEl) compEl.innerHTML = completed.length
    ? completed.map(remCard).join('')
    : '<p style="color:var(--text3);font-size:14px;">No completed items.</p>';

  var secEl = document.getElementById('rem-completed-section');
  if (secEl) secEl.style.display = completed.length ? '' : 'none';

  var labelEl = document.getElementById('rem-completed-label');
  if (labelEl) labelEl.textContent = (remShowCompleted ? 'Hide' : 'Show') + ' completed (' + completed.length + ')';
}

function remMatches(r) {
  if (remListFilter !== 'all' && r.list_type !== remListFilter) return false;
  if (remForFilter  !== 'all' && r.for_who  !== remForFilter)  return false;
  return true;
}

function remCard(r) {
  var badge = '';
  if (r.list_type) badge += '<span class="rem-badge">' + escHtml(r.list_type) + '</span>';
  if (r.for_who)   badge += '<span class="rem-badge rem-badge-who">' + escHtml(r.for_who) + '</span>';
  var addedBy = r.added_by ? '<span style="color:var(--text3);font-size:11px;">by ' + escHtml(r.added_by) + '</span>' : '';
  var date = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';

  if (remEditId === r.id) {
    var forChips = (REMINDER_FOR || []).map(function(w){
      return '<div class="kchip'+(r.for_who===w?' on':'')+'" onclick="remEditSetFor(\''+r.id+'\',\''+w+'\',this)">'+w+'</div>';
    }).join('');
    var listChips = remLists.map(function(l){
      return '<div class="kchip'+(r.list_type===l.name?' on':'')+'" onclick="remEditSetList(\''+r.id+'\',\''+escAttr(l.name)+'\',this)">'+escHtml(l.name)+'</div>';
    }).join('');
    return '<div class="rem-card" id="remc-'+r.id+'">' +
      '<div class="fg1" style="margin-bottom:8px;"><textarea id="rem-edit-text-'+r.id+'" style="min-height:50px;width:100%;font-size:14px;">'+escHtml(r.text)+'</textarea></div>' +
      '<div class="fg1" style="margin-bottom:6px;"><label class="fgl">For</label><div class="source-row" style="margin-top:4px;" id="remet-for-'+r.id+'">'+forChips+'</div></div>' +
      '<div class="fg1" style="margin-bottom:10px;"><label class="fgl">List</label><div class="source-row" style="margin-top:4px;flex-wrap:wrap;" id="remet-list-'+r.id+'">'+listChips+'</div></div>' +
      '<div class="btn-row"><button class="btn" onclick="cancelRemEdit()">Cancel</button><button class="btn btn-p" onclick="saveRemEdit(\''+r.id+'\')">Save</button></div>' +
      '</div>';
  }

  return '<div class="rem-card" id="remc-'+r.id+'">' +
    '<div style="display:flex;align-items:flex-start;gap:10px;">' +
    '  <button class="rem-check'+(r.completed?' rem-check-done':'')+'" onclick="toggleRemComplete(\''+r.id+'\','+r.completed+')" title="'+(r.completed?'Mark incomplete':'Mark complete')+'"></button>' +
    '  <div style="flex:1;min-width:0;">' +
    '    <div style="font-size:14px;color:var(--text);'+(r.completed?'text-decoration:line-through;color:var(--text3);':'')+' word-break:break-word;">' + escHtml(r.text) + '</div>' +
    '    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;align-items:center;">' + badge + addedBy + '<span style="color:var(--text3);font-size:11px;">' + date + '</span></div>' +
    '  </div>' +
    '  <div style="display:flex;gap:5px;flex-shrink:0;">' +
    (r.completed ? '' : '    <button class="att-rm" style="font-size:14px;" onclick="openRemEdit(\''+r.id+'\')" title="Edit">✎</button>') +
    '    <button class="att-rm" onclick="deleteReminder(\''+r.id+'\')" title="Delete">×</button>' +
    '  </div>' +
    '</div>' +
    '</div>';
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s || '').replace(/'/g,"\\'");
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
function setRemListFilter(val, btn) {
  remListFilter = val;
  document.querySelectorAll('#rem-list-tabs .fpill').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  renderReminders();
}

function setRemForFilter(val, btn) {
  remForFilter = val;
  document.querySelectorAll('#rem-for-tabs .fpill').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  renderReminders();
}

function toggleRemCompleted() {
  remShowCompleted = !remShowCompleted;
  document.getElementById('rem-completed-arrow').textContent = remShowCompleted ? '▼' : '▶';
  document.getElementById('rem-completed-list').style.display = remShowCompleted ? '' : 'none';
  var count = remAllItems.filter(function(r){ return r.completed && remMatches(r); }).length;
  var labelEl = document.getElementById('rem-completed-label');
  if (labelEl) labelEl.textContent = (remShowCompleted ? 'Hide' : 'Show') + ' completed (' + count + ')';
}

// ── ADD FORM ──────────────────────────────────────────────────────────────────
function setRemNewFor(val, el) {
  if (remNewFor === val) { remNewFor = ''; el.classList.remove('on'); return; }
  remNewFor = val;
  document.querySelectorAll('#rem-new-for .kchip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
}

function setRemNewList(val, el) {
  if (remNewList === val) { remNewList = ''; el.classList.remove('on'); return; }
  remNewList = val;
  document.querySelectorAll('#rem-new-list .kchip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
}

function setRemMsg(text, isErr) {
  var el = document.getElementById('rem-add-msg');
  if (!el) return;
  el.textContent = text;
  el.style.color = isErr ? 'var(--danger)' : 'var(--sage)';
}

async function saveReminder() {
  var text = (document.getElementById('rem-new-text').value || '').trim();
  if (!text) { setRemMsg('Please write something.', true); return; }
  setRemMsg('');
  var row = {
    text: text,
    for_who: remNewFor || null,
    list_type: remNewList || null,
    added_by: ls('logger') || 'Haley',
    completed: false,
  };
  var { data, error } = await sb.from('reminders').insert(row).select().single();
  if (error) { setRemMsg('Save failed: ' + error.message, true); return; }
  setRemMsg('Added!');
  remAllItems.unshift(data);
  document.getElementById('rem-new-text').value = '';
  remNewFor = ''; remNewList = '';
  document.querySelectorAll('#rem-new-for .kchip').forEach(function(c){ c.classList.remove('on'); });
  renderRemAddListChips();
  renderReminders();
  setTimeout(function(){ setRemMsg(''); }, 2000);
}

// ── COMPLETE / DELETE ─────────────────────────────────────────────────────────
async function toggleRemComplete(id, currentlyComplete) {
  var nowComplete = !currentlyComplete;
  var update = { completed: nowComplete, completed_at: nowComplete ? new Date().toISOString() : null };
  var { error } = await sb.from('reminders').update(update).eq('id', id);
  if (error) { console.error('toggle complete:', error); return; }
  remAllItems = remAllItems.map(function(r){ return r.id === id ? Object.assign({}, r, update) : r; });
  renderReminders();
}

async function deleteReminder(id) {
  var { error } = await sb.from('reminders').delete().eq('id', id);
  if (error) { console.error('delete reminder:', error); return; }
  remAllItems = remAllItems.filter(function(r){ return r.id !== id; });
  renderReminders();
}

// ── INLINE EDIT ───────────────────────────────────────────────────────────────
function openRemEdit(id) { remEditId = id; renderReminders(); }
function cancelRemEdit() { remEditId = null; renderReminders(); }

function remEditSetFor(id, val, el) {
  var r = remAllItems.find(function(x){ return x.id === id; });
  if (!r) return;
  var cur = r.for_who === val ? null : val;
  remAllItems = remAllItems.map(function(x){ return x.id === id ? Object.assign({}, x, {for_who: cur}) : x; });
  document.querySelectorAll('#remet-for-' + id + ' .kchip').forEach(function(c){ c.classList.remove('on'); });
  if (cur) el.classList.add('on');
}

function remEditSetList(id, val, el) {
  var r = remAllItems.find(function(x){ return x.id === id; });
  if (!r) return;
  var cur = r.list_type === val ? null : val;
  remAllItems = remAllItems.map(function(x){ return x.id === id ? Object.assign({}, x, {list_type: cur}) : x; });
  document.querySelectorAll('#remet-list-' + id + ' .kchip').forEach(function(c){ c.classList.remove('on'); });
  if (cur) el.classList.add('on');
}

async function saveRemEdit(id) {
  var r = remAllItems.find(function(x){ return x.id === id; });
  if (!r) return;
  var text = (document.getElementById('rem-edit-text-' + id).value || '').trim();
  if (!text) return;
  var update = { text: text, for_who: r.for_who || null, list_type: r.list_type || null };
  var { error } = await sb.from('reminders').update(update).eq('id', id);
  if (error) { console.error('save edit:', error); return; }
  remAllItems = remAllItems.map(function(x){ return x.id === id ? Object.assign({}, x, update) : x; });
  remEditId = null;
  renderReminders();
}

// ── MANAGE LISTS MODAL ────────────────────────────────────────────────────────
function openManageListsModal() {
  renderManageListsModal();
  document.getElementById('ml-overlay').classList.add('open');
}

function closeManageListsModal() {
  document.getElementById('ml-overlay').classList.remove('open');
}

function closeMLOverlay(e) {
  if (e.target === document.getElementById('ml-overlay')) closeManageListsModal();
}

function setMLMsg(text, isErr) {
  var el = document.getElementById('ml-msg');
  if (!el) return;
  el.textContent = text;
  el.style.color = isErr ? 'var(--danger)' : 'var(--sage)';
}

function renderManageListsModal() {
  var el = document.getElementById('ml-list');
  if (!el) return;
  if (!remLists.length) {
    el.innerHTML = '<p style="color:var(--text3);font-size:13px;">No lists yet.</p>';
    return;
  }
  el.innerHTML = remLists.map(function(l) {
    var delBtn = l.id
      ? '<button class="att-rm" onclick="deleteReminderList(\'' + l.id + '\')" title="Delete list">×</button>'
      : '<span style="font-size:11px;color:var(--text3);">(default)</span>';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">' +
      '<span style="font-size:14px;color:var(--text);">' + escHtml(l.name) + '</span>' +
      delBtn +
      '</div>';
  }).join('');
  var inp = document.getElementById('ml-new-name');
  if (inp) inp.value = '';
  setMLMsg('');
}

async function addReminderList() {
  var name = (document.getElementById('ml-new-name').value || '').trim();
  if (!name) { setMLMsg('Enter a list name.', true); return; }
  if (remLists.some(function(l){ return l.name.toLowerCase() === name.toLowerCase(); })) {
    setMLMsg('That list already exists.', true); return;
  }
  setMLMsg('');
  var maxOrder = remLists.reduce(function(m, l){ return Math.max(m, l.sort_order || 0); }, 0);
  var { data, error } = await sb.from('reminder_lists').insert({ name: name, sort_order: maxOrder + 1 }).select().single();
  if (error) { setMLMsg('Error: ' + error.message, true); return; }
  remLists.push(data);
  setMLMsg('List added!');
  renderManageListsModal();
  renderRemListTabs();
  renderRemAddListChips();
  // also refresh QC reminder chips if modal is open
  refreshQCNoteLists();
}

async function deleteReminderList(id) {
  var { error } = await sb.from('reminder_lists').delete().eq('id', id);
  if (error) { setMLMsg('Error: ' + error.message, true); return; }
  remLists = remLists.filter(function(l){ return l.id !== id; });
  // if active filter was this list, reset
  if (!remLists.some(function(l){ return l.name === remListFilter; })) remListFilter = 'all';
  renderManageListsModal();
  renderRemListTabs();
  renderRemAddListChips();
  refreshQCNoteLists();
}
