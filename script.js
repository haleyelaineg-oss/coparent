// ── SUPABASE CLIENT INIT ──────────────────────────────────────────────────────
var SUPABASE_URL = 'https://cjomxvxopnjmqfxaqeiu.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqb214dnhvcG5qbXFmeGFxZWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTg2MTUsImV4cCI6MjA4OTQzNDYxNX0.qN2JPCotyAJpcosg2TKlsM4eXHUrbmeTJtQaAGHKwF0';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
var ALLOWED_EMAILS = [
  'haleyelaineg@gmail.com',
  'davidvincent2007@gmail.com',
  'admin@hd-enterprises.us',
];

// ── DEFAULTS ──────────────────────────────────────────────────────────────────
var DEFAULT_TAGS = [
  { id: 't1', name: 'Preference expressed', type: 'preference' },
  { id: 't2', name: 'Co-parent issue', type: 'coparent' },
  { id: 't3', name: 'Boundary violation', type: 'coparent' },
  { id: 't4', name: 'Emotional distress', type: 'general' },
  { id: 't5', name: 'School related', type: 'general' },
  { id: 't6', name: 'Dismissive behavior', type: 'coparent' },
  { id: 't7', name: 'Withholding information', type: 'coparent' },
  { id: 't8', name: 'Communication failure', type: 'coparent' },
  { id: 't9', name: 'Unprompted statement', type: 'preference' },
  { id: 't10', name: 'Bedtime issue', type: 'general' },
  { id: 't11', name: 'Pickup/dropoff issue', type: 'coparent' },
  { id: 't12', name: 'Positive moment', type: 'positive' },
];

var DEFAULT_FEELINGS = [
  'Frustrated', 'Anxious', 'Dismissed', 'Disrespected', 'Hopeful',
  'Relieved', 'Angry', 'Sad', 'Confused', 'Calm', 'Exhausted',
  'Overwhelmed', 'Validated', 'Drained',
];

var DEFAULT_CHECKINS = [
  { id: 'ci1', name: 'Homework check — boys', freq: 'daily', who: 'Haley & Dave' },
  { id: 'ci2', name: 'Follow up with school', freq: 'weekly', who: 'Haley' },
  { id: 'ci3', name: 'Attorney update', freq: 'monthly', who: 'Haley & Dave' },
];

var KIDS = ['Landon', 'Luke', 'Leo'];

var MOODS = [
  { emoji: '😄', label: 'Happy' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤒', label: 'Sick' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😐', label: 'Okay' },
];

var FACTOR_HINTS = {
  '(A) Emotional bond': 'Document the boys seeking comfort, expressing love, emotional regulation in your care.',
  '(B) Guidance & education': 'Homework involvement, school conferences, discipline approach.',
  '(C) Material & medical needs': 'Medical appointments, clothing, food, childcare.',
  '(D) Stable environment': 'Housing stability, consistent routines, school continuity.',
  '(E) Permanence of home': 'Who lives in each home, stability of family unit.',
  '(F) Moral fitness': 'CPS involvement, criminal history, substance use.',
  '(G) Mental & physical health': 'Conditions impacting ability to parent. Therapy.',
  "(I) Child's preference": 'Unprompted statements only — never ask directly.',
  '(J) Co-parenting cooperation': 'Ignored messages, schedule violations, criticism in front of kids.',
  '(K) Domestic violence': 'Emotional invalidation, verbal abuse, dismissiveness, control.',
  '(L) Other relevant factor': "Anything relevant that doesn't fit above.",
};

// ── AUTH STATE ────────────────────────────────────────────────────────────────
var currentUser = null;

// ── APP STATE ─────────────────────────────────────────────────────────────────
var allEntries = [];
var currentFilter = 'all';
var incKids = [], posKids = [];
var distressVal = 0, flagged = false;
var incAtts = [], posAtts = [];
var incSelectedTags = [], posSelectedTags = [];

// Flow state
var flowStep = 0;
var flowKidsHome = true;
var flowMaryContact = false;
var flowMaryLikert = 0;
var flowSelectedFeelings = [];
var flowMoods = {};
var flowStruggles = {};
var flowPositives = {};
var FLOW_STEPS_KIDS = [0, 1, 2, 3, 4, 5, 6, 7];
var FLOW_STEPS_NOKIDS = [0, 1, 5, 6, 7];

// ── LOCAL SETTINGS ────────────────────────────────────────────────────────────
// Non-sensitive UI prefs only (tags, feelings, check-ins, logger name)
function ls(k, v) {
  if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
  localStorage.setItem(k, JSON.stringify(v));
}

function getTags() { return ls('tags') || DEFAULT_TAGS; }
function getFeelings() { return ls('feelings') || DEFAULT_FEELINGS; }
function getCheckIns() { return ls('checkins') || DEFAULT_CHECKINS; }

// ── AUTH ──────────────────────────────────────────────────────────────────────
function showScreen(id) {
  ['screen-login', 'screen-check-email', 'screen-app'].forEach(function (s) {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'flex';
}

async function sendMagicLink() {
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var btn = document.getElementById('login-btn');
  var err = document.getElementById('login-err');
  err.textContent = '';

  if (!email) { err.textContent = 'Please enter your email address.'; return; }
  if (!ALLOWED_EMAILS.map(function(e){ return e.toLowerCase(); }).includes(email)) {
    err.textContent = 'That email isn\'t authorized to access this app.';
    return;
  }

  btn.textContent = 'Sending...';
  btn.disabled = true;

  var { error } = await sb.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: window.location.href,
    },
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

async function signOut() {
  await sb.auth.signOut();
  currentUser = null;
  showScreen('screen-login');
}

function getLoggerName(email) {
  if (!email) return 'Haley';
  var lower = email.toLowerCase();
  // Map email to display name
  if (lower === ALLOWED_EMAILS[0].toLowerCase()) return 'Haley';
  if (lower === ALLOWED_EMAILS[1].toLowerCase()) return 'Dave';
  return email.split('@')[0];
}

// Login with Password
var passwordMode = false;

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
  if (!ALLOWED_EMAILS.map(function(e){ return e.toLowerCase(); }).includes(email)) {
    err.textContent = 'That email isn\'t authorized to access this app.';
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
  // onAuthStateChange handles the rest if successful
}

// ── INIT AUTH ─────────────────────────────────────────────────────────────────
async function initAuth() {
  // Check for existing session
  var { data: { session } } = await sb.auth.getSession();

  if (session) {
    currentUser = session.user;
    onAuthenticated();
  } else {
    showScreen('screen-login');
  }

  // Listen for auth state changes (handles magic link redirect)
  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      onAuthenticated();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showScreen('screen-login');
    }
  });
}

function onAuthenticated() {
  var name = getLoggerName(currentUser.email);
  // Set the logger name based on who's logged in
  ls('logger', name);

  // Show user info in header
  var el = document.getElementById('hdr-user');
  if (el) el.textContent = name;

  showScreen('screen-app');
  loadLogger();
  renderDashboard();
  loadEntries().then(updateCount);
}

// ── LOGGER ────────────────────────────────────────────────────────────────────
function setLogger(v) {
  ls('logger', v);
  ['ref-logger', 'inc-logger', 'pos-logger'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = v;
  });
}

function loadLogger() {
  var v = ls('logger') || 'Haley';
  ['ref-logger', 'inc-logger', 'pos-logger'].forEach(function (id) {
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
  if (page === 'viewlog') loadEntries().then(renderEntries);
  if (page === 'summary') loadEntries().then(renderSummary);
  if (page === 'settings') renderSettings();
  if (page === 'incident') { renderTagButtons('inc'); setNow('inc-date'); }
  if (page === 'positive') { renderTagButtons('pos'); setNow('pos-date'); }
  if (page === 'reflection') initFlow();
  if (page === 'dashboard') renderDashboard();
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  var h = new Date().getHours();
  var name = ls('logger') || 'Haley';
  var greet = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', ' + name + '.';
  document.getElementById('dash-greeting').textContent = greet;
  var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-US', opts);
  renderCheckInDash();
}

function renderCheckInDash() {
  var items = getCheckIns();
  var el = document.getElementById('dash-checkins');
  if (!items.length) {
    el.innerHTML = '<div class="empty">No check-in items yet. Add them in Settings.</div>';
    return;
  }
  var today = new Date().toISOString().slice(0, 10);
  var completed = ls('ci_completed') || {};
  el.innerHTML = '<div class="ci-list">' + items.map(function (item) {
    var doneToday = completed[item.id] === today;
    var cls = 'ci-item' + (doneToday ? '' : ' overdue');
    var meta = item.freq + (item.who ? ' · ' + item.who : '') + (doneToday ? ' · Done today' : ' · Not marked today');
    return '<div class="' + cls + '">' +
      '<div class="ci-dot"></div>' +
      '<div class="ci-body"><div class="ci-name">' + item.name + '</div>' +
      '<div class="ci-meta">' + meta + '</div></div>' +
      '</div>';
  }).join('') + '</div>';
}

// ── FLOW ──────────────────────────────────────────────────────────────────────
function initFlow() {
  flowStep = 0;
  flowKidsHome = true;
  flowMaryContact = false;
  flowMaryLikert = 0;
  flowSelectedFeelings = [];
  flowMoods = {};
  flowStruggles = {};
  flowPositives = {};
  document.querySelectorAll('.flow-step').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('step-0').classList.add('active');
  var now = new Date();
  document.getElementById('ref-date-sub').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
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
  if (n === 7) buildReviewSummary();
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

function setMaryContact(val) {
  flowMaryContact = val;
  if (val) flowNext();
  else goToStep(7);
}

function setMaryLikert(val, btn) {
  flowMaryLikert = val;
  document.getElementById('mary-likert').querySelectorAll('.lk-btn').forEach(function (b, i) {
    b.className = 'lk-btn';
    if (i < val) b.classList.add('s' + val);
  });
}

function renderFeelings() {
  var feelings = getFeelings();
  var el = document.getElementById('feelings-wrap');
  if (!el) return;
  el.innerHTML = feelings.map(function (f) {
    return '<div class="feeling-btn' + (flowSelectedFeelings.includes(f) ? ' on' : '') + '" onclick="toggleFeeling(\'' + f.replace(/'/g, "\\'") + '\')">' + f + '</div>';
  }).join('');
}

function toggleFeeling(f) {
  if (flowSelectedFeelings.includes(f)) flowSelectedFeelings.splice(flowSelectedFeelings.indexOf(f), 1);
  else flowSelectedFeelings.push(f);
  renderFeelings();
}

function buildMoodSections() {
  var el = document.getElementById('mood-sections');
  el.innerHTML = KIDS.map(function (kid) {
    var moods = MOODS.map(function (m) {
      var on = flowMoods[kid] === m.label;
      return '<div class="mood-opt' + (on ? ' on' : '') + '" onclick="setMood(\'' + kid + '\',\'' + m.label + '\')">' +
        '<div class="mood-icon">' + m.emoji + '</div>' +
        '<div class="mood-lbl">' + m.label + '</div></div>';
    }).join('');
    return '<div class="kid-section"><div class="kid-section-name">' + kid + '</div><div class="mood-row">' + moods + '</div></div>';
  }).join('');
}

function setMood(kid, mood) { flowMoods[kid] = mood; buildMoodSections(); }

function buildStruggleSections() {
  var el = document.getElementById('struggle-sections');
  el.innerHTML = KIDS.map(function (kid) {
    return '<div class="kid-section">' +
      '<div class="kid-section-name">' + kid + '</div>' +
      '<textarea id="struggle-' + kid + '" placeholder="Any struggles for ' + kid + ' today? Leave blank if none." style="min-height:70px;width:100%;">' +
      (flowStruggles[kid] || '') + '</textarea></div>';
  }).join('');
}

function buildPositiveSections() {
  var el = document.getElementById('positive-sections');
  el.innerHTML = KIDS.map(function (kid) {
    return '<div class="kid-section">' +
      '<div class="kid-section-name">' + kid + '</div>' +
      '<textarea id="positive-' + kid + '" placeholder="Any wins or good moments with ' + kid + ' today? Leave blank if none." style="min-height:70px;width:100%;">' +
      (flowPositives[kid] || '') + '</textarea></div>';
  }).join('');
}

function captureFlowData() {
  KIDS.forEach(function (kid) {
    var sel = document.getElementById('struggle-' + kid);
    if (sel) flowStruggles[kid] = sel.value.trim();
    var pel = document.getElementById('positive-' + kid);
    if (pel) flowPositives[kid] = pel.value.trim();
  });
}

function maryLikertLabel(n) { return ['', 'Pleasant', 'Neutral', 'Tense', 'Difficult', 'Distressing'][n] || ''; }

function buildReviewSummary() {
  captureFlowData();
  var el = document.getElementById('review-summary');
  var html = '<div style="display:flex;flex-direction:column;gap:10px;">';

  html += '<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px;">Kids</div>';
  html += '<div style="font-size:14px;color:var(--text);">' + (flowKidsHome ? 'Home today' : 'Not home today') + '</div></div>';

  if (flowKidsHome) {
    html += '<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px;">Moods</div>';
    html += KIDS.map(function (k) {
      return '<div style="font-size:14px;color:var(--text);">' + k + ': ' + (flowMoods[k] || 'Not recorded') + '</div>';
    }).join('');
    html += '</div>';

    var hasStruggles = KIDS.some(function (k) { return flowStruggles[k]; });
    if (hasStruggles) {
      html += '<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px;">Struggles</div>';
      html += KIDS.filter(function (k) { return flowStruggles[k]; }).map(function (k) {
        return '<div style="font-size:14px;color:var(--text);margin-bottom:3px;"><strong>' + k + ':</strong> ' + flowStruggles[k] + '</div>';
      }).join('');
      html += '</div>';
    }

    var hasPositives = KIDS.some(function (k) { return flowPositives[k]; });
    if (hasPositives) {
      html += '<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px;">Positive Moments</div>';
      html += KIDS.filter(function (k) { return flowPositives[k]; }).map(function (k) {
        return '<div style="font-size:14px;color:var(--text);margin-bottom:3px;"><strong>' + k + ':</strong> ' + flowPositives[k] + '</div>';
      }).join('');
      html += '</div>';
    }
  }

  html += '<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px;">Mary Communication</div>';
  if (flowMaryContact) {
    html += '<div style="font-size:14px;color:var(--text);">Yes — ' + maryLikertLabel(flowMaryLikert) + (flowSelectedFeelings.length ? ' · ' + flowSelectedFeelings.join(', ') : '') + '</div>';
    var mn = document.getElementById('mary-notes');
    if (mn && mn.value.trim()) html += '<div style="font-size:13px;color:var(--text2);margin-top:4px;font-style:italic;">' + mn.value.trim() + '</div>';
  } else {
    html += '<div style="font-size:14px;color:var(--text);">No contact today</div>';
  }
  html += '</div></div>';
  el.innerHTML = html;
}

// ── SAVE REFLECTION ───────────────────────────────────────────────────────────
async function saveReflection() {
  var maryNotes = document.getElementById('mary-notes').value.trim();
  var entry = {
    entry_type: 'reflection',
    entry_date: new Date().toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    kids: KIDS,
    kids_home: flowKidsHome,
    moods: flowMoods,
    struggles: flowStruggles,
    positives: flowPositives,
    mary_contact: flowMaryContact,
    mary_likert: flowMaryContact ? flowMaryLikert : null,
    mary_feelings: flowMaryContact ? flowSelectedFeelings : [],
    mary_notes: flowMaryContact ? maryNotes : '',
    flagged: false,
    tags: [],
  };

  var today = new Date().toISOString().slice(0, 10);
  var completed = ls('ci_completed') || {};
  getCheckIns().forEach(function (ci) { completed[ci.id] = today; });
  ls('ci_completed', completed);

  await saveEntryToStore(entry, 'ref');
}

// ── SAVE INCIDENT ─────────────────────────────────────────────────────────────
async function saveIncident() {
  var incident = document.getElementById('inc-incident').value.trim();
  var factor = document.getElementById('inc-factor').value;
  if (!incident) { showToast('inc', 'err', 'Please describe what happened.'); return; }
  if (!factor) { showToast('inc', 'err', 'Please select a best-interest factor.'); return; }
  if (!incKids.length) { showToast('inc', 'err', 'Please select which kid(s).'); return; }

  var entry = {
    entry_type: 'incident',
    entry_date: new Date(document.getElementById('inc-date').value || Date.now()).toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    kids: incKids.slice(),
    factor: factor,
    incident: incident,
    quote: document.getElementById('inc-quote').value.trim(),
    witnesses: document.getElementById('inc-witnesses').value.trim(),
    flagged: flagged,
    child_distress: distressVal || null,
    tags: incSelectedTags.slice(),
    attachments: incAtts.map(function (a) { return { name: a.name, size: a.size, type: a.type }; }),
  };

  await saveEntryToStore(entry, 'inc');
}

// ── SAVE POSITIVE ─────────────────────────────────────────────────────────────
async function savePositive() {
  var body = document.getElementById('pos-body').value.trim();
  if (!body) { showToast('pos', 'err', 'Please describe the moment.'); return; }
  if (!posKids.length) { showToast('pos', 'err', 'Please select which kid(s).'); return; }

  var entry = {
    entry_type: 'positive',
    entry_date: new Date(document.getElementById('pos-date').value || Date.now()).toISOString(),
    logger: ls('logger') || 'Haley',
    user_id: currentUser.id,
    kids: posKids.slice(),
    incident: body,
    quote: document.getElementById('pos-quote').value.trim(),
    flagged: false,
    tags: posSelectedTags.slice(),
    attachments: [],
  };

  await saveEntryToStore(entry, 'pos');
}

// ── GENERIC SAVE ──────────────────────────────────────────────────────────────
async function saveEntryToStore(entry, prefix) {
  var { data, error } = await sb.from('entries').insert(entry).select();

  if (error) {
    showToast(prefix, 'err', 'Save failed: ' + error.message);
    return;
  }

  allEntries.unshift(data[0]);
  showToast(prefix, 'ok', 'Saved.');
  updateCount();

  if (prefix === 'inc') clearIncident();
  else if (prefix === 'pos') clearPositive();
  else if (prefix === 'ref') initFlow();
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

// ── CLEAR FORMS ───────────────────────────────────────────────────────────────
function clearIncident() {
  ['inc-incident', 'inc-quote', 'inc-witnesses'].forEach(function (id) { document.getElementById(id).value = ''; });
  document.getElementById('inc-factor').value = '';
  document.getElementById('inc-hint').textContent = '';
  incKids = []; incAtts = []; incSelectedTags = []; distressVal = 0; flagged = false;
 ['Landon', 'Luke', 'Leo', 'All', 'Haley', 'Dave'].forEach(function (k) {
  var el = document.getElementById('ick-' + k);
  if (el) el.classList.remove('on');
});
  document.querySelectorAll('#inc-distress .lk-btn').forEach(function (b) { b.className = 'lk-btn'; });
  renderAtts('inc');
  renderTagButtons('inc');
}

function clearPositive() {
  ['pos-body', 'pos-quote'].forEach(function (id) { document.getElementById(id).value = ''; });
  posKids = []; posAtts = []; posSelectedTags = [];
 ['Landon', 'Luke', 'Leo', 'All'].forEach(function (k) {
  var el = document.getElementById('pok-' + k);
  if (el) el.classList.remove('on');
});
  renderAtts('pos');
  renderTagButtons('pos');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function setNow(id) {
  var n = new Date();
  document.getElementById(id).value = new Date(n - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function updateHint() {
  document.getElementById('inc-hint').textContent = FACTOR_HINTS[document.getElementById('inc-factor').value] || '';
}

function toggleKid(prefix, kid) {
  var pre = prefix === 'inc' ? 'ick-' : 'pok-';
  var current = prefix === 'inc' ? incKids : posKids;

  if (kid === 'All') {
    var isAll = current.includes('All');
    if (prefix === 'inc') incKids = isAll ? [] : ['All'];
    else posKids = isAll ? [] : ['All'];
    ['Landon', 'Luke', 'Leo', 'Haley', 'Dave'].forEach(function (k) {
      var el = document.getElementById(pre + k);
      if (el) el.classList.remove('on');
    });
  } else {
    if (prefix === 'inc') {
      incKids = incKids.filter(function (k) { return k !== 'All'; });
      if (incKids.includes(kid)) incKids = incKids.filter(function (k) { return k !== kid; });
      else incKids.push(kid);
    } else {
      posKids = posKids.filter(function (k) { return k !== 'All'; });
      if (posKids.includes(kid)) posKids = posKids.filter(function (k) { return k !== kid; });
      else posKids.push(kid);
    }
    var allEl = document.getElementById(pre + 'All');
    if (allEl) allEl.classList.remove('on');
  }

  var updated = prefix === 'inc' ? incKids : posKids;
  ['Landon', 'Luke', 'Leo', 'All', 'Haley', 'Dave'].forEach(function (k) {
    var el = document.getElementById(pre + k);
    if (el) el.classList.toggle('on', updated.includes(k));
  });
}

function renderTagButtons(prefix) {
  var tags = getTags();
  var sel = prefix === 'inc' ? incSelectedTags : posSelectedTags;
  var el = document.getElementById(prefix + '-tags');
  if (!el) return;
  el.innerHTML = tags.map(function (t) {
    var cls = 'tag-btn' + (sel.includes(t.id) ? ' on ' + t.type : '');
    return '<div class="' + cls + '" onclick="toggleTag(\'' + prefix + '\',\'' + t.id + '\')">' + t.name + '</div>';
  }).join('');
}

function toggleTag(prefix, tid) {
  var arr = prefix === 'inc' ? incSelectedTags : posSelectedTags;
  if (arr.includes(tid)) arr.splice(arr.indexOf(tid), 1);
  else arr.push(tid);
  renderTagButtons(prefix);
}

function setDistress(val, btn) {
  distressVal = val;
  document.getElementById('inc-distress').querySelectorAll('.lk-btn').forEach(function (b, i) {
    b.className = 'lk-btn';
    if (i < val) b.classList.add('s' + val);
  });
}

var flagOn = false;
function togFlag() {
  flagOn = !flagOn;
  flagged = flagOn;
  var sw = document.getElementById('flag-sw');
  var row = document.getElementById('tog-flagged');
  sw.style.background = flagOn ? 'var(--accent)' : 'var(--surface3)';
  sw.querySelector('div').style.transform = flagOn ? 'translateX(16px)' : '';
  row.style.background = flagOn ? 'var(--accent-l)' : '';
}

function handleFiles(prefix, files) {
  var arr = prefix === 'inc' ? incAtts : posAtts;
  Array.from(files).forEach(function (f) {
    arr.push({ name: f.name, size: (f.size / 1048576).toFixed(1) + ' MB', type: f.type });
  });
  renderAtts(prefix);
  document.getElementById(prefix + '-files').value = '';
}

function renderAtts(prefix) {
  var arr = prefix === 'inc' ? incAtts : posAtts;
  var el = document.getElementById(prefix + '-att-list');
  if (!el) return;
  el.innerHTML = arr.map(function (a, i) {
    return '<div class="att-item"><span class="att-name">' + a.name + '</span><span class="att-meta">' + a.size + '</span>' +
      '<button class="att-rm" onclick="rmAtt(\'' + prefix + '\',' + i + ')">×</button></div>';
  }).join('');
}

function rmAtt(prefix, i) {
  var arr = prefix === 'inc' ? incAtts : posAtts;
  arr.splice(i, 1);
  renderAtts(prefix);
}

// ── RENDER LOG ────────────────────────────────────────────────────────────────
function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('.fpill').forEach(function (p) { p.classList.remove('active'); });
  el.classList.add('active');
  renderEntries();
}

function distressLbl(n) { return ['', 'None', 'Mild', 'Moderate', 'High', 'Severe'][n] || ''; }

function renderEntries() {
  var list = document.getElementById('entries-list');
  var tags = getTags();
  var filtered = allEntries.filter(function (e) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'flagged') return e.flagged;
    if (['incident', 'positive', 'reflection'].includes(currentFilter)) return e.entry_type === currentFilter;
    if (currentFilter === 'Haley' || currentFilter === 'Dave') return e.logger === currentFilter;
    return (e.kids || []).includes(currentFilter) || (e.kids || []).includes('All');
  });

  updateCount();

  if (!filtered.length) {
    list.innerHTML = '<div class="empty">No entries match this filter.</div>';
    return;
  }

  list.innerHTML = filtered.map(function (e) {
    var d = new Date(e.entry_date || e.created_at);
    var ds = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    var kids = (e.kids || []).join(', ');
    var atts = e.attachments || [];
    var entryTags = (e.tags || []).map(function (tid) {
      var t = tags.find(function (x) { return x.id === tid; });
      return t ? '<span class="bdg b-tag">' + t.name + '</span>' : '';
    }).join('');
    var typeLabel = { incident: 'Incident', positive: 'Positive moment', reflection: 'Daily reflection' }[e.entry_type] || e.entry_type;
    var cardCls = 'ecard' + (e.flagged ? ' flagged' : '') + (e.entry_type === 'positive' ? ' positive' : '') + (e.entry_type === 'reflection' ? ' daily' : '');

    var body = '';
    if (e.entry_type === 'reflection') {
      var parts = [];
      if (e.kids_home === false) {
        parts.push('Kids not home.');
      } else {
        var moodStr = KIDS.filter(function (k) { return e.moods && e.moods[k]; })
          .map(function (k) { return k + ': ' + e.moods[k]; }).join(' · ');
        if (moodStr) parts.push('Moods — ' + moodStr);
        var struggles = KIDS.filter(function (k) { return e.struggles && e.struggles[k]; })
          .map(function (k) { return k + ': ' + e.struggles[k]; }).join(' | ');
        if (struggles) parts.push('Struggles — ' + struggles);
        var positives = KIDS.filter(function (k) { return e.positives && e.positives[k]; })
          .map(function (k) { return k + ': ' + e.positives[k]; }).join(' | ');
        if (positives) parts.push('Positives — ' + positives);
      }
      if (e.mary_contact) {
        parts.push('Mary: ' + maryLikertLabel(e.mary_likert) +
          (e.mary_feelings && e.mary_feelings.length ? ' (' + e.mary_feelings.join(', ') + ')' : ''));
      }
      body = parts.join('<br>');
    } else {
      body = e.incident || '';
    }

    return '<div class="' + cardCls + '">' +
      '<div class="ehdr">' +
        '<div class="badges">' +
          '<span class="bdg ' + (e.logger === 'Dave' ? 'b-d' : 'b-h') + '">' + e.logger + '</span>' +
          '<span class="bdg b-type">' + typeLabel + '</span>' +
          (kids ? '<span class="bdg b-kid">' + kids + '</span>' : '') +
          (e.factor ? '<span class="bdg b-factor">' + e.factor + '</span>' : '') +
          (e.flagged ? '<span class="bdg b-flagged">Flagged</span>' : '') +
          entryTags +
        '</div>' +
        '<span class="edate">' + ds + '</span>' +
      '</div>' +
      '<div class="ebody">' + body + '</div>' +
      (e.quote ? '<div class="equote">"' + e.quote + '"</div>' : '') +
      (e.child_distress ? '<div class="escale"><span class="stag">Distress ' + e.child_distress + '/5 — ' + distressLbl(e.child_distress) + '</span></div>' : '') +
      (e.witnesses ? '<div class="ewit">Witnesses: ' + e.witnesses + '</div>' : '') +
      (atts.length ? '<div class="eatts">' + atts.map(function (a) { return '<span class="atag">' + a.name + '</span>'; }).join('') + '</div>' : '') +
      '</div>';
  }).join('');
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
function renderSummary() {
  document.getElementById('s-total').textContent = allEntries.length;
  document.getElementById('s-inc').textContent = allEntries.filter(function (e) { return e.entry_type === 'incident'; }).length;
  document.getElementById('s-pos').textContent = allEntries.filter(function (e) { return e.entry_type === 'positive'; }).length;
  document.getElementById('s-flag').textContent = allEntries.filter(function (e) { return e.flagged; }).length;
}

function genExport() {
  if (!allEntries.length) { alert('No entries to export yet.'); return; }
  var incidents = allEntries.filter(function (e) { return e.entry_type === 'incident'; });
  var groups = {};
  incidents.forEach(function (e) { if (!groups[e.factor]) groups[e.factor] = []; groups[e.factor].push(e); });
  var flaggedList = incidents.filter(function (e) { return e.flagged; });
  var tags = getTags();

  function tagNames(ids) {
    return (ids || []).map(function (id) {
      var t = tags.find(function (x) { return x.id === id; });
      return t ? t.name : '';
    }).filter(Boolean).join(', ');
  }

  var out = 'PARENTING DOCUMENTATION LOG\nOttawa County — Custody Case\n';
  out += 'Generated: ' + new Date().toLocaleString() + '\n';
  out += 'Incidents: ' + incidents.length + ' | Positive: ' + allEntries.filter(function (e) { return e.entry_type === 'positive'; }).length +
    ' | Reflections: ' + allEntries.filter(function (e) { return e.entry_type === 'reflection'; }).length +
    ' | Flagged: ' + flaggedList.length + '\n';
  out += '='.repeat(60) + '\n\n';

  if (flaggedList.length) {
    out += '★ FLAGGED — PRIORITY FOR MOTION\n' + '-'.repeat(40) + '\n';
    flaggedList.forEach(function (e) {
      var d = new Date(e.entry_date || e.created_at);
      out += '\n[' + d.toLocaleDateString() + '] ' + e.logger + ' | ' + (e.kids || []).join(', ') + ' | ' + e.factor + '\n' + e.incident + '\n';
      if (e.quote) out += 'QUOTE: "' + e.quote + '"\n';
      if (e.witnesses) out += 'Witnesses: ' + e.witnesses + '\n';
    });
    out += '\n' + '='.repeat(60) + '\n\n';
  }

  out += 'INCIDENTS BY BEST-INTEREST FACTOR\n\n';
  Object.keys(groups).sort().forEach(function (factor) {
    out += factor.toUpperCase() + '\n' + '-'.repeat(40) + '\n';
    groups[factor].forEach(function (e) {
      var d = new Date(e.entry_date || e.created_at);
      out += '\n[' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '] ';
      out += e.logger + ' | ' + (e.kids || []).join(', ');
      if (e.child_distress) out += ' | Distress: ' + e.child_distress + '/5';
      if (e.flagged) out += ' ★';
      var tn = tagNames(e.tags); if (tn) out += ' | ' + tn;
      out += '\n' + e.incident + '\n';
      if (e.quote) out += 'DIRECT QUOTE: "' + e.quote + '"\n';
      if (e.witnesses) out += 'Witnesses: ' + e.witnesses + '\n';
      if (e.attachments && e.attachments.length) out += 'Attachments: ' + e.attachments.map(function (a) { return a.name; }).join(', ') + '\n';
    });
    out += '\n';
  });

  var positives = allEntries.filter(function (e) { return e.entry_type === 'positive'; });
  if (positives.length) {
    out += 'POSITIVE MOMENTS\n' + '-'.repeat(40) + '\n';
    positives.forEach(function (e) {
      var d = new Date(e.entry_date || e.created_at);
      out += '\n[' + d.toLocaleDateString() + '] ' + e.logger + ' | ' + (e.kids || []).join(', ') + '\n' + e.incident + '\n';
      if (e.quote) out += 'QUOTE: "' + e.quote + '"\n';
    });
  }

  var ta = document.getElementById('exp-text');
  ta.value = out;
  ta.style.display = 'block';
  document.getElementById('copy-hint').style.display = 'block';
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function renderSettings() { renderTagSettings(); renderFeelingsSettings(); renderCISettings(); }

function renderTagSettings() {
  var tags = getTags();
  var el = document.getElementById('tag-set-list');
  var colors = { general: 'var(--text2)', coparent: '#6040a0', preference: 'var(--rose)', positive: 'var(--sage)' };
  el.innerHTML = tags.map(function (t) {
    return '<div class="set-item"><div class="set-item-label">' + t.name + '</div>' +
      '<div class="set-item-meta" style="color:' + colors[t.type] + '">' + t.type + '</div>' +
      '<button class="btn-ghost" onclick="rmTag(\'' + t.id + '\')">Remove</button></div>';
  }).join('');
}

function addTag() {
  var name = document.getElementById('new-tag-name').value.trim();
  var type = document.getElementById('new-tag-type').value;
  if (!name) return;
  var tags = getTags();
  tags.push({ id: 't' + Date.now(), name: name, type: type });
  ls('tags', tags);
  renderTagSettings();
  document.getElementById('new-tag-name').value = '';
}

function rmTag(id) { ls('tags', getTags().filter(function (t) { return t.id !== id; })); renderTagSettings(); }

function renderFeelingsSettings() {
  var feelings = getFeelings();
  var el = document.getElementById('feelings-set-list');
  el.innerHTML = feelings.map(function (f, i) {
    return '<div class="set-item"><div class="set-item-label">' + f + '</div>' +
      '<button class="btn-ghost" onclick="rmFeeling(' + i + ')">Remove</button></div>';
  }).join('');
}

function addFeeling() {
  var f = document.getElementById('new-feeling').value.trim();
  if (!f) return;
  var feelings = getFeelings();
  feelings.push(f);
  ls('feelings', feelings);
  renderFeelingsSettings();
  document.getElementById('new-feeling').value = '';
}

function rmFeeling(i) {
  var feelings = getFeelings();
  feelings.splice(i, 1);
  ls('feelings', feelings);
  renderFeelingsSettings();
}

function renderCISettings() {
  var items = getCheckIns();
  var el = document.getElementById('ci-set-list');
  el.innerHTML = items.map(function (item) {
    return '<div class="set-item"><div class="set-item-label">' + item.name + '</div>' +
      '<div class="set-item-meta">' + item.freq + (item.who ? ' · ' + item.who : '') + '</div>' +
      '<button class="btn-ghost" onclick="rmCI(\'' + item.id + '\')">Remove</button></div>';
  }).join('');
}

function addCheckIn() {
  var name = document.getElementById('new-ci-name').value.trim();
  var freq = document.getElementById('new-ci-freq').value;
  var who = document.getElementById('new-ci-who').value.trim();
  if (!name) return;
  var items = getCheckIns();
  items.push({ id: 'ci' + Date.now(), name: name, freq: freq, who: who });
  ls('checkins', items);
  renderCISettings();
  document.getElementById('new-ci-name').value = '';
  document.getElementById('new-ci-who').value = '';
}

function rmCI(id) {
  ls('checkins', getCheckIns().filter(function (c) { return c.id !== id; }));
  renderCISettings();
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(prefix, type, msg) {
  var id = prefix + '-' + (type === 'ok' ? 'ok' : 'err');
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(function () { el.style.display = 'none'; }, 4000);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
initAuth();
