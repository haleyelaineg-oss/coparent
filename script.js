// ── SUPABASE ──────────────────────────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

// ── AUTH STATE ────────────────────────────────────────────────────────────────
var currentUser = null;
var passwordMode = false;

// ── APP STATE ─────────────────────────────────────────────────────────────────
var allEntries = [];
var currentFilter = 'all';
var currentPersonFilter = null;
var expCats = ['kids', 'parenting', 'coparenting', 'reflection'];

// Capture form state
var capPeople = [];
var capSource = '';
var capCategory = '';
var capSeverity = 0;
var capAtts = [];

// Daily reflection state
var flowStep = 0;
var flowKidsHome = true;
var flowMaryContact = false;
var flowMaryLikert = 0;
var flowMaryTreatment = '';
var flowFeelings = [];
var flowMoods = {};
var flowStruggles = {};
var flowPositives = {};
var FLOW_STEPS_KIDS = [0, 1, 2, 3, 4, 5, 6, 7];
var FLOW_STEPS_NOKIDS = [0, 1, 5, 6, 7];

// ── LOCAL STORAGE ─────────────────────────────────────────────────────────────
function ls(k, v) {
  if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
  localStorage.setItem(k, JSON.stringify(v));
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function showScreen(id) {
  ['screen-login', 'screen-check-email', 'screen-app'].forEach(function (s) {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = id === 'screen-app' ? 'flex' : 'flex';
  if (id === 'screen-app') document.getElementById(id).style.flexDirection = 'column';
}

async function sendMagicLink() {
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var btn = document.getElementById('login-btn');
  var err = document.getElementById('login-err');
  err.textContent = '';
  if (!email) { err.textContent = 'Please enter your email address.'; return; }
  if (!ALLOWED_EMAILS.map(function (e) { return e.toLowerCase(); }).includes(email)) {
    err.textContent = 'That email isn\'t authorized to access this app.';
    return;
  }
  btn.textContent = 'Sending...';
  btn.disabled = true;
  var redirectTo = window.location.origin + window.location.pathname;
  var { error } = await sb.auth.signInWithOtp({
    email: email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) {
    err.textContent = 'Error: ' + error.message;
    btn.textContent = 'Send Magic Link';
    btn.disabled = false;
  } else {
    document.getElementById('check-email-addr').textContent = email;
    showScreen('screen-check-email');
  }
}

function togglePasswordMode() {
  passwordMode = !passwordMode;
  var pwSection = document.getElementById('password-section');
  var pwBtn = document.getElementById('signin-password-btn');
  var toggleBtn = document.getElementById('password-toggle-btn');
  var magicBtn = document.getElementById('login-btn');
  if (passwordMode) {
    pwSection.style.display = 'block';
    pwBtn.style.display = 'block';
    toggleBtn.textContent = 'Use Magic Link';
    magicBtn.style.display = 'none';
    document.getElementById('login-password').focus();
  } else {
    pwSection.style.display = 'none';
    pwBtn.style.display = 'none';
    toggleBtn.textContent = 'Use Password';
    magicBtn.style.display = 'block';
  }
  document.getElementById('login-err').textContent = '';
}

async function signInWithPassword() {
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var password = document.getElementById('login-password').value;
  var err = document.getElementById('login-err');
  err.textContent = '';
  if (!email) { err.textContent = 'Please enter your email address.'; return; }
  if (!password) { err.textContent = 'Please enter your password.'; return; }
  if (!ALLOWED_EMAILS.map(function (e) { return e.toLowerCase(); }).includes(email)) {
    err.textContent = 'That email isn\'t authorized.';
    return;
  }
  var btn = document.getElementById('signin-password-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  var { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
  if (error) {
    err.textContent = 'Error: ' + error.message;
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}

async function signOut() {
  await sb.auth.signOut();
  currentUser = null;
  showScreen('screen-login');
}

function getLoggerName(email) {
  if (!email) return 'Haley';
  var lower = email.toLowerCase();
  if (lower === ALLOWED_EMAILS[0].toLowerCase()) return 'Haley';
  if (lower === ALLOWED_EMAILS[1].toLowerCase()) return 'Dave';
  return email.split('@')[0];
}

async function initAuth() {
  var { data: { session } } = await sb.auth.getSession();
  if (session) { currentUser = session.user; onAuthenticated(); }
  else showScreen('screen-login');
  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      onAuthenticated();
    } else if (event === 'SIGNED_OUT') {
      if (currentUser) {
        currentUser = null;
        showScreen('screen-login');
      }
    }
  });
}

function onAuthenticated() {
  // Prevent app content from being navigated back to the login state after successful auth
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  var name = getLoggerName(currentUser.email);
  ls('logger', name);
  var el = document.getElementById('hdr-user');
  if (el) el.textContent = name;
  showScreen('screen-app');
  loadTheme();
  loadLogger();
  initCapturePage();
  loadHabits().then(renderDashboard);
  loadEntries().then(updateCount);
}

// ── LOGGER ────────────────────────────────────────────────────────────────────
function setLogger(v) {
  ls('logger', v);
  ['ref-logger', 'cap-logger', 'mem-logger'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = v;
  });
}

function loadLogger() {
  var v = ls('logger') || 'Haley';
  ['ref-logger', 'cap-logger', 'mem-logger'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = v;
  });
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function nav(page, btn) {
  document.querySelectorAll('.pg').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.nb').forEach(function (b) { b.classList.remove('active'); });
  document.getElementById('pg-' + page).classList.add('active');
  if (btn) btn.classList.add('active');
  if (page === 'viewlog') { loadEntries().then(function () { renderFeed(); renderTrends(); }); }
  if (page === 'export') loadEntries();
  if (page === 'reflection') initFlow();
  if (page === 'dashboard') renderDashboard();
  if (page === 'capture') { setNow('cap-date'); loadLogger(); }
  if (page === 'memories') initMemoriesPage();
  if (page === 'manage-habits') initManageHabits();
  if (page === 'settings') renderThemePicker();
}

// ── THEME ──────────────────────────────────────────────────────────────────────
var THEMES = ['rose', 'sage', 'slate', 'amber', 'plum'];

function applyTheme(name) {
  document.body.className = name === 'rose' ? '' : 'theme-' + name;
  ls('theme', name);
  renderThemePicker();
}

function loadTheme() {
  var saved = ls('theme') || 'rose';
  applyTheme(saved);
}

function renderThemePicker() {
  var current = ls('theme') || 'rose';
  THEMES.forEach(function (t) {
    var swatch = document.getElementById('swatch-' + t);
    var check = document.getElementById('check-' + t);
    if (swatch) swatch.classList.toggle('active', t === current);
    if (check) check.textContent = t === current ? '✓' : '';
  });
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
var habits = [];
var habitsDoneToday = {};

async function loadHabits() {
  var { data, error } = await sb.from('habits').select('*').eq('active', true).order('created_at');
  if (!error && data) habits = data;
}

async function renderDashboard() {
  var h = new Date().getHours();
  var name = ls('logger') || 'Haley';
  document.getElementById('dash-greeting').textContent =
    (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', ' + name + '!';
  document.getElementById('dash-date').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  renderHabits();
  await Promise.all([loadHabits(), loadHabitsToday()]);
  renderHabits();
}

async function loadHabitsToday() {
  var today = new Date().toISOString().slice(0, 10);
  var { data, error } = await sb.from('habit_logs').select('habit_id,kid').eq('completed_date', today);
  if (error) return;
  habitsDoneToday = {};
  (data || []).forEach(function (row) { habitsDoneToday[row.habit_id + ':' + row.kid] = true; });
}

function renderHabits() {
  var el = document.getElementById('dash-habits');
  if (!habits.length) { el.innerHTML = '<div class="empty">No habits yet. <a href="#" onclick="nav(\'manage-habits\',null);return false;">Add one →</a></div>'; return; }
  var totalKids = habits.reduce(function (sum, h) { return sum + (h.kids || []).length; }, 0);
  var doneKids = Object.keys(habitsDoneToday).length;
  el.innerHTML =
    '<div class="habit-list">' +
    habits.map(function (h) {
      var kids = h.kids || [];
      var escapedName = h.name.replace(/'/g, "\\'");
      return '<div class="habit-item">' +
        '<div class="habit-body">' +
        '<div class="habit-name">' + h.name + '</div>' +
        '<div class="habit-kids">' +
        kids.map(function (kid) {
          var done = !!habitsDoneToday[h.id + ':' + kid];
          return '<div class="habit-kid' + (done ? ' done' : '') + '" onclick="toggleHabit(\'' + h.id + '\',\'' + escapedName + '\',\'' + kid + '\')">' +
            (done ? '✓ ' : '○ ') + kid +
            '</div>';
        }).join('') +
        '</div></div></div>';
    }).join('') +
    '</div>' +
    '<div style="font-size:12px;color:var(--text3);margin-top:10px;">' + doneKids + ' of ' + totalKids + ' done today</div>';
}

async function toggleHabit(id, name, kid) {
  var today = new Date().toISOString().slice(0, 10);
  var key = id + ':' + kid;
  if (habitsDoneToday[key]) {
    await sb.from('habit_logs').delete().eq('habit_id', id).eq('kid', kid).eq('completed_date', today);
    delete habitsDoneToday[key];
  } else {
    await sb.from('habit_logs').insert({
      habit_id: id,
      habit_name: name,
      kid: kid,
      completed_date: today,
      logger: ls('logger') || 'Haley',
      user_id: currentUser ? currentUser.id : null,
    });
    habitsDoneToday[key] = true;
  }
  renderHabits();
}

// ── MANAGE HABITS ─────────────────────────────────────────────────────────────
var newHabitKids = [];

function initManageHabits() {
  newHabitKids = [];
  document.getElementById('new-habit-name').value = '';
  var el = document.getElementById('new-habit-kids');
  el.innerHTML = KIDS.map(function (k) {
    return '<div class="kchip" id="mhchip-' + k + '" onclick="toggleNewHabitKid(\'' + k + '\')">' + k + '</div>';
  }).join('');
  renderHabitsList();
}

function toggleNewHabitKid(kid) {
  if (newHabitKids.includes(kid)) newHabitKids = newHabitKids.filter(function (k) { return k !== kid; });
  else newHabitKids.push(kid);
  KIDS.forEach(function (k) {
    var el = document.getElementById('mhchip-' + k);
    if (el) el.classList.toggle('on', newHabitKids.includes(k));
  });
}

async function addHabit() {
  var name = document.getElementById('new-habit-name').value.trim();
  if (!name) { showToast('mh', 'err', 'Please enter a habit name.'); return; }
  if (!newHabitKids.length) { showToast('mh', 'err', 'Please select at least one kid.'); return; }
  var { data, error } = await sb.from('habits').insert({ name: name, kids: newHabitKids, active: true }).select();
  if (error) { showToast('mh', 'err', 'Save failed: ' + error.message); return; }
  habits.push(data[0]);
  showToast('mh', 'ok', 'Habit added.');
  document.getElementById('new-habit-name').value = '';
  newHabitKids = [];
  KIDS.forEach(function (k) {
    var el = document.getElementById('mhchip-' + k);
    if (el) el.classList.remove('on');
  });
  renderHabitsList();
}

async function removeHabit(id) {
  var { error } = await sb.from('habits').update({ active: false }).eq('id', id);
  if (error) { showToast('mh', 'err', 'Remove failed: ' + error.message); return; }
  habits = habits.filter(function (h) { return h.id !== id; });
  renderHabitsList();
}

function renderHabitsList() {
  var el = document.getElementById('habits-manage-list');
  if (!habits.length) { el.innerHTML = '<div class="empty">No habits yet.</div>'; return; }
  el.innerHTML = habits.map(function (h) {
    return '<div class="mh-item">' +
      '<div class="mh-body">' +
      '<div class="mh-name">' + h.name + '</div>' +
      '<div class="mh-kids">' + (h.kids || []).join(', ') + '</div>' +
      '</div>' +
      '<button class="btn" onclick="removeHabit(\'' + h.id + '\')" style="flex-shrink:0;font-size:12px;padding:4px 10px;">Remove</button>' +
      '</div>';
  }).join('');
}

// ── CAPTURE PAGE INIT ─────────────────────────────────────────────────────────
function initCapturePage() {
  // Build location dropdown
  var locSel = document.getElementById('cap-location');
  locSel.innerHTML = '<option value="">Select location...</option>' +
    LOCATIONS.map(function (l) { return '<option value="' + l.id + '">' + l.name + '</option>'; }).join('');

  // Build category grid
  var grid = document.getElementById('cat-grid');
  grid.innerHTML = ENTRY_CATEGORIES.filter(function (cat) { return cat.id !== 'memories'; }).map(function (cat) {
    return '<div class="cat-btn" id="catbtn-' + cat.id + '" onclick="selectCategory(\'' + cat.id + '\')" ' +
      'style="--cat-color:' + cat.color + ';--cat-color-l:' + cat.colorL + ';">' +
      '<div class="cat-name">' + cat.name + '</div>' +
      '<div class="cat-desc">' + cat.description + '</div>' +
      '</div>';
  }).join('');

  // Build people chips
  var peopleEl = document.getElementById('cap-people');
  peopleEl.innerHTML = ALL_PEOPLE.map(function (p) {
    return '<div class="kchip" id="capchip-' + p + '" onclick="togglePerson(\'' + p + '\')">' + p + '</div>';
  }).join('');

  // Build source chips
  var srcEl = document.getElementById('cap-source');
  srcEl.innerHTML = INFO_SOURCES.map(function (s) {
    return '<div class="kchip" id="srchip-' + s.id + '" onclick="selectSource(\'' + s.id + '\')">' + s.name + '</div>';
  }).join('');

  // Build severity buttons
  var sevEl = document.getElementById('cap-severity');
  sevEl.innerHTML = [1,2,3,4,5].map(function (n) {
    return '<button class="sev-btn" id="sevbtn-' + n + '" onclick="setSeverity(' + n + ')">' + n + '</button>';
  }).join('');
}

function selectCategory(id) {
  capCategory = id;
  document.querySelectorAll('.cat-btn').forEach(function (b) {
    b.classList.remove('on');
    b.style.borderColor = '';
    b.style.background = '';
  });
  var cat = ENTRY_CATEGORIES.find(function (c) { return c.id === id; });
  var btn = document.getElementById('catbtn-' + id);
  btn.classList.add('on');
  btn.style.borderColor = cat.color;
  btn.style.background = cat.colorL;

  // Populate type dropdown
  var typeWrap = document.getElementById('type-wrap');
  var typeSel = document.getElementById('cap-type');
  typeWrap.style.display = 'flex';
  typeSel.innerHTML = '<option value="">Select type...</option>' +
    cat.types.map(function (t) { return '<option value="' + t.id + '">' + t.name + '</option>'; }).join('');

  // Hide source card for memories
  document.getElementById('source-card').style.display = id === 'memories' ? 'none' : 'block';
  document.getElementById('severity-card').style.display = id === 'memories' ? 'none' : 'block';

  // Set default severity when type changes
  typeSel.onchange = function () {
    var type = cat.types.find(function (t) { return t.id === typeSel.value; });
    if (type) setSeverity(type.defaultSeverity);
  };
}

function togglePerson(name) {
  if (capPeople.includes(name)) capPeople = capPeople.filter(function (p) { return p !== name; });
  else capPeople.push(name);
  ALL_PEOPLE.forEach(function (p) {
    var el = document.getElementById('capchip-' + p);
    if (el) el.classList.toggle('on', capPeople.includes(p));
  });
}

function selectSource(id) {
  capSource = id;
  INFO_SOURCES.forEach(function (s) {
    var el = document.getElementById('srchip-' + s.id);
    if (el) el.classList.toggle('on', s.id === id);
  });
}

function setSeverity(n) {
  capSeverity = n;
  [1,2,3,4,5].forEach(function (i) {
    var btn = document.getElementById('sevbtn-' + i);
    if (btn) {
      btn.className = 'sev-btn';
      if (i <= n) btn.classList.add('on-' + n);
    }
  });
  var hints = ['', 'Lowest severity — no concern', 'Low concern', 'Moderate', 'High concern', 'Highest severity — serious concern'];
  document.getElementById('sev-hint').textContent = hints[n] || '';
}

function handleFiles(files) {
  Array.from(files).forEach(function (f) {
    capAtts.push({ file: f, name: f.name, size: (f.size / 1048576).toFixed(1) + ' MB', type: f.type });
  });
  renderAtts();
  document.getElementById('cap-files').value = '';
}

function renderAtts() {
  document.getElementById('cap-att-list').innerHTML = capAtts.map(function (a, i) {
    return '<div class="att-item"><span class="att-name">' + a.name + '</span><span class="att-meta">' + a.size + '</span>' +
      '<button class="att-rm" onclick="rmAtt(' + i + ')">×</button></div>';
  }).join('');
}

function rmAtt(i) { capAtts.splice(i, 1); renderAtts(); }

function clearCapture() {
  capPeople = []; capSource = ''; capCategory = ''; capSeverity = 0; capAtts = [];
  document.getElementById('cap-facts').value = '';
  document.getElementById('cap-assessment').value = '';
  document.getElementById('cap-quote').value = '';
  document.getElementById('cap-witnesses').value = '';
  document.getElementById('cap-location').value = '';
  document.getElementById('cap-type').innerHTML = '';
  document.getElementById('type-wrap').style.display = 'none';
  document.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('on'); b.style.borderColor = ''; b.style.background = ''; });
  ALL_PEOPLE.forEach(function (p) { var el = document.getElementById('capchip-' + p); if (el) el.classList.remove('on'); });
  INFO_SOURCES.forEach(function (s) { var el = document.getElementById('srchip-' + s.id); if (el) el.classList.remove('on'); });
  [1,2,3,4,5].forEach(function (i) { var btn = document.getElementById('sevbtn-' + i); if (btn) btn.className = 'sev-btn'; });
  document.getElementById('sev-hint').textContent = '';
  document.getElementById('source-card').style.display = 'block';
  document.getElementById('severity-card').style.display = 'block';
  renderAtts();
  setNow('cap-date');
}

// ── SAVE ENTRY ────────────────────────────────────────────────────────────────
async function saveEntry() {
  var facts = document.getElementById('cap-facts').value.trim();
  var category = capCategory;
  var type = document.getElementById('cap-type') ? document.getElementById('cap-type').value : '';

  if (!facts) { showToast('cap', 'err', 'Please describe what happened in the Facts field.'); return; }
  if (!category) { showToast('cap', 'err', 'Please select a category.'); return; }
  if (!type) { showToast('cap', 'err', 'Please select a type.'); return; }
  if (!capPeople.length) { showToast('cap', 'err', 'Please select who was involved.'); return; }

  var locId = document.getElementById('cap-location').value;
  var loc = LOCATIONS.find(function (l) { return l.id === locId; });
  var srcObj = INFO_SOURCES.find(function (s) { return s.id === capSource; });
  var cat = ENTRY_CATEGORIES.find(function (c) { return c.id === category; });
  var typeObj = cat ? cat.types.find(function (t) { return t.id === type; }) : null;

  var entry = {
    entry_type: 'capture',
    category: category,
    type: type,
    type_name: typeObj ? typeObj.name : type,
    category_name: cat ? cat.name : category,
    entry_date: new Date(document.getElementById('cap-date').value || Date.now()).toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    people: capPeople.slice(),
    location: loc ? loc.name : '',
    info_source: srcObj ? srcObj.name : capSource,
    facts: facts,
    assessment: document.getElementById('cap-assessment').value.trim(),
    quote: document.getElementById('cap-quote').value.trim(),
    severity: category === 'memories' ? null : (capSeverity || null),
    witnesses: document.getElementById('cap-witnesses').value.trim(),
    attachments: await uploadAttachments(capAtts),
    flagged: false,
  };

  await saveToSupabase(entry, 'cap');
}

// ── MEMORIES PAGE ─────────────────────────────────────────────────────────────
var memPeople = [];
var memAtts = [];

function initMemoriesPage() {
  setNow('mem-date');
  loadLogger();
  var memCat = ENTRY_CATEGORIES.find(function (c) { return c.id === 'memories'; });
  var typeSel = document.getElementById('mem-type');
  typeSel.innerHTML = '<option value="">Select type...</option>' +
    memCat.types.map(function (t) { return '<option value="' + t.id + '">' + t.name + '</option>'; }).join('');
  memPeople = [];
  var peopleEl = document.getElementById('mem-people');
  peopleEl.innerHTML = ALL_PEOPLE.map(function (p) {
    return '<div class="kchip" id="memchip-' + p + '" onclick="toggleMemPerson(\'' + p + '\')">' + p + '</div>';
  }).join('');
}

function toggleMemPerson(name) {
  if (memPeople.includes(name)) memPeople = memPeople.filter(function (p) { return p !== name; });
  else memPeople.push(name);
  ALL_PEOPLE.forEach(function (p) {
    var el = document.getElementById('memchip-' + p);
    if (el) el.classList.toggle('on', memPeople.includes(p));
  });
}

function handleMemFiles(files) {
  Array.from(files).forEach(function (f) {
    memAtts.push({ file: f, name: f.name, size: (f.size / 1048576).toFixed(1) + ' MB', type: f.type });
  });
  renderMemAtts();
  document.getElementById('mem-files').value = '';
}

function renderMemAtts() {
  document.getElementById('mem-att-list').innerHTML = memAtts.map(function (a, i) {
    return '<div class="att-item"><span class="att-name">' + a.name + '</span><span class="att-meta">' + a.size + '</span>' +
      '<button class="att-rm" onclick="rmMemAtt(' + i + ')">×</button></div>';
  }).join('');
}

function rmMemAtt(i) { memAtts.splice(i, 1); renderMemAtts(); }

function clearMemory() {
  memPeople = [];
  memAtts = [];
  document.getElementById('mem-facts').value = '';
  document.getElementById('mem-quote').value = '';
  document.getElementById('mem-type').value = '';
  document.getElementById('mem-att-list').innerHTML = '';
  ALL_PEOPLE.forEach(function (p) {
    var el = document.getElementById('memchip-' + p);
    if (el) el.classList.remove('on');
  });
  setNow('mem-date');
}

async function saveMemory() {
  var facts = document.getElementById('mem-facts').value.trim();
  var type = document.getElementById('mem-type').value;
  if (!facts) { showToast('mem', 'err', 'Please describe the memory.'); return; }
  if (!type) { showToast('mem', 'err', 'Please select a type.'); return; }
  if (!memPeople.length) { showToast('mem', 'err', 'Please select who was involved.'); return; }
  var memCat = ENTRY_CATEGORIES.find(function (c) { return c.id === 'memories'; });
  var typeObj = memCat ? memCat.types.find(function (t) { return t.id === type; }) : null;
  var entry = {
    entry_type: 'capture',
    category: 'memories',
    category_name: 'Positive Moments & Memories',
    type: type,
    type_name: typeObj ? typeObj.name : type,
    entry_date: new Date(document.getElementById('mem-date').value || Date.now()).toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    people: memPeople.slice(),
    facts: facts,
    quote: document.getElementById('mem-quote').value.trim(),
    severity: null,
    flagged: false,
    attachments: await uploadAttachments(memAtts),
  };
  await saveToSupabase(entry, 'mem');
}

// ── DAILY REFLECTION ──────────────────────────────────────────────────────────
function initFlow() {
  flowStep = 0; flowKidsHome = true; flowMaryContact = false;
  flowMaryLikert = 0; flowMaryTreatment = ''; flowFeelings = [];
  flowMoods = {}; flowStruggles = {}; flowPositives = {};
  document.querySelectorAll('.flow-step').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('step-0').classList.add('active');
  document.getElementById('ref-date-sub').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  renderFeelings();
  updateProgress();
}

function getFlowSteps() { return flowKidsHome ? FLOW_STEPS_KIDS : FLOW_STEPS_NOKIDS; }

function updateProgress() {
  var steps = getFlowSteps();
  var current = steps.indexOf(flowStep);
  var el = document.getElementById('flow-progress');
  el.innerHTML = '';
  for (var i = 0; i < steps.length; i++) {
    var d = document.createElement('div');
    d.className = 'fp-dot' + (i <= current ? ' done' : '');
    el.appendChild(d);
  }
}

function goToStep(n) {
  document.querySelectorAll('.flow-step').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('step-' + n).classList.add('active');
  flowStep = n;
  updateProgress();
  if (n === 2) buildMoodSections();
  if (n === 3) buildStruggleSections();
  if (n === 4) buildPositiveSections();
  if (n === 7) buildReflectionPreview();
}

function flowNext() {
  var steps = getFlowSteps();
  var idx = steps.indexOf(flowStep);
  if (idx < steps.length - 1) goToStep(steps[idx + 1]);
}

function flowBack() {
  var steps = getFlowSteps();
  var idx = steps.indexOf(flowStep);
  if (idx > 0) goToStep(steps[idx - 1]);
}

function setKidsHome(val) { flowKidsHome = val; flowNext(); }
function setMaryContact(val) { flowMaryContact = val; if (val) flowNext(); else goToStep(7); }

function setMaryLikert(val, btn) {
  flowMaryLikert = val;
  document.getElementById('mary-likert').querySelectorAll('.lk-btn').forEach(function (b, i) {
    b.className = 'lk-btn';
    if (i < val) b.classList.add('s' + val);
  });
}

function setMaryTreatment(val, el) {
  flowMaryTreatment = val;
  document.getElementById('mary-treatment-row').querySelectorAll('.kchip').forEach(function (c) { c.classList.remove('on'); });
  el.classList.add('on');
}

function renderFeelings() {
  var el = document.getElementById('feelings-wrap');
  if (!el) return;
  el.innerHTML = FEELINGS.map(function (f) {
    return '<div class="feeling-btn' + (flowFeelings.includes(f) ? ' on' : '') + '" onclick="toggleFeeling(\'' + f.replace(/'/g, "\\'") + '\')">' + f + '</div>';
  }).join('');
}

function toggleFeeling(f) {
  if (flowFeelings.includes(f)) flowFeelings.splice(flowFeelings.indexOf(f), 1);
  else flowFeelings.push(f);
  renderFeelings();
}

function buildMoodSections() {
  var KIDS_LIST = ['Landon', 'Luke', 'Leo'];
  document.getElementById('mood-sections').innerHTML = KIDS_LIST.map(function (kid) {
    return '<div class="kid-section"><div class="kid-section-name">' + kid + '</div>' +
      '<div class="mood-row">' + MOODS.map(function (m) {
        var selected = Array.isArray(flowMoods[kid]) && flowMoods[kid].includes(m.label);
        return '<div class="mood-opt' + (selected ? ' on' : '') + '" onclick="setMood(\'' + kid + '\',\'' + m.label + '\')">' +
          '<div class="mood-icon">' + m.emoji + '</div><div class="mood-lbl">' + m.label + '</div></div>';
      }).join('') + '</div></div>';
  }).join('');
}

function setMood(kid, mood) {
  if (!flowMoods[kid]) flowMoods[kid] = [];
  var idx = flowMoods[kid].indexOf(mood);
  if (idx === -1) flowMoods[kid].push(mood);
  else flowMoods[kid].splice(idx, 1);
  if (!flowMoods[kid].length) delete flowMoods[kid];
  buildMoodSections();
}

function buildStruggleSections() {
  var KIDS_LIST = ['Landon', 'Luke', 'Leo'];
  document.getElementById('struggle-sections').innerHTML = KIDS_LIST.map(function (kid) {
    return '<div class="kid-section"><div class="kid-section-name">' + kid + '</div>' +
      '<textarea id="struggle-' + kid + '" placeholder="Any struggles for ' + kid + ' today? Leave blank if none." style="min-height:70px;width:100%;">' +
      (flowStruggles[kid] || '') + '</textarea></div>';
  }).join('');
}

function buildPositiveSections() {
  var KIDS_LIST = ['Landon', 'Luke', 'Leo'];
  document.getElementById('positive-sections').innerHTML = KIDS_LIST.map(function (kid) {
    return '<div class="kid-section"><div class="kid-section-name">' + kid + '</div>' +
      '<textarea id="positive-' + kid + '" placeholder="Any wins or positive moments for ' + kid + ' today? Leave blank if none." style="min-height:70px;width:100%;">' +
      (flowPositives[kid] || '') + '</textarea></div>';
  }).join('');
}

function captureFlowData() {
  ['Landon', 'Luke', 'Leo'].forEach(function (kid) {
    var s = document.getElementById('struggle-' + kid);
    if (s) flowStruggles[kid] = s.value.trim();
    var p = document.getElementById('positive-' + kid);
    if (p) flowPositives[kid] = p.value.trim();
  });
}

function maryLikertLabel(n) { return ['', 'Distressing', 'Difficult', 'Tense', 'Neutral', 'Pleasant'][n] || ''; }

function buildReflectionPreview() {
  captureFlowData();
  var el = document.getElementById('reflection-preview');
  var html = '';
  var KIDS_LIST = ['Landon', 'Luke', 'Leo'];

  if (!flowKidsHome) {
    html += '<div class="card" style="margin-bottom:8px;"><div style="font-size:14px;color:var(--text);">Kids not home today.</div></div>';
  } else {
    html += '<div class="card" style="margin-bottom:8px;"><div class="ct">Moods</div>' +
      KIDS_LIST.map(function (k) {
        var mood = flowMoods[k];
        if (Array.isArray(mood)) mood = mood.length ? mood.join(', ') : 'Not recorded';
        return '<div style="font-size:14px;color:var(--text);margin-bottom:4px;"><strong>' + k + ':</strong> ' + (mood || 'Not recorded') + '</div>';
      }).join('') + '</div>';

    var hasStruggles = KIDS_LIST.some(function (k) { return flowStruggles[k]; });
    var hasPositives = KIDS_LIST.some(function (k) { return flowPositives[k]; });

    if (hasStruggles) {
      html += '<div class="card" style="margin-bottom:8px;"><div class="ct">Struggles</div>' +
        KIDS_LIST.filter(function (k) { return flowStruggles[k]; }).map(function (k) {
          return '<div style="font-size:14px;color:var(--text);margin-bottom:4px;"><strong>' + k + ':</strong> ' + flowStruggles[k] + '</div>';
        }).join('') + '</div>';
    }

    if (hasPositives) {
      html += '<div class="card" style="margin-bottom:8px;"><div class="ct">Positives</div>' +
        KIDS_LIST.filter(function (k) { return flowPositives[k]; }).map(function (k) {
          return '<div style="font-size:14px;color:var(--text);margin-bottom:4px;"><strong>' + k + ':</strong> ' + flowPositives[k] + '</div>';
        }).join('') + '</div>';
    }
  }

  if (flowMaryContact) {
    var mn = document.getElementById('mary-notes');
    html += '<div class="card" style="margin-bottom:8px;"><div class="ct">Mary Communication</div>' +
      '<div style="font-size:14px;color:var(--text);margin-bottom:4px;">Quality: ' + maryLikertLabel(flowMaryLikert) + ' (' + flowMaryLikert + '/5)</div>' +
      (flowMaryTreatment ? '<div style="font-size:14px;color:var(--text);margin-bottom:4px;">Kids treatment: ' + flowMaryTreatment + '</div>' : '') +
      (flowFeelings.length ? '<div style="font-size:14px;color:var(--text);margin-bottom:4px;">Feelings: ' + flowFeelings.join(', ') + '</div>' : '') +
      (mn && mn.value.trim() ? '<div style="font-size:13px;color:var(--text2);font-style:italic;">' + mn.value.trim() + '</div>' : '') +
      '</div>';
  } else {
    html += '<div class="card" style="margin-bottom:8px;"><div style="font-size:14px;color:var(--text3);">No Mary contact today.</div></div>';
  }

  el.innerHTML = html;
}

async function saveReflection() {
  captureFlowData();
  var KIDS_LIST = ['Landon', 'Luke', 'Leo'];
  var maryNotes = document.getElementById('mary-notes') ? document.getElementById('mary-notes').value.trim() : '';
  var today = new Date().toISOString().slice(0, 10);
  var completed = ls('ci_completed') || {};
  CHECKINS.forEach(function (ci) { completed[ci.id] = today; });
  ls('ci_completed', completed);

  var entry = {
    entry_type: 'reflection',
    category: 'reflection',
    category_name: 'Daily Reflection',
    type: 'daily',
    type_name: 'Daily Reflection',
    entry_date: new Date().toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    people: KIDS_LIST,
    kids_home: flowKidsHome,
    moods: flowMoods,
    struggles: flowStruggles,
    positives: flowPositives,
    mary_contact: flowMaryContact,
    mary_likert: flowMaryContact ? flowMaryLikert : null,
    mary_kids_treatment: flowMaryContact ? flowMaryTreatment : '',
    mary_feelings: flowMaryContact ? flowFeelings : [],
    mary_notes: flowMaryContact ? maryNotes : '',
    facts: '',
    assessment: '',
    flagged: false,
  };

  await saveToSupabase(entry, 'ref');
}

// ── SUPABASE SAVE ─────────────────────────────────────────────────────────────
async function uploadAttachments(atts) {
  var results = [];
  for (var i = 0; i < atts.length; i++) {
    var a = atts[i];
    if (!a.file) { results.push({ name: a.name, size: a.size, type: a.type, url: a.url }); continue; }
    var path = currentUser.id + '/' + Date.now() + '_' + a.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    var { error } = await sb.storage.from('attachments').upload(path, a.file);
    if (error) { showToast('att', 'err', 'Upload failed: ' + a.name + ' — ' + error.message); results.push({ name: a.name, size: a.size, type: a.type }); continue; }
    var { data } = sb.storage.from('attachments').getPublicUrl(path);
    results.push({ name: a.name, size: a.size, type: a.type, url: data.publicUrl, path: path });
  }
  return results;
}

async function saveToSupabase(entry, prefix) {
  var { data, error } = await sb.from('entries').insert(entry).select();
  if (error) { showToast(prefix, 'err', 'Save failed: ' + error.message); return; }
  allEntries.unshift(Array.isArray(data) ? data[0] : data);
  showToast(prefix, 'ok', 'Saved.');
  updateCount();
  if (prefix === 'cap') clearCapture();
  else if (prefix === 'ref') initFlow();
  else if (prefix === 'mem') clearMemory();
}

// ── LOAD ENTRIES ──────────────────────────────────────────────────────────────
async function loadEntries() {
  var { data, error } = await sb
    .from('entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .limit(500);
  if (!error && data) allEntries = data;
}

function updateCount() {
  document.getElementById('nav-count').textContent = allEntries.length;
}

// ── VIEW LOG ──────────────────────────────────────────────────────────────────
function switchViewTab(tab, el) {
  document.querySelectorAll('.vtab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.view-panel').forEach(function (p) { p.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('vp-' + tab).classList.add('active');
  if (tab === 'feed') renderFeed();
  if (tab === 'byperson') renderByPerson(currentPersonFilter || 'Landon');
  if (tab === 'trends') renderTrends();
}

function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('.fpill').forEach(function (p) { p.classList.remove('active'); });
  el.classList.add('active');
  renderFeed();
}

function renderFeed() {
  var list = document.getElementById('entries-list');
  var filtered = allEntries.filter(function (e) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'reflection') return e.entry_type === 'reflection';
    if (currentFilter === 'Haley' || currentFilter === 'Dave') return e.logger === currentFilter;
    return e.category === currentFilter;
  });
  if (!filtered.length) { list.innerHTML = '<div class="empty">No entries match this filter.</div>'; return; }
  list.innerHTML = filtered.map(renderEntryCard).join('');
}

function renderByPerson(person) {
  currentPersonFilter = person;
  var el = document.getElementById('person-tabs');
  el.innerHTML = ALL_PEOPLE.map(function (p) {
    return '<button class="fpill' + (p === person ? ' active' : '') + '" onclick="renderByPerson(\'' + p + '\')">' + p + '</button>';
  }).join('');
  var entries = allEntries.filter(function (e) {
    return (e.people || []).includes(person);
  });
  var container = document.getElementById('person-entries');
  if (!entries.length) { container.innerHTML = '<div class="empty">No entries for ' + person + '.</div>'; return; }
  container.innerHTML = entries.map(renderEntryCard).join('');
}

function renderEntryCard(e) {
  var d = new Date(e.entry_date || e.created_at);
  var ds = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  var people = (e.people || []).join(', ');
  var atts = e.attachments || [];
  var catClass = e.category || 'kids';
  var catBadgeClass = 'b-' + catClass;

  var body = '';
  if (e.entry_type === 'reflection') {
    var KIDS_LIST = ['Landon', 'Luke', 'Leo'];
    var parts = [];
    if (e.kids_home === false) { parts.push('Kids not home.'); }
    else {
      var moodStr = KIDS_LIST.filter(function (k) { return e.moods && e.moods[k] && e.moods[k].length; })
        .map(function (k) { 
          var m = e.moods[k];
          if (Array.isArray(m)) m = m.join(', ');
          return k + ': ' + m;
        }).join(' · ');
      if (moodStr) parts.push('Moods — ' + moodStr);
      var struggles = KIDS_LIST.filter(function (k) { return e.struggles && e.struggles[k]; })
        .map(function (k) { return k + ': ' + e.struggles[k]; }).join(' | ');
      if (struggles) parts.push('Struggles — ' + struggles);
      var positives = KIDS_LIST.filter(function (k) { return e.positives && e.positives[k]; })
        .map(function (k) { return k + ': ' + e.positives[k]; }).join(' | ');
      if (positives) parts.push('Positives — ' + positives);
    }
    if (e.mary_contact) {
      parts.push('Mary: ' + maryLikertLabel(e.mary_likert) +
        (e.mary_kids_treatment ? ' · Kids: ' + e.mary_kids_treatment : '') +
        (e.mary_feelings && e.mary_feelings.length ? ' · ' + e.mary_feelings.join(', ') : ''));
    }
    body = parts.join('<br>');
  } else {
    body = '';
  }

  return '<div class="ecard ' + catClass + '">' +
    '<div class="ehdr">' +
      '<div class="badges">' +
        '<span class="bdg ' + (e.logger === 'Dave' ? 'b-d' : 'b-h') + '">' + e.logger + '</span>' +
        '<span class="bdg ' + catBadgeClass + '">' + (e.category_name || e.category) + '</span>' +
        (e.type_name ? '<span class="bdg b-type">' + e.type_name + '</span>' : '') +
        (people ? '<span class="bdg b-kid">' + people + '</span>' : '') +
        (e.location ? '<span class="bdg b-loc">' + e.location + '</span>' : '') +
        (e.info_source ? '<span class="bdg b-source">' + e.info_source + '</span>' : '') +
      '</div>' +
      '<span class="edate">' + ds + '</span>' +
    '</div>' +
    (body ? '<div class="ebody">' + body + '</div>' : '') +
    (e.facts ? '<div class="facts-block"><div class="facts-label">Facts</div><div class="facts-text">' + e.facts + '</div></div>' : '') +
    (e.assessment ? '<div class="assessment-block"><div class="assessment-label">Our Assessment</div><div class="facts-text">' + e.assessment + '</div></div>' : '') +
    (e.quote ? '<div class="equote">"' + e.quote + '"</div>' : '') +
    (e.severity ? '<div class="escale"><span class="stag">Severity ' + e.severity + '/5</span></div>' : '') +
    (e.witnesses ? '<div class="ewit">Witnesses: ' + e.witnesses + '</div>' : '') +
    (atts.length ? '<div class="eatts">' + atts.map(function (a) { return a.url ? '<a class="atag" href="' + a.url + '" target="_blank" rel="noopener">' + a.name + '</a>' : '<span class="atag">' + a.name + '</span>'; }).join('') + '</div>' : '') +
    '</div>';
}

// ── TRENDS ────────────────────────────────────────────────────────────────────
function renderTrends() {
  var el = document.getElementById('trends-grid');
  var captures = allEntries.filter(function (e) { return e.entry_type === 'capture'; });

  // By category
  var catCounts = {};
  ENTRY_CATEGORIES.forEach(function (c) { catCounts[c.name] = 0; });
  captures.forEach(function (e) { if (catCounts[e.category_name] !== undefined) catCounts[e.category_name]++; });
  var maxCat = Math.max.apply(null, Object.values(catCounts)) || 1;

  // By person
  var personCounts = {};
  ALL_PEOPLE.forEach(function (p) { personCounts[p] = 0; });
  captures.forEach(function (e) { (e.people || []).forEach(function (p) { if (personCounts[p] !== undefined) personCounts[p]++; }); });
  var maxPerson = Math.max.apply(null, Object.values(personCounts)) || 1;

  // Mary likert average
  var maryEntries = allEntries.filter(function (e) { return e.entry_type === 'reflection' && e.mary_contact && e.mary_likert; });
  var avgLikert = maryEntries.length ? (maryEntries.reduce(function (a, e) { return a + e.mary_likert; }, 0) / maryEntries.length).toFixed(1) : '—';

  // Severity avg by category
  var sevByCat = {};
  ENTRY_CATEGORIES.forEach(function (c) { sevByCat[c.id] = []; });
  captures.forEach(function (e) { if (e.severity && sevByCat[e.category]) sevByCat[e.category].push(e.severity); });

  el.innerHTML =
    '<div class="trend-box"><div class="trend-title">Entries by Category</div>' +
    Object.entries(catCounts).map(function (kv) {
      return '<div class="bar-row"><div class="bar-label">' + kv[0] + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(kv[1] / maxCat * 100) + '%"></div></div>' +
        '<div class="bar-count">' + kv[1] + '</div></div>';
    }).join('') + '</div>' +

    '<div class="trend-box"><div class="trend-title">Entries by Person</div>' +
    Object.entries(personCounts).map(function (kv) {
      return '<div class="bar-row"><div class="bar-label">' + kv[0] + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(kv[1] / maxPerson * 100) + '%"></div></div>' +
        '<div class="bar-count">' + kv[1] + '</div></div>';
    }).join('') + '</div>' +

    '<div class="trend-box"><div class="trend-title">Mary Co-Parenting</div>' +
    '<div style="font-size:28px;font-weight:600;color:var(--accent);margin-bottom:4px;">' + avgLikert + '</div>' +
    '<div style="font-size:12px;color:var(--text3);">Avg interaction quality (1=Distressing, 5=Pleasant)<br>' + maryEntries.length + ' interactions logged</div>' +
    '</div>' +

    '<div class="trend-box"><div class="trend-title">Avg Severity by Category</div>' +
    ENTRY_CATEGORIES.filter(function (c) { return c.id !== 'memories'; }).map(function (c) {
      var arr = sevByCat[c.id];
      var avg = arr.length ? (arr.reduce(function (a, b) { return a + b; }, 0) / arr.length).toFixed(1) : '—';
      return '<div class="bar-row"><div class="bar-label">' + c.name + '</div>' +
        '<div style="font-size:13px;font-weight:500;color:var(--text2);">' + avg + '</div></div>';
    }).join('') + '</div>';
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function toggleExpCat(id, el) {
  if (expCats.includes(id)) expCats = expCats.filter(function (c) { return c !== id; });
  else expCats.push(id);
  el.classList.toggle('on', expCats.includes(id));
}

function genExport() {
  var from = document.getElementById('exp-from').value;
  var to = document.getElementById('exp-to').value;
  var filtered = allEntries.filter(function (e) {
    if (!expCats.includes(e.category) && e.entry_type !== 'reflection') return false;
    if (e.entry_type === 'reflection' && !expCats.includes('reflection')) return false;
    if (from && e.entry_date < new Date(from).toISOString()) return false;
    if (to && e.entry_date > new Date(to + 'T23:59:59').toISOString()) return false;
    return true;
  });

  if (!filtered.length) { alert('No entries match the selected filters.'); return; }

  var out = 'COPARENT DOCUMENTATION LOG\nOttawa County — Custody Case\n';
  out += 'Generated: ' + new Date().toLocaleString() + '\n';
  out += 'Total entries: ' + filtered.length + '\n';
  if (from || to) out += 'Date range: ' + (from || 'beginning') + ' to ' + (to || 'present') + '\n';
  out += '='.repeat(60) + '\n\n';

  // Group by category
  var groups = {};
  filtered.forEach(function (e) {
    var key = e.category_name || e.category || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  Object.keys(groups).sort().forEach(function (cat) {
    out += cat.toUpperCase() + '\n' + '-'.repeat(40) + '\n';
    groups[cat].forEach(function (e) {
      var d = new Date(e.entry_date || e.created_at);
      out += '\n[' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '] ';
      out += e.logger;
      if (e.people && e.people.length) out += ' | ' + e.people.join(', ');
      if (e.type_name) out += ' | ' + e.type_name;
      if (e.location) out += ' | ' + e.location;
      if (e.info_source) out += ' | Source: ' + e.info_source;
      if (e.severity) out += ' | Severity: ' + e.severity + '/5';
      out += '\n';

      if (e.entry_type === 'reflection') {
        var KIDS_LIST = ['Landon', 'Luke', 'Leo'];
        if (e.kids_home === false) { out += 'Kids not home.\n'; }
        else {
          var moodStr = KIDS_LIST.filter(function (k) { return e.moods && e.moods[k]; }).map(function (k) { return k + ': ' + e.moods[k]; }).join(', ');
          if (moodStr) out += 'Moods — ' + moodStr + '\n';
          KIDS_LIST.forEach(function (k) { if (e.struggles && e.struggles[k]) out += k + ' struggle: ' + e.struggles[k] + '\n'; });
          KIDS_LIST.forEach(function (k) { if (e.positives && e.positives[k]) out += k + ' positive: ' + e.positives[k] + '\n'; });
        }
        if (e.mary_contact) {
          out += 'Mary: ' + maryLikertLabel(e.mary_likert) + ' (' + e.mary_likert + '/5)';
          if (e.mary_kids_treatment) out += ' | Kids: ' + e.mary_kids_treatment;
          if (e.mary_feelings && e.mary_feelings.length) out += ' | Felt: ' + e.mary_feelings.join(', ');
          out += '\n';
          if (e.mary_notes) out += 'Notes: ' + e.mary_notes + '\n';
        }
      } else {
        if (e.facts) out += 'FACTS: ' + e.facts + '\n';
        if (e.assessment) out += 'ASSESSMENT: ' + e.assessment + '\n';
        if (e.quote) out += 'QUOTE: "' + e.quote + '"\n';
        if (e.witnesses) out += 'Witnesses: ' + e.witnesses + '\n';
        if (e.attachments && e.attachments.length) out += 'Attachments: ' + e.attachments.map(function (a) { return a.name; }).join(', ') + '\n';
      }
    });
    out += '\n';
  });

  var ta = document.getElementById('exp-text');
  ta.value = out;
  document.getElementById('exp-output').style.display = 'block';
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function setNow(id) {
  var n = new Date();
  var el = document.getElementById(id);
  if (el) el.value = new Date(n - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function showToast(prefix, type, msg) {
  var id = prefix + '-' + (type === 'ok' ? 'ok' : 'err');
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(function () { el.style.display = 'none'; }, 4000);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
loadTheme();
initAuth();
