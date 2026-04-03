// ── COPARENT CONFIGURATION ────────────────────────────────────────────────────
// Edit this file to customize lists, locations, entry types, and kids.
// Changes here apply to both Haley and Dave automatically on next deploy.

var SUPABASE_URL = 'https://cjomxvxopnjmqfxaqeiu.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqb214dnhvcG5qbXFmeGFxZWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTg2MTUsImV4cCI6MjA4OTQzNDYxNX0.qN2JPCotyAJpcosg2TKlsM4eXHUrbmeTJtQaAGHKwF0';

var ALLOWED_EMAILS = [
  'haleyelaineg@gmail.com',
  'davidvincent2007@gmail.com',
  'admin@hd-enterprises.us',
];

// ── PEOPLE ────────────────────────────────────────────────────────────────────
var ALL_PEOPLE = ['Landon', 'Luke', 'Leo', 'Haley', 'Dave', 'Mary'];

// ── LOCATIONS ─────────────────────────────────────────────────────────────────
var LOCATIONS = [
  { id: 'l1', name: '10909 (Home)' },
  { id: 'l2', name: '2480 (Grandparents/Mom\'s)' },
  { id: 'l3', name: 'School' },
  { id: 'l4', name: 'Phone call' },
  { id: 'l5', name: 'Text message' },
  { id: 'l6', name: 'Email' },
  { id: 'l7', name: 'In transit' },
  { id: 'l8', name: 'Extracurricular' },
  { id: 'l9', name: 'Other' },
];

// ── INFORMATION SOURCES ───────────────────────────────────────────────────────
var INFO_SOURCES = [
  { id: 's1', name: 'We witnessed' },
  { id: 's2', name: 'Kids reported' },
  { id: 's3', name: 'Direct communication' },
  { id: 's4', name: 'School or teacher reported' },
  { id: 's5', name: 'Other' },
];

// ── ENTRY CATEGORIES & TYPES ──────────────────────────────────────────────────
// To add a new type, just add a line to the relevant category's types array.
var ENTRY_CATEGORIES = [
  {
    id: 'kids',
    name: 'Kids',
    icon: '◦',
    description: 'Kid behaviors, emotions, struggles, observations',
    color: 'var(--rose)',
    colorL: 'var(--rose-l)',
    types: [
      { id: 'emotional-positive', name: 'Emotional — positive', defaultSeverity: 5 },
      { id: 'emotional-struggle', name: 'Emotional struggle', defaultSeverity: 2 },
      { id: 'behavioral-positive', name: 'Behavioral — positive', defaultSeverity: 5 },
      { id: 'behavioral-concern', name: 'Behavioral concern', defaultSeverity: 2 },
      { id: 'educational-positive', name: 'Educational — positive', defaultSeverity: 5 },
      { id: 'educational-struggle', name: 'Educational struggle', defaultSeverity: 2 },
      { id: 'physical-health', name: 'Physical / health', defaultSeverity: 3 },
      { id: 'preference-expressed', name: 'Preference expressed', defaultSeverity: 3 },
      { id: 'positive-moment', name: 'Positive moment / memory', defaultSeverity: 5 },
    ]
  },
  {
    id: 'parenting',
    name: 'Parenting',
    icon: '♡',
    description: 'How Mary treats the kids — witnessed or reported',
    color: 'var(--mauve)',
    colorL: 'var(--mauve-l)',
    types: [
      { id: 'positive-parenting', name: 'Positive parenting moment', defaultSeverity: 5 },
      { id: 'dismissive', name: 'Dismissive / invalidating', defaultSeverity: 2 },
      { id: 'denying-choice', name: 'Denying choice or autonomy', defaultSeverity: 2 },
      { id: 'emotional-response', name: 'Emotional response to kids', defaultSeverity: 2 },
      { id: 'physical-care', name: 'Physical care concern', defaultSeverity: 1 },
      { id: 'kids-reported', name: 'Kids reported something', defaultSeverity: 2 },
      { id: 'witnessed-behavior', name: 'Witnessed behavior', defaultSeverity: 2 },
    ]
  },
  {
    id: 'coparenting',
    name: 'Co-Parenting',
    icon: '⇄',
    description: 'Communication, schedule, flexibility, boundaries',
    color: 'var(--amber)',
    colorL: 'var(--amber-l)',
    types: [
      { id: 'communication', name: 'Communication', defaultSeverity: 3 },
      { id: 'schedule-violation', name: 'Schedule violation', defaultSeverity: 1 },
      { id: 'flexibility-request', name: 'Parenting time flexibility request', defaultSeverity: 3 },
      { id: 'boundary-violation', name: 'Boundary violation', defaultSeverity: 1 },
      { id: 'cooperation', name: 'Cooperation / good faith moment', defaultSeverity: 5 },
      { id: 'kid-request-home', name: 'Kid requested to come home', defaultSeverity: 3 },
      { id: 'us-flexibility', name: 'We extended flexibility', defaultSeverity: 5 },
      { id: 'us-communication', name: 'We initiated communication', defaultSeverity: 4 },
    ]
  },
  {
    id: 'memories',
    name: 'Positive Moments & Memories',
    icon: '★',
    description: 'Milestones, accomplishments, good stuff worth remembering',
    color: 'var(--sage)',
    colorL: 'var(--sage-l)',
    types: [
      { id: 'milestone', name: 'Milestone', defaultSeverity: 5 },
      { id: 'accomplishment', name: 'Accomplishment', defaultSeverity: 5 },
      { id: 'funny-moment', name: 'Funny moment', defaultSeverity: 5 },
      { id: 'first', name: 'A first', defaultSeverity: 5 },
      { id: 'proud-moment', name: 'Proud parent moment', defaultSeverity: 5 },
      { id: 'connection', name: 'Connection moment', defaultSeverity: 5 },
      { id: 'good-day', name: 'Just a good day', defaultSeverity: 5 },
    ]
  },
];

// ── FEELINGS (for Daily Reflection — Mary interaction) ────────────────────────
var FEELINGS = [
  'Frustrated', 'Anxious', 'Dismissed', 'Disrespected', 'Hopeful',
  'Relieved', 'Angry', 'Sad', 'Confused', 'Calm', 'Exhausted',
  'Overwhelmed', 'Invalidated', 'Drained',
];

// ── MOODS (for Daily Reflection — kids) ──────────────────────────────────────
var MOODS = [
  { emoji: '😄', label: 'Happy' },
  { emoji: '😌', label: 'Chill' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😭', label: 'Distraught' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤒', label: 'Sick' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😐', label: 'Okay' },
];

// ── KIDS ──────────────────────────────────────────────────────────────────────
// Used for habit kid selection. Update if needed.
var KIDS = ['Landon', 'Luke', 'Leo'];

// ── MARY KIDS TREATMENT OPTIONS ───────────────────────────────────────────────
var MARY_TREATMENT = ['Warm', 'Neutral', 'Dismissive', 'Cold', 'Not present'];

// ── HEALTH & MEDICAL ──────────────────────────────────────────────────────────
var HEALTH_SYMPTOMS = [
  'Fever', 'Cough', 'Runny nose', 'Sore throat', 'Headache',
  'Stomach ache', 'Vomiting', 'Diarrhea', 'Fatigue', 'Rash',
  'Earache', 'Congestion', 'Other'
];
var HEALTH_CARE_PROVIDERS = ['Haley', 'Dave', 'Both'];
var SYMPTOM_SEVERITY_LABELS = ['', 'Mild', 'Moderate', 'Severe'];

// ── OUR PARENTING LOG ─────────────────────────────────────────────────────────
var OUR_PARENTING_ACTIONS = [
  { id: 'scheduled-after-3pm',    label: 'Scheduled appointment after 3pm',         notify: false, decline: false },
  { id: 'notified-illness',       label: 'Notified Mary promptly of illness/injury', notify: true,  decline: false },
  { id: 'consulted-mary',         label: 'Consulted Mary on major health or education decision', notify: false, decline: false },
  { id: 'encouraged-contact',     label: 'Encouraged child contact with Mary',       notify: false, decline: false },
  { id: 'positive-transition',    label: 'Supported positive transition/goodbye',    notify: false, decline: false },
  { id: 'accommodated-request',   label: "Accommodated Mary's request",              notify: false, decline: false },
  { id: 'declined-request',       label: "Declined Mary's request",                  notify: false, decline: true  },
  { id: 'followed-jod',           label: 'Followed JOD parenting schedule',          notify: false, decline: false },
  { id: 'modeled-coparenting',    label: 'Modeled positive co-parenting',            notify: false, decline: false },
  { id: 'other-intentional',      label: 'Other intentional parenting action',       notify: false, decline: false },
];
var OUR_PARENTING_OUTCOMES = [
  'Acknowledged by Mary',
  'Ignored by Mary',
  'Declined by Mary',
  'N/A',
];
var OUR_PARENTING_NOTIFY_METHODS = ['CoParent app', 'Text', 'Email', 'Phone call'];
