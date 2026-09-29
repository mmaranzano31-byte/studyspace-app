'use strict';
/* ============================================================
   Studyspace — core: data, storage, helpers
   ============================================================ */
const LEGACY_KEY = 'studyspace-v1';
const AI_CODE_KEY = 'studyspace-ai-code';
const DB_NAME = 'studyspace';

const COLORS = ['#2e69b2', '#5480b8', '#0f8b8d', '#2f8f5b', '#8171b0', '#b0578d', '#c0584f', '#bb855d', '#b7951f', '#5b6b82'];
const ICONS = ['✳', '❋', '◉', '⌂', '⚛', '🧬', '🧪', '📐', '💻', '🌐', '📊', '💼', '⚖️', '🏛️', '📜', '🎨', '🎵', '🧠', '🩺', '🌱', '🔬', '📚', '✏️', '🗺️', '🧮', '🛡️', '📈', '🗣️'];
const TYPE_LABELS = { mc: 'Multiple choice', tf: 'True / false', fill: 'Fill in the blank', match: 'Matching', order: 'Ordering', short: 'Free response', discuss: 'Discussion', case: 'Case study' };
const TYPE_SHORT = { mc: 'MC', tf: 'T/F', fill: 'Fill', match: 'Match', order: 'Order', short: 'Free resp.', discuss: 'Discussion', case: 'Case' };
const QTYPES = Object.keys(TYPE_LABELS);
const OPEN_TYPES = ['short', 'discuss']; // graded by AI or by you

const starterData = () => ({
  version: 2,
  profile: { name: 'Student', photo: '', weeklyMinutes: 300, weeklyQuestions: 150 },
  settings: { aiProvider: 'auto', autoAI: false, reminders: { daily: false, time: '19:00', exams: true } },
  classes: [
    { id: 'bio', name: 'Biology', teacher: 'BIO 101 · Dr. Rivera', color: '#5480b8', symbol: '❋', exams: [], chapters: [
      { id: 'bio1', title: 'Cell Structure & Function', source: 'Sample notes · replace with your course source',
        text: 'Cells are the basic structural and functional units of life. The cell membrane is a selectively permeable barrier that regulates movement of substances. The nucleus contains DNA. Mitochondria generate most of the ATP used by a cell through cellular respiration. Ribosomes synthesize proteins.\n\nThe fluid mosaic model describes a flexible phospholipid bilayer with embedded proteins. Diffusion is net movement from high to low concentration; osmosis is diffusion of water across a selectively permeable membrane.',
        definitions: [['Cell membrane', 'A selectively permeable barrier around a cell that regulates what enters and leaves.'], ['Mitochondrion', 'An organelle that produces most cellular ATP through cellular respiration.'], ['Osmosis', 'Movement of water across a selectively permeable membrane.'], ['Ribosome', 'A structure that synthesizes proteins.'], ['Diffusion', 'Net movement of particles from high to low concentration.']],
        questions: [
          { type: 'mc', q: 'Which organelle generates most cellular ATP?', choices: ['Golgi apparatus', 'Mitochondrion', 'Lysosome', 'Ribosome'], a: 1, why: 'Mitochondria generate most cellular ATP through respiration.', difficulty: 'easy' },
          { type: 'tf', q: 'Osmosis is movement of water across a selectively permeable membrane.', a: true, why: 'That is the definition of osmosis.', difficulty: 'easy' },
          { type: 'fill', q: 'The fluid mosaic model describes a flexible phospholipid ___.', a: 'bilayer', why: 'The membrane is a phospholipid bilayer.' },
          { type: 'match', q: 'Match each structure to its job.', pairs: [['Nucleus', 'Contains DNA'], ['Ribosome', 'Makes proteins'], ['Mitochondrion', 'Makes ATP'], ['Cell membrane', 'Controls what enters and leaves']], why: 'Each structure has a specialized function.' },
          { type: 'short', q: 'Explain the difference between diffusion and osmosis.', a: 'Diffusion is the net movement of any particles from high to low concentration; osmosis is specifically the diffusion of water across a selectively permeable membrane.', why: '' , difficulty: 'hard' }
        ] },
      { id: 'bio2', title: 'Genetics & Inheritance', source: '', text: '', definitions: [], questions: [] }
    ] },
    { id: 'psych', name: 'Psychology', teacher: 'PSY 110 · Prof. Chen', color: '#8171b0', symbol: '🧠', exams: [], chapters: [
      { id: 'psy1', title: 'Learning & Memory', source: 'Sample notes · replace with your course source',
        text: 'Learning is a relatively lasting change in behavior or knowledge due to experience. Classical conditioning pairs two stimuli; operant conditioning shapes behavior through consequences. Reinforcement increases a behavior; punishment decreases it.\n\nWorking memory temporarily holds and manipulates information. Long-term memory stores information over extended periods.',
        definitions: [['Classical conditioning', 'Learning by associating two stimuli, so one predicts the other.'], ['Reinforcement', 'A consequence that increases the likelihood of a behavior.'], ['Working memory', 'A limited-capacity system for temporarily holding and using information.']],
        questions: [
          { type: 'mc', q: 'A consequence that increases a behavior is called:', choices: ['Punishment', 'Reinforcement', 'Extinction', 'Habituation'], a: 1, why: 'Reinforcement increases the behavior that precedes it.' },
          { type: 'case', scenario: 'Maya gives her dog a treat every time it sits on command. After two weeks, the dog sits much more often, even without the treat being visible.', q: 'Which learning process best explains the dog\'s behavior?', choices: ['Classical conditioning', 'Operant conditioning with reinforcement', 'Punishment', 'Working memory'], a: 1, why: 'A consequence (treat) increased the behavior, which is operant conditioning through reinforcement.' }
        ] }
    ] }
  ],
  progress: {}, practice: {}, learn: {}, cards: {}, tests: [], activeTest: null, mistakes: {}, activity: {}, badges: {}, plans: {}, guides: [], tutor: { scope: '', messages: [] }
});

/* ---------- small helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const uid = (p = 'id') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad = n => String(n).padStart(2, '0');
const dateKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseDateKey = key => { const [y, m, d] = String(key).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const daysUntil = key => Math.round((parseDateKey(key) - parseDateKey(dateKey())) / 86400000);
const fmtDate = (v, opts = { month: 'short', day: 'numeric' }) => new Date(v).toLocaleDateString(undefined, opts);
const fmtTime = sec => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' + pad(m) : m) + ':' + pad(s); };
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const norm = s => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
function levenshtein(a, b) {
  if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
function toast(message, ms = 2800) {
  const node = document.createElement('div'); node.className = 'toast'; node.textContent = message;
  document.body.append(node);
  const restack = () => [...document.querySelectorAll('.toast')].reverse().forEach((t, i) => t.style.setProperty('--b', (20 + i * 52) + 'px'));
  restack(); setTimeout(() => { node.remove(); restack(); }, ms);
}
const htmlToText = html => { const d = document.createElement('div'); d.innerHTML = html; d.querySelectorAll('br').forEach(b => b.replaceWith('\n')); d.querySelectorAll('p,div,h1,h2,h3,h4,li,blockquote,tr').forEach(el => el.append('\n')); return d.textContent.replace(/\n{3,}/g, '\n\n').trim(); };
const textToHtml = text => String(text || '').split(/\n{2,}/).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');

/* Allow-list HTML sanitizer for rich notes */
const ALLOWED_TAGS = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'MARK', 'IMG', 'BLOCKQUOTE', 'CODE', 'PRE', 'DIV', 'SPAN', 'SUB', 'SUP', 'TABLE', 'TR', 'TD', 'TH', 'TBODY', 'THEAD', 'HR']);
function sanitizeHTML(html) {
  const doc = new DOMParser().parseFromString('<body>' + (html || '') + '</body>', 'text/html');
  const walk = node => {
    [...node.children].forEach(el => {
      if (!ALLOWED_TAGS.has(el.tagName)) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'].includes(el.tagName)) { el.remove(); return; }
        const frag = document.createDocumentFragment(); while (el.firstChild) frag.append(el.firstChild);
        walk({ children: [...frag.children] }); el.replaceWith(frag); return;
      }
      [...el.attributes].forEach(attr => {
        const keep = el.tagName === 'IMG' && ((attr.name === 'src' && /^data:image\//i.test(attr.value)) || attr.name === 'alt');
        if (!keep) el.removeAttribute(attr.name);
      });
      if (el.tagName === 'IMG' && !el.getAttribute('src')) { el.remove(); return; }
      walk(el);
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

/* ---------- IndexedDB storage (bigger than localStorage) ---------- */
let dbPromise = null;
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { const db = req.result; db.createObjectStore('kv'); const files = db.createObjectStore('files', { keyPath: 'id' }); files.createIndex('chapterId', 'chapterId'); };
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  });
  return dbPromise;
}
async function idb(store, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode), req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req?.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  });
}
const kvGet = key => idb('kv', 'readonly', s => s.get(key));
const kvSet = (key, val) => idb('kv', 'readwrite', s => s.put(val, key));
const filePut = rec => idb('files', 'readwrite', s => s.put(rec));
const fileGet = id => idb('files', 'readonly', s => s.get(id));
const fileDelete = id => idb('files', 'readwrite', s => s.delete(id));
async function filesForChapter(chapterId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('files').objectStore('files').index('chapterId').getAll(chapterId);
    req.onsuccess = () => resolve(req.result.map(f => ({ id: f.id, name: f.name, type: f.type, size: f.size, added: f.added }))); req.onerror = () => reject(req.error);
  });
}

let data = null;
let saveTimer = null, storageWarned = false;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await kvSet('data', JSON.parse(JSON.stringify(data))); }
    catch (err) {
      try { localStorage.setItem(LEGACY_KEY, JSON.stringify(data)); }
      catch { if (!storageWarned) { storageWarned = true; alert('Your browser storage is full, so recent changes may not be saved. Download a backup from Settings.'); } }
    }
  }, 150);
}
window.addEventListener('beforeunload', () => { if (saveTimer) { clearTimeout(saveTimer); try { localStorage.setItem(LEGACY_KEY + '-last', JSON.stringify({ t: Date.now() })); } catch {} kvSet('data', JSON.parse(JSON.stringify(data))).catch(() => {}); } });

async function loadData() {
  let loaded = null;
  try { loaded = await kvGet('data'); } catch {}
  if (!loaded) { try { loaded = JSON.parse(localStorage.getItem(LEGACY_KEY)); } catch {} }
  data = normalizeData(loaded || starterData());
  save();
}

/* Upgrade old saves and fill in anything missing */
function normalizeQuestion(q) {
  if (!q || typeof q !== 'object') return null;
  const out = { id: q.id || uid('q'), type: QTYPES.includes(q.type) ? q.type : 'mc', q: String(q.q ?? q.question ?? '').trim(), why: String(q.why ?? q.explanation ?? ''), difficulty: ['easy', 'standard', 'hard'].includes(q.difficulty) ? q.difficulty : '', src: q.src || '' };
  if (!out.q && out.type !== 'match' && out.type !== 'order') return null;
  if (out.type === 'mc' || (out.type === 'case' && Array.isArray(q.choices) && q.choices.length > 1)) {
    out.choices = (q.choices || []).map(String).filter(Boolean);
    out.a = typeof q.a === 'number' ? q.a : Math.max(0, out.choices.findIndex(c => norm(c) === norm(q.a)));
    if (out.choices.length < 2) return null;
  } else if (out.type === 'tf') out.a = q.a === true || String(q.a).toLowerCase() === 'true';
  else if (out.type === 'match') { out.pairs = (q.pairs || []).map(p => Array.isArray(p) ? [String(p[0]), String(p[1])] : [String(p.left), String(p.right)]).filter(p => p[0] && p[1]); if (out.pairs.length < 2) return null; if (!out.q) out.q = 'Match each item to its pair.'; }
  else if (out.type === 'order') { out.items = (q.items || []).map(String).filter(Boolean); if (out.items.length < 2) return null; if (!out.q) out.q = 'Put these in the correct order.'; }
  else out.a = String(q.a ?? q.answer ?? '');
  if (out.type === 'case') out.scenario = String(q.scenario || '');
  return out;
}
function normalizeData(d) {
  const base = starterData();
  d = d && typeof d === 'object' ? d : base;
  if (!d.version) { // v1 save
    d.version = 2;
    const oldProgress = d.progress || {}; d.progress = {};
    for (const [id, v] of Object.entries(oldProgress)) d.progress[id] = Number(v && typeof v === 'object' ? v.percent : v) || 0;
  }
  for (const key of Object.keys(base)) if (d[key] === undefined || d[key] === null && key !== 'activeTest') d[key] = base[key];
  d.profile = { ...base.profile, ...d.profile };
  d.settings = { ...base.settings, ...d.settings, reminders: { ...base.settings.reminders, ...(d.settings?.reminders || {}) } };
  d.classes = (d.classes || []).map(c => ({
    id: c.id || uid('c'), name: c.name || 'Untitled class', teacher: c.teacher || '', color: c.color || COLORS[0], symbol: c.symbol || '✳',
    exams: (c.exams || []).filter(e => e && e.date).map(e => ({ id: e.id || uid('e'), title: e.title || 'Exam', date: e.date, chapterIds: e.chapterIds || [] })),
    chapters: (c.chapters || []).map(ch => ({
      id: ch.id || uid('ch'), title: ch.title || 'Untitled chapter', source: ch.source || '', summary: ch.summary || '',
      html: ch.html ? sanitizeHTML(ch.html) : '', text: ch.text || (ch.html ? htmlToText(ch.html) : ''),
      definitions: (ch.definitions || []).map(def => Array.isArray(def) ? [String(def[0] || ''), String(def[1] || ''), String(def[2] || '')] : [String(def.term || ''), String(def.explanation || ''), '']).filter(def => def[0] && def[1]),
      questions: (ch.questions || []).map(normalizeQuestion).filter(Boolean),
      files: ch.files || []
    }))
  }));
  ['progress', 'practice', 'learn', 'cards', 'mistakes', 'activity', 'badges', 'plans'].forEach(k => { if (typeof d[k] !== 'object' || Array.isArray(d[k])) d[k] = {}; });
  if (!Array.isArray(d.tests)) d.tests = [];
  if (!Array.isArray(d.guides)) d.guides = [];
  if (!d.tutor || typeof d.tutor !== 'object') d.tutor = { scope: '', messages: [] };
  return d;
}

/* ---------- lookups ---------- */
const findClass = id => data.classes.find(c => c.id === id);
function findChapter(chapterId) {
  for (const c of data.classes) { const ch = c.chapters.find(x => x.id === chapterId); if (ch) return { course: c, chapter: ch }; }
  return { course: null, chapter: null };
}
const allChapters = () => data.classes.flatMap(course => course.chapters.map(chapter => ({ course, chapter })));
const chapterText = ch => ch.html ? htmlToText(ch.html) : (ch.text || '');
const chapterProgress = id => Math.round(data.progress[id] || 0);
const classProgress = c => c.chapters.length ? Math.round(c.chapters.reduce((s, ch) => s + chapterProgress(ch.id), 0) / c.chapters.length) : 0;
function setChapterProgress(id, value, allowDecrease = false) {
  const v = clamp(Math.round(value), 0, 100);
  data.progress[id] = allowDecrease ? v : Math.max(chapterProgress(id), v);
  save();
}
/* Progress from practice: share of the chapter's questions you've answered right at least once, plus flashcards/learn mastery */
function recomputeProgress(chapterId) {
  const { chapter } = findChapter(chapterId); if (!chapter) return;
  const qs = chapter.questions, st = data.practice[chapterId] || {};
  const correct = qs.filter(q => st.correct?.[q.id]).length;
  const learned = chapter.definitions.filter(def => (data.learn[chapterId] || {})[def[0]] >= 2).length;
  const parts = [];
  if (qs.length) parts.push(correct / qs.length);
  if (chapter.definitions.length) parts.push(learned / chapter.definitions.length);
  if (!parts.length) return;
  const pct = parts.reduce((a, b) => a + b, 0) / parts.length * 100;
  setChapterProgress(chapterId, Math.min(pct, 99));
}
const guessDifficulty = q => q.difficulty || (q.type === 'tf' ? 'easy' : ['discuss', 'case'].includes(q.type) ? 'hard' : q.type === 'mc' ? 'easy' : 'standard');

/* ---------- activity, streaks, badges ---------- */
function logActivity(fields) {
  const k = dateKey(); const day = data.activity[k] ||= { minutes: 0, questions: 0, correct: 0, cards: 0, tests: 0 };
  for (const [f, v] of Object.entries(fields)) day[f] = (day[f] || 0) + v;
  save(); checkBadges(); updateSidebar();
}
function streak() {
  let n = 0; const d = new Date();
  const active = key => { const a = data.activity[key]; return a && (a.questions || a.cards || a.minutes >= 5 || a.tests); };
  if (!active(dateKey(d))) d.setDate(d.getDate() - 1); // today not started yet: count from yesterday
  while (active(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function weekTotals() {
  const t = { minutes: 0, questions: 0, correct: 0, cards: 0, tests: 0 }; const d = new Date();
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  for (let x = new Date(monday); x <= d; x.setDate(x.getDate() + 1)) { const a = data.activity[dateKey(x)]; if (a) for (const k in t) t[k] += a[k] || 0; }
  return t;
}
const BADGES = [
  { id: 'first-q', icon: '🌱', name: 'First steps', desc: 'Answer your first question', test: () => totalActivity('questions') >= 1 },
  { id: 'q100', icon: '💯', name: 'Century', desc: 'Answer 100 questions', test: () => totalActivity('questions') >= 100 },
  { id: 'q500', icon: '🏔️', name: 'Mountain climber', desc: 'Answer 500 questions', test: () => totalActivity('questions') >= 500 },
  { id: 'first-test', icon: '📝', name: 'Test taker', desc: 'Finish your first test', test: () => data.tests.length >= 1 },
  { id: 'perfect', icon: '🏆', name: 'Perfect score', desc: 'Score 100% on a test of 10+ questions', test: () => data.tests.some(t => t.percent === 100 && t.total >= 10) },
  { id: 'streak3', icon: '🔥', name: 'On a roll', desc: '3-day study streak', test: () => streak() >= 3 },
  { id: 'streak7', icon: '⚡', name: 'Week warrior', desc: '7-day study streak', test: () => streak() >= 7 },
  { id: 'streak30', icon: '👑', name: 'Unstoppable', desc: '30-day study streak', test: () => streak() >= 30 },
  { id: 'chapter', icon: '📘', name: 'Chapter champ', desc: 'Complete a chapter (100%)', test: () => Object.values(data.progress).some(v => v >= 100) },
  { id: 'cards50', icon: '🃏', name: 'Card shark', desc: 'Review 50 flashcards', test: () => totalActivity('cards') >= 50 },
  { id: 'focus', icon: '⏱', name: 'Deep focus', desc: 'Finish a focus-timer session', test: () => totalActivity('pomos') >= 1 },
  { id: 'goal', icon: '🎯', name: 'Goal getter', desc: 'Hit your weekly study goal', test: () => { const w = weekTotals(); return w.minutes >= data.profile.weeklyMinutes || w.questions >= data.profile.weeklyQuestions; } },
  { id: 'fixer', icon: '🛠️', name: 'Mistake fixer', desc: 'Clear 10 weak spots', test: () => totalActivity('fixed') >= 10 }
];
const totalActivity = f => Object.values(data.activity).reduce((s, a) => s + (a[f] || 0), 0);
function checkBadges() {
  for (const b of BADGES) if (!data.badges[b.id]) { let ok = false; try { ok = b.test(); } catch {} if (ok) { data.badges[b.id] = Date.now(); toast(b.icon + ' Badge earned: ' + b.name + '!', 3500); save(); } }
}
/* ============================================================
   AI client (talks to /api/generate on Vercel)
   ============================================================ */
const aiCode = () => { try { return localStorage.getItem(AI_CODE_KEY) || ''; } catch { return ''; } };
const aiReady = () => !!aiCode();
async function callAI(task, payload) {
  const code = aiCode();
  if (!code) throw new Error('AI is not set up yet. Open Settings → AI and enter your access code.');
  let response;
  try {
    response = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-study-access-code': code },
      body: JSON.stringify({ task, provider: data.settings.aiProvider, ...payload })
    });
  } catch { throw new Error('Could not reach the AI. Check your internet connection. (AI only works on your Vercel site, not when opening the file directly.)'); }
  let result = {};
  try { result = await response.json(); } catch { throw new Error(response.status === 404 ? 'The AI endpoint was not found. AI works after the app is deployed on Vercel.' : 'The AI returned an unexpected response (' + response.status + ').'); }
  if (!response.ok) throw new Error(result.error || 'AI request failed.');
  return result;
}
/* Build a combined, size-limited material string from chapters */
function materialFor(chapters, limit = 55000) {
  const parts = chapters.map(({ course, chapter }) => ({ head: '=== ' + course.name + ' — ' + chapter.title + (chapter.source ? ' (source: ' + chapter.source + ')' : '') + ' ===\n', body: chapterText(chapter) + (chapter.definitions.length ? '\nKey terms: ' + chapter.definitions.map(d => d[0] + ': ' + d[1]).join('; ') : '') }));
  const each = Math.floor(limit / Math.max(1, parts.length));
  return parts.map(p => p.head + (p.body.length > each ? p.body.slice(0, each - 30) + '\n[…trimmed…]' : p.body)).join('\n\n');
}
/* Convert AI question objects to the app's format */
function fromAIQuestion(q, src = '') {
  const base = { type: q.type, q: q.question, why: q.explanation || '', difficulty: q.difficulty, src: q.sourceReference || src };
  if (q.type === 'mc' || (q.type === 'case' && (q.choices || []).length > 1)) {
    const idx = (q.choices || []).findIndex(c => norm(c) === norm(q.answer));
    if (idx < 0) return null;
    return normalizeQuestion({ ...base, choices: q.choices, a: idx, scenario: q.scenario });
  }
  if (q.type === 'tf') return normalizeQuestion({ ...base, a: String(q.answer).toLowerCase().startsWith('t') });
  if (q.type === 'match') return normalizeQuestion({ ...base, pairs: (q.pairs || []).map(p => [p.left, p.right]) });
  if (q.type === 'order') return normalizeQuestion({ ...base, items: q.items });
  return normalizeQuestion({ ...base, a: q.answer, scenario: q.scenario });
}
/* Tiny, safe Markdown → HTML (for AI answers and study guides) */
function md(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n'); let html = '', list = null;
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<i>$2</i>').replace(/`(.+?)`/g, '<code>$1</code>');
  const close = () => { if (list) { html += '</' + list + '>'; list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)/))) { close(); const lvl = Math.min(4, m[1].length + 1); html += '<h' + lvl + '>' + inline(m[2]) + '</h' + lvl + '>'; }
    else if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += '<li>' + inline(m[1]) + '</li>'; }
    else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += '<li>' + inline(m[1]) + '</li>'; }
    else if (!line.trim()) close();
    else { close(); html += '<p>' + inline(line) + '</p>'; }
  }
  close(); return html;
}
function aiErrorHTML(err) { return '<div class="feedback bad"><b class="v">AI unavailable</b>' + esc(err.message) + '</div>'; }
/* ============================================================
   Questions: render, capture answers, grade (shared by Practice,
   Test center, and Weak spots)
   ============================================================ */
const isOpen = q => OPEN_TYPES.includes(q.type) || (q.type === 'case' && !(q.choices && q.choices.length > 1));
const hasChoices = q => q.type === 'mc' || (q.type === 'case' && q.choices && q.choices.length > 1);

function makeItem(q, meta = {}, opts = {}) {
  const item = { q: JSON.parse(JSON.stringify(q)), meta, resp: null, result: null, flagged: false };
  if (hasChoices(q)) item.choiceOrder = opts.shuffleChoices === false ? q.choices.map((_, i) => i) : shuffle(q.choices.map((_, i) => i));
  if (q.type === 'match') item.rights = shuffle(q.pairs.map(p => p[1]));
  if (q.type === 'order') { let o = shuffle(q.items); if (o.every((x, i) => x === q.items[i]) && o.length > 1) o = [...o.slice(1), o[0]]; item.resp = o; }
  return item;
}
function answered(item) {
  const r = item.resp, q = item.q;
  if (q.type === 'order') return !!item.touched;
  if (q.type === 'match') return Array.isArray(r) && r.some(Boolean);
  return r !== null && r !== undefined && r !== '';
}
function correctText(q) {
  if (hasChoices(q)) return q.choices[q.a];
  if (q.type === 'tf') return q.a ? 'True' : 'False';
  if (q.type === 'match') return q.pairs.map(p => p[0] + ' → ' + p[1]).join('\n');
  if (q.type === 'order') return q.items.map((x, i) => (i + 1) + '. ' + x).join('\n');
  return q.a || '';
}
function responseText(item) {
  const q = item.q, r = item.resp;
  if (!answered(item)) return '(no answer)';
  if (hasChoices(q)) return q.choices[r];
  if (q.type === 'tf') return r ? 'True' : 'False';
  if (q.type === 'match') return q.pairs.map((p, i) => p[0] + ' → ' + (r[i] || '—')).join('\n');
  if (q.type === 'order') return r.map((x, i) => (i + 1) + '. ' + x).join('\n');
  return String(r);
}
/* Auto-grade objective types. Returns null for open (free response/discussion/open case) questions. */
function autoGrade(item) {
  const q = item.q, r = item.resp;
  if (isOpen(q)) return null;
  let score = 0;
  if (!answered(item)) score = 0;
  else if (hasChoices(q)) score = Number(r) === Number(q.a) ? 1 : 0;
  else if (q.type === 'tf') score = r === q.a ? 1 : 0;
  else if (q.type === 'fill') {
    const given = norm(r), accepted = String(q.a).split(/[\/;]| or /i).map(norm).filter(Boolean);
    score = accepted.some(ans => given === ans || (ans.length > 4 && levenshtein(given, ans) <= (ans.length > 9 ? 2 : 1))) ? 1 : 0;
  } else if (q.type === 'match') score = q.pairs.filter((p, i) => r[i] === p[1]).length / q.pairs.length;
  else if (q.type === 'order') score = q.items.filter((x, i) => r[i] === x).length / q.items.length;
  return { score, verdict: score >= 1 ? 'correct' : score > 0 ? 'partial' : 'incorrect', by: 'auto' };
}
const verdictOf = score => score >= 0.8 ? 'correct' : score >= 0.4 ? 'partial' : 'incorrect';

/* Read typed values from the DOM into the item before navigating/checking */
function captureInputs(item) {
  if (!item) return;
  const q = item.q;
  const fill = $('#qFill'); if (fill && q.type === 'fill') item.resp = fill.value.trim() || null;
  const txt = $('#qText'); if (txt && isOpen(q)) item.resp = txt.value.trim() || null;
  if (q.type === 'match') { const sels = $$('.match-sel'); if (sels.length) item.resp = sels.map(s => s.value || null); }
}

/* Render one question. reveal=true shows right/wrong styling and feedback. */
function renderItem(item, { reveal = false, showExplain = true, key = 'x' } = {}) {
  const q = item.q, r = item.resp, res = item.result;
  const lock = reveal ? 'disabled' : '';
  let body = '';
  if (q.scenario) body += '<div class="scenario"><b>Scenario.</b> ' + esc(q.scenario) + '</div>';
  body += '<div class="question">' + esc(q.q) + '</div>';
  if (hasChoices(q)) {
    body += '<div class="answers">' + item.choiceOrder.map((ci, pos) => {
      let cls = r === ci ? ' selected' : '';
      if (reveal) cls = ci === q.a ? ' right' : r === ci ? ' wrong' : '';
      return '<button class="answer' + cls + '" data-act="pick" data-val="' + ci + '" ' + lock + '><span class="letter">' + String.fromCharCode(65 + pos) + '</span><span>' + esc(q.choices[ci]) + '</span></button>';
    }).join('') + '</div>';
  } else if (q.type === 'tf') {
    body += '<div class="answers">' + [true, false].map(v => {
      let cls = r === v ? ' selected' : '';
      if (reveal) cls = v === q.a ? ' right' : r === v ? ' wrong' : '';
      return '<button class="answer' + cls + '" data-act="pick" data-val="' + v + '" ' + lock + '><span class="letter">' + (v ? 'T' : 'F') + '</span><span>' + (v ? 'True' : 'False') + '</span></button>';
    }).join('') + '</div>';
  } else if (q.type === 'fill') {
    body += '<input id="qFill" class="text-answer" placeholder="Type your answer…" autocomplete="off" value="' + esc(r || '') + '" ' + lock + '>';
  } else if (q.type === 'match') {
    body += '<div>' + q.pairs.map((p, i) => {
      const cls = reveal ? (r?.[i] === p[1] ? ' right' : ' wrong') : '';
      return '<div class="match-row' + cls + '"><b>' + esc(p[0]) + '</b><select class="match-sel" ' + lock + '><option value="">Choose…</option>' +
        item.rights.map(opt => '<option ' + (r?.[i] === opt ? 'selected' : '') + ' value="' + esc(opt) + '">' + esc(opt) + '</option>').join('') + '</select></div>';
    }).join('') + '</div>';
  } else if (q.type === 'order') {
    body += '<div class="order-list" id="orderList">' + r.map((x, i) => {
      const cls = reveal ? (q.items[i] === x ? ' right' : ' wrong') : '';
      return '<div class="order-item' + cls + '" draggable="' + !reveal + '" data-idx="' + i + '"><span class="num">' + (i + 1) + '</span><span class="t">' + esc(x) + '</span>' +
        (reveal ? '' : '<button data-act="order-move" data-idx="' + i + '" data-dir="-1" title="Move up">↑</button><button data-act="order-move" data-idx="' + i + '" data-dir="1" title="Move down">↓</button>') + '</div>';
    }).join('') + '</div>' + (reveal ? '' : '<p class="muted small">Drag items, or use the arrows, to put them in order.</p>');
  } else {
    body += '<textarea id="qText" class="text-answer" placeholder="' + (q.type === 'discuss' ? 'Write your discussion answer…' : 'Write your answer…') + '" ' + lock + '>' + esc(r || '') + '</textarea>';
  }
  if (reveal) body += feedbackHTML(item, { showExplain, key });
  return body;
}
function feedbackHTML(item, { showExplain = true, key = 'x' } = {}) {
  const q = item.q, res = item.result;
  let html = '';
  if (!res && isOpen(q)) {
    html += '<div class="feedback"><b class="v">How did you do?</b>Compare your answer with the model answer, then grade yourself' + (aiReady() ? ' or let AI grade it.' : '.') +
      '<div class="model"><b>Model answer / key points:</b>\n' + esc(correctText(q)) + '</div>' +
      '<div class="btn-row" style="margin-top:10px">' + (aiReady() ? '<button class="soft ai" data-act="ai-grade">✦ Grade with AI</button>' : '') +
      '<button class="soft" data-act="self-grade" data-score="1">✓ I got it</button><button class="soft" data-act="self-grade" data-score="0.5">≈ Partly</button><button class="soft" data-act="self-grade" data-score="0">✗ Missed it</button></div></div>';
  } else if (res) {
    const label = res.verdict === 'correct' ? '✓ Correct' : res.verdict === 'partial' ? '≈ Partly correct' + (res.score ? ' (' + Math.round(res.score * 100) + '%)' : '') : '✗ Not quite';
    const cls = res.verdict === 'correct' ? 'good' : res.verdict === 'partial' ? 'partial' : 'bad';
    html += '<div class="feedback ' + cls + '"><b class="v">' + label + (res.by === 'ai' ? ' · graded by AI' : res.by === 'self' ? ' · self-graded' : '') + '</b>' +
      (res.feedback ? esc(res.feedback) + (res.missing?.length ? '<br><b>Missing:</b> ' + esc(res.missing.join('; ')) : '') + '<br>' : '') +
      (res.verdict !== 'correct' || isOpen(q) ? '<div class="model"><b>' + (isOpen(q) ? 'Model answer' : 'Correct answer') + ':</b>\n' + esc(correctText(q)) + '</div>' : '') +
      (q.why ? '<div style="margin-top:6px">' + esc(q.why) + '</div>' : '') + (q.src ? '<div class="muted small" style="margin-top:4px">Source: ' + esc(q.src) + '</div>' : '') + '</div>';
  }
  if (showExplain && res) html += '<div id="explain-' + key + '"></div><div class="btn-row" style="margin-top:8px">' + (aiReady() ? '<button class="text-link" data-act="explain" data-key="' + key + '">✦ Explain this answer</button>' : '') + '</div>';
  return html;
}
async function explainItem(item, key, btn) {
  const box = $('#explain-' + key); if (!box) return;
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Explaining…'; }
  try {
    const { chapter, course } = findChapter(item.meta.chapterId);
    const out = await callAI('explain', { question: item.q.q, scenario: item.q.scenario || '', answer: correctText(item.q), studentAnswer: responseText(item), material: chapter ? materialFor([{ course, chapter }], 20000) : '' });
    box.innerHTML = '<div class="feedback ai-text">' + md(out.text) + '</div>';
    if (btn) btn.remove();
  } catch (err) { box.innerHTML = aiErrorHTML(err); if (btn) { btn.disabled = false; btn.textContent = '✦ Explain this answer'; } }
}
async function aiGradeItem(item) {
  const { chapter, course } = findChapter(item.meta.chapterId);
  const out = await callAI('grade', { type: item.q.type, question: item.q.q, scenario: item.q.scenario || '', modelAnswer: correctText(item.q), studentAnswer: item.resp || '(blank)', material: chapter ? materialFor([{ course, chapter }], 15000) : '' });
  const score = clamp(Number(out.score) || 0, 0, 100) / 100;
  item.result = { score, verdict: out.verdict || verdictOf(score), feedback: out.feedback, missing: out.missing || [], by: 'ai' };
  return item.result;
}
/* Wire up drag-and-drop ordering after rendering */
function bindOrderDrag(item, rerender) {
  const list = $('#orderList'); if (!list || item.q.type !== 'order') return;
  let from = null;
  list.querySelectorAll('.order-item').forEach(el => {
    el.addEventListener('dragstart', () => { from = Number(el.dataset.idx); el.classList.add('dragging'); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', e => { e.preventDefault(); const to = Number(el.dataset.idx); if (from === null || from === to) return; const arr = item.resp; const [x] = arr.splice(from, 1); arr.splice(to, 0, x); item.touched = true; rerender(); });
  });
}

/* ---------- Weak spots (mistakes) ---------- */
const mistakeKey = item => (item.meta.chapterId || 'x') + '::' + (item.q.id || norm(item.q.q).slice(0, 80));
function recordResult(item, source) {
  const res = item.result; if (!res) return;
  const key = mistakeKey(item);
  logActivity({ questions: 1, correct: res.verdict === 'correct' ? 1 : 0 });
  if (res.verdict !== 'correct') {
    const m = data.mistakes[key] ||= { q: item.q, classId: item.meta.classId, chapterId: item.meta.chapterId, count: 0, streak: 0, added: Date.now() };
    m.count++; m.streak = 0; m.last = Date.now(); m.lastAnswer = responseText(item); m.source = source;
  } else if (data.mistakes[key]) {
    const m = data.mistakes[key]; m.streak = (m.streak || 0) + 1;
    if (m.streak >= 2) { delete data.mistakes[key]; logActivity({ fixed: 1 }); toast('Weak spot cleared — nice work!'); }
  }
  if (item.meta.chapterId && res.verdict === 'correct' && item.q.id) {
    const st = data.practice[item.meta.chapterId] ||= { index: 0, correct: {} };
    st.correct ||= {}; st.correct[item.q.id] = 1; recomputeProgress(item.meta.chapterId);
  }
  save(); updateSidebar();
}
/* ============================================================
   Views: navigation, overview, classes, library, chapter
   ============================================================ */
const ui = {
  page: 'home', classId: null, chapterId: null, tab: 'Notes', libFilter: 'all', search: '', guideId: null,
  pFilter: { difficulty: 'all', type: 'all' }, pItem: null,
  flash: { mode: 'due', flipped: false, key: null, queue: [] },
  learn: null, bankFilter: 'all', gen: null
};
const PAGE_NAMES = { home: 'Overview', classes: 'My classes', library: 'Study library', tests: 'Test center', mistakes: 'Weak spots', tutor: 'AI tutor', planner: 'Planner', progress: 'Progress', settings: 'Settings', search: 'Search', guide: 'Study guide', 'test-result': 'Test center / Results' };

function go(page, extra = {}) {
  if (ui.page === 'test-run' && page !== 'test-run') captureInputs(currentRunItem());
  Object.assign(ui, { page }, extra);
  render(); window.scrollTo(0, 0);
}
function openChapter(classId, chapterId, tab = 'Notes') { go('chapter', { classId, chapterId, tab, pItem: null, learn: null }); }

function updateSidebar() {
  $('#classNav').innerHTML = data.classes.map(c => '<button class="class-link" data-act="open-class" data-id="' + c.id + '"><i style="--c:' + c.color + '"></i>' + esc(c.name) + '</button>').join('');
  const s = streak(), today = data.activity[dateKey()] || {};
  $('#streakCard').innerHTML = '<span class="flame">' + (s ? '🔥' : '✦') + '</span><div><b>' + (s ? plural(s, 'day') + ' streak' : 'Start a streak') + '</b><small>' + (today.questions || 0) + ' questions · ' + (today.minutes || 0) + ' min today</small></div>';
  const p = data.profile;
  $('#profileCard').innerHTML = '<i class="avatar">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : esc((p.name || 'S')[0].toUpperCase())) + '</i><div><b>' + esc(p.name || 'Student') + '</b><small>Settings & profile</small></div>';
  const mc = Object.keys(data.mistakes).length, badge = $('#mistakeCount');
  badge.textContent = mc; badge.classList.toggle('hidden', !mc);
  $$('.nav').forEach(b => b.classList.toggle('active', b.dataset.page === ui.page || (ui.page === 'test-run' && b.dataset.page === 'tests') || (['class', 'chapter'].includes(ui.page) && b.dataset.page === 'classes')));
  const course = findClass(ui.classId), chapter = findChapter(ui.chapterId).chapter;
  $('#breadcrumb').textContent = 'Your workspace / ' + (ui.page === 'class' ? course?.name : ui.page === 'chapter' ? (course?.name + ' / ' + chapter?.title) : ui.page === 'test-run' ? 'Test center / Test' : PAGE_NAMES[ui.page] || '');
  $('#themeBtn').textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾';
}

function render() {
  updateSidebar();
  const view = $('#view');
  const fn = { home: viewHome, classes: viewClasses, class: viewClass, library: viewLibrary, chapter: viewChapter, tests: viewTests, 'test-run': viewRunner, 'test-result': viewResult, mistakes: viewMistakes, tutor: viewTutor, planner: viewPlanner, progress: viewProgress, settings: viewSettings, search: viewSearch, guide: viewGuide }[ui.page] || viewHome;
  view.innerHTML = fn();
  afterRender();
}
function afterRender() {
  if (ui.page === 'chapter' && ui.tab === 'Practice' && ui.pItem) bindOrderDrag(ui.pItem.item, render);
  if (ui.page === 'test-run') { const it = currentRunItem(); if (it) bindOrderDrag(it, render); }
  if (ui.page === 'mistakes' && ui.review?.item) bindOrderDrag(ui.review.item, render);
  if (ui.page === 'tutor') { const log = $('#chatLog'); if (log) log.scrollTop = log.scrollHeight; }
  const focus = $('[data-autofocus]'); if (focus) focus.focus();
}

const statCard = (icon, label, value) => '<div class="stat"><div class="symbol">' + icon + '</div><div><small>' + label + '</small><b>' + value + '</b></div></div>';
function classCard(c) {
  const p = classProgress(c), next = upcomingExams().find(e => e.course.id === c.id);
  return '<article class="card" data-act="open-class" data-id="' + c.id + '" style="--color:' + c.color + '">' +
    '<div class="card-top"><div class="symbol">' + esc(c.symbol) + '</div><button class="kebab" data-act="edit-class" data-id="' + c.id + '" title="Edit or delete class">···</button></div>' +
    '<h3>' + esc(c.name) + '</h3><p>' + esc(c.teacher || 'Class workspace') + '</p>' +
    '<div class="progress-meta"><span>' + plural(c.chapters.length, 'chapter') + '</span><b>' + p + '%</b></div>' +
    '<div class="track"><i style="--p:' + p + '%"></i></div>' +
    '<div class="card-foot"><span>' + (next ? '📅 ' + esc(next.exam.title) + ' in ' + plural(next.days, 'day') : 'No exam scheduled') + '</span><b>Open →</b></div></article>';
}
function chapterRow(course, ch, showClass = false) {
  const p = chapterProgress(ch.id);
  return '<article class="chapter" style="--color:' + course.color + '"><div class="symbol">' + esc(course.symbol) + '</div>' +
    '<section><h3>' + esc(ch.title) + '</h3><p>' + (showClass ? esc(course.name) + ' · ' : '') + p + '% complete · ' + plural(ch.questions.length, 'question') + ' · ' + plural(ch.definitions.length, 'term') + '</p>' +
    '<div class="track" style="margin-top:8px"><i style="--p:' + p + '%"></i></div></section>' +
    '<div class="chapter-actions"><button class="soft" data-act="open-chapter" data-class="' + course.id + '" data-id="' + ch.id + '">' + (p > 0 && p < 100 ? 'Continue' : 'Open') + '</button>' +
    '<button class="soft" data-act="quick-test" data-class="' + course.id + '" data-id="' + ch.id + '">Test</button>' +
    '<button class="soft" data-act="edit-material" data-class="' + course.id + '" data-id="' + ch.id + '">Edit</button>' +
    '<button class="soft danger" data-act="delete-chapter" data-class="' + course.id + '" data-id="' + ch.id + '">Delete</button></div></article>';
}

/* ---------- Overview ---------- */
function viewHome() {
  const all = allChapters(), overall = all.length ? Math.round(all.reduce((s, x) => s + chapterProgress(x.chapter.id), 0) / all.length) : 0;
  const continuing = all.filter(x => chapterProgress(x.chapter.id) > 0 && chapterProgress(x.chapter.id) < 100);
  const w = weekTotals(), p = data.profile, exams = upcomingExams().slice(0, 3), due = dueCardCount(), weak = Object.keys(data.mistakes).length;
  const hour = new Date().getHours(), hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const minPct = clamp(Math.round(w.minutes / Math.max(1, p.weeklyMinutes) * 100), 0, 100), qPct = clamp(Math.round(w.questions / Math.max(1, p.weeklyQuestions) * 100), 0, 100);
  return '<div class="hero"><div><div class="eyebrow">' + fmtDate(Date.now(), { weekday: 'long', month: 'long', day: 'numeric' }) + '</div><h1 class="title">' + hello + ', ' + esc((p.name || 'Student').split(' ')[0]) + '<span class="dot">.</span></h1><p class="sub">A little progress goes a long way. Pick up where you left off, or start something new.</p></div>' +
    '<div class="btn-row"><button class="soft" data-act="go" data-page="tests">✎ Take a test</button><button class="primary" data-act="add-material">＋ Add material</button></div></div>' +
    '<div class="stats">' + statCard('🔥', 'Study streak', plural(streak(), 'day')) + statCard('✧', 'Overall progress', overall + '%') + statCard('🃏', 'Flashcards due', due) + statCard('⚑', 'Weak spots', weak) + '</div>' +
    '<div class="section-head"><h2>Your classes</h2><button class="text-link" data-act="go" data-page="classes">View all →</button></div>' +
    (data.classes.length ? '<div class="grid">' + data.classes.map(classCard).join('') + '</div>' : '<div class="empty"><b>No classes yet</b>Add a class to start organizing your study material.<br><button class="primary" data-act="add-class">＋ Add a class</button></div>') +
    '<div class="grid-2"><div class="panel"><h2>Today’s plan</h2>' + todayPlanHTML(5) + '<div style="margin-top:10px"><button class="text-link" data-act="go" data-page="planner">Open planner →</button></div></div>' +
    '<div class="panel"><h2>This week’s goals</h2>' +
    '<div class="goal"><div class="ring sm" style="--p:' + minPct + '"><div><b>' + minPct + '%</b></div></div><div><b>' + w.minutes + ' / ' + p.weeklyMinutes + ' min</b><div class="muted small">Study time</div></div></div>' +
    '<div class="goal"><div class="ring sm" style="--p:' + qPct + ';--ring:var(--good)"><div><b>' + qPct + '%</b></div></div><div><b>' + w.questions + ' / ' + p.weeklyQuestions + ' questions</b><div class="muted small">Practice questions answered</div></div></div>' +
    (exams.length ? '<h2 style="margin-top:18px">Upcoming exams</h2>' + exams.map(e => '<div class="task"><div class="symbol" style="--color:' + e.course.color + '">📅</div><div><b>' + esc(e.exam.title) + '</b><small>' + esc(e.course.name) + ' · ' + fmtDate(parseDateKey(e.exam.date), { weekday: 'short', month: 'short', day: 'numeric' }) + '</small></div><span class="pill ' + (e.days <= 3 ? 'bad' : e.days <= 7 ? 'warn' : '') + '">' + (e.days === 0 ? 'Today' : e.days + 'd') + '</span></div>').join('') : '') +
    '</div></div>' +
    (continuing.length ? '<div class="panel" style="margin-top:14px"><h2>Pick up where you left off</h2>' + continuing.slice(0, 5).map(x => '<div class="task"><div class="symbol" style="--color:' + x.course.color + '">' + esc(x.course.symbol) + '</div><div><b>' + esc(x.chapter.title) + '</b><small>' + esc(x.course.name) + ' · ' + chapterProgress(x.chapter.id) + '% complete</small></div><button class="text-link" data-act="open-chapter" data-class="' + x.course.id + '" data-id="' + x.chapter.id + '" data-tab="Practice">Continue →</button></div>').join('') + '</div>' : '');
}

/* ---------- Classes ---------- */
function viewClasses() {
  return '<div class="hero"><div><div class="eyebrow">Your workspace</div><h1 class="title">My classes</h1><p class="sub">Keep every subject, chapter, and session together.</p></div><button class="primary" data-act="add-class">＋ Add a class</button></div>' +
    (data.classes.length ? '<div class="grid">' + data.classes.map(classCard).join('') + '</div>' : '<div class="empty"><b>No classes yet</b>Create a class for each subject you are studying.<br><button class="primary" data-act="add-class">＋ Add a class</button></div>');
}
function viewClass() {
  const c = findClass(ui.classId); if (!c) { ui.page = 'classes'; return viewClasses(); }
  const p = classProgress(c), guides = data.guides.filter(g => g.classId === c.id);
  const exams = (c.exams || []).filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  return '<div class="hero" style="--color:' + c.color + '"><div><div class="eyebrow">' + esc(c.teacher || 'Class workspace') + '</div><h1 class="title">' + esc(c.symbol) + ' ' + esc(c.name) + '</h1><p class="sub">' + plural(c.chapters.length, 'chapter') + ' · ' + p + '% overall' + (exams[0] ? ' · next exam in ' + plural(daysUntil(exams[0].date), 'day') : '') + '</p></div>' +
    '<div class="btn-row"><button class="soft" data-act="edit-class" data-id="' + c.id + '">Edit class</button><button class="soft" data-act="class-test" data-id="' + c.id + '">✎ Test this class</button><button class="soft" data-act="tutor-scope" data-class="' + c.id + '">✦ Ask tutor</button><button class="primary" data-act="add-chapter" data-id="' + c.id + '">＋ Add chapter</button></div></div>' +
    '<div class="track" style="--color:' + c.color + ';margin-bottom:20px"><i style="--p:' + p + '%"></i></div>' +
    '<div class="section-head"><h2>Chapters / modules</h2><span class="eyebrow">' + p + '% overall</span></div><div class="list">' +
    (c.chapters.length ? c.chapters.map(ch => chapterRow(c, ch)).join('') : '<div class="empty"><b>No chapters yet</b>Add a chapter, then upload its study material.<br><button class="primary" data-act="add-chapter" data-id="' + c.id + '">＋ Add chapter</button></div>') + '</div>' +
    '<div class="grid-even" style="margin-top:22px"><div class="panel"><div class="section-head"><h2>Exams</h2><button class="text-link" data-act="add-exam" data-id="' + c.id + '">＋ Add exam date</button></div>' +
    (exams.length ? exams.map(e => '<div class="task"><div class="symbol">📅</div><div><b>' + esc(e.title) + '</b><small>' + fmtDate(parseDateKey(e.date), { weekday: 'short', month: 'short', day: 'numeric' }) + ' · in ' + plural(daysUntil(e.date), 'day') + '</small></div><button class="kebab" data-act="edit-exam" data-class="' + c.id + '" data-id="' + e.id + '">✎</button></div>').join('') : '<p class="muted small">Add exam dates to get countdowns and a study plan.</p>') + '</div>' +
    '<div class="panel"><div class="section-head"><h2>Study guides</h2><button class="text-link" data-act="new-guide" data-class="' + c.id + '">✦ New guide</button></div>' +
    (guides.length ? guides.map(g => '<div class="task"><div class="symbol">📄</div><div><b>' + esc(g.title) + '</b><small>' + fmtDate(g.date) + '</small></div><button class="text-link" data-act="open-guide" data-id="' + g.id + '">Open →</button></div>').join('') : '<p class="muted small">AI can turn chapters into a printable one-page exam guide.</p>') + '</div></div>';
}

/* ---------- Library ---------- */
function viewLibrary() {
  const rows = allChapters().filter(x => ui.libFilter === 'all' || ui.libFilter === x.course.id);
  return '<div class="hero"><div><div class="eyebrow">Study library</div><h1 class="title">Your study materials</h1><p class="sub">Every chapter across your classes. Open one to review, practice, or explore definitions.</p></div><button class="primary" data-act="add-material">＋ Add material</button></div>' +
    '<div class="toolbar"><select id="libFilter"><option value="all">All classes</option>' + data.classes.map(c => '<option value="' + c.id + '" ' + (c.id === ui.libFilter ? 'selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select><input id="libSearch" type="search" placeholder="Filter chapters…"></div>' +
    '<div id="libraryList" class="list">' + (rows.length ? rows.map(x => chapterRow(x.course, x.chapter, true)).join('') : '<div class="empty"><b>No study materials</b>Add chapters to your classes, or change the class filter.</div>') + '</div>';
}

/* ---------- Chapter ---------- */
const CH_TABS = ['Notes', 'Practice', 'Learn', 'Flashcards', 'Definitions', 'Questions', 'Files'];
function viewChapter() {
  const { course, chapter } = findChapter(ui.chapterId);
  if (!course || !chapter) { ui.page = 'classes'; return viewClasses(); }
  ui.classId = course.id;
  const p = chapterProgress(chapter.id);
  const body = { Notes: tabNotes, Practice: tabPractice, Learn: tabLearn, Flashcards: tabFlashcards, Definitions: tabDefinitions, Questions: tabQuestions, Files: tabFiles }[ui.tab]?.(course, chapter) || '';
  return '<div class="detail" style="--color:' + course.color + '"><div><button class="text-link" data-act="open-class" data-id="' + course.id + '">← ' + esc(course.name) + '</button><h1 class="title">' + esc(chapter.title) + '</h1><p class="sub">' + p + '% complete' + (chapter.source ? ' · ' + esc(chapter.source) : '') + '</p></div>' +
    '<div class="btn-row no-print"><button class="soft" data-act="quick-test" data-class="' + course.id + '" data-id="' + chapter.id + '">✎ Test me</button><button class="soft" data-act="tutor-scope" data-class="' + course.id + '" data-chapter="' + chapter.id + '">✦ Ask tutor</button><button class="soft" data-act="edit-material" data-class="' + course.id + '" data-id="' + chapter.id + '">✎ Edit material</button></div></div>' +
    '<div class="track" style="--color:' + course.color + '"><i style="--p:' + p + '%"></i></div>' +
    '<div class="tabs">' + CH_TABS.map(t => '<button class="tab ' + (t === ui.tab ? 'active' : '') + '" data-act="tab" data-tab="' + t + '">' + t + (t === 'Flashcards' && dueCardCount(chapter) ? ' <span class="pill">' + dueCardCount(chapter) + '</span>' : '') + '</button>').join('') + '</div>' + body;
}
function tabNotes(course, ch) {
  const hasNotes = ch.html || ch.text;
  return (ch.summary ? '<div class="summary-box"><h4>✦ Summary</h4><div class="ai-text">' + md(ch.summary) + '</div></div>' : '') +
    (hasNotes ? '<div class="notes" id="printNotes">' + (ch.html || '<div class="plain">' + esc(ch.text) + '</div>') + '</div>' : '<div class="empty"><b>No notes yet</b>Upload PDFs, Word docs, slides, or photos — or paste your notes.<br><button class="primary" data-act="edit-material" data-class="' + course.id + '" data-id="' + ch.id + '">＋ Add material</button></div>') +
    '<div class="source">Source: ' + esc(ch.source || 'Add a source in Edit material') + '</div>' +
    '<div class="btn-row no-print"><button class="primary" data-act="complete" data-id="' + ch.id + '">✓ Mark chapter complete</button><button class="soft" data-act="edit-material" data-class="' + course.id + '" data-id="' + ch.id + '">Edit notes</button>' +
    '<button class="soft" data-act="print-chapter" data-id="' + ch.id + '">⎙ Print / PDF</button><button class="soft ai" data-act="new-guide" data-class="' + course.id + '" data-chapter="' + ch.id + '">✦ Study guide</button>' +
    (chapterProgress(ch.id) > 0 ? '<button class="text-link danger" data-act="reset-progress" data-id="' + ch.id + '" style="margin-left:auto">Reset progress</button>' : '') + '</div>';
}

/* Practice: one question at a time, resumes where you left off */
function practiceList(ch) {
  return ch.questions.filter(q => (ui.pFilter.type === 'all' || q.type === ui.pFilter.type) &&
    (ui.pFilter.difficulty === 'all' || (ui.pFilter.difficulty === 'easy' ? guessDifficulty(q) !== 'hard' : ui.pFilter.difficulty === 'hard' ? guessDifficulty(q) !== 'easy' : true)));
}
function tabPractice(course, ch) {
  if (!ch.questions.length) return '<div class="empty"><b>No practice questions yet</b>Add questions yourself, or let AI write them from your notes.<br><button class="primary" data-act="tab" data-tab="Questions">Go to question bank</button></div>';
  const list = practiceList(ch), st = data.practice[ch.id] ||= { index: 0, correct: {} };
  const typesHere = [...new Set(ch.questions.map(q => q.type))];
  const filters = '<div class="mode-top"><div class="seg">' + [['all', 'All levels'], ['easy', 'Easier'], ['hard', 'Harder']].map(([v, l]) => '<button class="' + (ui.pFilter.difficulty === v ? 'on' : '') + '" data-act="p-diff" data-val="' + v + '">' + l + '</button>').join('') + '</div>' +
    '<select id="pType"><option value="all">All question types</option>' + typesHere.map(t => '<option value="' + t + '" ' + (ui.pFilter.type === t ? 'selected' : '') + '>' + TYPE_LABELS[t] + '</option>').join('') + '</select></div>';
  if (!list.length) return '<div class="mode">' + filters + '<div class="empty">No questions match these filters.</div></div>';
  st.index = clamp(st.index || 0, 0, list.length - 1);
  const q = list[st.index];
  if (!ui.pItem || ui.pItem.id !== q.id) ui.pItem = { id: q.id, item: makeItem(q, { classId: course.id, chapterId: ch.id }), revealed: false };
  const { item, revealed } = ui.pItem;
  const mastered = ch.questions.filter(x => st.correct?.[x.id]).length;
  const needsCheck = !revealed && ['fill', 'match', 'order'].includes(q.type) || (!revealed && isOpen(q));
  return '<div class="mode">' + filters +
    '<div class="mode-top"><span>Question ' + (st.index + 1) + ' of ' + list.length + ' · ' + mastered + '/' + ch.questions.length + ' answered correctly</span><span class="pill gray">' + TYPE_LABELS[q.type] + ' · ' + guessDifficulty(q) + '</span></div>' +
    '<div class="track" style="margin-bottom:6px"><i style="--p:' + Math.round(mastered / ch.questions.length * 100) + '%"></i></div>' +
    renderItem(item, { reveal: revealed, key: 'p' }) +
    '<div class="nav-row"><button class="soft" data-act="p-nav" data-dir="-1" ' + (st.index === 0 ? 'disabled' : '') + '>← Previous</button>' +
    '<div class="btn-row">' + (needsCheck ? '<button class="primary" data-act="p-check">' + (isOpen(q) ? 'Show answer' : 'Check answer') + '</button>' : '') +
    '<button class="' + (needsCheck ? 'soft' : 'primary') + '" data-act="p-nav" data-dir="1">' + (st.index === list.length - 1 ? 'Start over ↺' : 'Next question →') + '</button></div></div></div>';
}

/* Learn mode: multiple choice first, then type-the-term, until every term is mastered */
function tabLearn(course, ch) {
  const defs = ch.definitions;
  if (defs.length < 2) return '<div class="empty"><b>Learn mode needs at least 2 definitions</b>Add terms in the Definitions tab (or let AI create them from your notes).<br><button class="primary" data-act="tab" data-tab="Definitions">Go to definitions</button></div>';
  const st = data.learn[ch.id] ||= {};
  const mastered = defs.filter(d => st[d[0]] >= 2).length, familiar = defs.filter(d => st[d[0]] === 1).length;
  const head = '<div class="mode-top"><span>' + mastered + ' of ' + defs.length + ' mastered · ' + familiar + ' familiar</span><button class="text-link" data-act="learn-reset">Restart</button></div><div class="track" style="margin-bottom:14px"><i style="--p:' + Math.round(mastered / defs.length * 100) + '%;--color:var(--good)"></i></div>';
  if (mastered === defs.length) return '<div class="mode">' + head + '<div class="empty"><b>🎉 You mastered every term!</b>Try a test, or restart Learn mode to review.<br><button class="primary" data-act="quick-test" data-class="' + course.id + '" data-id="' + ch.id + '">Take a test</button></div></div>';
  if (!ui.learn || ui.learn.chapterId !== ch.id) {
    const pool = shuffle(defs.filter(d => (st[d[0]] || 0) < 2)).sort((a, b) => (st[a[0]] || 0) - (st[b[0]] || 0));
    const d = pool[0], stage = st[d[0]] || 0;
    const options = stage === 0 ? shuffle([d[0], ...shuffle(defs.filter(x => x[0] !== d[0])).slice(0, 3).map(x => x[0])]) : null;
    ui.learn = { chapterId: ch.id, term: d[0], def: d[1], stage, options, answered: false, correct: null, given: '' };
  }
  const L = ui.learn;
  let body = '<div class="eyebrow">' + (L.stage === 0 ? 'Choose the matching term' : 'Type the term') + '</div><div class="question">' + esc(L.def) + '</div>';
  if (L.stage === 0) body += '<div class="answers">' + L.options.map((o, i) => { let cls = ''; if (L.answered) cls = o === L.term ? ' right' : o === L.given ? ' wrong' : ''; return '<button class="answer' + cls + '" data-act="learn-pick" data-val="' + esc(o) + '" ' + (L.answered ? 'disabled' : '') + '><span class="letter">' + (i + 1) + '</span><span>' + esc(o) + '</span></button>'; }).join('') + '</div>';
  else body += '<input id="learnInput" class="text-answer" placeholder="Type the term…" autocomplete="off" value="' + esc(L.given) + '" ' + (L.answered ? 'disabled' : 'data-autofocus') + '>' + (L.answered ? '' : '<div class="btn-row" style="margin-top:10px"><button class="primary" data-act="learn-check">Check</button><button class="text-link" data-act="learn-dontknow">I don’t know</button></div>');
  if (L.answered) body += '<div class="feedback ' + (L.correct ? 'good' : 'bad') + '"><b class="v">' + (L.correct ? (L.stage === 0 ? '✓ Nice! Next time you’ll type it.' : '✓ Mastered!') : '✗ The answer is: ' + esc(L.term)) + '</b></div><div class="nav-row"><span></span><button class="primary" data-act="learn-next" data-autofocus>Continue →</button></div>';
  return '<div class="mode">' + head + body + '</div>';
}

/* Smart flashcards (spaced repetition) */
const cardKey = (chId, term) => chId + '::' + term;
function dueCards(ch) { const today = dateKey(); return ch.definitions.filter(d => { const s = data.cards[cardKey(ch.id, d[0])]; return !s || s.due <= today; }); }
function dueCardCount(ch) { return ch ? dueCards(ch).length : allChapters().reduce((s, x) => s + dueCards(x.chapter).length, 0); }
function tabFlashcards(course, ch) {
  const defs = ch.definitions;
  if (!defs.length) return '<div class="empty"><b>No flashcards yet</b>Flashcards are made from your definitions.<br><button class="primary" data-act="tab" data-tab="Definitions">Add definitions</button></div>';
  const F = ui.flash;
  if (F.chapterId !== ch.id || !F.queue.length) {
    F.chapterId = ch.id; F.flipped = false;
    F.queue = (F.mode === 'due' ? shuffle(dueCards(ch)) : [...defs]).map(d => d[0]);
    F.pos = 0;
  }
  const seg = '<div class="mode-top"><div class="seg"><button class="' + (F.mode === 'due' ? 'on' : '') + '" data-act="flash-mode" data-val="due">Smart review (' + dueCards(ch).length + ' due)</button><button class="' + (F.mode === 'all' ? 'on' : '') + '" data-act="flash-mode" data-val="all">Browse all ' + defs.length + '</button></div><button class="text-link" data-act="flash-shuffle">⤮ Shuffle</button></div>';
  if (!F.queue.length) return '<div class="mode">' + seg + '<div class="empty"><b>🎉 All caught up!</b>No cards are due today. Come back tomorrow, or browse all cards.</div></div>';
  F.pos = clamp(F.pos || 0, 0, F.queue.length - 1);
  const d = defs.find(x => x[0] === F.queue[F.pos]) || defs[0];
  const s = data.cards[cardKey(ch.id, d[0])];
  const card = '<div class="flash ' + (F.flipped ? 'back' : '') + '" data-act="flip">' + '<div>' + esc(F.flipped ? d[1] : d[0]) + '<small>' + (F.flipped ? 'Definition · click to see term' : 'Term · click or press Space to flip') + '</small></div></div>';
  const nextIv = r => { const iv = scheduleCard(s, r, true); return iv < 1 ? '<10 min' : plural(iv, 'day'); };
  const controls = F.mode === 'due'
    ? (F.flipped ? '<div class="rate-row"><button class="again" data-act="rate" data-val="0">Again<small>' + nextIv(0) + '</small></button><button class="hard" data-act="rate" data-val="1">Hard<small>' + nextIv(1) + '</small></button><button class="good" data-act="rate" data-val="2">Good<small>' + nextIv(2) + '</small></button><button class="easy" data-act="rate" data-val="3">Easy<small>' + nextIv(3) + '</small></button></div><p class="muted small" style="text-align:center">Keys: 1 Again · 2 Hard · 3 Good · 4 Easy</p>' : '<div class="nav-row"><span></span><button class="primary" data-act="flip">Show answer</button></div>')
    : '<div class="nav-row"><button class="soft" data-act="flash-nav" data-dir="-1">← Previous</button><button class="primary" data-act="flash-nav" data-dir="1">Next card →</button></div>';
  return '<div class="mode">' + seg + '<div class="mode-top"><span>Card ' + (F.pos + 1) + ' of ' + F.queue.length + '</span>' + (s ? '<span class="pill gray">Next review ' + (s.due <= dateKey() ? 'today' : fmtDate(parseDateKey(s.due))) + '</span>' : '<span class="pill">New</span>') + '</div>' + card + controls + '</div>';
}
/* Simple SM-2 style scheduling. rating: 0 again, 1 hard, 2 good, 3 easy */
function scheduleCard(s, rating, previewOnly = false) {
  s = { interval: 0, ease: 2.5, reps: 0, ...(s || {}) };
  let iv;
  if (rating === 0) { iv = 0; s.ease = Math.max(1.3, s.ease - 0.2); s.reps = 0; }
  else if (rating === 1) { iv = Math.max(1, Math.round(s.interval * 1.2)); s.ease = Math.max(1.3, s.ease - 0.15); }
  else if (rating === 2) { iv = s.reps === 0 ? 1 : s.reps === 1 ? 3 : Math.round(s.interval * s.ease); }
  else { iv = s.reps === 0 ? 4 : Math.round(Math.max(1, s.interval) * s.ease * 1.3); s.ease += 0.15; }
  if (previewOnly) return iv;
  s.interval = iv; s.reps = rating === 0 ? 0 : s.reps + 1;
  const due = new Date(); due.setDate(due.getDate() + iv); s.due = dateKey(due);
  return s;
}

function tabDefinitions(course, ch) {
  return '<div class="section-head no-print"><h2>' + plural(ch.definitions.length, 'term') + '</h2><div class="btn-row"><button class="soft" data-act="quizlet-import" data-id="' + ch.id + '">⇪ Import from Quizlet</button><button class="soft" data-act="quizlet-export" data-id="' + ch.id + '" ' + (ch.definitions.length ? '' : 'disabled') + '>⇩ Export for Quizlet</button><button class="soft" data-act="print-defs" data-id="' + ch.id + '" ' + (ch.definitions.length ? '' : 'disabled') + '>⎙ Print</button><button class="primary" data-act="edit-material" data-class="' + course.id + '" data-id="' + ch.id + '">Edit terms</button></div></div>' +
    '<div class="definitions">' + (ch.definitions.map(d => '<article class="definition"><h3>' + esc(d[0]) + '</h3><p>' + esc(d[1]) + '</p><small>Source: ' + esc(d[2] || ch.source || 'Add a source in Edit material') + '</small></article>').join('') || '<div class="empty">No definitions yet. Add them in Edit material, import from Quizlet, or generate them with AI.</div>') + '</div>';
}

function tabQuestions(course, ch) {
  const counts = {}; ch.questions.forEach(q => counts[q.type] = (counts[q.type] || 0) + 1);
  const list = ch.questions.filter(q => ui.bankFilter === 'all' || q.type === ui.bankFilter);
  return '<div class="section-head"><h2>Question bank · ' + ch.questions.length + '</h2><div class="btn-row"><button class="soft ai" data-act="gen-questions" data-id="' + ch.id + '">✦ Generate with AI</button><button class="primary" data-act="edit-question" data-chapter="' + ch.id + '">＋ Add question</button></div></div>' +
    '<div class="chips" style="margin-bottom:12px"><button class="chip ' + (ui.bankFilter === 'all' ? 'on' : '') + '" data-act="bank-filter" data-val="all">All <small>' + ch.questions.length + '</small></button>' + QTYPES.filter(t => counts[t]).map(t => '<button class="chip ' + (ui.bankFilter === t ? 'on' : '') + '" data-act="bank-filter" data-val="' + t + '">' + TYPE_LABELS[t] + ' <small>' + counts[t] + '</small></button>').join('') + '</div>' +
    '<div class="list">' + (list.map(q => '<div class="qcard"><div class="qtext"><div class="qmeta"><span class="pill">' + TYPE_LABELS[q.type] + '</span><span class="pill gray">' + guessDifficulty(q) + '</span>' + (data.practice[ch.id]?.correct?.[q.id] ? '<span class="pill good">✓ answered</span>' : '') + '</div>' + esc(q.q) + '<div class="muted small" style="margin-top:4px">Answer: ' + esc(correctText(q).replace(/\n/g, ' · ').slice(0, 160)) + '</div></div>' +
      '<div class="btn-row"><button class="soft" data-act="edit-question" data-chapter="' + ch.id + '" data-id="' + q.id + '">Edit</button><button class="soft danger" data-act="delete-question" data-chapter="' + ch.id + '" data-id="' + q.id + '">Delete</button></div></div>').join('') ||
      '<div class="empty"><b>No questions yet</b>Add true/false, multiple choice, fill-in, matching, ordering, free response, discussion, or case-study questions.</div>') + '</div>';
}

function tabFiles(course, ch) {
  setTimeout(async () => {
    const box = $('#fileList'); if (!box) return;
    let files = [];
    try { files = await filesForChapter(ch.id); } catch {}
    box.innerHTML = files.length ? files.map(f => '<div class="file-row"><div class="symbol">' + esc((f.name.split('.').pop() || '').toUpperCase().slice(0, 4)) + '</div><div><b>' + esc(f.name) + '</b><small>' + (f.size / 1024 / 1024).toFixed(2) + ' MB · added ' + fmtDate(f.added) + '</small></div>' +
      '<button class="soft" data-act="file-open" data-id="' + f.id + '">Open</button><button class="soft" data-act="file-download" data-id="' + f.id + '">Download</button><button class="soft danger" data-act="file-delete" data-id="' + f.id + '">Delete</button></div>').join('')
      : '<div class="empty"><b>No saved files</b>When you upload material, the original PDFs, Word files, slides, and photos are kept here so you can reopen them.</div>';
  });
  return '<div class="section-head"><h2>Original files</h2><button class="primary" data-act="edit-material" data-class="' + course.id + '" data-id="' + ch.id + '">＋ Upload files</button></div><div id="fileList"><p class="muted">Loading…</p></div>' +
    '<p class="hint" style="margin-top:14px">Files are stored in this browser on this computer (not in backups). Keep your originals somewhere safe too.</p>';
}

/* ---------- Study guide page ---------- */
function viewGuide() {
  const g = data.guides.find(x => x.id === ui.guideId); if (!g) { ui.page = 'home'; return viewHome(); }
  const c = findClass(g.classId);
  return '<div class="detail"><div><button class="text-link no-print" data-act="open-class" data-id="' + g.classId + '">← ' + esc(c?.name || 'Class') + '</button><h1 class="title">' + esc(g.title) + '</h1><p class="sub">Study guide · made ' + fmtDate(g.date) + '</p></div>' +
    '<div class="btn-row no-print"><button class="soft" data-act="print-guide" data-id="' + g.id + '">⎙ Print / PDF</button><button class="soft danger" data-act="delete-guide" data-id="' + g.id + '">Delete</button></div></div>' +
    '<div class="notes ai-text" id="guideBody">' + md(g.md) + '</div>';
}
/* ============================================================
   Test center: setup → runner → results, score history
   ============================================================ */
const defaultSetup = () => ({ classId: data.classes[0]?.id || '', chapterIds: [], mode: 'exam', source: 'bank', count: 10, time: 0, types: ['mc', 'tf', 'fill'], difficulty: 'mixed', shuffle: true, weakOnly: false, saveAI: true });
function testSetup() {
  const s = ui.ts ||= { ...defaultSetup(), ...(data.settings.lastSetup || {}) };
  if (!findClass(s.classId)) { s.classId = data.classes[0]?.id || ''; s.chapterIds = []; s._init = false; }
  const c = findClass(s.classId);
  s.chapterIds = (s.chapterIds || []).filter(id => c?.chapters.some(ch => ch.id === id));
  if (c && !s._init) { if (!s.chapterIds.length) s.chapterIds = c.chapters.map(ch => ch.id); s._init = true; }
  return s;
}
function setupPool(s) {
  const c = findClass(s.classId); if (!c) return [];
  const pool = [];
  c.chapters.filter(ch => s.chapterIds.includes(ch.id)).forEach(ch => ch.questions.forEach(q => {
    if (!s.types.includes(q.type)) return;
    if (s.difficulty !== 'mixed' && guessDifficulty(q) !== s.difficulty) return;
    if (s.weakOnly && !data.mistakes[ch.id + '::' + q.id]) return;
    pool.push({ q, chapterId: ch.id });
  }));
  return pool;
}
function viewTests() {
  if (!data.classes.length) return '<div class="hero"><div><div class="eyebrow">Test center</div><h1 class="title">Test center</h1></div></div><div class="empty"><b>Add a class first</b>Tests are built from your classes and chapters.<br><button class="primary" data-act="add-class">＋ Add a class</button></div>';
  const s = testSetup(), c = findClass(s.classId), pool = setupPool(s);
  const typeCounts = {}; c.chapters.filter(ch => s.chapterIds.includes(ch.id)).forEach(ch => ch.questions.forEach(q => typeCounts[q.type] = (typeCounts[q.type] || 0) + 1));
  const at = data.activeTest;
  const recent = data.tests.slice(-5).reverse();
  const needsAI = s.source !== 'bank';
  const shortfall = s.source === 'bank' && pool.length < s.count;
  const seg = (name, val, opts) => '<div class="seg">' + opts.map(([v, l]) => '<button class="' + (String(val) === String(v) ? 'on' : '') + '" data-act="ts" data-k="' + name + '" data-val="' + v + '">' + l + '</button>').join('') + '</div>';
  return '<div class="hero"><div><div class="eyebrow">Test center</div><h1 class="title">Build a test<span class="dot">.</span></h1><p class="sub">Choose a class, the chapters/modules to cover, and how you want to be tested.</p></div>' +
    '<div class="btn-row"><button class="soft" data-act="go" data-page="mistakes">⚑ Weak spots (' + Object.keys(data.mistakes).length + ')</button><button class="soft" data-act="go" data-page="progress">↗ Score history</button></div></div>' +
    (at ? '<div class="panel" style="margin-bottom:16px;border-color:var(--accent-line);background:var(--accent-soft-2)"><div class="task" style="border:0;padding:0"><div class="symbol">⏸</div><div><b>Test in progress · ' + esc(findClass(at.classId)?.name || '') + '</b><small>' + at.items.filter(answered).length + ' of ' + at.items.length + ' answered' + (at.timeLimit ? ' · ' + fmtTime(at.remaining) + ' left' : '') + ' · ' + (at.mode === 'exam' ? 'Exam mode' : 'Practice mode') + '</small></div><button class="soft danger" data-act="discard-test">Discard</button><button class="primary" data-act="resume-test">Resume →</button></div></div>' : '') +
    '<div class="setup"><div class="panel">' +
    '<div class="setup-block"><label>1 · Class</label><select id="tsClass" style="width:100%">' + data.classes.map(x => '<option value="' + x.id + '" ' + (x.id === s.classId ? 'selected' : '') + '>' + esc(x.symbol + ' ' + x.name) + '</option>').join('') + '</select></div>' +
    '<div class="setup-block"><div class="setup-label">2 · Chapters / modules <span class="btn-row"><button class="text-link" data-act="ts-ch-all">Select all</button><button class="text-link" data-act="ts-ch-none">Clear</button></span></div>' +
    (c.chapters.length ? '<div class="chips">' + c.chapters.map(ch => '<label class="chip"><input type="checkbox" class="ts-ch" value="' + ch.id + '" ' + (s.chapterIds.includes(ch.id) ? 'checked' : '') + '>' + esc(ch.title) + ' <small>' + ch.questions.length + 'q</small></label>').join('') + '</div><p class="muted small" style="margin:8px 0 0">Pick one chapter to test it on its own, or several to combine them.</p>' : '<p class="muted small">This class has no chapters yet.</p>') + '</div>' +
    '<div class="setup-block"><label>3 · Mode</label>' + seg('mode', s.mode, [['exam', '📝 Exam — answers at the end'], ['practice', '💡 Practice — feedback after each']]) + '</div>' +
    '<div class="setup-block"><label>4 · Where questions come from</label>' + seg('source', s.source, [['bank', 'My question bank'], ['ai', '✦ AI writes a new test'], ['mix', 'Mix of both']]) +
    (needsAI && !aiReady() ? '<p class="hint warn" style="margin-top:8px">AI isn’t set up yet — add your access code in Settings → AI.</p>' : '') +
    (needsAI ? '<label class="chip" style="margin-top:10px"><input type="checkbox" id="tsSaveAI" ' + (s.saveAI ? 'checked' : '') + '>Save AI questions to my question bank</label>' : '') + '</div>' +
    '<div class="setup-block"><div class="setup-label">5 · Question types <small>number in your bank</small></div><div class="chips">' + QTYPES.map(t => '<label class="chip"><input type="checkbox" class="ts-type" value="' + t + '" ' + (s.types.includes(t) ? 'checked' : '') + '>' + TYPE_LABELS[t] + ' <small>' + (typeCounts[t] || 0) + '</small></label>').join('') + '</div></div>' +
    '<div class="setup-block"><label>6 · Length</label><div class="btn-row">' + seg('count', s.count, [[5, '5'], [10, '10'], [20, '20'], [30, '30'], [50, '50']]) + '<input type="number" id="tsCount" min="1" max="100" value="' + s.count + '" style="width:80px"> <span class="muted small">questions</span></div>' +
    '<div class="btn-row" style="margin-top:10px">' + seg('time', s.time, [[0, 'No timer'], [10, '10m'], [20, '20m'], [30, '30m'], [60, '60m'], [90, '90m']]) + '<input type="number" id="tsTime" min="0" max="300" value="' + s.time + '" style="width:80px"> <span class="muted small">minutes</span></div></div>' +
    '<div class="setup-block"><label>7 · Difficulty</label>' + seg('difficulty', s.difficulty, [['easy', 'Easier'], ['standard', 'Standard'], ['hard', 'Harder'], ['mixed', 'Mixed']]) +
    '<div class="chips" style="margin-top:10px"><label class="chip"><input type="checkbox" id="tsShuffle" ' + (s.shuffle ? 'checked' : '') + '>Shuffle questions & choices</label><label class="chip"><input type="checkbox" id="tsWeak" ' + (s.weakOnly ? 'checked' : '') + '>Only questions I’ve missed before</label></div></div>' +
    '</div><div class="runner-side"><div class="panel"><h2>Your test</h2><div class="summary-list">' +
    '<div><span>Class</span><b>' + esc(c.name) + '</b></div><div><span>Chapters</span><b>' + (s.chapterIds.length === c.chapters.length && c.chapters.length > 1 ? 'All ' + c.chapters.length : s.chapterIds.length) + '</b></div>' +
    '<div><span>Mode</span><b>' + (s.mode === 'exam' ? 'Exam' : 'Practice') + '</b></div><div><span>Questions</span><b>' + s.count + '</b></div><div><span>Timer</span><b>' + (s.time ? s.time + ' min' : 'None') + '</b></div>' +
    '<div><span>Types</span><b>' + (s.types.length === QTYPES.length ? 'All' : s.types.map(t => TYPE_SHORT[t]).join(', ') || '—') + '</b></div><div><span>In your bank</span><b>' + pool.length + ' match</b></div></div>' +
    (shortfall ? '<p class="hint warn" style="margin-top:12px">Only ' + pool.length + ' bank questions match. ' + (aiReady() ? 'Switch to “Mix of both” and AI will fill the gap.' : 'The test will be shorter, or add more questions.') + '</p>' : '') +
    '<button class="primary" style="width:100%;margin-top:14px;padding:12px" data-act="start-test" ' + (!s.chapterIds.length || !s.types.length ? 'disabled' : '') + '>Start test →</button>' +
    '<button class="soft ai" style="width:100%;margin-top:8px" data-act="new-guide" data-class="' + c.id + '" data-chapters="' + s.chapterIds.join(',') + '">✦ Make a study guide for these chapters</button></div>' +
    (recent.length ? '<div class="panel" style="margin-top:14px"><h2>Recent scores</h2>' + recent.map(t => '<div class="task"><div class="ring sm" style="--p:' + t.percent + ';--ring:' + (t.percent >= 80 ? 'var(--good)' : t.percent >= 60 ? 'var(--warn)' : 'var(--bad)') + '"><div><b>' + t.percent + '%</b></div></div><div><b>' + esc(t.className) + '</b><small>' + fmtDate(t.date) + ' · ' + t.total + ' q · ' + (t.mode === 'exam' ? 'Exam' : 'Practice') + '</small></div>' + (t.items ? '<button class="text-link" data-act="open-result" data-id="' + t.id + '">Review</button>' : '') + '</div>').join('') + '</div>' : '') +
    '</div></div>';
}
function readSetupInputs() {
  const s = testSetup();
  const count = Number($('#tsCount')?.value); if (count) s.count = clamp(count, 1, 100);
  const time = $('#tsTime'); if (time) s.time = clamp(Number(time.value) || 0, 0, 300);
  if ($('#tsShuffle')) s.shuffle = $('#tsShuffle').checked;
  if ($('#tsWeak')) s.weakOnly = $('#tsWeak').checked;
  if ($('#tsSaveAI')) s.saveAI = $('#tsSaveAI').checked;
  if ($$('.ts-ch').length) s.chapterIds = $$('.ts-ch').filter(x => x.checked).map(x => x.value);
  if ($$('.ts-type').length) s.types = $$('.ts-type').filter(x => x.checked).map(x => x.value);
  data.settings.lastSetup = { ...s, chapterIds: [], _init: false }; save();
  return s;
}
function prefillTest(classId, chapterIds) {
  ui.ts = { ...defaultSetup(), ...(data.settings.lastSetup || {}), classId, chapterIds: chapterIds || [], _init: false };
  go('tests');
}

async function startTest(btn) {
  const s = readSetupInputs(), c = findClass(s.classId);
  if (!s.chapterIds.length || !s.types.length) return;
  if (data.activeTest && !confirm('You have an unfinished test. Start a new one and discard it?')) return;
  const pool = s.shuffle ? shuffle(setupPool(s)) : setupPool(s);
  let items = [];
  const aiCount = s.source === 'ai' ? s.count : s.source === 'mix' ? Math.max(s.count - Math.min(pool.length, Math.ceil(s.count / 2)), s.count - pool.length) : 0;
  const bankCount = s.count - aiCount;
  items = pool.slice(0, bankCount).map(x => makeItem(x.q, { classId: c.id, chapterId: x.chapterId }, { shuffleChoices: s.shuffle }));
  if (aiCount > 0) {
    if (!aiReady()) { alert('AI isn’t set up yet. Add your access code in Settings → AI, or choose “My question bank”.'); return; }
    const chs = c.chapters.filter(ch => s.chapterIds.includes(ch.id));
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> AI is writing your test…';
    try {
      const out = await callAI('test', { material: materialFor(chs.map(chapter => ({ course: c, chapter }))), types: s.types, count: aiCount, difficulty: s.difficulty, avoid: items.map(i => i.q.q), source: c.name });
      const byTitle = t => chs.find(ch => norm(ch.title) === norm(t)) || chs.find(ch => norm(t).includes(norm(ch.title)) || norm(ch.title).includes(norm(t)));
      const aiItems = (out.questions || []).map(q => { const nq = fromAIQuestion(q, c.name); if (!nq) return null; const ch = byTitle(q.section || '') || (chs.length === 1 ? chs[0] : null); return makeItem(nq, { classId: c.id, chapterId: ch?.id || null, ai: true }, { shuffleChoices: false }); }).filter(Boolean);
      if (!aiItems.length) throw new Error('The AI did not return usable questions. Try again, or pick different question types.');
      items = items.concat(aiItems);
      if (s.shuffle) items = shuffle(items);
    } catch (err) { btn.disabled = false; btn.textContent = 'Start test →'; alert(err.message); return; }
  }
  if (!items.length) { alert('No questions match your choices. Try other question types or difficulty, add questions to your bank, or use AI.'); return; }
  if (items.length < s.count && s.source === 'bank') toast('Only ' + items.length + ' matching questions — test shortened.');
  data.activeTest = { id: uid('t'), classId: c.id, chapterIds: s.chapterIds, mode: s.mode, source: s.source, types: s.types, difficulty: s.difficulty, saveAI: s.saveAI, timeLimit: s.time * 60, remaining: s.time * 60, elapsed: 0, started: Date.now(), items, index: 0 };
  save(); go('test-run');
}
const currentRunItem = () => data.activeTest?.items[data.activeTest.index];

function viewRunner() {
  const t = data.activeTest; if (!t) { ui.page = 'tests'; return viewTests(); }
  const item = t.items[t.index], c = findClass(t.classId), q = item.q;
  const revealed = t.mode === 'practice' && item.checked;
  const needsCheck = t.mode === 'practice' && !revealed;
  const chName = findChapter(item.meta.chapterId).chapter?.title;
  const left = '<div class="mode" style="max-width:none"><div class="mode-top"><span>Question ' + (t.index + 1) + ' of ' + t.items.length + (chName ? ' · ' + esc(chName) : '') + '</span><div class="btn-row"><span class="pill gray">' + TYPE_LABELS[q.type] + '</span>' + (item.meta.ai ? '<span class="pill">✦ AI</span>' : '') + '<button class="soft" data-act="flag" style="padding:5px 9px">' + (item.flagged ? '⚑ Flagged' : '⚐ Flag') + '</button></div></div>' +
    renderItem(item, { reveal: revealed, key: 'run' }) +
    '<div class="nav-row"><button class="soft" data-act="run-nav" data-dir="-1" ' + (t.index === 0 ? 'disabled' : '') + '>← Previous</button><div class="btn-row">' +
    (needsCheck ? '<button class="' + (t.mode === 'practice' ? 'primary' : 'soft') + '" data-act="run-check">' + (isOpen(q) ? 'Show answer' : 'Check answer') + '</button>' : '') +
    (t.index < t.items.length - 1 ? '<button class="' + (needsCheck ? 'soft' : 'primary') + '" data-act="run-nav" data-dir="1">Next →</button>' : '<button class="primary" data-act="submit-test">Finish test ✓</button>') + '</div></div></div>';
  const done = t.items.filter(answered).length;
  const side = '<div class="runner-side"><div class="panel">' + (t.timeLimit ? '<div class="eyebrow">Time left</div><div class="timer" id="timerText">' + fmtTime(t.remaining) + '</div>' : '<div class="eyebrow">Time</div><div class="timer" id="timerText">' + fmtTime(t.elapsed) + '</div>') +
    '<div class="muted small" style="margin-top:4px">' + esc(c?.name || '') + ' · ' + (t.mode === 'exam' ? 'Exam mode' : 'Practice mode') + '</div>' +
    '<div class="progress-meta"><span>' + done + ' / ' + t.items.length + ' answered</span></div><div class="track"><i style="--p:' + Math.round(done / t.items.length * 100) + '%"></i></div>' +
    '<div class="qnav">' + t.items.map((it, i) => { let cls = answered(it) ? ' answered' : ''; if (t.mode === 'practice' && it.result) cls = ' ' + (it.result.verdict === 'correct' ? 'right' : it.result.verdict === 'partial' ? 'partial' : 'wrong'); return '<button class="' + cls + (i === t.index ? ' current' : '') + (it.flagged ? ' flagged' : '') + '" data-act="run-go" data-idx="' + i + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
    '<button class="primary" style="width:100%" data-act="submit-test">Finish & ' + (t.mode === 'exam' ? 'grade' : 'see results') + '</button><button class="soft" style="width:100%;margin-top:8px" data-act="go" data-page="tests">Save & exit</button></div></div>';
  return '<div class="runner">' + left + side + '</div>';
}

async function submitTest(auto = false) {
  const t = data.activeTest; if (!t) return;
  captureInputs(currentRunItem());
  const unanswered = t.items.filter(it => !answered(it)).length;
  if (!auto && unanswered && !confirm(plural(unanswered, 'question') + ' unanswered. Finish anyway?')) return;
  t.items.forEach(it => { if (!it.result) { const r = autoGrade(it); if (r) it.result = r; else if (!answered(it)) it.result = { score: 0, verdict: 'incorrect', by: 'auto' }; } });
  const open = t.items.filter(it => !it.result);
  const view = $('#view');
  if (open.length && aiReady()) {
    for (let i = 0; i < open.length; i++) {
      view.innerHTML = '<div class="empty" style="margin-top:40px"><span class="spinner"></span><b>AI is grading your written answers…</b>' + (i + 1) + ' of ' + open.length + '</div>';
      try { await aiGradeItem(open[i]); } catch (err) { if (i === 0) toast('AI grading unavailable — grade those yourself on the results page.'); break; }
    }
  }
  const already = t.mode === 'practice';
  t.items.forEach(it => { if (it.result && !(already && it.recorded)) { recordResult(it, 'test'); it.recorded = true; } });
  // Save AI questions into the bank
  if (t.saveAI) {
    let added = 0;
    t.items.filter(it => it.meta.ai && it.meta.chapterId).forEach(it => { const { chapter } = findChapter(it.meta.chapterId); if (chapter && !chapter.questions.some(q => norm(q.q) === norm(it.q.q))) { chapter.questions.push(it.q); added++; } });
    if (added) toast(plural(added, 'AI question') + ' saved to your question bank');
  }
  const entry = finalizeEntry(t);
  data.tests.push(entry);
  data.tests.forEach((x, i) => { if (i < data.tests.length - 30) delete x.items; });
  data.activeTest = null;
  logActivity({ tests: 1, minutes: Math.round(entry.duration / 60) });
  save(); checkBadges();
  go('test-result', { resultId: entry.id });
}
function finalizeEntry(t) {
  const c = findClass(t.classId);
  const entry = { id: t.id, date: Date.now(), classId: t.classId, className: c?.name || 'Class', chapterIds: t.chapterIds, chapterNames: t.chapterIds.map(id => findChapter(id).chapter?.title).filter(Boolean), mode: t.mode, source: t.source, total: t.items.length, duration: t.timeLimit ? t.timeLimit - t.remaining : t.elapsed, items: t.items };
  scoreEntry(entry); return entry;
}
function scoreEntry(e) {
  e.score = e.items.reduce((s, it) => s + (it.result?.score || 0), 0);
  e.pending = e.items.filter(it => !it.result).length;
  e.percent = Math.round(e.score / Math.max(1, e.total) * 100);
}
function viewResult() {
  const e = data.tests.find(x => x.id === ui.resultId); if (!e || !e.items) { ui.page = 'tests'; return viewTests(); }
  scoreEntry(e);
  const color = e.percent >= 80 ? 'var(--good)' : e.percent >= 60 ? 'var(--warn)' : 'var(--bad)';
  const msg = e.percent >= 90 ? 'Outstanding work! 🎉' : e.percent >= 80 ? 'Great job — you know this well.' : e.percent >= 60 ? 'Solid effort. Review the misses and retake.' : 'Keep going — review the explanations below, then retake your missed questions.';
  const group = keyFn => { const m = {}; e.items.forEach(it => { const k = keyFn(it); (m[k] ||= { s: 0, n: 0 }); m[k].s += it.result?.score || 0; m[k].n++; }); return m; };
  const bar = (label, g) => { const pct = Math.round(g.s / g.n * 100); return '<div class="breakdown-row"><span>' + esc(label) + '</span><div class="track"><i style="--p:' + pct + '%;--color:' + (pct >= 80 ? 'var(--good)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)') + '"></i></div><b>' + pct + '%</b></div>'; };
  const byType = group(it => TYPE_LABELS[it.q.type]), byCh = group(it => findChapter(it.meta.chapterId).chapter?.title || 'AI · mixed');
  const missed = e.items.filter(it => it.result && it.result.verdict !== 'correct').length;
  return '<div class="hero"><div><div class="eyebrow">Test results · ' + esc(e.className) + '</div><h1 class="title">' + msg + '</h1><p class="sub">' + fmtDate(e.date, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' · ' + (e.mode === 'exam' ? 'Exam' : 'Practice') + ' · ' + fmtTime(e.duration) + '</p></div>' +
    '<div class="btn-row no-print"><button class="soft" data-act="print-result" data-id="' + e.id + '">⎙ Print</button><button class="soft" data-act="retake-missed" data-id="' + e.id + '" ' + (missed ? '' : 'disabled') + '>↺ Retake missed (' + missed + ')</button><button class="primary" data-act="go" data-page="tests">New test</button></div></div>' +
    '<div class="grid-2" style="margin-top:0"><div class="panel"><div class="score-hero"><div class="ring" style="--p:' + e.percent + ';--ring:' + color + '"><div><div><b>' + e.percent + '%</b><small>' + (Math.round(e.score * 10) / 10) + ' / ' + e.total + '</small></div></div></div>' +
    '<div><div class="summary-list" style="min-width:200px"><div><span>Correct</span><b>' + e.items.filter(i => i.result?.verdict === 'correct').length + '</b></div><div><span>Partly correct</span><b>' + e.items.filter(i => i.result?.verdict === 'partial').length + '</b></div><div><span>Missed</span><b>' + e.items.filter(i => i.result?.verdict === 'incorrect').length + '</b></div>' + (e.pending ? '<div><span>Needs grading</span><b class="danger">' + e.pending + '</b></div>' : '') + '</div>' +
    (e.pending ? '<p class="hint warn" style="margin-top:10px">Grade your written answers below to finish your score.</p>' : '') + '</div></div></div>' +
    '<div class="panel"><h2>Breakdown</h2><div class="breakdown">' + Object.entries(byCh).map(([k, g]) => bar(k, g)).join('') + '<div style="height:6px"></div>' + Object.entries(byType).map(([k, g]) => bar(k, g)).join('') + '</div></div></div>' +
    '<div class="section-head" style="margin-top:24px"><h2>Review your answers</h2><span class="muted small">Missed questions are added to Weak spots automatically.</span></div>' +
    e.items.map((it, i) => '<div class="review-item" data-ri="' + i + '"><div class="btn-row"><span class="pill ' + (it.result ? it.result.verdict === 'correct' ? 'good' : it.result.verdict === 'partial' ? 'warn' : 'bad' : 'gray') + '">' + (i + 1) + ' · ' + (it.result ? it.result.verdict === 'correct' ? 'Correct' : it.result.verdict === 'partial' ? 'Partial' : 'Missed' : 'Needs grading') + '</span><span class="pill gray">' + TYPE_LABELS[it.q.type] + '</span></div>' +
      (it.q.scenario ? '<div class="scenario">' + esc(it.q.scenario) + '</div>' : '') + '<div class="question">' + esc(it.q.q) + '</div>' +
      '<div class="ans-line"><b>Your answer:</b>' + esc(responseText(it)) + '</div>' + feedbackHTML(it, { key: 'r' + i }) + '</div>').join('');
}
function retakeMissed(id) {
  const e = data.tests.find(x => x.id === id); if (!e?.items) return;
  const items = e.items.filter(it => it.result && it.result.verdict !== 'correct').map(it => makeItem(it.q, it.meta));
  if (!items.length) return;
  data.activeTest = { id: uid('t'), classId: e.classId, chapterIds: e.chapterIds, mode: 'practice', source: 'bank', types: [], difficulty: 'mixed', timeLimit: 0, remaining: 0, elapsed: 0, started: Date.now(), items, index: 0 };
  save(); go('test-run');
}

/* Timer tick (runs every second) */
setInterval(() => {
  const t = data?.activeTest; if (!t || ui.page !== 'test-run' || document.hidden) return;
  if (t.timeLimit) { t.remaining = Math.max(0, t.remaining - 1); if (t.remaining === 0) { toast('⏰ Time’s up! Grading your test…'); submitTest(true); return; } }
  else t.elapsed++;
  const el = $('#timerText'); if (el) { el.textContent = fmtTime(t.timeLimit ? t.remaining : t.elapsed); el.classList.toggle('low', !!t.timeLimit && t.remaining <= 60); }
  if ((t.remaining || t.elapsed) % 10 === 0) save();
}, 1000);
/* ============================================================
   Weak spots, AI tutor, planner, progress, settings, search
   ============================================================ */
function upcomingExams() {
  return data.classes.flatMap(course => (course.exams || []).map(exam => ({ course, exam, days: daysUntil(exam.date) }))).filter(x => x.days >= 0).sort((a, b) => a.days - b.days);
}

/* ---------- Weak spots ---------- */
function viewMistakes() {
  const list = Object.entries(data.mistakes).map(([key, m]) => ({ key, ...m })).filter(m => !ui.weakFilter || ui.weakFilter === 'all' || m.classId === ui.weakFilter).sort((a, b) => b.count - a.count || b.last - a.last);
  const classesWith = data.classes.filter(c => Object.values(data.mistakes).some(m => m.classId === c.id));
  return '<div class="hero"><div><div class="eyebrow">Weak spots</div><h1 class="title">Review your mistakes<span class="dot">.</span></h1><p class="sub">Every question you miss lands here. Get one right twice in a row and it’s cleared.</p></div>' +
    '<div class="btn-row"><select id="weakFilter"><option value="all">All classes</option>' + classesWith.map(c => '<option value="' + c.id + '" ' + (ui.weakFilter === c.id ? 'selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select><button class="primary" data-act="practice-weak" ' + (list.length ? '' : 'disabled') + '>Practice ' + (list.length ? Math.min(list.length, 20) + ' ' : '') + 'weak spots →</button></div></div>' +
    (list.length ? '<div class="list">' + list.map(m => { const { course, chapter } = findChapter(m.chapterId); return '<div class="qcard"><div class="qtext"><div class="qmeta"><span class="pill bad">Missed ' + plural(m.count, 'time') + '</span>' + (m.streak ? '<span class="pill good">' + m.streak + '/2 right</span>' : '') + '<span class="pill gray">' + TYPE_LABELS[m.q.type] + '</span><span class="pill gray">' + esc(course ? course.name + ' · ' + chapter.title : 'AI test') + '</span></div>' + esc(m.q.q) +
      '<div class="muted small" style="margin-top:5px">You said: ' + esc(String(m.lastAnswer || '').replace(/\n/g, ' · ').slice(0, 140)) + ' &nbsp;·&nbsp; Answer: ' + esc(correctText(m.q).replace(/\n/g, ' · ').slice(0, 140)) + '</div></div><button class="soft" data-act="remove-weak" data-key="' + esc(m.key) + '">Remove</button></div>'; }).join('') + '</div>'
      : '<div class="empty"><b>🎉 No weak spots right now</b>Questions you miss in practice and tests will show up here so you can fix them.<br><button class="primary" data-act="go" data-page="tests">Take a test</button></div>');
}
function practiceWeak() {
  const list = shuffle(Object.values(data.mistakes).filter(m => !ui.weakFilter || ui.weakFilter === 'all' || m.classId === ui.weakFilter)).slice(0, 20);
  if (!list.length) return;
  data.activeTest = { id: uid('t'), classId: list[0].classId, chapterIds: [...new Set(list.map(m => m.chapterId).filter(Boolean))], mode: 'practice', source: 'weak', types: [], difficulty: 'mixed', timeLimit: 0, remaining: 0, elapsed: 0, started: Date.now(), items: list.map(m => makeItem(m.q, { classId: m.classId, chapterId: m.chapterId })), index: 0 };
  save(); go('test-run');
}

/* ---------- AI tutor ---------- */
function tutorScope() {
  const T = data.tutor; if (!findClass(T.classId)) { T.classId = data.classes[0]?.id || ''; T.chapterIds = []; }
  return T;
}
function viewTutor() {
  const T = tutorScope(), c = findClass(T.classId);
  if (!c) return '<div class="empty"><b>Add a class first</b>The tutor answers questions using your class notes.</div>';
  T.chapterIds = (T.chapterIds || []).filter(id => c.chapters.some(ch => ch.id === id));
  const msgs = T.messages || [];
  const suggestions = ['Explain the main ideas simply', 'Quiz me with 3 questions, one at a time', 'What topics are most likely on the exam?', 'Give me a real-world example', 'Make a memory trick for the key terms', 'What’s the difference between the most confusing terms?'];
  return '<div class="hero"><div><div class="eyebrow">AI tutor</div><h1 class="title">Ask anything about your notes<span class="dot">.</span></h1><p class="sub">The tutor reads the chapters you choose and answers from them first.</p></div><button class="soft" data-act="tutor-clear">Clear chat</button></div>' +
    (!aiReady() ? '<p class="hint warn" style="margin-bottom:12px">AI isn’t set up yet. Add your access code in <a href="#" data-act="go" data-page="settings">Settings → AI</a>.</p>' : '') +
    '<div class="toolbar" style="margin-top:0"><select id="tutorClass">' + data.classes.map(x => '<option value="' + x.id + '" ' + (x.id === c.id ? 'selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>' +
    '<div class="chips">' + '<label class="chip"><input type="checkbox" class="tutor-ch" value="__all" ' + (!T.chapterIds.length ? 'checked' : '') + '>Whole class</label>' + c.chapters.map(ch => '<label class="chip"><input type="checkbox" class="tutor-ch" value="' + ch.id + '" ' + (T.chapterIds.includes(ch.id) ? 'checked' : '') + '>' + esc(ch.title) + '</label>').join('') + '</div></div>' +
    '<div class="chat"><div class="chat-log" id="chatLog">' + (msgs.length ? msgs.map(m => '<div class="msg ' + m.role + '">' + (m.role === 'assistant' ? '<div class="ai-text">' + md(m.content) + '</div>' : esc(m.content)) + '</div>').join('') : '<div class="empty" style="border:0"><b>✦ Hi! I’m your study tutor.</b>Ask me to explain something, quiz you, or compare ideas from your ' + esc(c.name) + ' notes.<div class="suggestions" style="justify-content:center;margin-top:12px">' + suggestions.map(s => '<button class="chip" data-act="tutor-suggest" data-val="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div></div>') +
    (ui.tutorBusy ? '<div class="msg assistant"><span class="spinner"></span> Thinking…</div>' : '') + '</div>' +
    '<div class="chat-input"><textarea id="tutorInput" placeholder="Ask a question… (Enter to send, Shift+Enter for a new line)" ' + (ui.tutorBusy ? 'disabled' : 'data-autofocus') + '></textarea><button class="primary" data-act="tutor-send" ' + (ui.tutorBusy ? 'disabled' : '') + '>Send</button></div></div>';
}
async function tutorSend(text) {
  text = String(text || '').trim(); if (!text || ui.tutorBusy) return;
  const T = tutorScope(), c = findClass(T.classId);
  T.messages = [...(T.messages || []), { role: 'user', content: text }];
  ui.tutorBusy = true; save(); render();
  try {
    const chs = c.chapters.filter(ch => !T.chapterIds.length || T.chapterIds.includes(ch.id));
    const out = await callAI('tutor', { messages: T.messages, material: materialFor(chs.map(chapter => ({ course: c, chapter })), 50000), source: c.name });
    T.messages.push({ role: 'assistant', content: out.text });
  } catch (err) { T.messages.push({ role: 'assistant', content: '⚠️ ' + err.message }); }
  T.messages = T.messages.slice(-40);
  ui.tutorBusy = false; save(); if (ui.page === 'tutor') render();
}

/* ---------- Planner ---------- */
function planTasks() {
  const tasks = [];
  const withDue = allChapters().map(x => ({ ...x, due: dueCards(x.chapter).length })).filter(x => x.due).sort((a, b) => b.due - a.due);
  const totalDue = withDue.reduce((s, x) => s + x.due, 0);
  if (totalDue) tasks.push({ id: 'cards', icon: '🃏', title: 'Review ' + plural(totalDue, 'flashcard'), sub: 'Smart review · starts with ' + withDue[0].chapter.title, act: 'data-act="open-chapter" data-class="' + withDue[0].course.id + '" data-id="' + withDue[0].chapter.id + '" data-tab="Flashcards"' });
  const weak = Object.keys(data.mistakes).length;
  if (weak) tasks.push({ id: 'weak', icon: '⚑', title: 'Fix ' + plural(Math.min(weak, 20), 'weak spot'), sub: 'Questions you missed before', act: 'data-act="practice-weak"' });
  const exams = upcomingExams().filter(e => e.days <= 21);
  exams.forEach(({ course, exam, days }) => {
    const scope = course.chapters.filter(ch => !exam.chapterIds?.length || exam.chapterIds.includes(ch.id));
    const weakest = [...scope].sort((a, b) => chapterProgress(a.id) - chapterProgress(b.id)).filter(ch => chapterProgress(ch.id) < 100).slice(0, days <= 7 ? 2 : 1);
    weakest.forEach(ch => tasks.push({ id: 'ch-' + ch.id, icon: course.symbol, title: 'Practice ' + ch.title, sub: course.name + ' · ' + chapterProgress(ch.id) + '% · ' + exam.title + ' in ' + plural(days, 'day'), act: 'data-act="open-chapter" data-class="' + course.id + '" data-id="' + ch.id + '" data-tab="Practice"' }));
    if (days <= 4) tasks.push({ id: 'exam-' + exam.id, icon: '📝', title: 'Take a timed practice exam', sub: course.name + ' · ' + exam.title + (days === 0 ? ' is today!' : ' in ' + plural(days, 'day')), act: 'data-act="class-test" data-id="' + course.id + '"' });
  });
  if (!exams.length) allChapters().filter(x => chapterProgress(x.chapter.id) < 100 && (x.chapter.questions.length || x.chapter.definitions.length)).sort((a, b) => chapterProgress(b.chapter.id) - chapterProgress(a.chapter.id)).slice(0, 2)
    .forEach(x => tasks.push({ id: 'ch-' + x.chapter.id, icon: x.course.symbol, title: 'Continue ' + x.chapter.title, sub: x.course.name + ' · ' + chapterProgress(x.chapter.id) + '% complete', act: 'data-act="open-chapter" data-class="' + x.course.id + '" data-id="' + x.chapter.id + '" data-tab="Practice"' }));
  tasks.push({ id: 'focus', icon: '⏱', title: 'Do a 25-minute focus session', sub: 'Use the focus timer at the top', act: 'data-act="pomo-toggle"' });
  return tasks;
}
function todayPlanHTML(limit = 99) {
  const done = data.plans[dateKey()] || {};
  const tasks = planTasks().slice(0, limit);
  return tasks.map(t => '<div class="task ' + (done[t.id] ? 'done' : '') + '"><input type="checkbox" class="check plan-check" data-id="' + t.id + '" ' + (done[t.id] ? 'checked' : '') + '><div class="symbol">' + esc(t.icon) + '</div><div><b>' + esc(t.title) + '</b><small>' + esc(t.sub) + '</small></div><button class="text-link" ' + t.act + '>Start →</button></div>').join('');
}
function viewPlanner() {
  const exams = upcomingExams(), past = data.classes.flatMap(course => (course.exams || []).map(exam => ({ course, exam, days: daysUntil(exam.date) }))).filter(x => x.days < 0).sort((a, b) => b.days - a.days).slice(0, 5);
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  return '<div class="hero"><div><div class="eyebrow">Planner</div><h1 class="title">Plan your studying<span class="dot">.</span></h1><p class="sub">Add exam dates and get a daily plan built from your progress, flashcards, and weak spots.</p></div><button class="primary" data-act="add-exam">＋ Add exam date</button></div>' +
    '<div class="grid-2" style="margin-top:0"><div class="panel"><h2>Today’s plan · ' + fmtDate(Date.now(), { weekday: 'long', month: 'short', day: 'numeric' }) + '</h2>' + todayPlanHTML() + '</div>' +
    '<div class="panel"><h2>Upcoming exams</h2>' + (exams.length ? '<div class="list">' + exams.map(({ course, exam, days }) => '<div class="exam-card" style="--color:' + course.color + '"><div class="countdown"><b>' + days + '</b><small>' + (days === 1 ? 'DAY' : 'DAYS') + '</small></div><div style="flex:1;min-width:0"><b>' + esc(exam.title) + '</b><div class="muted small">' + esc(course.name) + ' · ' + fmtDate(parseDateKey(exam.date), { weekday: 'short', month: 'short', day: 'numeric' }) + '</div><div class="muted small">' + (exam.chapterIds?.length ? plural(exam.chapterIds.length, 'chapter') : 'All chapters') + ' · ' + classProgress(course) + '% ready</div></div><button class="kebab" data-act="edit-exam" data-class="' + course.id + '" data-id="' + exam.id + '">✎</button></div>').join('') + '</div>' : '<p class="muted small">No exams yet. Add one to get countdowns and a smarter plan.</p>') +
    (past.length ? '<h2 style="margin-top:16px">Past</h2>' + past.map(({ course, exam }) => '<div class="task"><div class="symbol" style="--color:' + course.color + '">✓</div><div><b>' + esc(exam.title) + '</b><small>' + esc(course.name) + ' · ' + fmtDate(parseDateKey(exam.date)) + '</small></div><button class="kebab" data-act="edit-exam" data-class="' + course.id + '" data-id="' + exam.id + '">✎</button></div>').join('') : '') + '</div></div>' +
    '<div class="panel" style="margin-top:14px"><h2>Next two weeks</h2><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">' + days.map(d => { const k = dateKey(d), ex = exams.filter(e => e.exam.date === k); return '<div style="border:1px solid var(--line);border-radius:9px;padding:8px;min-height:74px;background:' + (k === dateKey() ? 'var(--accent-soft-2)' : 'var(--panel)') + '"><div class="muted small">' + d.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + d.getDate() + '</div>' + ex.map(e => '<div class="pill" style="margin-top:4px;background:color-mix(in srgb,' + e.course.color + ' 16%,var(--panel));color:' + e.course.color + ';white-space:normal">' + esc(e.exam.title) + '</div>').join('') + '</div>'; }).join('') + '</div></div>';
}

/* ---------- Progress ---------- */
function lineChart(points) {
  if (!points.length) return '<div class="empty">Take a test to see your score trend.</div>';
  const W = 1000, H = 240, L = 40, R = 14, T = 12, B = 26, n = points.length;
  const x = i => L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)), y = v => T + (100 - v) * (H - T - B) / 100;
  const path = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Test score trend">' +
    [0, 25, 50, 75, 100].map(v => '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + v + '%</text>').join('') +
    (n > 1 ? '<path class="area" d="' + path + ' L' + x(n - 1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z"/><path class="line" d="' + path + '"/>' : '') +
    points.map((p, i) => '<circle cx="' + x(i) + '" cy="' + y(p.v) + '" r="4"><title>' + esc(p.label) + ': ' + p.v + '%</title></circle>' + (n <= 12 || i % Math.ceil(n / 12) === 0 ? '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(p.short) + '</text>' : '')).join('') + '</svg>';
}
function viewProgress() {
  const f = ui.progFilter || 'all';
  const tests = data.tests.filter(t => f === 'all' || t.classId === f);
  const avg = tests.length ? Math.round(tests.reduce((s, t) => s + t.percent, 0) / tests.length) : 0;
  const best = tests.reduce((m, t) => Math.max(m, t.percent), 0);
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return { d, a: data.activity[dateKey(d)] || {} }; });
  const maxMin = Math.max(30, ...days.map(x => x.a.minutes || 0));
  return '<div class="hero"><div><div class="eyebrow">Progress</div><h1 class="title">Your progress<span class="dot">.</span></h1><p class="sub">Scores, study time, goals, and badges — all saved on this device.</p></div><select id="progFilter"><option value="all">All classes</option>' + data.classes.map(c => '<option value="' + c.id + '" ' + (f === c.id ? 'selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></div>' +
    '<div class="stats">' + statCard('📝', 'Tests taken', tests.length) + statCard('∅', 'Average score', avg + '%') + statCard('🏆', 'Best score', best + '%') + statCard('🔥', 'Current streak', plural(streak(), 'day')) + '</div>' +
    '<div class="panel"><h2>Score history</h2>' + lineChart(tests.slice(-30).map(t => ({ v: t.percent, label: t.className + ' · ' + fmtDate(t.date), short: fmtDate(t.date, { month: 'numeric', day: 'numeric' }) }))) + '</div>' +
    '<div class="grid-2"><div class="panel"><h2>Study activity · last 14 days</h2><div style="display:flex;align-items:flex-end;gap:5px;height:120px">' + days.map(x => '<div title="' + fmtDate(x.d) + ': ' + (x.a.minutes || 0) + ' min, ' + (x.a.questions || 0) + ' questions" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;align-items:center;gap:4px"><div style="width:100%;border-radius:4px 4px 0 0;background:var(--accent);opacity:' + (x.a.minutes ? 1 : .15) + ';height:' + Math.max(3, (x.a.minutes || 0) / maxMin * 100) + '%"></div><small class="muted" style="font-size:9px">' + x.d.getDate() + '</small></div>').join('') + '</div><p class="muted small">Minutes studied per day (counted while the app is open and you’re active).</p></div>' +
    '<div class="panel"><div class="section-head"><h2>Weekly goals</h2><button class="text-link" data-act="go" data-page="settings">Edit</button></div>' + (() => { const w = weekTotals(), p = data.profile; const a = clamp(Math.round(w.minutes / p.weeklyMinutes * 100), 0, 100), b = clamp(Math.round(w.questions / p.weeklyQuestions * 100), 0, 100); return '<div class="goal"><div class="ring sm" style="--p:' + a + '"><div><b>' + a + '%</b></div></div><div><b>' + w.minutes + ' / ' + p.weeklyMinutes + ' minutes</b></div></div><div class="goal"><div class="ring sm" style="--p:' + b + ';--ring:var(--good)"><div><b>' + b + '%</b></div></div><div><b>' + w.questions + ' / ' + p.weeklyQuestions + ' questions</b></div></div>'; })() + '</div></div>' +
    '<div class="panel" style="margin-top:14px"><h2>Badges · ' + Object.keys(data.badges).length + ' of ' + BADGES.length + '</h2><div class="badges">' + BADGES.map(b => '<div class="badge ' + (data.badges[b.id] ? '' : 'locked') + '"><span class="b-icon">' + b.icon + '</span><b>' + esc(b.name) + '</b><small>' + (data.badges[b.id] ? 'Earned ' + fmtDate(data.badges[b.id]) : esc(b.desc)) + '</small></div>').join('') + '</div></div>' +
    '<div class="panel" style="margin-top:14px"><h2>All tests</h2>' + (tests.length ? '<table class="data"><thead><tr><th>Date</th><th>Class</th><th>Chapters</th><th>Mode</th><th>Score</th><th></th></tr></thead><tbody>' + [...tests].reverse().map(t => '<tr><td>' + fmtDate(t.date) + '</td><td>' + esc(t.className) + '</td><td>' + esc((t.chapterNames || []).join(', ').slice(0, 60) || '—') + '</td><td>' + (t.mode === 'exam' ? 'Exam' : 'Practice') + '</td><td><span class="pill ' + (t.percent >= 80 ? 'good' : t.percent >= 60 ? 'warn' : 'bad') + '">' + t.percent + '%</span> <span class="muted small">' + t.total + ' q</span></td><td>' + (t.items ? '<button class="text-link" data-act="open-result" data-id="' + t.id + '">Review</button>' : '') + '</td></tr>').join('') + '</tbody></table>' : '<p class="muted small">No tests yet.</p>') + '</div>' +
    '<div class="panel" style="margin-top:14px"><h2>Chapter progress</h2>' + (allChapters().filter(x => f === 'all' || x.course.id === f).map(x => '<div class="breakdown-row" style="margin:6px 0;grid-template-columns:1fr 140px 42px"><span>' + esc(x.course.symbol + ' ' + x.chapter.title) + '</span><div class="track" style="--color:' + x.course.color + '"><i style="--p:' + chapterProgress(x.chapter.id) + '%"></i></div><b>' + chapterProgress(x.chapter.id) + '%</b></div>').join('') || '<p class="muted small">No chapters.</p>') + '</div>';
}

/* ---------- Settings ---------- */
function viewSettings() {
  const p = data.profile, s = data.settings, dark = document.documentElement.dataset.theme === 'dark';
  return '<div class="hero"><div><div class="eyebrow">Settings</div><h1 class="title">Settings<span class="dot">.</span></h1><p class="sub">Your profile, AI, reminders, and data.</p></div></div>' +
    '<div class="grid-even"><div class="panel"><h2>Profile</h2><div class="task" style="border:0"><i class="avatar" style="width:56px;height:56px;font-size:20px">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : esc((p.name || 'S')[0].toUpperCase())) + '</i><div><button class="soft" data-act="pick-photo">Upload photo</button> ' + (p.photo ? '<button class="text-link danger" data-act="remove-photo">Remove</button>' : '') + '</div></div>' +
    '<div class="field"><label>Your name</label><input id="setName" value="' + esc(p.name) + '"></div>' +
    '<div class="field-row"><div class="field"><label>Weekly goal · minutes</label><input id="setMin" type="number" min="10" value="' + p.weeklyMinutes + '"></div><div class="field"><label>Weekly goal · questions</label><input id="setQ" type="number" min="10" value="' + p.weeklyQuestions + '"></div></div>' +
    '<div class="field"><label>Theme</label><div class="seg"><button class="' + (!dark ? 'on' : '') + '" data-act="set-theme" data-val="light">☀ Light</button><button class="' + (dark ? 'on' : '') + '" data-act="set-theme" data-val="dark">☾ Dark</button></div></div>' +
    '<button class="primary" data-act="save-profile">Save profile</button></div>' +
    '<div class="panel"><h2>✦ AI</h2><p class="muted small" style="margin-top:0">AI runs through your Vercel site. Enter the same access code you set as <code>STUDY_AI_ACCESS_CODE</code> in Vercel. It’s remembered on this computer.</p>' +
    '<div class="field"><label>AI access code</label><input id="setCode" type="password" autocomplete="off" value="' + esc(aiCode()) + '" placeholder="Your private phrase from Vercel"></div>' +
    '<div class="field"><label>AI provider</label><select id="setProvider"><option value="auto" ' + (s.aiProvider === 'auto' ? 'selected' : '') + '>Automatic — free Gemini first, then Vercel credit</option><option value="gemini" ' + (s.aiProvider === 'gemini' ? 'selected' : '') + '>Google Gemini only (free tier)</option><option value="vercel" ' + (s.aiProvider === 'vercel' ? 'selected' : '') + '>Vercel AI Gateway only (monthly free credit)</option></select></div>' +
    '<label class="chip" style="margin:4px 0 12px"><input type="checkbox" id="setAutoAI" ' + (s.autoAI ? 'checked' : '') + '>Auto-create a summary, flashcards & questions after uploading</label>' +
    '<div class="btn-row"><button class="primary" data-act="save-ai">Save AI settings</button><button class="soft" data-act="test-ai">Test connection</button><span id="aiStatus" class="small"></span></div>' +
    '<p class="hint" style="margin-top:12px">Free options: Google Gemini’s free tier (Google may use free-tier prompts to improve its products) and Vercel’s monthly AI credit. See the README for setup.</p></div></div>' +
    '<div class="grid-even" style="margin-top:14px"><div class="panel"><h2>Reminders</h2><p class="muted small" style="margin-top:0">Browser notifications. They work while Studyspace is open in a tab (it can be in the background).</p>' +
    '<label class="chip"><input type="checkbox" id="setDaily" ' + (s.reminders.daily ? 'checked' : '') + '>Daily study reminder at</label> <input type="time" id="setTime" value="' + esc(s.reminders.time) + '">' +
    '<div style="margin-top:10px"><label class="chip"><input type="checkbox" id="setExamRem" ' + (s.reminders.exams ? 'checked' : '') + '>Remind me the day before an exam</label></div>' +
    '<div class="btn-row" style="margin-top:12px"><button class="primary" data-act="save-reminders">Save reminders</button><span class="small muted">Permission: ' + ('Notification' in window ? Notification.permission : 'not supported') + '</span></div></div>' +
    '<div class="panel"><h2>Your data</h2><p class="muted small" style="margin-top:0">Everything is saved in this browser on this computer. Download a backup regularly — you can restore it here or on another computer.</p>' +
    '<div class="btn-row"><button class="primary" data-act="backup">⇩ Download backup</button><button class="soft" data-act="restore">⇪ Restore from backup</button></div>' +
    '<div class="btn-row" style="margin-top:14px"><button class="soft" data-act="load-samples">Add sample classes</button><button class="danger-button" data-act="erase-all">Erase everything</button></div></div></div>';
}

/* ---------- Search everything ---------- */
function viewSearch() {
  const q = ui.search.trim(), nq = q.toLowerCase();
  if (q.length < 2) return '<div class="empty"><b>Search everything</b>Type at least 2 letters in the search bar to search classes, notes, definitions, and questions.</div>';
  const hl = s => { const text = String(s); const i = text.toLowerCase().indexOf(nq); if (i < 0) return esc(text.slice(0, 160)); const start = Math.max(0, i - 60); return (start ? '…' : '') + esc(text.slice(start, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length, i + q.length + 100)) + '…'; };
  const results = [];
  data.classes.forEach(c => {
    if ((c.name + ' ' + c.teacher).toLowerCase().includes(nq)) results.push({ kind: 'Class', title: c.name, snip: c.teacher, act: 'data-act="open-class" data-id="' + c.id + '"' });
    c.chapters.forEach(ch => {
      const where = 'data-class="' + c.id + '" data-id="' + ch.id + '"';
      if (ch.title.toLowerCase().includes(nq)) results.push({ kind: 'Chapter', title: ch.title, snip: c.name, act: 'data-act="open-chapter" ' + where });
      const text = chapterText(ch); if (text.toLowerCase().includes(nq)) results.push({ kind: 'Notes', title: ch.title, snip: hl(text), html: true, act: 'data-act="open-chapter" ' + where + ' data-tab="Notes"', where: c.name });
      ch.definitions.forEach(d => { if ((d[0] + ' ' + d[1]).toLowerCase().includes(nq)) results.push({ kind: 'Definition', title: d[0], snip: hl(d[1]), html: true, act: 'data-act="open-chapter" ' + where + ' data-tab="Definitions"', where: c.name + ' · ' + ch.title }); });
      ch.questions.forEach(qq => { if ((qq.q + ' ' + correctText(qq)).toLowerCase().includes(nq)) results.push({ kind: 'Question', title: qq.q, snip: 'Answer: ' + esc(correctText(qq).slice(0, 120)), html: true, act: 'data-act="open-chapter" ' + where + ' data-tab="Questions"', where: c.name + ' · ' + ch.title }); });
    });
  });
  return '<div class="hero"><div><div class="eyebrow">Search</div><h1 class="title">“' + esc(q) + '”</h1><p class="sub">' + plural(results.length, 'result') + '</p></div></div>' +
    (results.length ? '<div class="list">' + results.slice(0, 150).map(r => '<div class="result" ' + r.act + '><small>' + r.kind + (r.where ? ' · ' + esc(r.where) : '') + '</small><div><b>' + (r.kind === 'Question' || r.kind === 'Definition' ? hl(r.title) : esc(r.title)) + '</b></div>' + (r.snip ? '<p>' + (r.html ? r.snip : esc(r.snip)) + '</p>' : '') + '</div>').join('') + '</div>' : '<div class="empty">Nothing found. Try a different word.</div>');
}
/* ============================================================
   Modals: classes, chapters, exams, material editor & uploads,
   question editor, Quizlet, study guides, printing
   ============================================================ */
function showModal(title, content, wide = false) {
  $('#modalContent').innerHTML = '<div class="modal-head"><h2>' + title + '</h2><button type="button" class="close" data-act="close-modal" aria-label="Close">×</button></div>' + content;
  const m = $('#modal'); m.classList.toggle('wide', wide);
  if (!m.open) m.showModal();
}
const closeModal = () => $('#modal').close();
const cancelBtn = () => '<button type="button" class="soft" data-act="close-modal">Cancel</button>';

/* ---------- Class ---------- */
function openClassModal(course = null) {
  const color = course?.color || COLORS[data.classes.length % COLORS.length], icon = course?.symbol || ICONS[0];
  showModal(course ? 'Edit class' : 'Add a class',
    '<div class="field"><label>Class name</label><input id="className" value="' + esc(course?.name || '') + '" placeholder="e.g. CIS 424 — Systems Analysis" data-autofocus></div>' +
    '<div class="field"><label>Teacher or course details</label><input id="classTeacher" value="' + esc(course?.teacher || '') + '" placeholder="e.g. Prof. Lee · MWF 10am"></div>' +
    '<div class="field"><span class="field-label">Color</span><div class="swatches">' + COLORS.map(c => '<button type="button" class="swatch ' + (c === color ? 'on' : '') + '" style="--c:' + c + '" data-act="pick-color" data-val="' + c + '"></button>').join('') + '<input type="color" id="classColorCustom" value="' + color + '" title="Custom color" style="width:34px;height:30px;padding:0;border:0;background:none"></div><input type="hidden" id="classColor" value="' + color + '"></div>' +
    '<div class="field"><span class="field-label">Icon</span><div class="icon-grid">' + ICONS.map(i => '<button type="button" class="' + (i === icon ? 'on' : '') + '" data-act="pick-icon" data-val="' + i + '">' + i + '</button>').join('') + '</div><input id="classIcon" value="' + esc(icon) + '" maxlength="4" style="width:90px" title="Or type/paste any emoji"></div>' +
    '<div class="modal-actions">' + (course ? '<button type="button" class="danger-button left" data-act="delete-class" data-id="' + course.id + '">Delete class</button>' : '') + cancelBtn() + '<button type="button" class="primary" data-act="save-class" data-id="' + (course?.id || '') + '">Save class</button></div>');
}
function saveClass(id) {
  const name = $('#className').value.trim(); if (!name) { alert('Enter a class name.'); return; }
  const fields = { name, teacher: $('#classTeacher').value.trim(), color: $('#classColor').value, symbol: $('#classIcon').value.trim() || '✳' };
  const course = findClass(id);
  if (course) Object.assign(course, fields); else data.classes.push({ id: uid('c'), ...fields, exams: [], chapters: [] });
  save(); closeModal(); render(); toast(course ? 'Class updated' : 'Class created');
}
async function deleteCourse(id) {
  const c = findClass(id); if (!c || !confirm('Delete "' + c.name + '" and all its chapters, questions, and progress? This can’t be undone.')) return;
  for (const ch of c.chapters) await cleanupChapter(ch.id);
  data.classes = data.classes.filter(x => x.id !== id);
  save(); closeModal(); go('classes'); toast('Class deleted');
}
async function cleanupChapter(chId) {
  delete data.progress[chId]; delete data.practice[chId]; delete data.learn[chId];
  Object.keys(data.cards).forEach(k => k.startsWith(chId + '::') && delete data.cards[k]);
  Object.keys(data.mistakes).forEach(k => k.startsWith(chId + '::') && delete data.mistakes[k]);
  try { for (const f of await filesForChapter(chId)) await fileDelete(f.id); } catch {}
}

/* ---------- Chapter ---------- */
function openChapterModal(classId) {
  showModal('Add a chapter / module', '<div class="field"><label>Chapter name</label><input id="newChapterName" placeholder="e.g. Chapter 3 · Atoms & molecules" data-autofocus></div>' +
    '<p class="hint">Tip: after creating it, choose <b>Add material</b> to upload PDFs, Word docs, slides, or photos of notes.</p>' +
    '<div class="modal-actions">' + cancelBtn() + '<button type="button" class="soft" data-act="save-chapter" data-id="' + classId + '">Create</button><button type="button" class="primary" data-act="save-chapter" data-id="' + classId + '" data-then="material">Create & add material</button></div>');
}
function saveChapter(classId, then) {
  const title = $('#newChapterName').value.trim(); if (!title) { alert('Enter a chapter name.'); return; }
  const c = findClass(classId); const ch = { id: uid('ch'), title, text: '', html: '', source: '', summary: '', definitions: [], questions: [], files: [] };
  c.chapters.push(ch); save(); closeModal();
  if (then === 'material') { ui.classId = classId; render(); openMaterialModal(classId, ch.id); } else { render(); toast('Chapter created'); }
}
async function deleteChapter(classId, chId) {
  const c = findClass(classId), ch = c?.chapters.find(x => x.id === chId);
  if (!ch || !confirm('Delete "' + ch.title + '" and its notes, questions, files, and progress?')) return;
  c.chapters = c.chapters.filter(x => x.id !== chId); await cleanupChapter(chId);
  save(); if (ui.chapterId === chId) { ui.chapterId = null; ui.page = 'class'; }
  render(); toast('Chapter deleted');
}

/* ---------- Exams ---------- */
function openExamModal(classId, examId) {
  const c = findClass(classId) || findClass(ui.classId) || data.classes[0];
  if (!c) { alert('Add a class first.'); return; }
  const e = c.exams.find(x => x.id === examId);
  const d = new Date(); d.setDate(d.getDate() + 7);
  showModal(e ? 'Edit exam' : 'Add an exam date',
    '<div class="field"><label>Class</label><select id="examClass" ' + (e ? 'disabled' : '') + '>' + data.classes.map(x => '<option value="' + x.id + '" ' + (x.id === c.id ? 'selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></div>' +
    '<div class="field-row"><div class="field"><label>Name</label><input id="examTitle" value="' + esc(e?.title || 'Exam 1') + '"></div><div class="field"><label>Date</label><input id="examDate" type="date" value="' + (e?.date || dateKey(d)) + '"></div></div>' +
    '<div class="field"><span class="field-label">Chapters covered (none selected = all)</span><div class="chips" id="examChapters">' + c.chapters.map(ch => '<label class="chip"><input type="checkbox" class="exam-ch" value="' + ch.id + '" ' + (e?.chapterIds?.includes(ch.id) ? 'checked' : '') + '>' + esc(ch.title) + '</label>').join('') + '</div></div>' +
    '<div class="modal-actions">' + (e ? '<button type="button" class="danger-button left" data-act="delete-exam" data-class="' + c.id + '" data-id="' + e.id + '">Delete</button>' : '') + cancelBtn() + '<button type="button" class="primary" data-act="save-exam" data-class="' + c.id + '" data-id="' + (e?.id || '') + '">Save exam</button></div>');
}
function saveExam(classId, examId) {
  const c = findClass($('#examClass').value) || findClass(classId);
  const date = $('#examDate').value; if (!date) { alert('Pick a date.'); return; }
  const fields = { title: $('#examTitle').value.trim() || 'Exam', date, chapterIds: $$('.exam-ch').filter(x => x.checked).map(x => x.value) };
  const e = c.exams.find(x => x.id === examId);
  if (e) Object.assign(e, fields); else c.exams.push({ id: uid('e'), ...fields });
  save(); closeModal(); render(); toast('Exam saved');
}

/* ---------- Material editor (notes, uploads, AI) ---------- */
function editorHTML(html) {
  const b = (cmd, label, title, val = '') => '<button type="button" data-act="fmt" data-cmd="' + cmd + '" data-val="' + val + '" title="' + title + '">' + label + '</button>';
  return '<div class="editor-wrap"><div class="editor-bar">' + b('bold', '<b>B</b>', 'Bold') + b('italic', '<i>I</i>', 'Italic') + b('underline', '<u>U</u>', 'Underline') + b('formatBlock', 'H2', 'Heading', 'H2') + b('formatBlock', 'H3', 'Subheading', 'H3') + b('formatBlock', '¶', 'Paragraph', 'P') +
    b('insertUnorderedList', '• List', 'Bullets') + b('insertOrderedList', '1. List', 'Numbers') + b('formatBlock', '❝', 'Quote', 'BLOCKQUOTE') + b('hilite', '<mark>H</mark>', 'Highlight') + b('image', '🖼', 'Insert image') + b('removeFormat', '⌫', 'Clear formatting') + '</div>' +
    '<div class="editor" id="notesEditor" contenteditable="true" data-placeholder="Upload files or paste/type your notes here…">' + html + '</div></div>';
}
function openMaterialModal(classId = ui.classId, chapterId = ui.chapterId) {
  if (!data.classes.length) { openClassModal(); toast('Create a class first'); return; }
  const course = findClass(classId) || data.classes[0];
  let ch = course.chapters.find(x => x.id === chapterId);
  ui.gen = null; ui.pendingFiles = [];
  const s = ui.genSettings ||= { types: ['mc', 'tf', 'fill', 'short'], count: 10, difficulty: 'standard' };
  const html = ch ? (ch.html || textToHtml(ch.text)) : '';
  showModal(ch ? 'Edit study material' : 'Add study material',
    '<div class="field-row"><div class="field"><label>Class</label><select id="materialClass">' + data.classes.map(x => '<option value="' + x.id + '" ' + (x.id === course.id ? 'selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>Chapter / module</label><select id="materialChapter">' + chapterOptions(course, ch?.id) + '</select></div></div>' +
    '<div class="btn-row" style="margin:4px 0 8px"><button type="button" class="primary" data-act="upload-files">⇪ Upload files</button><span class="muted small">PDF, Word (.docx), PowerPoint (.pptx), photos/scans (OCR), TXT, Markdown</span></div>' +
    '<div id="uploadStatus" class="small muted"></div>' +
    '<div class="field"><label>Study notes & explanations</label>' + editorHTML(html) + '</div>' +
    '<div class="field"><label>Source / citation</label><input id="materialSource" placeholder="Textbook ch. 4, pp. 82–90; Lecture 3 slides" value="' + esc(ch?.source || '') + '"></div>' +
    '<div class="field"><label>Summary (optional)</label><textarea id="materialSummary" placeholder="A short summary shown at the top of the notes. AI can write this.">' + esc(ch?.summary || '') + '</textarea></div>' +
    '<div class="field"><label>Definitions — one per line: term | explanation</label><textarea id="materialDefinitions" placeholder="Osmosis | Water crossing a selectively permeable membrane">' + esc((ch?.definitions || []).map(d => d[0] + ' | ' + d[1]).join('\n')) + '</textarea></div>' +
    '<div class="ai-box"><h4>✦ Generate with AI</h4><div class="field-label" style="margin-bottom:6px">Question types to create</div><div class="chips">' + QTYPES.map(t => '<label class="chip"><input type="checkbox" class="gen-type" value="' + t + '" ' + (s.types.includes(t) ? 'checked' : '') + '>' + TYPE_LABELS[t] + '</label>').join('') + '</div>' +
    '<div class="btn-row" style="margin-top:10px"><label class="small">How many <input type="number" id="genCount" min="3" max="30" value="' + s.count + '" style="width:70px"></label><label class="small">Difficulty <select id="genDiff">' + [['easy', 'Easier'], ['standard', 'Standard'], ['hard', 'Harder'], ['mixed', 'Mixed']].map(([v, l]) => '<option value="' + v + '" ' + (s.difficulty === v ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
    '<button type="button" class="soft ai" data-act="gen-studyset">✦ Create summary, flashcards & questions</button></div>' +
    '<div id="genResults"></div><small>' + (aiReady() ? 'Uses your notes above. You’ll review everything before it’s saved.' : 'Set up AI in Settings to use this.') + '</small></div>' +
    '<div class="modal-actions">' + cancelBtn() + '<button type="button" class="primary" data-act="save-material">Save material</button></div>', true);
}
function chapterOptions(course, selectedId) {
  return course.chapters.map(x => '<option value="' + x.id + '" ' + (x.id === selectedId ? 'selected' : '') + '>' + esc(x.title) + '</option>').join('') + '<option value="__new">＋ New chapter…</option>';
}
function editorAppendText(text, heading) {
  const ed = $('#notesEditor'); if (!ed) return;
  ed.insertAdjacentHTML('beforeend', (heading ? '<h3>' + esc(heading) + '</h3>' : '') + textToHtml(text));
}
function resolveMaterialChapter() {
  const course = findClass($('#materialClass').value);
  let chId = $('#materialChapter').value;
  if (chId === '__new') {
    const title = prompt('Name for the new chapter:'); if (!title) return null;
    const ch = { id: uid('ch'), title: title.trim(), text: '', html: '', source: '', summary: '', definitions: [], questions: [], files: [] };
    course.chapters.push(ch); save(); $('#materialChapter').innerHTML = chapterOptions(course, ch.id); chId = ch.id;
  }
  return { course, chapter: course.chapters.find(x => x.id === chId) };
}
function saveMaterial() {
  const r = resolveMaterialChapter(); if (!r?.chapter) { alert('Choose or create a chapter first.'); return; }
  const { course, chapter } = r;
  chapter.html = sanitizeHTML($('#notesEditor').innerHTML);
  chapter.text = htmlToText(chapter.html);
  chapter.source = $('#materialSource').value.trim();
  chapter.summary = $('#materialSummary').value.trim();
  chapter.definitions = $('#materialDefinitions').value.split('\n').map(line => { const i = line.indexOf('|'); return i < 0 ? null : [line.slice(0, i).trim(), line.slice(i + 1).trim(), '']; }).filter(d => d && d[0] && d[1]);
  if (ui.gen) {
    const picked = $$('.gen-q').filter(x => x.checked).map(x => ui.gen.questions[Number(x.value)]).filter(Boolean);
    const existing = new Set(chapter.questions.map(q => norm(q.q)));
    picked.forEach(q => { if (!existing.has(norm(q.q))) chapter.questions.push(q); });
    if (picked.length) toast(plural(picked.length, 'question') + ' added to the question bank');
  }
  (ui.pendingFiles || []).forEach(f => { f.chapterId = chapter.id; filePut(f).catch(() => {}); });
  ui.pendingFiles = [];
  ui.gen = null; save(); closeModal();
  if (ui.flash) ui.flash.queue = [];
  openChapter(course.id, chapter.id, 'Notes'); toast('Study material saved');
}
async function generateStudySet(btn) {
  const notes = htmlToText($('#notesEditor').innerHTML).trim();
  if (notes.length < 80) { alert('Upload a document or add more notes first.'); return; }
  const types = $$('.gen-type').filter(x => x.checked).map(x => x.value); if (!types.length) { alert('Pick at least one question type.'); return; }
  const count = clamp(Number($('#genCount').value) || 10, 3, 30), difficulty = $('#genDiff').value;
  ui.genSettings = { types, count, difficulty };
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Creating…';
  try {
    const out = await callAI('studyset', { material: notes.slice(0, 60000), source: $('#materialSource').value, types, count, difficulty });
    const questions = (out.questions || []).map(q => fromAIQuestion(q, $('#materialSource').value)).filter(Boolean);
    ui.gen = { questions };
    if (out.summary) { const sb = $('#materialSummary'); sb.value = out.summary; }
    const defs = (out.definitions || []).map(d => String(d.term).replaceAll('|', '/') + ' | ' + String(d.explanation).replaceAll('|', '/') + (d.sourceReference ? ' (' + d.sourceReference + ')' : ''));
    const box = $('#materialDefinitions'); const have = new Set(box.value.split('\n').map(l => norm(l.split('|')[0])));
    box.value = [box.value.trim(), ...defs.filter(l => !have.has(norm(l.split('|')[0])))].filter(Boolean).join('\n');
    $('#genResults').innerHTML = '<div class="hint" style="margin-top:10px">✓ Summary and ' + plural(defs.length, 'definition') + ' filled in above (they become flashcards). Choose which questions to keep:</div>' +
      '<div class="gen-list">' + questions.map((q, i) => '<label class="gen-item"><input type="checkbox" class="gen-q" value="' + i + '" checked><div><span class="pill">' + TYPE_SHORT[q.type] + '</span> <span class="pill gray">' + guessDifficulty(q) + '</span> ' + esc(q.q) + '<div class="muted small">Answer: ' + esc(correctText(q).replace(/\n/g, ' · ').slice(0, 140)) + '</div></div></label>').join('') + '</div>' +
      '<div class="muted small" style="margin-top:6px">Made with ' + esc(out.provider || 'AI') + '. Click “Save material” to keep them.</div>';
  } catch (err) { $('#genResults').innerHTML = aiErrorHTML(err); }
  finally { btn.disabled = false; btn.textContent = '✦ Create summary, flashcards & questions'; }
}

/* ---------- File extraction (PDF, DOCX, PPTX, images with OCR) ---------- */
function loadScript(src) {
  return new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Could not load a document reader. Check your internet connection.')); document.head.append(s); });
}
let ocrWorker = null;
async function ocrImage(source, status) {
  if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  if (!ocrWorker) { status('Loading text recognition (first time takes a moment)…'); ocrWorker = await Tesseract.createWorker('eng'); }
  const { data: { text } } = await ocrWorker.recognize(source);
  return text;
}
async function extractFile(file, status) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (['txt', 'md', 'csv'].includes(ext)) return await file.text();
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(ext)) { status('Reading text from ' + file.name + ' (OCR)…'); return await ocrImage(file, status); }
  const buffer = await file.arrayBuffer();
  if (ext === 'pdf') {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages = []; let ocrPages = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      status('Reading ' + file.name + ' — page ' + n + ' of ' + pdf.numPages + '…');
      const page = await pdf.getPage(n);
      let text = (await page.getTextContent()).items.map(i => i.str + (i.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' ').trim();
      if (text.length < 25) { // scanned page → OCR
        const viewport = page.getViewport({ scale: 2 }); const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        status('Scanned page ' + n + ' of ' + pdf.numPages + ' — recognizing text (OCR)…');
        text = (await ocrImage(canvas, status)).trim(); ocrPages++;
      }
      if (text) pages.push('[Page ' + n + ']\n' + text);
    }
    if (ocrPages) toast(plural(ocrPages, 'scanned page') + ' read with OCR — double-check the text.');
    return pages.join('\n\n');
  }
  if (ext === 'docx') {
    if (!window.mammoth) await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js');
    return (await window.mammoth.extractRawText({ arrayBuffer: buffer })).value;
  }
  if (ext === 'pptx') {
    if (!window.JSZip) await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    const zip = await window.JSZip.loadAsync(buffer);
    const slideNum = n => Number(n.match(/(\d+)\.xml$/)[1]);
    const files = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => slideNum(a) - slideNum(b));
    const out = [];
    for (const name of files) {
      const doc = new DOMParser().parseFromString(await zip.file(name).async('text'), 'application/xml');
      const paras = [...doc.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).filter(Boolean);
      const notesFile = zip.file('ppt/notesSlides/notesSlide' + slideNum(name) + '.xml');
      let notes = '';
      if (notesFile) { const nd = new DOMParser().parseFromString(await notesFile.async('text'), 'application/xml'); notes = [...nd.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).filter(t => t && !/^\d+$/.test(t)).join('\n'); }
      out.push('[Slide ' + slideNum(name) + ']\n' + paras.join('\n') + (notes ? '\nSpeaker notes: ' + notes : ''));
    }
    return out.join('\n\n');
  }
  throw new Error('Unsupported file type. Use PDF, DOCX, PPTX, images, TXT, or Markdown.');
}
async function handleUploads(files) {
  const statusEl = $('#uploadStatus'); const status = msg => { if (statusEl) statusEl.innerHTML = '<span class="spinner"></span> ' + esc(msg); };
  const errors = [], names = [];
  ui.pendingFiles ||= [];
  for (const file of files) {
    try {
      status('Reading ' + file.name + '…');
      const text = (await extractFile(file, status)).trim();
      if (text) { editorAppendText(text, file.name); names.push(file.name); }
      else errors.push(file.name + ' (no text found)');
      if (file.size < 60 * 1024 * 1024) ui.pendingFiles.push({ id: uid('f'), chapterId: null, name: file.name, type: file.type || 'application/octet-stream', size: file.size, added: Date.now(), blob: file });
    } catch (err) { errors.push(file.name + ' (' + err.message + ')'); }
  }
  if (statusEl) statusEl.innerHTML = names.length ? '✓ Added text from ' + esc(names.join(', ')) + '. Review it below, then save.' : '';
  if (names.length) { const src = $('#materialSource'); src.value = [src.value.trim(), names.join(', ')].filter(Boolean).join('; '); }
  if (errors.length) alert('Could not read some files:\n' + errors.join('\n'));
  if (names.length && data.settings.autoAI && aiReady()) { const b = $('[data-act="gen-studyset"]'); if (b) generateStudySet(b); }
}

/* ---------- Question editor ---------- */
function openQuestionModal(chapterId, qid) {
  const { chapter } = findChapter(chapterId); const q = chapter.questions.find(x => x.id === qid);
  ui.qEdit = { chapterId, qid, type: q?.type || 'mc' };
  showModal(q ? 'Edit question' : 'Add a question', '<div class="field"><label>Question type</label><select id="qeType">' + QTYPES.map(t => '<option value="' + t + '" ' + (t === ui.qEdit.type ? 'selected' : '') + '>' + TYPE_LABELS[t] + '</option>').join('') + '</select></div><div id="qeFields">' + questionFields(ui.qEdit.type, q) + '</div>' +
    '<div class="modal-actions">' + cancelBtn() + (q ? '' : '<button type="button" class="soft" data-act="save-question" data-more="1">Save & add another</button>') + '<button type="button" class="primary" data-act="save-question">Save question</button></div>', true);
}
function questionFields(type, q = {}) {
  q = q || {};
  const same = q.type === type;
  const diff = '<div class="field"><label>Difficulty</label><select id="qeDiff">' + [['', 'Auto'], ['easy', 'Easier'], ['standard', 'Standard'], ['hard', 'Harder']].map(([v, l]) => '<option value="' + v + '" ' + ((q.difficulty || '') === v ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></div>';
  const why = '<div class="field"><label>Explanation (shown after answering)</label><textarea id="qeWhy" style="min-height:60px">' + esc(q.why || '') + '</textarea></div>';
  let f = '';
  if (type === 'case') f += '<div class="field"><label>Scenario</label><textarea id="qeScenario" placeholder="Describe the situation…">' + esc(q.scenario || '') + '</textarea></div>';
  f += '<div class="field"><label>' + (type === 'fill' ? 'Question (use ___ for the blank)' : type === 'match' ? 'Instructions' : type === 'order' ? 'What should be put in order?' : 'Question') + '</label><textarea id="qeQ" style="min-height:60px">' + esc(q.q || (type === 'match' ? 'Match each term to its description.' : '')) + '</textarea></div>';
  if (type === 'mc' || type === 'case') {
    const choices = same && q.choices ? q.choices : ['', '', '', ''];
    f += '<div class="field"><span class="field-label">Choices — select the correct one' + (type === 'case' ? ' (leave choices empty for a written answer)' : '') + '</span>' + choices.concat(choices.length < 4 ? Array(4 - choices.length).fill('') : []).map((c, i) => '<div class="btn-row" style="margin-bottom:6px"><input type="radio" name="qeCorrect" value="' + i + '" ' + (same && q.a === i ? 'checked' : !same && i === 0 ? 'checked' : '') + '><input class="qe-choice" style="flex:1" value="' + esc(c) + '" placeholder="Choice ' + String.fromCharCode(65 + i) + '"></div>').join('') + '<button type="button" class="text-link" data-act="qe-add-choice">＋ Add choice</button></div>';
    if (type === 'case') f += '<div class="field"><label>Model answer (for written case questions)</label><textarea id="qeA">' + esc(same && typeof q.a === 'string' ? q.a : '') + '</textarea></div>';
  } else if (type === 'tf') f += '<div class="field"><label>Correct answer</label><div class="seg"><label class="chip"><input type="radio" name="qeTF" value="true" ' + (!same || q.a ? 'checked' : '') + '>True</label><label class="chip"><input type="radio" name="qeTF" value="false" ' + (same && !q.a ? 'checked' : '') + '>False</label></div></div>';
  else if (type === 'fill') f += '<div class="field"><label>Answer (separate alternatives with / )</label><input id="qeA" value="' + esc(same ? q.a : '') + '"></div>';
  else if (type === 'match') f += '<div class="field"><label>Pairs — one per line: term | match</label><textarea id="qePairs" placeholder="Nucleus | Contains DNA">' + esc(same ? q.pairs.map(p => p.join(' | ')).join('\n') : '') + '</textarea></div>';
  else if (type === 'order') f += '<div class="field"><label>Items in the CORRECT order — one per line</label><textarea id="qeItems" placeholder="First step\nSecond step">' + esc(same ? q.items.join('\n') : '') + '</textarea></div>';
  else f += '<div class="field"><label>' + (type === 'discuss' ? 'Key points a strong answer should cover' : 'Model answer') + '</label><textarea id="qeA">' + esc(same ? q.a : '') + '</textarea></div>';
  return f + '<div class="field-row">' + diff + '<div class="field"><label>Source (optional)</label><input id="qeSrc" value="' + esc(q.src || '') + '" placeholder="p. 42, Slide 7…"></div></div>' + why;
}
function saveQuestion(more) {
  const { chapterId, qid } = ui.qEdit, type = $('#qeType').value, { chapter } = findChapter(chapterId);
  const raw = { id: qid || uid('q'), type, q: $('#qeQ').value.trim(), why: $('#qeWhy').value.trim(), difficulty: $('#qeDiff').value, src: $('#qeSrc').value.trim() };
  if (type === 'mc' || type === 'case') {
    const choices = $$('.qe-choice').map(x => x.value.trim()); const checked = Number($$('[name=qeCorrect]').find(x => x.checked)?.value ?? 0);
    const kept = choices.map((c, i) => ({ c, i })).filter(x => x.c);
    if (type === 'case') raw.scenario = $('#qeScenario').value.trim();
    if (kept.length >= 2) { raw.choices = kept.map(x => x.c); raw.a = Math.max(0, kept.findIndex(x => x.i === checked)); if (!choices[checked]) { alert('The selected correct choice is empty.'); return; } }
    else if (type === 'mc') { alert('Add at least two choices.'); return; }
    else raw.a = $('#qeA').value.trim();
  } else if (type === 'tf') raw.a = $$('[name=qeTF]').find(x => x.checked)?.value === 'true';
  else if (type === 'match') raw.pairs = $('#qePairs').value.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p[0] && p[1]);
  else if (type === 'order') raw.items = $('#qeItems').value.split('\n').map(s => s.trim()).filter(Boolean);
  else raw.a = $('#qeA').value.trim();
  const q = normalizeQuestion(raw); if (!q) { alert('Please fill in the question and its answer (matching needs 2+ pairs, ordering needs 2+ items).'); return; }
  const i = chapter.questions.findIndex(x => x.id === q.id);
  if (i >= 0) chapter.questions[i] = q; else chapter.questions.push(q);
  save(); ui.pItem = null;
  if (more) { openQuestionModal(chapterId); toast('Saved — add another'); } else { closeModal(); render(); toast('Question saved'); }
}
function openGenQuestionsModal(chapterId) {
  const s = ui.genSettings ||= { types: ['mc', 'tf', 'fill', 'short'], count: 10, difficulty: 'standard' };
  ui.genChapter = chapterId; ui.gen = null;
  showModal('✦ Generate questions with AI', '<p class="muted small" style="margin-top:0">AI writes new questions from this chapter’s notes. You choose which ones to keep.</p><div class="field-label" style="margin-bottom:6px">Question types</div><div class="chips">' + QTYPES.map(t => '<label class="chip"><input type="checkbox" class="gen-type" value="' + t + '" ' + (s.types.includes(t) ? 'checked' : '') + '>' + TYPE_LABELS[t] + '</label>').join('') + '</div>' +
    '<div class="btn-row" style="margin-top:12px"><label class="small">How many <input type="number" id="genCount" min="3" max="30" value="' + s.count + '" style="width:70px"></label><label class="small">Difficulty <select id="genDiff">' + [['easy', 'Easier'], ['standard', 'Standard'], ['hard', 'Harder'], ['mixed', 'Mixed']].map(([v, l]) => '<option value="' + v + '" ' + (s.difficulty === v ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></label><button type="button" class="primary" data-act="gen-run">✦ Generate</button></div><div id="genResults"></div>' +
    '<div class="modal-actions">' + cancelBtn() + '<button type="button" class="primary hidden" id="genAddBtn" data-act="gen-add">Add selected to bank</button></div>', true);
}
async function genQuestionsRun(btn) {
  const { course, chapter } = findChapter(ui.genChapter);
  const types = $$('.gen-type').filter(x => x.checked).map(x => x.value); if (!types.length) { alert('Pick at least one question type.'); return; }
  const count = clamp(Number($('#genCount').value) || 10, 3, 30), difficulty = $('#genDiff').value; ui.genSettings = { types, count, difficulty };
  if (chapterText(chapter).length < 80) { $('#genResults').innerHTML = '<p class="hint warn">This chapter needs more notes first.</p>'; return; }
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating…';
  try {
    const out = await callAI('test', { material: materialFor([{ course, chapter }]), types, count, difficulty, avoid: chapter.questions.map(q => q.q).slice(0, 40), source: chapter.source || chapter.title });
    ui.gen = { questions: (out.questions || []).map(q => fromAIQuestion(q, chapter.source)).filter(Boolean) };
    $('#genResults').innerHTML = '<div class="gen-list">' + ui.gen.questions.map((q, i) => '<label class="gen-item"><input type="checkbox" class="gen-q" value="' + i + '" checked><div><span class="pill">' + TYPE_SHORT[q.type] + '</span> <span class="pill gray">' + guessDifficulty(q) + '</span> ' + esc(q.q) + '<div class="muted small">Answer: ' + esc(correctText(q).replace(/\n/g, ' · ').slice(0, 140)) + '</div></div></label>').join('') + '</div>';
    $('#genAddBtn').classList.remove('hidden');
  } catch (err) { $('#genResults').innerHTML = aiErrorHTML(err); }
  finally { btn.disabled = false; btn.textContent = '✦ Generate'; }
}

/* ---------- Quizlet ---------- */
function openQuizletImport(chapterId) {
  showModal('Import from Quizlet', '<p class="muted small" style="margin-top:0">In Quizlet, open your set → <b>⋯</b> → <b>Export</b> → Copy text (default settings: Tab between term and definition, new line between rows). Paste it here.</p>' +
    '<div class="field"><textarea id="qzText" style="min-height:200px" placeholder="term[Tab]definition&#10;term[Tab]definition" data-autofocus></textarea></div>' +
    '<div class="field-row"><div class="field"><label>Between term and definition</label><select id="qzSep"><option value="tab">Tab</option><option value="comma">Comma</option><option value="dash"> - (dash)</option><option value="pipe">| (pipe)</option></select></div><div class="field"><label>Between cards</label><select id="qzRow"><option value="nl">New line</option><option value="semi">Semicolon</option></select></div></div>' +
    '<div class="modal-actions">' + cancelBtn() + '<button type="button" class="primary" data-act="quizlet-do-import" data-id="' + chapterId + '">Import terms</button></div>');
}
function quizletImport(chapterId) {
  const { chapter } = findChapter(chapterId);
  const sep = { tab: '\t', comma: ',', dash: ' - ', pipe: '|' }[$('#qzSep').value], rowSep = $('#qzRow').value === 'semi' ? ';' : '\n';
  const rows = $('#qzText').value.split(rowSep).map(r => { const i = r.indexOf(sep); return i < 0 ? null : [r.slice(0, i).trim(), r.slice(i + sep.length).trim(), 'Quizlet']; }).filter(r => r && r[0] && r[1]);
  if (!rows.length) { alert('No terms found. Check the separator settings.'); return; }
  const have = new Set(chapter.definitions.map(d => norm(d[0])));
  const add = rows.filter(r => !have.has(norm(r[0])));
  chapter.definitions.push(...add); save(); closeModal(); ui.flash.queue = []; render();
  toast('Imported ' + plural(add.length, 'term') + (rows.length > add.length ? ' (' + (rows.length - add.length) + ' duplicates skipped)' : ''));
}
function quizletExport(chapterId) {
  const { chapter } = findChapter(chapterId);
  const text = chapter.definitions.map(d => d[0].replace(/[\t\n]/g, ' ') + '\t' + d[1].replace(/[\t\n]/g, ' ')).join('\n');
  showModal('Export for Quizlet', '<p class="muted small" style="margin-top:0">In Quizlet: <b>Create</b> → <b>Import</b>, paste this, and keep “Tab” and “New line” selected.</p><div class="field"><textarea id="qzOut" style="min-height:220px" readonly>' + esc(text) + '</textarea></div>' +
    '<div class="modal-actions"><button type="button" class="soft" data-act="download-text" data-name="' + esc(chapter.title) + ' - quizlet.txt">⇩ Download .txt</button><button type="button" class="primary" data-act="copy-quizlet">Copy to clipboard</button></div>');
}

/* ---------- Study guides ---------- */
function openGuideModal(classId, chapterIds) {
  const c = findClass(classId); if (!c) return;
  showModal('✦ Make a study guide', '<p class="muted small" style="margin-top:0">AI turns your notes into a printable exam study guide: big ideas, key terms, connections, likely questions, and common mistakes.</p>' +
    '<div class="field"><label>Title</label><input id="guideTitle" value="' + esc(c.name + ' — ' + (chapterIds?.length === 1 ? findChapter(chapterIds[0]).chapter?.title : 'Study guide')) + '"></div>' +
    '<div class="field"><span class="field-label">Chapters</span><div class="chips">' + c.chapters.map(ch => '<label class="chip"><input type="checkbox" class="guide-ch" value="' + ch.id + '" ' + (!chapterIds?.length || chapterIds.includes(ch.id) ? 'checked' : '') + '>' + esc(ch.title) + '</label>').join('') + '</div></div>' +
    (!aiReady() ? '<p class="hint warn">Set up AI in Settings first.</p>' : '') + '<div id="guideStatus"></div>' +
    '<div class="modal-actions">' + cancelBtn() + '<button type="button" class="primary" data-act="guide-run" data-class="' + c.id + '">✦ Create guide</button></div>');
}
async function guideRun(btn, classId) {
  const c = findClass(classId), ids = $$('.guide-ch').filter(x => x.checked).map(x => x.value);
  if (!ids.length) { alert('Pick at least one chapter.'); return; }
  const title = $('#guideTitle').value.trim() || 'Study guide';
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Writing your guide…';
  try {
    const out = await callAI('guide', { title, material: materialFor(c.chapters.filter(ch => ids.includes(ch.id)).map(chapter => ({ course: c, chapter }))), source: c.name });
    const g = { id: uid('g'), classId, chapterIds: ids, title, md: out.text, date: Date.now() };
    data.guides.push(g); save(); closeModal(); go('guide', { guideId: g.id });
  } catch (err) { $('#guideStatus').innerHTML = aiErrorHTML(err); btn.disabled = false; btn.textContent = '✦ Create guide'; }
}

/* ---------- Printing / PDF ---------- */
function printHTML(title, html) {
  const frame = document.createElement('iframe'); frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.append(frame);
  const doc = frame.contentDocument;
  doc.open(); doc.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font:13px/1.6 Georgia,serif;color:#111;margin:32px 40px}h1{font:700 22px Arial,sans-serif;margin:0 0 4px}h2,h3,h4{font-family:Arial,sans-serif;margin:16px 0 6px}.meta{color:#666;font:11px Arial,sans-serif;margin-bottom:18px}.q{margin:0 0 14px;page-break-inside:avoid}.choices{margin:4px 0 0 18px}.key{margin-top:28px;border-top:2px solid #111;padding-top:10px;page-break-before:always}.term{margin:0 0 10px;page-break-inside:avoid}.term b{display:block;font-family:Arial,sans-serif}mark{background:#fff1a8}img{max-width:100%}.lines{border-bottom:1px solid #bbb;height:22px}</style></head><body>' + html + '</body></html>');
  doc.close();
  setTimeout(() => { frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 1500); }, 350);
}
function printChapter(chId) {
  const { course, chapter } = findChapter(chId);
  printHTML(chapter.title, '<h1>' + esc(chapter.title) + '</h1><div class="meta">' + esc(course.name) + (chapter.source ? ' · Source: ' + esc(chapter.source) : '') + '</div>' + (chapter.summary ? '<h3>Summary</h3>' + md(chapter.summary) : '') + (chapter.html || textToHtml(chapter.text)) +
    (chapter.definitions.length ? '<h2>Key terms</h2>' + chapter.definitions.map(d => '<div class="term"><b>' + esc(d[0]) + '</b>' + esc(d[1]) + '</div>').join('') : ''));
}
function printDefs(chId) {
  const { course, chapter } = findChapter(chId);
  printHTML(chapter.title + ' — terms', '<h1>' + esc(chapter.title) + ' — Key terms</h1><div class="meta">' + esc(course.name) + '</div>' + chapter.definitions.map(d => '<div class="term"><b>' + esc(d[0]) + '</b>' + esc(d[1]) + '</div>').join(''));
}
function printResult(id, withKey = true) {
  const e = data.tests.find(x => x.id === id); if (!e?.items) return;
  const qs = e.items.map((it, i) => { const q = it.q; let body = '';
    if (hasChoices(q)) body = '<div class="choices">' + q.choices.map((c, j) => String.fromCharCode(65 + j) + '. ' + esc(c)).join('<br>') + '</div>';
    else if (q.type === 'tf') body = '<div class="choices">True / False</div>';
    else if (q.type === 'match') body = '<div class="choices">' + q.pairs.map(p => esc(p[0]) + ' ____').join('<br>') + '<br><i>Options: ' + esc(shuffle(q.pairs.map(p => p[1])).join(' · ')) + '</i></div>';
    else if (q.type === 'order') body = '<div class="choices">' + shuffle(q.items).map(x => '___ ' + esc(x)).join('<br>') + '</div>';
    else body = '<div class="lines"></div><div class="lines"></div>' + (q.type === 'discuss' ? '<div class="lines"></div><div class="lines"></div>' : '');
    return '<div class="q"><b>' + (i + 1) + '.</b> ' + (q.scenario ? '<i>' + esc(q.scenario) + '</i><br>' : '') + esc(q.q) + body + '</div>'; }).join('');
  const key = '<div class="key"><h2>Answer key</h2>' + e.items.map((it, i) => '<div class="q"><b>' + (i + 1) + '.</b> ' + esc(correctText(it.q)).replace(/\n/g, '<br>') + (it.q.why ? '<br><i>' + esc(it.q.why) + '</i>' : '') + '</div>').join('') + '</div>';
  printHTML(e.className + ' test', '<h1>' + esc(e.className) + ' — Practice test</h1><div class="meta">' + esc((e.chapterNames || []).join(', ')) + ' · ' + e.total + ' questions · Name: ______________________</div>' + qs + (withKey ? key : ''));
}
/* ============================================================
   Events, focus timer, reminders, backup/restore, start-up
   ============================================================ */
function currentItemFor(el) {
  const ri = el.closest('[data-ri]');
  if (ri) { const e = data.tests.find(x => x.id === ui.resultId); return { item: e?.items[Number(ri.dataset.ri)], where: 'result', entry: e }; }
  if (ui.page === 'test-run') return { item: currentRunItem(), where: 'run' };
  if (ui.page === 'chapter' && ui.pItem) return { item: ui.pItem.item, where: 'practice' };
  return {};
}
function revealPractice(item) {
  if (!item.result) item.result = autoGrade(item);
  ui.pItem.revealed = true;
  if (item.result) recordResult(item, 'practice');
  render();
}
function revealRun(item) {
  captureInputs(item);
  item.checked = true;
  if (!item.result) item.result = autoGrade(item);
  if (item.result && !item.recorded) { recordResult(item, 'test'); item.recorded = true; }
  save(); render();
}
function afterGrade(where, item, entry) {
  if (where === 'practice') recordResult(item, 'practice');
  else if (where === 'run') { if (!item.recorded) { recordResult(item, 'test'); item.recorded = true; } }
  else if (where === 'result') { recordResult(item, 'test'); scoreEntry(entry); }
  save(); render();
}

const actions = {
  'go': el => { if (el.dataset.page === 'tests') ui.ts = null; go(el.dataset.page); },
  'open-class': el => go('class', { classId: el.dataset.id }),
  'open-chapter': el => openChapter(el.dataset.class, el.dataset.id, el.dataset.tab || 'Notes'),
  'tab': el => { ui.tab = el.dataset.tab; ui.pItem = null; ui.learn = null; ui.flash.queue = []; render(); },
  'add-class': () => openClassModal(),
  'edit-class': el => openClassModal(findClass(el.dataset.id)),
  'save-class': el => saveClass(el.dataset.id),
  'delete-class': el => deleteCourse(el.dataset.id),
  'pick-color': el => { $('#classColor').value = el.dataset.val; $('#classColorCustom').value = el.dataset.val; $$('.swatch').forEach(s => s.classList.toggle('on', s === el)); },
  'pick-icon': el => { $('#classIcon').value = el.dataset.val; $$('.icon-grid button').forEach(b => b.classList.toggle('on', b === el)); },
  'add-chapter': el => openChapterModal(el.dataset.id || ui.classId),
  'save-chapter': el => saveChapter(el.dataset.id, el.dataset.then),
  'delete-chapter': el => deleteChapter(el.dataset.class, el.dataset.id),
  'add-material': () => openMaterialModal(ui.classId, ui.chapterId),
  'edit-material': el => openMaterialModal(el.dataset.class, el.dataset.id),
  'save-material': () => saveMaterial(),
  'upload-files': () => $('#importFile').click(),
  'gen-studyset': el => generateStudySet(el),
  'fmt': el => {
    const ed = $('#notesEditor'); ed.focus();
    const cmd = el.dataset.cmd;
    if (cmd === 'hilite') { const sel = window.getSelection(); if (sel.rangeCount && !sel.isCollapsed) { const r = sel.getRangeAt(0); const m = document.createElement('mark'); try { r.surroundContents(m); } catch { document.execCommand('hiliteColor', false, '#fff1a8'); } } return; }
    if (cmd === 'image') { ui.imgTarget = true; $('#photoFile').click(); return; }
    document.execCommand(cmd, false, el.dataset.val ? '<' + el.dataset.val + '>' : null);
  },
  'complete': el => { setChapterProgress(el.dataset.id, 100); checkBadges(); render(); toast('Chapter marked complete 🎉'); },
  'reset-progress': el => { if (!confirm('Reset progress for this chapter? (Your notes and questions stay.)')) return; const id = el.dataset.id; data.progress[id] = 0; delete data.practice[id]; delete data.learn[id]; ui.pItem = null; ui.learn = null; save(); render(); },
  'close-modal': () => closeModal(),

  /* practice */
  'pick': el => {
    const { item, where } = currentItemFor(el); if (!item) return;
    const v = el.dataset.val; item.resp = v === 'true' ? true : v === 'false' ? false : Number(v);
    if (where === 'practice') revealPractice(item);
    else if (where === 'run') { if (data.activeTest.mode === 'practice') revealRun(item); else { save(); render(); } }
  },
  'p-check': () => { const item = ui.pItem?.item; if (!item) return; captureInputs(item); if (!answered(item) && !isOpen(item.q)) { toast('Answer first, then check.'); return; } revealPractice(item); },
  'p-nav': el => {
    const { chapter } = findChapter(ui.chapterId); const list = practiceList(chapter); const st = data.practice[chapter.id] ||= { index: 0, correct: {} };
    st.index = (st.index + Number(el.dataset.dir) + list.length) % list.length; ui.pItem = null; save(); render();
  },
  'p-diff': el => { ui.pFilter.difficulty = el.dataset.val; ui.pItem = null; render(); },
  'order-move': el => {
    const { item, where } = currentItemFor(el); if (!item) return;
    const i = Number(el.dataset.idx), j = i + Number(el.dataset.dir); if (j < 0 || j >= item.resp.length) return;
    [item.resp[i], item.resp[j]] = [item.resp[j], item.resp[i]]; item.touched = true;
    if (where === 'run') save(); render();
  },
  'self-grade': el => { const { item, where, entry } = currentItemFor(el); if (!item) return; captureInputs(item); const s = Number(el.dataset.score); item.result = { score: s, verdict: verdictOf(s), by: 'self' }; afterGrade(where, item, entry); },
  'ai-grade': async el => {
    const { item, where, entry } = currentItemFor(el); if (!item) return; captureInputs(item);
    if (!item.resp) { toast('Write an answer first.'); return; }
    el.disabled = true; el.innerHTML = '<span class="spinner"></span> Grading…';
    try { await aiGradeItem(item); afterGrade(where, item, entry); } catch (err) { alert(err.message); el.disabled = false; el.textContent = '✦ Grade with AI'; }
  },
  'explain': el => { const { item } = currentItemFor(el); if (item) explainItem(item, el.dataset.key, el); },

  /* learn mode */
  'learn-pick': el => { const L = ui.learn; L.given = el.dataset.val; L.correct = L.given === L.term; learnAnswer(); },
  'learn-check': () => { const L = ui.learn; L.given = $('#learnInput').value.trim(); if (!L.given) return; const a = norm(L.given), b = norm(L.term); L.correct = a === b || (b.length > 4 && levenshtein(a, b) <= 1); learnAnswer(); },
  'learn-dontknow': () => { const L = ui.learn; L.given = ''; L.correct = false; learnAnswer(); },
  'learn-next': () => { ui.learn = null; render(); },
  'learn-reset': () => { if (!confirm('Restart Learn mode for this chapter?')) return; data.learn[ui.chapterId] = {}; ui.learn = null; save(); render(); },

  /* flashcards */
  'flip': () => { ui.flash.flipped = !ui.flash.flipped; render(); },
  'flash-mode': el => { ui.flash.mode = el.dataset.val; ui.flash.queue = []; render(); },
  'flash-shuffle': () => { ui.flash.queue = shuffle(ui.flash.queue); ui.flash.pos = 0; ui.flash.flipped = false; render(); },
  'flash-nav': el => { const F = ui.flash; F.pos = (F.pos + Number(el.dataset.dir) + F.queue.length) % F.queue.length; F.flipped = false; logActivity({ cards: 1 }); render(); },
  'rate': el => {
    const F = ui.flash, rating = Number(el.dataset.val), term = F.queue[F.pos], k = cardKey(ui.chapterId, term);
    data.cards[k] = scheduleCard(data.cards[k], rating);
    F.queue.splice(F.pos, 1); if (rating === 0) F.queue.push(term);
    F.flipped = false; logActivity({ cards: 1 }); save();
    if (!F.queue.length) { F.queue = []; toast('Review done — great work!'); }
    render();
  },

  /* question bank */
  'bank-filter': el => { ui.bankFilter = el.dataset.val; render(); },
  'edit-question': el => openQuestionModal(el.dataset.chapter, el.dataset.id),
  'save-question': el => saveQuestion(!!el.dataset.more),
  'qe-add-choice': el => { const n = $$('.qe-choice').length; el.insertAdjacentHTML('beforebegin', '<div class="btn-row" style="margin-bottom:6px"><input type="radio" name="qeCorrect" value="' + n + '"><input class="qe-choice" style="flex:1" placeholder="Choice ' + String.fromCharCode(65 + n) + '"></div>'); },
  'delete-question': el => { const { chapter } = findChapter(el.dataset.chapter); if (!confirm('Delete this question?')) return; chapter.questions = chapter.questions.filter(q => q.id !== el.dataset.id); ui.pItem = null; save(); render(); },
  'gen-questions': el => { if (!aiReady()) { alert('Set up AI in Settings first.'); return; } openGenQuestionsModal(el.dataset.id); },
  'gen-run': el => genQuestionsRun(el),
  'gen-add': () => { const { chapter } = findChapter(ui.genChapter); const picked = $$('.gen-q').filter(x => x.checked).map(x => ui.gen.questions[Number(x.value)]); chapter.questions.push(...picked); ui.gen = null; save(); closeModal(); render(); toast(plural(picked.length, 'question') + ' added'); },

  /* files */
  'file-open': async el => { const f = await fileGet(el.dataset.id); if (!f) return; const url = URL.createObjectURL(f.blob); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000); },
  'file-download': async el => { const f = await fileGet(el.dataset.id); if (!f) return; downloadBlob(f.blob, f.name); },
  'file-delete': async el => { if (!confirm('Delete this saved file? (Your notes stay.)')) return; await fileDelete(el.dataset.id); render(); },

  /* quizlet */
  'quizlet-import': el => openQuizletImport(el.dataset.id),
  'quizlet-do-import': el => quizletImport(el.dataset.id),
  'quizlet-export': el => quizletExport(el.dataset.id),
  'copy-quizlet': async () => { try { await navigator.clipboard.writeText($('#qzOut').value); toast('Copied! Paste it into Quizlet’s Import box.'); } catch { $('#qzOut').select(); document.execCommand('copy'); toast('Copied'); } },
  'download-text': el => downloadBlob(new Blob([$('#qzOut').value], { type: 'text/plain' }), el.dataset.name),

  /* printing & guides */
  'print-chapter': el => printChapter(el.dataset.id),
  'print-defs': el => printDefs(el.dataset.id),
  'print-result': el => printResult(el.dataset.id, confirm('Include the answer key at the end?')),
  'print-guide': el => { const g = data.guides.find(x => x.id === el.dataset.id); printHTML(g.title, '<h1>' + esc(g.title) + '</h1><div class="meta">Study guide</div>' + md(g.md)); },
  'new-guide': el => openGuideModal(el.dataset.class, el.dataset.chapter ? [el.dataset.chapter] : el.dataset.chapters ? el.dataset.chapters.split(',').filter(Boolean) : null),
  'guide-run': el => guideRun(el, el.dataset.class),
  'open-guide': el => go('guide', { guideId: el.dataset.id }),
  'delete-guide': el => { if (!confirm('Delete this study guide?')) return; const g = data.guides.find(x => x.id === el.dataset.id); data.guides = data.guides.filter(x => x.id !== el.dataset.id); save(); go('class', { classId: g?.classId }); },

  /* test center */
  'quick-test': el => prefillTest(el.dataset.class, [el.dataset.id]),
  'class-test': el => prefillTest(el.dataset.id, []),
  'ts': el => { readSetupInputs(); const s = testSetup(), k = el.dataset.k, v = el.dataset.val; s[k] = ['count', 'time'].includes(k) ? Number(v) : v; data.settings.lastSetup = { ...s, chapterIds: [], _init: false }; save(); render(); },
  'ts-ch-all': () => { const s = testSetup(); s.chapterIds = findClass(s.classId).chapters.map(c => c.id); render(); },
  'ts-ch-none': () => { const s = testSetup(); s.chapterIds = []; render(); },
  'start-test': el => startTest(el),
  'resume-test': () => go('test-run'),
  'discard-test': () => { if (!confirm('Discard your unfinished test?')) return; data.activeTest = null; save(); render(); },
  'run-nav': el => { const t = data.activeTest; captureInputs(currentRunItem()); t.index = clamp(t.index + Number(el.dataset.dir), 0, t.items.length - 1); save(); render(); window.scrollTo(0, 0); },
  'run-go': el => { const t = data.activeTest; captureInputs(currentRunItem()); t.index = Number(el.dataset.idx); save(); render(); },
  'run-check': () => { const item = currentRunItem(); captureInputs(item); if (!answered(item) && !isOpen(item.q)) { toast('Answer first, then check.'); return; } revealRun(item); },
  'flag': () => { const item = currentRunItem(); captureInputs(item); item.flagged = !item.flagged; save(); render(); },
  'submit-test': () => submitTest(false),
  'open-result': el => go('test-result', { resultId: el.dataset.id }),
  'retake-missed': el => retakeMissed(el.dataset.id),

  /* weak spots */
  'practice-weak': () => practiceWeak(),
  'remove-weak': el => { delete data.mistakes[el.dataset.key]; save(); render(); },

  /* tutor */
  'tutor-send': () => tutorSend($('#tutorInput').value),
  'tutor-suggest': el => tutorSend(el.dataset.val),
  'tutor-clear': () => { data.tutor.messages = []; save(); render(); },
  'tutor-scope': el => { data.tutor.classId = el.dataset.class; data.tutor.chapterIds = el.dataset.chapter ? [el.dataset.chapter] : []; save(); go('tutor'); },

  /* planner */
  'add-exam': el => openExamModal(el.dataset.id || ui.classId),
  'edit-exam': el => openExamModal(el.dataset.class, el.dataset.id),
  'save-exam': el => saveExam(el.dataset.class, el.dataset.id),
  'delete-exam': el => { const c = findClass(el.dataset.class); c.exams = c.exams.filter(e => e.id !== el.dataset.id); save(); closeModal(); render(); },

  /* settings */
  'toggle-theme': () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'),
  'set-theme': el => setTheme(el.dataset.val),
  'save-profile': () => { const p = data.profile; p.name = $('#setName').value.trim() || 'Student'; p.weeklyMinutes = clamp(Number($('#setMin').value) || 300, 10, 10000); p.weeklyQuestions = clamp(Number($('#setQ').value) || 150, 10, 10000); save(); render(); toast('Profile saved'); },
  'pick-photo': () => { ui.imgTarget = false; $('#photoFile').click(); },
  'remove-photo': () => { data.profile.photo = ''; save(); render(); },
  'save-ai': () => { try { localStorage.setItem(AI_CODE_KEY, $('#setCode').value.trim()); } catch {} data.settings.aiProvider = $('#setProvider').value; data.settings.autoAI = $('#setAutoAI').checked; save(); render(); toast('AI settings saved'); },
  'test-ai': async el => { actions['save-ai'](); const st = $('#aiStatus'); st.innerHTML = '<span class="spinner"></span> Testing…'; try { const out = await callAI('ping', {}); $('#aiStatus').innerHTML = '<span class="pill good">✓ Connected · ' + esc(out.provider) + '</span>'; } catch (err) { $('#aiStatus').innerHTML = '<span class="pill bad">' + esc(err.message) + '</span>'; } },
  'save-reminders': async () => {
    const r = data.settings.reminders; r.daily = $('#setDaily').checked; r.time = $('#setTime').value || '19:00'; r.exams = $('#setExamRem').checked;
    if ((r.daily || r.exams) && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    if ((r.daily || r.exams) && 'Notification' in window && Notification.permission === 'denied') alert('Notifications are blocked for this site. Allow them in your browser’s site settings (the icon left of the address bar).');
    save(); render(); toast('Reminders saved');
  },
  'backup': () => { downloadBlob(new Blob([JSON.stringify({ app: 'studyspace', exported: new Date().toISOString(), data }, null, 2)], { type: 'application/json' }), 'studyspace-backup-' + dateKey() + '.json'); toast('Backup downloaded'); },
  'restore': () => $('#restoreFile').click(),
  'load-samples': () => { const s = starterData(); const have = new Set(data.classes.map(c => c.id)); const add = s.classes.filter(c => !have.has(c.id)); data.classes.push(...normalizeData({ ...s, classes: add }).classes); save(); render(); toast(add.length ? 'Sample classes added' : 'Samples are already here'); },
  'erase-all': async () => { if (!confirm('Erase ALL classes, notes, progress, and scores on this computer? Download a backup first if you might want them.')) return; if (!confirm('Are you absolutely sure? This cannot be undone.')) return; const keep = { profile: data.profile, settings: data.settings }; data = normalizeData({ ...starterData(), classes: [], ...keep }); try { const db = await openDB(); db.transaction('files', 'readwrite').objectStore('files').clear(); } catch {} save(); go('home'); toast('Everything erased'); },

  /* focus timer */
  'pomo-toggle': () => { $('#pomo').classList.toggle('hidden'); renderPomo(); },
  'pomo-start': () => { const P = pomo; if (!P.running) { P.running = true; P.endAt = Date.now() + P.left * 1000; } else { P.running = false; P.left = Math.max(0, Math.round((P.endAt - Date.now()) / 1000)); } renderPomo(); },
  'pomo-reset': () => { Object.assign(pomo, { running: false, left: pomo.len * 60 }); renderPomo(); },
  'pomo-len': el => { Object.assign(pomo, { len: Number(el.dataset.val), running: false, left: Number(el.dataset.val) * 60, kind: el.dataset.kind }); renderPomo(); },
  'pomo-close': () => $('#pomo').classList.add('hidden')
};
function learnAnswer() {
  const L = ui.learn, st = data.learn[ui.chapterId] ||= {};
  L.answered = true;
  st[L.term] = L.correct ? Math.min(2, (st[L.term] || 0) + 1) : 0;
  logActivity({ questions: 1, correct: L.correct ? 1 : 0 });
  recomputeProgress(ui.chapterId); save(); render();
}
function setTheme(t) {
  document.documentElement.dataset.theme = t === 'dark' ? 'dark' : '';
  if (t !== 'dark') delete document.documentElement.dataset.theme;
  try { localStorage.setItem('studyspace-theme', JSON.stringify(t)); } catch {}
  render();
}
function downloadBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
async function resizeImage(file, max) {
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
  const scale = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url); return c.toDataURL('image/jpeg', 0.85);
}

/* ---------- Focus timer (Pomodoro) ---------- */
const pomo = { len: 25, left: 25 * 60, running: false, endAt: 0, kind: 'focus' };
function renderPomo() {
  const box = $('#pomo'), btn = $('#pomoBtn');
  const left = pomo.running ? Math.max(0, Math.round((pomo.endAt - Date.now()) / 1000)) : pomo.left;
  btn.textContent = pomo.running ? '⏱ ' + fmtTime(left) : '⏱'; btn.classList.toggle('running', pomo.running);
  if (box.classList.contains('hidden')) return;
  box.innerHTML = '<div class="section-head"><h2>' + (pomo.kind === 'break' ? 'Break' : 'Focus timer') + '</h2><button class="close" data-act="pomo-close">×</button></div>' +
    '<div class="seg" style="width:100%;justify-content:center">' + [[25, 'focus', 'Focus 25'], [50, 'focus', '50'], [5, 'break', 'Break 5'], [15, 'break', '15']].map(([m, k, l]) => '<button class="' + (pomo.len === m && pomo.kind === k ? 'on' : '') + '" data-act="pomo-len" data-val="' + m + '" data-kind="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<div class="timer" id="pomoTime">' + fmtTime(left) + '</div><div class="btn-row" style="justify-content:center"><button class="primary" data-act="pomo-start">' + (pomo.running ? 'Pause' : 'Start') + '</button><button class="soft" data-act="pomo-reset">Reset</button></div>' +
    '<p class="muted small" style="text-align:center;margin-bottom:0">Finished focus sessions count toward your study time and streak.</p>';
}
function beep() { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); [0, .25, .5].forEach(t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.2, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + .2); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .2); }); } catch {} }
function notify(title, body) { try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body }); } catch {} }
setInterval(() => {
  if (!pomo.running) return;
  const left = Math.max(0, Math.round((pomo.endAt - Date.now()) / 1000));
  const el = $('#pomoTime'); if (el) el.textContent = fmtTime(left);
  $('#pomoBtn').textContent = '⏱ ' + fmtTime(left);
  if (left <= 0) {
    pomo.running = false; beep();
    if (pomo.kind === 'focus') { logActivity({ pomos: 1 }); notify('Focus session done! 🎉', 'Take a short break.'); toast('Focus session complete — take a break!', 4000); Object.assign(pomo, { kind: 'break', len: 5, left: 300 }); }
    else { notify('Break is over', 'Ready for another focus session?'); toast('Break over — ready to focus?', 4000); Object.assign(pomo, { kind: 'focus', len: 25, left: 1500 }); }
    $('#pomo').classList.remove('hidden'); renderPomo();
  }
}, 1000);

/* ---------- Study-time tracking & reminders ---------- */
let lastInteraction = Date.now();
['click', 'keydown', 'scroll', 'input'].forEach(ev => document.addEventListener(ev, () => { lastInteraction = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!data) return;
  const active = !document.hidden && (Date.now() - lastInteraction < 120000 || pomo.running && pomo.kind === 'focus');
  if (active) logActivity({ minutes: 1 });
  const r = data.settings.reminders, now = new Date(), hm = pad(now.getHours()) + ':' + pad(now.getMinutes()), today = dateKey();
  if (r.daily && hm === r.time && data.settings.lastDaily !== today) { data.settings.lastDaily = today; save(); const t = planTasks()[0]; notify('Time to study 📚', t ? t.title + ' — ' + t.sub : 'Open Studyspace for today’s plan.'); }
  if (r.exams && data.settings.lastExamNote !== today && now.getHours() >= 9) {
    const soon = upcomingExams().filter(e => e.days === 1);
    if (soon.length) { data.settings.lastExamNote = today; save(); notify('Exam tomorrow!', soon.map(e => e.course.name + ': ' + e.exam.title).join(', ') + ' — try a timed practice exam.'); }
  }
}, 60000);

/* ---------- Wiring ---------- */
function bindEvents() {
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-act]'); if (!el) return;
    if (el.tagName === 'A') event.preventDefault();
    const fn = actions[el.dataset.act]; if (!fn) return;
    fn(el, event);
  });
  document.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'libFilter') { ui.libFilter = e.target.value; render(); }
    if (id === 'pType') { ui.pFilter.type = e.target.value; ui.pItem = null; render(); }
    if (id === 'tsClass') { ui.ts.classId = e.target.value; ui.ts.chapterIds = []; ui.ts._init = false; render(); }
    if (e.target.classList.contains('ts-ch') || e.target.classList.contains('ts-type') || ['tsShuffle', 'tsWeak', 'tsSaveAI', 'tsCount', 'tsTime'].includes(id)) { readSetupInputs(); render(); }
    if (id === 'materialClass') { const c = findClass(e.target.value); $('#materialChapter').innerHTML = chapterOptions(c); }
    if (id === 'qeType') { ui.qEdit.type = e.target.value; const { chapter } = findChapter(ui.qEdit.chapterId); $('#qeFields').innerHTML = questionFields(e.target.value, chapter.questions.find(q => q.id === ui.qEdit.qid)); }
    if (id === 'classColorCustom') { $('#classColor').value = e.target.value; $$('.swatch').forEach(s => s.classList.remove('on')); }
    if (id === 'weakFilter') { ui.weakFilter = e.target.value; render(); }
    if (id === 'progFilter') { ui.progFilter = e.target.value; render(); }
    if (id === 'tutorClass') { data.tutor.classId = e.target.value; data.tutor.chapterIds = []; save(); render(); }
    if (e.target.classList.contains('tutor-ch')) {
      if (e.target.value === '__all') data.tutor.chapterIds = [];
      else data.tutor.chapterIds = $$('.tutor-ch').filter(x => x.checked && x.value !== '__all').map(x => x.value);
      save(); render();
    }
    if (e.target.classList.contains('plan-check')) { const d = data.plans[dateKey()] ||= {}; d[e.target.dataset.id] = e.target.checked; save(); render(); }
    if (e.target.classList.contains('match-sel')) { const { item, where } = currentItemFor(e.target); if (item) { captureInputs(item); if (where === 'run') save(); } }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'libSearch') { const q = e.target.value.toLowerCase(); $$('#libraryList .chapter').forEach(c => c.classList.toggle('hidden', !c.textContent.toLowerCase().includes(q))); }
    if (e.target.id === 'globalSearch') { ui.search = e.target.value; if (ui.search.trim().length >= 2) { if (ui.page !== 'search') { ui.prevPage = ui.page; } ui.page = 'search'; $('#view').innerHTML = viewSearch(); updateSidebar(); } else if (ui.page === 'search') { go(ui.prevPage || 'home'); } }
  });
  document.addEventListener('keydown', e => {
    const tag = e.target.tagName, typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable;
    if (e.key === 'Enter' && e.target.id === 'tutorInput' && !e.shiftKey) { e.preventDefault(); tutorSend(e.target.value); return; }
    if (e.key === 'Enter' && e.target.id === 'learnInput') { e.preventDefault(); actions['learn-check'](); return; }
    if (e.key === 'Enter' && e.target.id === 'qFill') { e.preventDefault(); if (ui.page === 'chapter') actions['p-check'](); else if (ui.page === 'test-run' && data.activeTest?.mode === 'practice') actions['run-check'](); else if (ui.page === 'test-run') actions['run-nav']({ dataset: { dir: 1 } }); return; }
    if (e.key === '/' && !typing) { e.preventDefault(); $('#globalSearch').focus(); return; }
    if (typing || $('#modal').open) return;
    if (ui.page === 'chapter' && ui.tab === 'Flashcards') {
      if (e.key === ' ') { e.preventDefault(); actions.flip(); }
      if (ui.flash.flipped && ui.flash.mode === 'due' && ['1', '2', '3', '4'].includes(e.key)) actions.rate({ dataset: { val: String(Number(e.key) - 1) } });
      if (ui.flash.mode === 'all' && e.key === 'ArrowRight') actions['flash-nav']({ dataset: { dir: 1 } });
      if (ui.flash.mode === 'all' && e.key === 'ArrowLeft') actions['flash-nav']({ dataset: { dir: -1 } });
    }
    if (ui.page === 'chapter' && ui.tab === 'Learn' && ui.learn) {
      if (!ui.learn.answered && ui.learn.stage === 0 && /^[1-4]$/.test(e.key)) { const b = $$('[data-act="learn-pick"]')[Number(e.key) - 1]; if (b) b.click(); }
      else if (ui.learn.answered && e.key === 'Enter') actions['learn-next']();
    }
    if (ui.page === 'test-run' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) actions['run-nav']({ dataset: { dir: e.key === 'ArrowRight' ? 1 : -1 } });
  });
  $('#importFile').addEventListener('change', async e => { const files = [...e.target.files]; e.target.value = ''; if (files.length) await handleUploads(files); });
  $('#photoFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      if (ui.imgTarget) { const url = await resizeImage(f, 1200); const ed = $('#notesEditor'); ed.focus(); document.execCommand('insertHTML', false, '<img src="' + url + '" alt="">'); }
      else { data.profile.photo = await resizeImage(f, 160); save(); render(); }
    } catch { alert('Could not read that image.'); }
  });
  $('#restoreFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()); const incoming = parsed.data || parsed;
      if (!incoming.classes) throw new Error('not a backup');
      if (!confirm('Replace everything on this computer with this backup (' + plural(incoming.classes.length, 'class') + ')?')) return;
      data = normalizeData(incoming); save(); go('home'); toast('Backup restored');
    } catch { alert('That file isn’t a Studyspace backup.'); }
  });
  document.addEventListener('paste', e => {
    if (e.target.id !== 'notesEditor') return;
    const html = e.clipboardData.getData('text/html');
    if (html) { e.preventDefault(); document.execCommand('insertHTML', false, sanitizeHTML(html)); }
  });
}

/* ---------- Start ---------- */
(async function start() {
  await loadData();
  bindEvents();
  if (data.activeTest) toast('You have an unfinished test — resume it in the Test center.', 4000);
  render(); renderPomo(); checkBadges();
})();
