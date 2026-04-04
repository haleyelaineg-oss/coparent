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
var allPatterns = [];
var currentFilter = 'all';
var currentPersonFilter = null;
var expCats = ['kids', 'parenting', 'coparenting', 'coparenting-positive', 'reflection'];

// Capture form state
var capSource = '';
var capCategory = '';
var capSeverity = 0;
var capPatterns = [];
var capDirection = '';

var DIRECTION_OPTIONS = {
  'kids':                ['Kids → Us', 'Kids → Mary'],
  'parenting':           ['Mary → Kids', 'Us → Kids'],
  'coparenting':         ['Mary → Us', 'Us → Mary'],
  'coparenting-positive':['Us → Mary', 'Mary → Us'],
};

// Health form state
var healthKid = '';
var healthSymptoms = [];
var healthMeds = [];
var healthMedsNone = false;
var healthMissedSchool = false;
var healthMissedActivity = false;
var healthRecovery = '';
var healthCareProvider = '';
var healthTransition = false;
var healthDoctorVisit = false;
var healthSeverity = 0;
var healthAtts = [];
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
  loadPatterns();
}

// ── LOGGER ────────────────────────────────────────────────────────────────────
function setLogger(v) {
  ls('logger', v);
  ['ref-logger', 'cap-logger', 'mem-logger', 'health-logger', 'op-logger'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = v;
  });
}

function loadLogger() {
  var v = ls('logger') || 'Haley';
  ['ref-logger', 'cap-logger', 'mem-logger', 'health-logger', 'op-logger'].forEach(function (id) {
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
  if (page === 'health') initHealthPage();
  if (page === 'memories') initMemoriesPage();
  if (page === 'manage-habits') initManageHabits();
  if (page === 'manage-patterns') initManagePatterns();
  if (page === 'settings') renderThemePicker();
  if (page === 'analytics') initAnalytics();
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

// ── PATTERNS ──────────────────────────────────────────────────────────────────
async function loadPatterns() {
  var { data, error } = await sb.from('patterns').select('*').order('category').order('sort_order');
  if (!error && data) { allPatterns = data; renderPatternChips(); }
}

function renderPatternChips() {
  var maryEl = document.getElementById('cap-patterns-mary');
  var usEl   = document.getElementById('cap-patterns-us');
  var boysEl = document.getElementById('cap-patterns-boys');
  if (!maryEl || !boysEl) return;
  var mary = allPatterns.filter(function (p) { return p.category === 'mary'; });
  var us   = allPatterns.filter(function (p) { return p.category === 'us'; });
  var boys = allPatterns.filter(function (p) { return p.category === 'boys'; });
  function sortByPolarity(a, b) {
    if (a.polarity === b.polarity) return 0;
    return a.polarity === 'negative' ? -1 : 1;
  }
  mary.sort(sortByPolarity);
  us.sort(sortByPolarity);
  boys.sort(sortByPolarity);
  function makeChips(list, cls) {
    return list.map(function (p) {
      var indicator = p.polarity === 'positive' ? '+ ' : '− ';
      return '<div class="kchip pchip ' + cls + '" id="pchip-' + p.slug + '" title="' + p.description + '" onclick="toggleCapPattern(\'' + p.slug + '\')">' + indicator + p.label + '</div>';
    }).join('');
  }
  maryEl.innerHTML = makeChips(mary, 'pchip-mary');
  if (usEl) usEl.innerHTML = makeChips(us, 'pchip-us');
  boysEl.innerHTML = makeChips(boys, 'pchip-boys');
}

function toggleCapPattern(slug) {
  if (capPatterns.includes(slug)) capPatterns = capPatterns.filter(function (s) { return s !== slug; });
  else capPatterns.push(slug);
  var el = document.getElementById('pchip-' + slug);
  if (el) el.classList.toggle('on', capPatterns.includes(slug));
}

var newPatternPolarity = 'negative';

function selectPatternPolarity(val) {
  newPatternPolarity = val;
  document.getElementById('polarity-negative').classList.toggle('on', val === 'negative');
  document.getElementById('polarity-positive').classList.toggle('on', val === 'positive');
}

function initManagePatterns() {
  document.getElementById('new-pattern-label').value = '';
  document.getElementById('new-pattern-desc').value = '';
  document.getElementById('new-pattern-category').value = 'mary';
  newPatternPolarity = 'negative';
  document.getElementById('polarity-negative').classList.add('on');
  document.getElementById('polarity-positive').classList.remove('on');
  renderPatternsList();
}

async function addPattern() {
  var label = document.getElementById('new-pattern-label').value.trim();
  var desc = document.getElementById('new-pattern-desc').value.trim();
  var category = document.getElementById('new-pattern-category').value;
  if (!label) { showToast('mp', 'err', 'Please enter a pattern label.'); return; }
  var slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  var maxOrder = allPatterns.filter(function (p) { return p.category === category; }).reduce(function (m, p) { return Math.max(m, p.sort_order); }, 0);
  var { data, error } = await sb.from('patterns').insert({ slug: slug, label: label, description: desc, category: category, sort_order: maxOrder + 1, polarity: newPatternPolarity }).select();
  if (error) { showToast('mp', 'err', 'Save failed: ' + error.message); return; }
  allPatterns.push(data[0]);
  showToast('mp', 'ok', 'Pattern added.');
  document.getElementById('new-pattern-label').value = '';
  document.getElementById('new-pattern-desc').value = '';
  renderPatternChips();
  renderPatternsList();
}

async function deletePattern(id) {
  var { error } = await sb.from('patterns').delete().eq('id', id);
  if (error) { showToast('mp', 'err', 'Delete failed: ' + error.message); return; }
  allPatterns = allPatterns.filter(function (p) { return p.id !== id; });
  renderPatternChips();
  renderPatternsList();
}

function renderPatternsList() {
  var el = document.getElementById('patterns-manage-list');
  if (!allPatterns.length) { el.innerHTML = '<div class="empty">No patterns yet.</div>'; return; }
  var mary = allPatterns.filter(function (p) { return p.category === 'mary'; });
  var us = allPatterns.filter(function (p) { return p.category === 'us'; });
  var boys = allPatterns.filter(function (p) { return p.category === 'boys'; });
  function renderGroup(title, list) {
    if (!list.length) return '';
    return '<div class="pt-group-lbl">' + title + '</div>' +
      list.map(function (p) {
        return '<div class="mh-item">' +
          '<div class="mh-body">' +
          '<div class="mh-name">' + (p.polarity === 'positive' ? '+ ' : '− ') + p.label + '</div>' +
          (p.description ? '<div class="mh-kids">' + p.description + '</div>' : '') +
          '</div>' +
          '<button class="btn" onclick="deletePattern(\'' + p.id + '\')" style="flex-shrink:0;font-size:12px;padding:4px 10px;">Remove</button>' +
          '</div>';
      }).join('');
  }
  el.innerHTML = renderGroup("Mary's Behavior", mary) + renderGroup("Our Patterns", us) + renderGroup("Boys' Patterns", boys);
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

  // Hide source/severity cards for memories
  document.getElementById('source-card').style.display = id === 'memories' ? 'none' : 'block';
  document.getElementById('severity-card').style.display = id === 'memories' ? 'none' : 'block';

  // Show direction chips for applicable categories
  var dirCard = document.getElementById('direction-card');
  var dirEl = document.getElementById('cap-direction');
  var dirOptions = DIRECTION_OPTIONS[id];
  capDirection = '';
  if (dirOptions && dirOptions.length) {
    dirEl.innerHTML = dirOptions.map(function (d) {
      return '<div class="kchip" id="dirchip-' + d.replace(/[^a-z]/gi, '') + '" onclick="selectDirection(\'' + d + '\')">' + d + '</div>';
    }).join('');
    dirCard.style.display = 'block';
  } else {
    dirCard.style.display = 'none';
  }

  // Set default severity when type changes
  typeSel.onchange = function () {
    var type = cat.types.find(function (t) { return t.id === typeSel.value; });
    if (type) setSeverity(type.defaultSeverity);
  };
}

function selectDirection(val) {
  capDirection = val;
  var options = DIRECTION_OPTIONS[capCategory] || [];
  options.forEach(function (d) {
    var el = document.getElementById('dirchip-' + d.replace(/[^a-z]/gi, ''));
    if (el) el.classList.toggle('on', d === val);
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
  capSource = ''; capCategory = ''; capSeverity = 0; capAtts = []; capPatterns = []; capDirection = '';
  allPatterns.forEach(function (p) { var el = document.getElementById('pchip-' + p.slug); if (el) el.classList.remove('on'); });
  document.getElementById('cap-facts').value = '';
  document.getElementById('cap-assessment').value = '';
  document.getElementById('cap-quote').value = '';
  document.getElementById('cap-witnesses').value = '';
  document.getElementById('cap-location').value = '';
  document.getElementById('cap-type').innerHTML = '';
  document.getElementById('type-wrap').style.display = 'none';
  document.getElementById('direction-card').style.display = 'none';
  document.getElementById('cap-direction').innerHTML = '';
  document.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('on'); b.style.borderColor = ''; b.style.background = ''; });
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
  if (DIRECTION_OPTIONS[category] && !capDirection) { showToast('cap', 'err', 'Please select a direction.'); return; }

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
    direction: capDirection || null,
    people: [],
    location: loc ? loc.name : '',
    info_source: srcObj ? srcObj.name : capSource,
    facts: facts,
    assessment: document.getElementById('cap-assessment').value.trim(),
    quote: document.getElementById('cap-quote').value.trim(),
    severity: category === 'memories' ? null : (capSeverity || null),
    witnesses: document.getElementById('cap-witnesses').value.trim(),
    attachments: await uploadAttachments(capAtts),
    pattern_tags: capPatterns.slice(),
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

// ── HEALTH & MEDICAL ──────────────────────────────────────────────────────────
function initHealthPage() {
  healthKid = ''; healthSymptoms = []; healthMeds = []; healthMedsNone = false;
  healthMissedSchool = false; healthMissedActivity = false;
  healthRecovery = ''; healthCareProvider = ''; healthTransition = false;
  healthDoctorVisit = false; healthSeverity = 0; healthAtts = [];
  setNow('health-date');
  loadLogger();

  // Kid chips — single select
  var kidEl = document.getElementById('health-kid-row');
  if (kidEl) kidEl.innerHTML = KIDS.map(function (k) {
    return '<div class="kchip" id="hkchip-' + k + '" onclick="toggleHealthKid(\'' + k + '\')">' + k + '</div>';
  }).join('');

  // Symptom chips
  var sympEl = document.getElementById('health-symptom-chips');
  if (sympEl) sympEl.innerHTML = HEALTH_SYMPTOMS.map(function (s) {
    var id = s.replace(/\s+/g, '-').toLowerCase();
    return '<div class="kchip" id="hsymp-' + id + '" onclick="toggleHealthSymptom(\'' + s + '\')">' + s + '</div>';
  }).join('');
  var sevEl = document.getElementById('health-symptom-severities');
  if (sevEl) sevEl.innerHTML = '';

  // Severity track
  var strack = document.getElementById('health-severity-track');
  if (strack) strack.innerHTML = [1,2,3,4,5].map(function (n) {
    return '<button class="sev-btn" id="hsevbtn-' + n + '" onclick="setHealthSeverity(' + n + ')">' + n + '</button>';
  }).join('');
  var hint = document.getElementById('health-sev-hint');
  if (hint) hint.textContent = '';

  // Care provider chips
  var careEl = document.getElementById('health-care-row');
  if (careEl) careEl.innerHTML = HEALTH_CARE_PROVIDERS.map(function (p) {
    return '<div class="kchip" id="hcare-' + p + '" onclick="setHealthCareProvider(\'' + p + '\')">' + p + '</div>';
  }).join('');

  // Reset toggles
  var chip = document.getElementById('health-meds-none-chip');
  if (chip) chip.classList.remove('on');
  document.getElementById('health-meds-none-section').style.display = 'none';
  document.getElementById('health-meds-none-reason').value = '';
  document.getElementById('health-meds-add-section').style.display = '';
  document.getElementById('health-meds-list').innerHTML = '';

  ['health-school-no','health-school-yes','health-activity-no','health-activity-yes',
   'health-rec-sick','health-rec-improving','health-rec-recovered',
   'health-transition-chip','health-doctor-chip'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('on');
  });
  document.getElementById('health-activity-name-wrap').style.display = 'none';
  document.getElementById('health-activity-name').value = '';
  document.getElementById('health-doctor-fields').style.display = 'none';
  document.getElementById('health-doctor-name').value = '';
  document.getElementById('health-doctor-date').value = '';
  document.getElementById('health-diagnosis').value = '';
  document.getElementById('health-notes').value = '';
  document.getElementById('health-att-list').innerHTML = '';
}

function toggleHealthKid(kid) {
  healthKid = (healthKid === kid) ? '' : kid;
  KIDS.forEach(function (k) {
    var el = document.getElementById('hkchip-' + k);
    if (el) el.classList.toggle('on', k === healthKid);
  });
}

function toggleHealthSymptom(name) {
  var idx = healthSymptoms.findIndex(function (s) { return s.name === name; });
  if (idx > -1) healthSymptoms.splice(idx, 1);
  else healthSymptoms.push({ name: name, severity: 1 });
  var id = name.replace(/\s+/g, '-').toLowerCase();
  var chip = document.getElementById('hsymp-' + id);
  if (chip) chip.classList.toggle('on', healthSymptoms.some(function (s) { return s.name === name; }));
  renderSymptomSeverities();
}

function setSymptomSeverity(name, level) {
  var s = healthSymptoms.find(function (x) { return x.name === name; });
  if (s) s.severity = level;
  renderSymptomSeverities();
}

function renderSymptomSeverities() {
  var el = document.getElementById('health-symptom-severities');
  if (!el) return;
  if (!healthSymptoms.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">' +
    healthSymptoms.map(function (s) {
      return '<div class="symp-sev-row">' +
        '<span class="symp-name">' + s.name + '</span>' +
        '<div class="symp-sev-btns">' +
          [1,2,3].map(function (lv) {
            return '<button class="symp-sev-btn' + (s.severity === lv ? ' on' : '') + '" onclick="setSymptomSeverity(\'' + s.name + '\', ' + lv + ')">' + SYMPTOM_SEVERITY_LABELS[lv] + '</button>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
}

function setHealthSeverity(n) {
  healthSeverity = n;
  [1,2,3,4,5].forEach(function (i) {
    var btn = document.getElementById('hsevbtn-' + i);
    if (btn) { btn.className = 'sev-btn'; if (i <= n) btn.classList.add('on-' + n); }
  });
  var hints = ['','Mild — minor discomfort','Low concern','Moderate','High concern','Serious — seek care'];
  var hint = document.getElementById('health-sev-hint');
  if (hint) hint.textContent = hints[n] || '';
}

function toggleHealthMedsNone() {
  healthMedsNone = !healthMedsNone;
  document.getElementById('health-meds-none-chip').classList.toggle('on', healthMedsNone);
  document.getElementById('health-meds-none-section').style.display = healthMedsNone ? '' : 'none';
  document.getElementById('health-meds-add-section').style.display = healthMedsNone ? 'none' : '';
}

function addHealthMed() {
  healthMeds.push({ name: '', dose: '', time: '' });
  renderHealthMeds();
}

function removeHealthMed(i) {
  healthMeds.splice(i, 1);
  renderHealthMeds();
}

function updateHealthMed(i, field, val) {
  if (healthMeds[i]) healthMeds[i][field] = val;
}

function renderHealthMeds() {
  var el = document.getElementById('health-meds-list');
  if (!el) return;
  el.innerHTML = healthMeds.map(function (m, i) {
    return '<div class="med-row">' +
      '<input type="text" class="med-name" placeholder="Medication" value="' + (m.name || '') + '" oninput="updateHealthMed(' + i + ',\'name\',this.value)"/>' +
      '<input type="text" class="med-dose" placeholder="Dose (e.g. 10ml)" value="' + (m.dose || '') + '" oninput="updateHealthMed(' + i + ',\'dose\',this.value)"/>' +
      '<input type="time" class="med-time" value="' + (m.time || '') + '" oninput="updateHealthMed(' + i + ',\'time\',this.value)"/>' +
      '<button class="att-rm" onclick="removeHealthMed(' + i + ')">×</button>' +
    '</div>';
  }).join('');
}

function setHealthSchool(val) {
  healthMissedSchool = val;
  document.getElementById('health-school-no').classList.toggle('on', !val);
  document.getElementById('health-school-yes').classList.toggle('on', val);
}

function setHealthActivity(val) {
  healthMissedActivity = val;
  document.getElementById('health-activity-no').classList.toggle('on', !val);
  document.getElementById('health-activity-yes').classList.toggle('on', val);
  document.getElementById('health-activity-name-wrap').style.display = val ? '' : 'none';
}

function setHealthRecovery(stage) {
  healthRecovery = stage;
  ['sick','improving','recovered'].forEach(function (s) {
    var el = document.getElementById('health-rec-' + s);
    if (el) el.classList.toggle('on', s === stage);
  });
}

function setHealthCareProvider(val) {
  healthCareProvider = val;
  HEALTH_CARE_PROVIDERS.forEach(function (p) {
    var el = document.getElementById('hcare-' + p);
    if (el) el.classList.toggle('on', p === val);
  });
}

function toggleHealthTransition() {
  healthTransition = !healthTransition;
  document.getElementById('health-transition-chip').classList.toggle('on', healthTransition);
}

function toggleHealthDoctorVisit() {
  healthDoctorVisit = !healthDoctorVisit;
  document.getElementById('health-doctor-chip').classList.toggle('on', healthDoctorVisit);
  document.getElementById('health-doctor-fields').style.display = healthDoctorVisit ? '' : 'none';
}

function handleHealthFiles(files) {
  Array.from(files).forEach(function (f) {
    healthAtts.push({ file: f, name: f.name, size: (f.size / 1048576).toFixed(1) + ' MB', type: f.type });
  });
  renderHealthAtts();
  document.getElementById('health-files').value = '';
}

function renderHealthAtts() {
  document.getElementById('health-att-list').innerHTML = healthAtts.map(function (a, i) {
    return '<div class="att-item"><span class="att-name">' + a.name + '</span><span class="att-meta">' + a.size + '</span>' +
      '<button class="att-rm" onclick="rmHealthAtt(' + i + ')">×</button></div>';
  }).join('');
}

function rmHealthAtt(i) { healthAtts.splice(i, 1); renderHealthAtts(); }

function clearHealth() {
  initHealthPage();
}

async function saveHealth() {
  if (!healthKid) { showToast('health', 'err', 'Please select which kid this is for.'); return; }
  var notes = document.getElementById('health-notes').value.trim();
  if (!healthSymptoms.length && !notes) { showToast('health', 'err', 'Please add at least one symptom or write a note.'); return; }

  var tempVal = document.getElementById('health-temp').value;
  var entry = {
    entry_type: 'capture',
    category: 'health',
    category_name: 'Health & Medical',
    entry_date: new Date(document.getElementById('health-date').value || Date.now()).toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    people: [healthKid],
    kid: healthKid,
    severity: healthSeverity || null,
    temperature: tempVal ? parseFloat(tempVal) : null,
    symptoms: healthSymptoms.slice(),
    medications: healthMedsNone ? [] : healthMeds.filter(function (m) { return m.name.trim(); }),
    meds_none: healthMedsNone,
    meds_none_reason: document.getElementById('health-meds-none-reason').value.trim(),
    missed_school: healthMissedSchool,
    missed_activity: healthMissedActivity,
    missed_activity_name: document.getElementById('health-activity-name').value.trim(),
    recovery_stage: healthRecovery,
    transition_flag: healthTransition,
    care_provider: healthCareProvider,
    doctor_visit: healthDoctorVisit,
    doctor_name: document.getElementById('health-doctor-name').value.trim(),
    doctor_visit_date: document.getElementById('health-doctor-date').value || null,
    diagnosis: document.getElementById('health-diagnosis').value.trim(),
    facts: notes,
    attachments: await uploadAttachments(healthAtts),
    flagged: false,
  };
  await saveToSupabase(entry, 'health');
}

// ── OUR PARENTING ─────────────────────────────────────────────────────────────
var opAction = '';
var opKids = [];
var opOutcome = '';
var opNotifyMethod = '';
var allOpEntries = [];

function initOurParentingPage() {
  opAction = ''; opKids = []; opOutcome = ''; opNotifyMethod = '';
  setNow('op-date');
  loadLogger();

  // Action chips — single select, full-width label style
  var actionEl = document.getElementById('op-action-chips');
  if (actionEl) actionEl.innerHTML = OUR_PARENTING_ACTIONS.map(function (a) {
    return '<div class="kchip op-action-chip" id="opact-' + a.id + '" onclick="selectOpAction(\'' + a.id + '\')">' + a.label + '</div>';
  }).join('');

  // Kid chips — multi-select + All
  var kidsEl = document.getElementById('op-kids-row');
  if (kidsEl) kidsEl.innerHTML = KIDS.concat(['All']).map(function (k) {
    return '<div class="kchip" id="opkid-' + k + '" onclick="toggleOpKid(\'' + k + '\')">' + k + '</div>';
  }).join('');

  // Notify method chips — single select
  var notifyEl = document.getElementById('op-notify-chips');
  if (notifyEl) notifyEl.innerHTML = OUR_PARENTING_NOTIFY_METHODS.map(function (m) {
    var id = m.replace(/\s+/g, '-').toLowerCase();
    return '<div class="kchip" id="opnotify-' + id + '" onclick="selectOpNotify(\'' + m + '\')">' + m + '</div>';
  }).join('');

  // Outcome chips — single select
  var outcomeEl = document.getElementById('op-outcome-chips');
  if (outcomeEl) outcomeEl.innerHTML = LIST_OUTCOMES.map(function (o) {
    var id = o.replace(/\s+/g,'-').toLowerCase();
    return '<div class="kchip" id="opout-' + id + '" onclick="selectOpOutcome(\'' + o + '\')">' + o + '</div>';
  }).join('');

  document.getElementById('op-decline-wrap').style.display = 'none';
  document.getElementById('op-notify-wrap').style.display = 'none';
  document.getElementById('op-decline-reason').value = '';
  document.getElementById('op-notes').value = '';
}

function selectOpAction(id) {
  opAction = (opAction === id) ? '' : id;
  OUR_PARENTING_ACTIONS.forEach(function (a) {
    var el = document.getElementById('opact-' + a.id);
    if (el) el.classList.toggle('on', a.id === opAction);
  });
  var action = OUR_PARENTING_ACTIONS.find(function (a) { return a.id === opAction; });
  document.getElementById('op-decline-wrap').style.display = (action && action.decline) ? '' : 'none';
  document.getElementById('op-notify-wrap').style.display = (action && action.notify) ? '' : 'none';
  // Clear conditional fields when switching away
  if (!action || !action.decline) document.getElementById('op-decline-reason').value = '';
  if (!action || !action.notify) {
    opNotifyMethod = '';
    OUR_PARENTING_NOTIFY_METHODS.forEach(function (m) {
      var el = document.getElementById('opnotify-' + m.replace(/\s+/g,'-').toLowerCase());
      if (el) el.classList.remove('on');
    });
  }
}

function toggleOpKid(kid) {
  if (kid === 'All') {
    opKids = opKids.length === 1 && opKids[0] === 'All' ? [] : ['All'];
  } else {
    opKids = opKids.filter(function (k) { return k !== 'All'; });
    if (opKids.includes(kid)) opKids = opKids.filter(function (k) { return k !== kid; });
    else opKids.push(kid);
  }
  KIDS.concat(['All']).forEach(function (k) {
    var el = document.getElementById('opkid-' + k);
    if (el) el.classList.toggle('on', opKids.includes(k));
  });
}

function selectOpNotify(method) {
  opNotifyMethod = (opNotifyMethod === method) ? '' : method;
  OUR_PARENTING_NOTIFY_METHODS.forEach(function (m) {
    var el = document.getElementById('opnotify-' + m.replace(/\s+/g,'-').toLowerCase());
    if (el) el.classList.toggle('on', m === opNotifyMethod);
  });
}

function selectOpOutcome(outcome) {
  opOutcome = (opOutcome === outcome) ? '' : outcome;
  LIST_OUTCOMES.forEach(function (o) {
    var el = document.getElementById('opout-' + o.replace(/\s+/g,'-').toLowerCase());
    if (el) el.classList.toggle('on', o === opOutcome);
  });
}

function clearOurParenting() {
  initOurParentingPage();
}

async function saveOurParenting() {
  if (!opAction) { showToast('op', 'err', 'Please select an action type.'); return; }
  if (!opKids.length) { showToast('op', 'err', 'Please select which child(ren) this involves.'); return; }
  var notes = document.getElementById('op-notes').value.trim();
  if (!notes) { showToast('op', 'err', 'Please add notes describing what was done.'); return; }

  var action = OUR_PARENTING_ACTIONS.find(function (a) { return a.id === opAction; });
  if (action && action.decline) {
    var reason = document.getElementById('op-decline-reason').value.trim();
    if (!reason) { showToast('op', 'err', 'Please enter the reason for declining.'); return; }
  }
  if (action && action.notify) {
    if (!opNotifyMethod) { showToast('op', 'err', 'Please select the method of notification.'); return; }
  }

  var entry = {
    entry_date: new Date(document.getElementById('op-date').value || Date.now()).toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    action_type: opAction,
    kids: opKids.slice(),
    notes: notes,
    outcome: opOutcome || null,
    decline_reason: (action && action.decline) ? document.getElementById('op-decline-reason').value.trim() : null,
    notify_method: (action && action.notify) ? opNotifyMethod : null,
  };

  var { data, error } = await sb.from('our_parenting').insert(entry).select();
  if (error) { showToast('op', 'err', 'Save failed: ' + error.message); return; }
  allOpEntries.unshift(Array.isArray(data) ? data[0] : data);
  showToast('op', 'ok', 'Saved.');
  clearOurParenting();
}

// ── OUR PARENTING LOG VIEW ─────────────────────────────────────────────────────
async function loadOpEntries() {
  var { data, error } = await sb.from('our_parenting').select('*').order('entry_date', { ascending: false }).limit(500);
  if (!error && data) allOpEntries = data;
}

function initOpLog() {
  // Populate action filter dropdown
  var sel = document.getElementById('opl-filter-action');
  if (sel && sel.options.length === 1) {
    OUR_PARENTING_ACTIONS.forEach(function (a) {
      var opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.label;
      sel.appendChild(opt);
    });
  }
  loadOpEntries().then(renderOpLog);
}

function applyOpFilter() { renderOpLog(); }

function clearOpFilter() {
  document.getElementById('opl-filter-action').value = '';
  document.getElementById('opl-filter-kid').value = '';
  document.getElementById('opl-filter-from').value = '';
  document.getElementById('opl-filter-to').value = '';
  renderOpLog();
}

function renderOpLog() {
  var actionFilter = document.getElementById('opl-filter-action').value;
  var kidFilter = document.getElementById('opl-filter-kid').value;
  var fromFilter = document.getElementById('opl-filter-from').value;
  var toFilter = document.getElementById('opl-filter-to').value;

  var filtered = allOpEntries.filter(function (e) {
    if (actionFilter && e.action_type !== actionFilter) return false;
    if (kidFilter && !(e.kids || []).includes(kidFilter)) return false;
    if (fromFilter && e.entry_date < new Date(fromFilter).toISOString()) return false;
    if (toFilter && e.entry_date > new Date(toFilter + 'T23:59:59').toISOString()) return false;
    return true;
  });

  var countEl = document.getElementById('op-log-count');
  if (countEl) countEl.textContent = filtered.length + ' entr' + (filtered.length === 1 ? 'y' : 'ies');

  var listEl = document.getElementById('op-log-list');
  if (!listEl) return;
  if (!filtered.length) { listEl.innerHTML = '<div class="empty">No entries match the selected filters.</div>'; return; }
  listEl.innerHTML = filtered.map(renderOpCard).join('');
}

function renderOpCard(e) {
  var d = new Date(e.entry_date || e.created_at);
  var ds = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  var action = OUR_PARENTING_ACTIONS.find(function (a) { return a.id === e.action_type; });
  var actionLabel = action ? action.label : e.action_type;
  var kids = (e.kids || []).join(', ');

  return '<div class="ecard op-card">' +
    '<div class="ehdr">' +
      '<div class="badges">' +
        '<span class="bdg ' + (e.logger === 'Dave' ? 'b-d' : 'b-h') + '">' + e.logger + '</span>' +
        '<span class="bdg b-op-action">' + actionLabel + '</span>' +
        (kids ? '<span class="bdg b-kid">' + kids + '</span>' : '') +
        (e.outcome ? '<span class="bdg b-op-outcome">' + e.outcome + '</span>' : '') +
      '</div>' +
      '<span class="edate">' + ds + '</span>' +
    '</div>' +
    (e.notes ? '<div class="facts-block"><div class="facts-label">Notes</div><div class="facts-text">' + e.notes + '</div></div>' : '') +
    (e.decline_reason ? '<div class="assessment-block"><div class="assessment-label">Reason for declining</div><div class="facts-text">' + e.decline_reason + '</div></div>' : '') +
    (e.notify_method ? '<div style="font-size:12px;color:var(--text3);margin-top:7px;">Notified via: ' + e.notify_method + '</div>' : '') +
    '</div>';
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
    results.push({ name: a.name, size: a.size, type: a.type, path: path });
  }
  return results;
}

async function openAttachment(path) {
  var { data, error } = await sb.storage.from('attachments').createSignedUrl(path, 300);
  if (error || !data) { alert('Could not open attachment: ' + (error ? error.message : 'unknown error')); return; }
  window.open(data.signedUrl, '_blank', 'noopener');
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
  var search = (document.getElementById('feed-search') || {}).value || '';
  var searchLc = search.toLowerCase();
  var fromVal = (document.getElementById('feed-from') || {}).value || '';
  var toVal = (document.getElementById('feed-to') || {}).value || '';
  var sort = (document.getElementById('feed-sort') || {}).value || 'logged-desc';

  var filtered = allEntries.filter(function (e) {
    if (currentFilter !== 'all') {
      if (currentFilter === 'reflection' && e.entry_type !== 'reflection') return false;
      if (currentFilter === 'Haley' || currentFilter === 'Dave') { if (e.logger !== currentFilter) return false; }
      else if (currentFilter !== 'reflection' && e.category !== currentFilter) return false;
    }
    // Date range filters on incident/entry date
    if (fromVal && e.entry_date < new Date(fromVal).toISOString()) return false;
    if (toVal && e.entry_date > new Date(toVal + 'T23:59:59').toISOString()) return false;
    // Search across facts, assessment, quote, type_name, category_name, people
    if (searchLc) {
      var haystack = [e.facts, e.assessment, e.quote, e.type_name, e.category_name,
        (e.people || []).join(' '), e.location, e.info_source, e.witnesses].join(' ').toLowerCase();
      if (haystack.indexOf(searchLc) === -1) return false;
    }
    return true;
  });

  filtered.sort(function (a, b) {
    var da = sort.startsWith('incident') ? a.entry_date : a.created_at;
    var db = sort.startsWith('incident') ? b.entry_date : b.created_at;
    return sort.endsWith('asc') ? (da < db ? -1 : da > db ? 1 : 0) : (db < da ? -1 : db > da ? 1 : 0);
  });

  if (!filtered.length) { list.innerHTML = '<div class="empty">No entries match.</div>'; return; }
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
  var incidentDate = new Date(e.entry_date);
  var loggedDate = new Date(e.created_at);
  var incidentDs = incidentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + incidentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  var sameDay = incidentDate.toDateString() === loggedDate.toDateString();
  var loggedDs = sameDay ? null :
    'Logged ' + loggedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  var ds = incidentDs;
  var atts = e.attachments || [];
  var pats = (e.pattern_tags || []).map(function (slug) {
    var p = allPatterns.find(function (x) { return x.slug === slug; });
    return p ? { label: p.label, cat: p.category } : { label: slug, cat: 'mary' };
  });
  var catClass = e.category || 'kids';
  var catBadgeClass = 'b-' + catClass;
  if (catClass === 'health') catBadgeClass = 'b-health';

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
  } else if (e.category === 'health') {
    var hparts = [];
    if (e.recovery_stage) {
      var stageEmoji = { sick: '🤒', improving: '😐', recovered: '😊' };
      hparts.push((stageEmoji[e.recovery_stage] || '') + ' ' + e.recovery_stage.charAt(0).toUpperCase() + e.recovery_stage.slice(1));
    }
    if (e.temperature) hparts.push('Temp: ' + e.temperature + '°F');
    if (e.symptoms && e.symptoms.length) {
      hparts.push('Symptoms: ' + e.symptoms.map(function (s) { return s.name + (s.severity > 1 ? ' (' + (SYMPTOM_SEVERITY_LABELS[s.severity] || '') + ')' : ''); }).join(', '));
    }
    if (e.missed_school) hparts.push('Missed school');
    if (e.missed_activity) hparts.push('Missed: ' + (e.missed_activity_name || 'activity'));
    if (e.meds_none) hparts.push('No meds given' + (e.meds_none_reason ? ' — ' + e.meds_none_reason : ''));
    else if (e.medications && e.medications.length) hparts.push('Meds: ' + e.medications.map(function (m) { return m.name + (m.dose ? ' ' + m.dose : ''); }).join(', '));
    if (e.doctor_visit) hparts.push('Doctor visit' + (e.doctor_name ? ': ' + e.doctor_name : '') + (e.diagnosis ? ' — ' + e.diagnosis : ''));
    body = hparts.join('<br>');
  } else {
    body = '';
  }

  var transitionBadge = (e.transition_flag ? '<span class="bdg b-transition">⚡ transition</span>' : '');

  return '<div class="ecard ' + catClass + '">' +
    '<div class="ehdr">' +
      '<div class="badges">' +
        '<span class="bdg ' + (e.logger === 'Dave' ? 'b-d' : 'b-h') + '">' + e.logger + '</span>' +
        '<span class="bdg ' + catBadgeClass + '">' + (e.category_name || e.category) + '</span>' +
        (e.type_name ? '<span class="bdg b-type">' + e.type_name + '</span>' : '') +
        (e.direction ? '<span class="bdg b-kid">' + e.direction + '</span>' : '') +
        (e.location ? '<span class="bdg b-loc">' + e.location + '</span>' : '') +
        (e.info_source ? '<span class="bdg b-source">' + e.info_source + '</span>' : '') +
        transitionBadge +
      '</div>' +
      '<div class="edate-wrap"><span class="edate">' + ds + '</span>' + (loggedDs ? '<span class="edate-logged">' + loggedDs + '</span>' : '') + '</div>' +
    '</div>' +
    (body ? '<div class="ebody">' + body + '</div>' : '') +
    (e.facts ? '<div class="facts-block"><div class="facts-label">Facts</div><div class="facts-text">' + e.facts + '</div></div>' : '') +
    (e.assessment ? '<div class="assessment-block"><div class="assessment-label">Our Assessment</div><div class="facts-text">' + e.assessment + '</div></div>' : '') +
    (e.quote ? '<div class="equote">"' + e.quote + '"</div>' : '') +
    (e.severity ? '<div class="escale"><span class="stag">Severity ' + e.severity + '/5</span></div>' : '') +
    (e.witnesses ? '<div class="ewit">Witnesses: ' + e.witnesses + '</div>' : '') +
    (atts.length ? '<div class="eatts">' + atts.map(function (a) { return a.path ? '<button class="atag atag-btn" onclick="openAttachment(\'' + a.path.replace(/'/g, "\\'") + '\')">' + a.name + '</button>' : '<span class="atag">' + a.name + '</span>'; }).join('') + '</div>' : '') +
    (pats.length ? '<div class="epats">' + pats.map(function (p) { return '<span class="ptag ptag-' + p.cat + '">' + p.label + '</span>'; }).join('') + '</div>' : '') +
    '</div>';
}

// ── TRENDS ────────────────────────────────────────────────────────────────────
function renderTrends() {
  var el = document.getElementById('trends-grid');
  var captures = allEntries.filter(function (e) { return e.entry_type === 'capture'; });

  // By category
  var catCounts = {};
  ENTRY_CATEGORIES.forEach(function (c) { catCounts[c.name] = 0; });
  catCounts['Health & Medical'] = 0;
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
    }).join('') + '</div>' +

    (function () {
      var patCounts = {};
      allEntries.forEach(function (e) {
        (e.pattern_tags || []).forEach(function (slug) { patCounts[slug] = (patCounts[slug] || 0) + 1; });
      });
      var sorted = Object.entries(patCounts).sort(function (a, b) { return b[1] - a[1]; });
      if (!sorted.length) return '<div class="trend-box"><div class="trend-title">Pattern Frequency</div><div class="empty" style="font-size:13px;">No patterns tagged yet.</div></div>';
      var maxPat = sorted[0][1] || 1;
      return '<div class="trend-box trend-box-wide"><div class="trend-title">Pattern Frequency</div>' +
        sorted.map(function (kv) {
          var p = allPatterns.find(function (x) { return x.slug === kv[0]; });
          var label = p ? p.label : kv[0];
          var cat = p ? p.category : 'mary';
          return '<div class="bar-row"><div class="bar-label">' +
            '<span class="ptag ptag-' + cat + '" style="font-size:10px;padding:1px 6px;">' + label + '</span></div>' +
            '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(kv[1] / maxPat * 100) + '%"></div></div>' +
            '<div class="bar-count">' + kv[1] + '</div></div>';
        }).join('') + '</div>';
    })();
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
      } else if (e.category === 'health') {
        if (e.kid) out += 'Kid: ' + e.kid + '\n';
        if (e.recovery_stage) out += 'Recovery stage: ' + e.recovery_stage + '\n';
        if (e.temperature) out += 'Temperature: ' + e.temperature + '°F\n';
        if (e.symptoms && e.symptoms.length) {
          out += 'Symptoms: ' + e.symptoms.map(function (s) { return s.name + (s.severity > 1 ? ' (' + SYMPTOM_SEVERITY_LABELS[s.severity] + ')' : ''); }).join(', ') + '\n';
        }
        if (e.meds_none) out += 'Medications: None given' + (e.meds_none_reason ? ' — ' + e.meds_none_reason : '') + '\n';
        else if (e.medications && e.medications.length) out += 'Medications: ' + e.medications.map(function (m) { return m.name + (m.dose ? ' ' + m.dose : '') + (m.time ? ' at ' + m.time : ''); }).join('; ') + '\n';
        if (e.missed_school) out += 'Missed school: Yes\n';
        if (e.missed_activity) out += 'Missed activity: ' + (e.missed_activity_name || 'Yes') + '\n';
        if (e.care_provider) out += 'Care provided by: ' + e.care_provider + '\n';
        if (e.transition_flag) out += 'TRANSITION FLAG: Started or worsened within 24 hrs of custody exchange\n';
        if (e.doctor_visit) {
          out += 'Doctor visit: Yes';
          if (e.doctor_name) out += ' — ' + e.doctor_name;
          if (e.doctor_visit_date) out += ' on ' + e.doctor_visit_date;
          out += '\n';
          if (e.diagnosis) out += 'Diagnosis: ' + e.diagnosis + '\n';
        }
        if (e.facts) out += 'Notes: ' + e.facts + '\n';
        if (e.attachments && e.attachments.length) out += 'Attachments: ' + e.attachments.map(function (a) { return a.name; }).join(', ') + '\n';
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

// ── DATA ANALYSIS ─────────────────────────────────────────────────────────────
// ── MARY'S MOOD LOG ───────────────────────────────────────────────────────────
var moodLogMood = '';
var moodLogFormats = [];
var moodLogKids = null;

function openMoodLog() {
  moodLogMood = '';
  moodLogFormats = [];
  moodLogKids = null;

  var today = new Date();
  document.getElementById('ml-date').value = today.toISOString().slice(0, 10);
  document.getElementById('ml-notes').value = '';

  var moodEl = document.getElementById('ml-mood-chips');
  moodEl.innerHTML = MARY_MOODS.map(function (m) {
    return '<div class="kchip ml-mood-chip ' + m.polarity + '" id="mlm-' + m.label + '" onclick="selectMoodLogMood(\'' + m.label + '\')">' + m.label + '</div>';
  }).join('');

  var fmtEl = document.getElementById('ml-format-chips');
  fmtEl.innerHTML = MARY_FORMATS.map(function (f) {
    var id = 'mlf-' + f.replace(/\W+/g, '');
    return '<div class="kchip" id="' + id + '" onclick="toggleMoodLogFormat(\'' + f + '\')">' + f + '</div>';
  }).join('');

  document.getElementById('ml-kids-yes').classList.remove('on');
  document.getElementById('ml-kids-no').classList.remove('on');
  document.getElementById('ml-ok').textContent = '';
  document.getElementById('ml-err').textContent = '';

  document.getElementById('mood-log-overlay').classList.add('open');
}

function closeMoodLog(e) {
  if (e && e.target !== document.getElementById('mood-log-overlay')) return;
  document.getElementById('mood-log-overlay').classList.remove('open');
}

function closeMoodLogBtn() {
  document.getElementById('mood-log-overlay').classList.remove('open');
}

function selectMoodLogMood(label) {
  moodLogMood = label;
  MARY_MOODS.forEach(function (m) {
    var el = document.getElementById('mlm-' + m.label);
    if (el) el.classList.toggle('on', m.label === label);
  });
}

function toggleMoodLogFormat(f) {
  var id = 'mlf-' + f.replace(/\W+/g, '');
  if (moodLogFormats.includes(f)) {
    moodLogFormats = moodLogFormats.filter(function (x) { return x !== f; });
  } else {
    moodLogFormats.push(f);
  }
  var el = document.getElementById(id);
  if (el) el.classList.toggle('on', moodLogFormats.includes(f));
}

function setMoodLogKids(val) {
  moodLogKids = val;
  document.getElementById('ml-kids-yes').classList.toggle('on', val === true);
  document.getElementById('ml-kids-no').classList.toggle('on', val === false);
}

async function saveMoodLog() {
  if (!moodLogMood) { showToast('ml', 'err', 'Please select a mood.'); return; }
  var dateVal = document.getElementById('ml-date').value;
  if (!dateVal) { showToast('ml', 'err', 'Please select a date.'); return; }

  var entry = {
    entry_date: new Date(dateVal + 'T12:00:00').toISOString(),
    entry_type: 'mood-log',
    category: 'mary-mood',
    entry_subtype: moodLogMood,
    logger: getLoggerName(currentUser.email),
    user_id: currentUser.id,
    facts: document.getElementById('ml-notes').value.trim(),
    mary_feelings: moodLogFormats,
    kids_home: moodLogKids,
  };

  var { data, error } = await sb.from('entries').insert(entry).select();
  if (error) { showToast('ml', 'err', 'Save failed: ' + error.message); return; }
  allEntries.unshift(Array.isArray(data) ? data[0] : data);
  showToast('ml', 'ok', 'Saved!');
  updateCount();
  setTimeout(closeMoodLogBtn, 900);
}

function captureLater() {
  var dateVal = document.getElementById('ml-date').value;
  var notes = document.getElementById('ml-notes').value.trim();
  var moodPrefix = moodLogMood
    ? '[Mary: ' + moodLogMood + (moodLogFormats.length ? ' — ' + moodLogFormats.join(', ') : '') + ']\n'
    : '';
  closeMoodLogBtn();
  nav('capture', null);
  setTimeout(function () {
    var capDate = document.getElementById('cap-date');
    if (capDate && dateVal) capDate.value = dateVal;
    var capFacts = document.getElementById('cap-facts');
    if (capFacts) capFacts.value = moodPrefix + notes;
  }, 60);
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
var anaView = 'all';
var anaMode = 'charts';
var anaGran = 'month';
var anaCharts = {};
var anaPatternTimePats = []; // selected slugs for pattern timeline; empty = auto top 5

function initAnalytics() {
  Promise.all([
    allEntries.length ? Promise.resolve() : loadEntries(),
    allOpEntries.length ? Promise.resolve() : loadOpEntries(),
  ]).then(renderAnalytics);
}

function setAnaView(view, el) {
  anaView = view;
  anaPatternTimePats = []; // reset pattern filter on view change
  document.querySelectorAll('#ana-view-tabs .vtab').forEach(function (b) { b.classList.remove('active'); });
  el.classList.add('active');
  renderAnalytics();
}

function setAnaMode(mode) {
  anaMode = mode;
  document.getElementById('ana-charts-view').style.display = mode === 'charts' ? '' : 'none';
  document.getElementById('ana-table-view').style.display = mode === 'table' ? '' : 'none';
  document.getElementById('ana-btn-charts').className = mode === 'charts' ? 'btn btn-p' : 'btn';
  document.getElementById('ana-btn-table').className = mode === 'table' ? 'btn btn-p' : 'btn';
  if (mode === 'table') renderAnaTable();
}

function setAnaGran(gran) {
  anaGran = gran;
  document.getElementById('ana-gran-week').classList.toggle('active', gran === 'week');
  document.getElementById('ana-gran-month').classList.toggle('active', gran === 'month');
  renderAnalytics();
}

function getAnaFiltered() {
  var from = (document.getElementById('ana-from') || {}).value || '';
  var to = (document.getElementById('ana-to') || {}).value || '';
  var kid = (document.getElementById('ana-kid') || {}).value || '';
  var logger = (document.getElementById('ana-logger') || {}).value || '';

  function dateOk(dateStr) {
    if (!dateStr) return false;
    if (from && dateStr < new Date(from).toISOString()) return false;
    if (to && dateStr > new Date(to + 'T23:59:59').toISOString()) return false;
    return true;
  }

  var entries = allEntries.filter(function (e) {
    if (!dateOk(e.entry_date)) return false;
    if (logger && e.logger !== logger) return false;
    if (kid) {
      var inPeople = (e.people || []).includes(kid);
      var isKid = e.kid === kid;
      var inMoods = e.moods && e.moods[kid];
      if (!inPeople && !isKid && !inMoods) return false;
    }
    if (anaView === 'incident') {
      var incidentCats = ['kids', 'parenting', 'coparenting', 'coparenting-positive'];
      if (!incidentCats.includes(e.category) && e.entry_type !== 'reflection') return false;
    } else if (anaView === 'parenting') {
      return false;
    } else if (anaView === 'health') {
      if (e.category !== 'health') return false;
    } else if (anaView === 'memories') {
      if (e.category !== 'memories') return false;
    }
    return true;
  });

  var opEntries = allOpEntries.filter(function (e) {
    if (!dateOk(e.entry_date)) return false;
    if (logger && e.logger !== logger) return false;
    if (kid) {
      var opKidList = e.kids || [];
      if (!opKidList.includes(kid) && !opKidList.includes('All')) return false;
    }
    if (anaView === 'incident' || anaView === 'health' || anaView === 'memories') return false;
    return true;
  });

  return { entries: entries, opEntries: opEntries };
}

function anaFormatPeriod(periodStr) {
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (periodStr.includes('-W')) {
    var wp = periodStr.split('-W');
    return 'Wk ' + parseInt(wp[1], 10) + ' \'' + wp[0].slice(2);
  }
  var pp = periodStr.split('-');
  return MONTHS[parseInt(pp[1], 10) - 1] + ' ' + pp[0];
}

function anaTimePeriod(dateStr, gran) {
  var d = new Date(dateStr);
  if (gran === 'month') {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  // ISO week number
  var d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var day = d2.getUTCDay() || 7;
  d2.setUTCDate(d2.getUTCDate() + 4 - day);
  var yearStart = new Date(Date.UTC(d2.getUTCFullYear(), 0, 1));
  var week = Math.ceil((((d2 - yearStart) / 86400000) + 1) / 7);
  return d2.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

function anaDestroyChart(key) {
  if (anaCharts[key]) { anaCharts[key].destroy(); delete anaCharts[key]; }
}

function anaShowOrEmpty(wrapId, emptyId, hasData) {
  var wrap = document.getElementById(wrapId);
  var empty = document.getElementById(emptyId);
  if (wrap) wrap.style.display = hasData ? '' : 'none';
  if (empty) empty.style.display = hasData ? 'none' : '';
}

function renderAnalytics() {
  var d = getAnaFiltered();
  renderAnaStats(d.entries, d.opEntries);
  renderAnaFreqChart(d.entries, d.opEntries);
  renderAnaPatternBars(d.entries);
  renderAnaPatternTimeline(d.entries);
  renderAnaTopPatterns(d.entries);
  renderAnaRatioChart(d.entries, d.opEntries);

  // Show/hide contextual cards
  var showSev = ['all', 'incident'].includes(anaView);
  var showPatterns = ['all', 'incident'].includes(anaView);
  var showRatio = ['all', 'incident', 'parenting'].includes(anaView);
  document.getElementById('ana-severity-box').style.display = showSev ? '' : 'none';
  document.getElementById('ana-patterns-box').style.display = showPatterns ? '' : 'none';
  document.getElementById('ana-top-patterns-box').style.display = showPatterns ? '' : 'none';
  document.getElementById('ana-ratio-box').style.display = showRatio ? '' : 'none';
}

// ── STAT CARDS ────────────────────────────────────────────────────────────────
function renderAnaStats(entries, opEntries) {
  var el = document.getElementById('ana-stat-grid');
  if (!el) return;
  var total = entries.length + opEntries.length;

  // ── Card 2: Habits Tracked ────────────────────────────────────────────────
  var posPats = allPatterns.filter(function (p) { return p.category === 'boys'; });
  var usPats = allPatterns.filter(function (p) { return p.category === 'us'; });
  var negPats = allPatterns.filter(function (p) { return p.category === 'mary'; });
  var posSlugs = posPats.map(function (p) { return p.slug; });
  var negSlugs = negPats.map(function (p) { return p.slug; });
  var posLogged = 0, negLogged = 0;
  entries.forEach(function (e) {
    (e.pattern_tags || []).forEach(function (slug) {
      if (posSlugs.includes(slug)) posLogged++;
      else if (negSlugs.includes(slug)) negLogged++;
    });
  });

  // ── Card 3: Communication Climate ────────────────────────────────────────
  var climateEntries = entries.filter(function (e) {
    return ['coparenting', 'coparenting-positive', 'parenting'].includes(e.category);
  });
  var posWeight = 0, negWeight = 0;
  climateEntries.forEach(function (e) {
    var isPositive = e.category === 'coparenting-positive' ||
      (e.category === 'parenting' && e.entry_subtype === 'positive-parenting');
    if (isPositive) posWeight += (e.severity || 4);
    else negWeight += (6 - (e.severity || 2));
  });
  var totalWeight = posWeight + negWeight;
  var climateRatio = totalWeight > 0 ? posWeight / totalWeight : null;
  var climateInfo = climateRatio === null ? { label: '—', color: 'var(--text3)' }
    : climateRatio >= 0.75 ? { label: 'Warm', color: 'var(--sage)' }
    : climateRatio >= 0.55 ? { label: 'Cooperative', color: '#8ab08a' }
    : climateRatio >= 0.4  ? { label: 'Neutral', color: 'var(--amber)' }
    : climateRatio >= 0.2  ? { label: 'Strained', color: '#ce7b8d' }
    : { label: 'Tense', color: 'var(--accent)' };

  // ── Card 4: Top Habit Logged ──────────────────────────────────────────────
  var patCounts = {};
  entries.forEach(function (e) {
    (e.pattern_tags || []).forEach(function (slug) { patCounts[slug] = (patCounts[slug] || 0) + 1; });
  });
  var topPatEntry = Object.entries(patCounts).sort(function (a, b) { return b[1] - a[1]; })[0];
  var topPatLabel = '—', topPatSub = '';
  if (topPatEntry) {
    var topPat = allPatterns.find(function (p) { return p.slug === topPatEntry[0]; });
    topPatLabel = topPat ? topPat.label : topPatEntry[0];
    topPatSub = topPatEntry[1] + '× logged';
  }

  var habitsHtml = '<div class="ana-stat-card">' +
    '<div class="ana-stat-val" style="font-size:18px;line-height:1.4;">' +
      '<span style="color:var(--sage);font-weight:600;">' + posLogged + ' Positive</span><br>' +
      '<span style="color:var(--accent);font-weight:600;">' + negLogged + ' Concerning</span>' +
    '</div>' +
    '<div class="ana-stat-lbl">Habits Logged</div>' +
    '</div>';

  el.innerHTML = [
    { label: 'Total Entries', val: total, sub: '' },
    null, // habits card rendered separately above
    { label: 'Communication Climate', val: climateInfo.label, valColor: climateInfo.color, sub: totalWeight > 0 ? 'based on ' + climateEntries.length + ' entries' : 'no communication data' },
    { label: 'Top Habit Logged', val: topPatLabel, sub: topPatSub, valSmall: true },
  ].map(function (s, i) {
    if (i === 1) return habitsHtml;
    var valStyle = s.valColor ? 'color:' + s.valColor + ';' : '';
    if (s.valSmall) valStyle += 'font-size:15px;line-height:1.25;word-break:break-word;';
    return '<div class="ana-stat-card">' +
      '<div class="ana-stat-val" style="' + valStyle + '">' + s.val + '</div>' +
      '<div class="ana-stat-lbl">' + s.label + '</div>' +
      (s.sub ? '<div class="ana-stat-sub">' + s.sub + '</div>' : '') +
      '</div>';
  }).join('');
}

// ── FREQUENCY CHART ───────────────────────────────────────────────────────────
function renderAnaFreqChart(entries, opEntries) {
  anaDestroyChart('freq');
  var periods = {};

  var CAT_COLORS = {
    incident: { bg: 'rgba(154,80,112,.65)', bd: '#9a5070' },
    parenting: { bg: 'rgba(202,143,165,.65)', bd: '#ca8fa5' },
    health: { bg: 'rgba(72,112,168,.65)', bd: '#4870a8' },
    memories: { bg: 'rgba(103,133,102,.65)', bd: '#678566' },
    reflection: { bg: 'rgba(176,120,48,.65)', bd: '#b07830' },
    entry: { bg: 'rgba(202,143,165,.65)', bd: '#ca8fa5' },
  };

  function addEntry(e, key) {
    var p = anaTimePeriod(e.entry_date, anaGran);
    if (!periods[p]) periods[p] = {};
    periods[p][key] = (periods[p][key] || 0) + 1;
  }

  if (anaView === 'all') {
    entries.forEach(function (e) {
      var key = e.category === 'health' ? 'health'
        : e.category === 'memories' ? 'memories'
        : e.entry_type === 'reflection' ? 'reflection'
        : 'incident';
      addEntry(e, key);
    });
    opEntries.forEach(function (e) { addEntry(e, 'parenting'); });
  } else {
    entries.forEach(function (e) { addEntry(e, 'entry'); });
    opEntries.forEach(function (e) { addEntry(e, 'entry'); });
  }

  var sortedPeriods = Object.keys(periods).sort();
  anaShowOrEmpty('ana-freq-wrap', 'ana-freq-empty', sortedPeriods.length > 0);
  if (!sortedPeriods.length) return;

  var datasets;
  if (anaView === 'all') {
    var sourceKeys = ['incident', 'parenting', 'health', 'memories', 'reflection'];
    var sourceLabels = { incident: 'Co-Parenting Log', parenting: 'Our Parenting', health: 'Health', memories: 'Memories', reflection: 'Reflections' };
    datasets = sourceKeys
      .filter(function (k) { return sortedPeriods.some(function (p) { return periods[p][k]; }); })
      .map(function (k) {
        return {
          label: sourceLabels[k],
          data: sortedPeriods.map(function (p) { return periods[p][k] || 0; }),
          backgroundColor: CAT_COLORS[k].bg,
          borderColor: CAT_COLORS[k].bd,
          borderWidth: 1,
        };
      });
  } else {
    var c = CAT_COLORS[anaView] || CAT_COLORS.entry;
    datasets = [{ label: 'Entries', data: sortedPeriods.map(function (p) { return periods[p].entry || 0; }), backgroundColor: c.bg, borderColor: c.bd, borderWidth: 1 }];
  }

  var ctx = document.getElementById('ana-freq-canvas').getContext('2d');
  anaCharts.freq = new Chart(ctx, {
    type: 'bar',
    data: { labels: sortedPeriods.map(anaFormatPeriod), datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: anaView === 'all', labels: { font: { family: 'Jost' }, boxWidth: 12 } } },
      scales: {
        x: { stacked: anaView === 'all', ticks: { font: { family: 'Jost', size: 11 } } },
        y: { stacked: anaView === 'all', beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Jost', size: 11 } } },
      },
    },
  });
}

// ── PATTERN TAG BARS ──────────────────────────────────────────────────────────
function renderAnaPatternBars(entries) {
  var el = document.getElementById('ana-pattern-bars');
  var emptyEl = document.getElementById('ana-pattern-empty');
  if (!el) return;
  var counts = {};
  entries.forEach(function (e) {
    (e.pattern_tags || []).forEach(function (slug) { counts[slug] = (counts[slug] || 0) + 1; });
  });
  var sorted = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12);
  var hasData = sorted.length > 0;
  el.style.display = hasData ? '' : 'none';
  if (emptyEl) emptyEl.style.display = hasData ? 'none' : '';
  if (!hasData) return;
  var max = sorted[0][1] || 1;
  el.innerHTML = sorted.map(function (kv) {
    var p = allPatterns.find(function (x) { return x.slug === kv[0]; });
    var label = p ? p.label : kv[0];
    var cat = p ? p.category : 'mary';
    var fillColor = cat === 'mary' ? 'var(--mauve)' : cat === 'us' ? 'var(--amber)' : 'var(--sage)';
    return '<div class="bar-row">' +
      '<div class="bar-label"><span class="ptag ptag-' + cat + '" style="font-size:10px;padding:2px 6px;">' + label + '</span></div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(kv[1] / max * 100) + '%;background:' + fillColor + ';"></div></div>' +
      '<div class="bar-count">' + kv[1] + '</div>' +
      '</div>';
  }).join('');
}

// ── PATTERN TIMELINE ──────────────────────────────────────────────────────────
var PAT_LINE_COLORS = ['#ce7b8d','#9a5070','#678566','#b07830','#4870a8','#8ab08a','#c0a8b0','#7a6080','#d4a040','#5890a0'];

function renderAnaPatternTimeline(entries) {
  anaDestroyChart('sev');

  // Count all pattern slugs across entries
  var patCounts = {};
  entries.forEach(function (e) {
    (e.pattern_tags || []).forEach(function (slug) { patCounts[slug] = (patCounts[slug] || 0) + 1; });
  });
  var allSlugs = Object.keys(patCounts).sort(function (a, b) { return patCounts[b] - patCounts[a]; });

  // Keep only slugs still present in data; default to top 5
  anaPatternTimePats = anaPatternTimePats.filter(function (s) { return allSlugs.includes(s); });
  var activeSlugs = anaPatternTimePats.length > 0 ? anaPatternTimePats : allSlugs.slice(0, 5);

  // Render filter pills (top 10 patterns)
  var pillEl = document.getElementById('ana-pat-timeline-pills');
  if (pillEl) {
    pillEl.innerHTML = allSlugs.slice(0, 10).map(function (slug) {
      var pat = allPatterns.find(function (p) { return p.slug === slug; });
      var label = pat ? pat.label : slug;
      var isActive = activeSlugs.includes(slug);
      return '<button class="fpill' + (isActive ? ' active' : '') + '" onclick="togglePatTimeline(\'' + slug + '\')" style="margin:2px 3px 2px 0;font-size:11px;">' + label + '</button>';
    }).join('');
  }

  // Build period data for active slugs
  var allPeriods = new Set();
  var patData = {};
  activeSlugs.forEach(function (slug) { patData[slug] = {}; });

  entries.forEach(function (e) {
    var period = anaTimePeriod(e.entry_date, anaGran);
    allPeriods.add(period);
    (e.pattern_tags || []).forEach(function (slug) {
      if (patData[slug]) patData[slug][period] = (patData[slug][period] || 0) + 1;
    });
  });

  var sortedPeriods = Array.from(allPeriods).sort();
  var hasData = sortedPeriods.length > 0 && activeSlugs.length > 0;
  anaShowOrEmpty('ana-sev-wrap', 'ana-sev-empty', hasData);
  if (!hasData) return;

  var datasets = activeSlugs.map(function (slug, i) {
    var pat = allPatterns.find(function (p) { return p.slug === slug; });
    var color = PAT_LINE_COLORS[i % PAT_LINE_COLORS.length];
    return {
      label: pat ? pat.label : slug,
      data: sortedPeriods.map(function (p) { return patData[slug][p] || 0; }),
      borderColor: color,
      backgroundColor: color + '22',
      fill: false,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: color,
    };
  });

  var ctx = document.getElementById('ana-sev-canvas').getContext('2d');
  anaCharts.sev = new Chart(ctx, {
    type: 'line',
    data: { labels: sortedPeriods.map(anaFormatPeriod), datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: { family: 'Jost', size: 10 }, boxWidth: 10, padding: 6 } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Jost', size: 11 } } },
        x: { ticks: { font: { family: 'Jost', size: 11 } } },
      },
    },
  });
}

function togglePatTimeline(slug) {
  // If nothing explicitly selected, start with current auto-top-5 as the base
  if (anaPatternTimePats.length === 0) {
    var d = getAnaFiltered();
    var counts = {};
    d.entries.forEach(function (e) {
      (e.pattern_tags || []).forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
    });
    anaPatternTimePats = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);
  }
  if (anaPatternTimePats.includes(slug)) {
    anaPatternTimePats = anaPatternTimePats.filter(function (s) { return s !== slug; });
  } else {
    anaPatternTimePats.push(slug);
  }
  var d = getAnaFiltered();
  renderAnaPatternTimeline(d.entries);
}

// ── OUTCOME DONUT ─────────────────────────────────────────────────────────────
function renderAnaOutcomeChart(opEntries) {
  anaDestroyChart('outcome');
  var counts = {};
  LIST_OUTCOMES.forEach(function (o) { counts[o] = 0; });
  opEntries.forEach(function (e) {
    var o = e.outcome || 'N/A';
    if (counts[o] !== undefined) counts[o]++;
    else counts['N/A']++;
  });
  var hasData = opEntries.length > 0;
  anaShowOrEmpty('ana-outcome-wrap', 'ana-outcome-empty', hasData);
  if (!hasData) return;
  var OUTCOME_COLORS = {
    'Acknowledged No Response': '#b07830',
    'Ignored': '#9a5070',
    'Accepted': '#678566',
    'Declined': '#ce7b8d',
    'N/A': '#c0a8b0',
  };
  var ctx = document.getElementById('ana-outcome-canvas').getContext('2d');
  anaCharts.outcome = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: LIST_OUTCOMES,
      datasets: [{
        data: LIST_OUTCOMES.map(function (o) { return counts[o]; }),
        backgroundColor: LIST_OUTCOMES.map(function (o) { return OUTCOME_COLORS[o] || '#ccc'; }),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Jost', size: 11 }, boxWidth: 12, padding: 8 } },
      },
    },
  });
}

// ── TOP 5 PATTERNS ────────────────────────────────────────────────────────────
function renderAnaTopPatterns(entries) {
  var el = document.getElementById('ana-top-patterns-list');
  var emptyEl = document.getElementById('ana-top-patterns-empty');
  if (!el) return;
  var counts = {};
  entries.forEach(function (e) {
    (e.pattern_tags || []).forEach(function (slug) { counts[slug] = (counts[slug] || 0) + 1; });
  });
  var sorted = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
  var hasData = sorted.length > 0;
  el.style.display = hasData ? '' : 'none';
  if (emptyEl) emptyEl.style.display = hasData ? 'none' : '';
  if (!hasData) return;
  el.innerHTML = sorted.map(function (kv, idx) {
    var p = allPatterns.find(function (x) { return x.slug === kv[0]; });
    var label = p ? p.label : kv[0];
    var cat = p ? p.category : 'mary';
    return '<div class="ana-top-item">' +
      '<div class="ana-top-rank">' + (idx + 1) + '</div>' +
      '<div class="ana-top-body"><span class="ptag ptag-' + cat + '" style="font-size:11px;">' + label + '</span></div>' +
      '<div class="ana-top-count">' + kv[1] + '×</div>' +
      '</div>';
  }).join('');
}

// ── ACTIONS VS INCIDENTS CHART ────────────────────────────────────────────────
function renderAnaRatioChart(entries, opEntries) {
  anaDestroyChart('ratio');
  var incidents = entries.filter(function (e) { return e.entry_type === 'capture' && e.severity && e.severity <= 2; });
  var iByPeriod = {};
  var aByPeriod = {};
  incidents.forEach(function (e) {
    var p = anaTimePeriod(e.entry_date, 'month');
    iByPeriod[p] = (iByPeriod[p] || 0) + 1;
  });
  opEntries.forEach(function (e) {
    var p = anaTimePeriod(e.entry_date, 'month');
    aByPeriod[p] = (aByPeriod[p] || 0) + 1;
  });
  var allPeriods = Array.from(new Set(Object.keys(iByPeriod).concat(Object.keys(aByPeriod)))).sort();
  var hasData = allPeriods.length > 0;
  anaShowOrEmpty('ana-ratio-wrap', 'ana-ratio-empty', hasData);
  if (!hasData) return;
  var ctx = document.getElementById('ana-ratio-canvas').getContext('2d');
  anaCharts.ratio = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: allPeriods.map(anaFormatPeriod),
      datasets: [
        {
          label: 'Our Actions',
          data: allPeriods.map(function (p) { return aByPeriod[p] || 0; }),
          backgroundColor: 'rgba(103,133,102,.7)', borderColor: '#678566', borderWidth: 1,
        },
        {
          label: 'Concerning Incidents',
          data: allPeriods.map(function (p) { return iByPeriod[p] || 0; }),
          backgroundColor: 'rgba(154,80,112,.7)', borderColor: '#9a5070', borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Jost', size: 11 }, boxWidth: 12, padding: 8 } } },
      scales: {
        x: { ticks: { font: { family: 'Jost', size: 11 } } },
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Jost', size: 11 } } },
      },
    },
  });
}

// ── ANALYTICS TABLE VIEW ──────────────────────────────────────────────────────
function renderAnaTable() {
  var d = getAnaFiltered();
  var search = ((document.getElementById('ana-table-search') || {}).value || '').toLowerCase();
  var sortVal = (document.getElementById('ana-table-sort') || {}).value || 'date-desc';

  var rows = d.entries.map(function (e) {
    return {
      date: e.entry_date,
      log: e.category_name || (e.entry_type === 'reflection' ? 'Reflection' : e.category || 'Entry'),
      category: e.category || '',
      type: e.type_name || e.type || (e.entry_type === 'reflection' ? 'Daily Reflection' : ''),
      people: ((e.people || []).length ? e.people.join(', ') : '') || (e.kid || ''),
      severity: e.severity || null,
      logger: e.logger || '',
      facts: e.facts || '',
    };
  }).concat(d.opEntries.map(function (e) {
    var action = OUR_PARENTING_ACTIONS.find(function (a) { return a.id === e.action_type; });
    return {
      date: e.entry_date,
      log: 'Our Parenting',
      category: 'our-parenting',
      type: action ? action.label : (e.action_type || ''),
      people: (e.kids || []).join(', '),
      severity: null,
      logger: e.logger || '',
      facts: e.notes || '',
    };
  }));

  if (search) {
    rows = rows.filter(function (r) {
      return [r.log, r.type, r.people, r.facts, r.logger].join(' ').toLowerCase().indexOf(search) !== -1;
    });
  }

  rows.sort(function (a, b) {
    if (sortVal === 'sev-desc') return (b.severity || 0) - (a.severity || 0);
    if (sortVal === 'sev-asc') return (a.severity || 0) - (b.severity || 0);
    var dir = sortVal === 'date-asc' ? 1 : -1;
    return dir * (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  });

  var tbody = document.getElementById('ana-table-body');
  var empty = document.getElementById('ana-table-empty');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  var CAT_BADGE = {
    kids: 'b-kids', parenting: 'b-parenting', coparenting: 'b-coparenting',
    'coparenting-positive': 'b-memories', memories: 'b-memories', health: 'b-health',
    'our-parenting': 'b-parenting', reflection: 'b-type',
  };

  tbody.innerHTML = rows.map(function (r) {
    var d = new Date(r.date);
    var ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    var catCls = CAT_BADGE[r.category] || 'b-type';
    var sevStr = r.severity
      ? '<span class="bdg b-type" style="font-size:10px;">' + r.severity + '/5</span>'
      : '<span style="color:var(--text3);font-size:12px;">—</span>';
    return '<tr>' +
      '<td style="white-space:nowrap;">' + ds + '</td>' +
      '<td><span class="bdg ' + catCls + '" style="font-size:10px;">' + r.log + '</span></td>' +
      '<td style="font-size:12px;color:var(--text2);">' + (r.type || '—') + '</td>' +
      '<td style="font-size:12px;color:var(--text2);">' + (r.people || '—') + '</td>' +
      '<td>' + sevStr + '</td>' +
      '<td><span class="bdg ' + (r.logger === 'Dave' ? 'b-d' : 'b-h') + '" style="font-size:10px;">' + r.logger + '</span></td>' +
      '</tr>';
  }).join('');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
loadTheme();
initAuth();
