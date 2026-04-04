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
    description: 'Parenting moments, interactions, observations, concerns',
    color: 'var(--mauve)',
    colorL: 'var(--mauve-l)',
    types: [
      { id: 'positive-parenting', name: 'Positive parenting moment', defaultSeverity: 5 },
      { id: 'dismissive', name: 'Dismissive / invalidating', defaultSeverity: 2 },
      { id: 'denying-choice', name: 'Denying choice or autonomy', defaultSeverity: 2 },
      { id: 'emotional-response', name: 'Emotional response/parentification', defaultSeverity: 2 },
      { id: 'physical-care', name: 'Physical care concern', defaultSeverity: 1 },
      { id: 'kids-reported', name: 'Kids reported something', defaultSeverity: 2 },
      { id: 'witnessed-behavior', name: 'Witnessed behavior', defaultSeverity: 2 },
    ]
  },
  {
    id: 'coparenting',
    name: 'Co-Parenting (Concerning)',
    icon: '⇄',
    description: 'Communication breakdowns, JOD violations, boundary violations',
    color: 'var(--amber)',
    colorL: 'var(--amber-l)',
    types: [
      { id: 'communication', name: 'Problematic communication', defaultSeverity: 2 },
      { id: 'miscommunication', name: 'Miscommunication', defaultSeverity: 2 },
      { id: 'jod-violation', name: 'JOD violation', defaultSeverity: 1 },
      { id: 'flexibility-request', name: 'Parenting time flexibility request', defaultSeverity: 3 },
      { id: 'boundary-violation', name: 'Boundary violation', defaultSeverity: 1 },
      { id: 'kid-request-home', name: 'Kid requested to come home', defaultSeverity: 3 },
    ]
  },
  {
    id: 'coparenting-positive',
    name: 'Co-Parenting (Positive)',
    icon: '⇄',
    description: 'Cooperation, good faith, flexibility extended',
    color: 'var(--sage)',
    colorL: 'var(--sage-l)',
    types: [
      { id: 'cooperation', name: 'Cooperation / good faith moment', defaultSeverity: 5 },
      { id: 'flexibility', name: 'Extended flexibility', defaultSeverity: 5 },
      { id: 'positive-communication', name: 'Positive communication', defaultSeverity: 4 },
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
  'Overwhelmed', 'Invalidated', 'Drained', 'Furious', 'Resentful', 'Appreciative', 'Supported', 'Other'
];

// ── MOODS (for Daily Reflection — kids) ──────────────────────────────────────
var MOODS = [
  { emoji: '😄', label: 'Happy' },
  { emoji: '😌', label: 'Chill' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😭', label: 'Distraught' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤒', label: 'Sick' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😓', label: 'Anxious' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😖', label: 'Frustrated' },
  { emoji: '🙄', label: 'Annoyed' },
  { emoji: '😠', label: 'Grumpy' },
];

// ── KIDS ──────────────────────────────────────────────────────────────────────
// Used for habit kid selection. Update if needed.
var KIDS = ['Landon', 'Luke', 'Leo'];

// ── MARY KIDS TREATMENT OPTIONS ───────────────────────────────────────────────
var MARY_TREATMENT = ['Warm', 'Neutral', 'Dismissive', 'Cold', 'Not present'];

// ── MARY MOOD LOG ─────────────────────────────────────────────────────────────
var MARY_MOODS = [
  { label: 'Warm',     polarity: 'positive' },
  { label: 'Friendly', polarity: 'positive' },
  { label: 'Neutral',  polarity: 'neutral'  },
  { label: 'Tense',    polarity: 'negative' },
  { label: 'Cold',     polarity: 'negative' },
  { label: 'Hostile',  polarity: 'negative' },
  { label: 'Erratic',  polarity: 'negative' },
];
var MARY_FORMATS = ['In person', 'Phone call', 'Text', 'Email', 'Pickup/dropoff'];

// ── HEALTH & MEDICAL ──────────────────────────────────────────────────────────
var HEALTH_SYMPTOMS = [
  'Fever', 'Cough', 'Runny nose', 'Sore throat', 'Headache',
  'Upset Stomach', 'Nausea', 'Vomiting', 'Diarrhea', 'Fatigue', 'Rash',
  'Earache', 'Congestion', 'Other'
];
var HEALTH_CARE_PROVIDERS = ['Haley', 'Dave', 'Both'];
var SYMPTOM_SEVERITY_LABELS = ['','Minor', 'Mild', 'Moderate', 'Severe'];

// ── CHORES ────────────────────────────────────────────────────────────────────
var CHORE_ROOMS = [
  'Bathrooms', 'Bedrooms', 'Daily Tasks', 'Dishes', 'Downstairs',
  'Entry Way', 'General', 'Kitchen', 'Laundry', 'Living & Dining Room',
  'Outside', 'Pets', 'Trash', 'Other',
];

// Training statuses for each kid per chore
// 'not-trained' | 'in-training' | 'needs-reminders' | 'mastered'
var CHORE_TRAINING_STATUSES = [
  { id: 'not-trained',     label: 'Not Trained'     },
  { id: 'in-training',     label: 'In Training'     },
  { id: 'needs-reminders', label: 'Needs Reminders' },
  { id: 'mastered',        label: 'Mastered'        },
];

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
var LIST_OUTCOMES = [
  'Acknowledged No Response',
  'Ignored',
  'Accepted',
  'Declined',
  'N/A',
];
var OUR_PARENTING_NOTIFY_METHODS = ['CoParent app', 'Text', 'Email', 'Phone call'];
