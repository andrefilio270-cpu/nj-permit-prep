// db/build-db.js — rebuilds db/permitprep-nc.db from the static data files (data/*.js + js/storage.js TOPICS).
// Usage (Node 22+, built-in node:sqlite):  node db/build-db.js
// Same schema as the NJ database plus Spanish (_es) columns; ready to migrate to Postgres/Supabase later.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DatabaseSync } = require('node:sqlite');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
fs.readdirSync(path.join(root, 'data')).filter(f => f.endsWith('.js')).sort().forEach(f => run('data/' + f));
// TOPICS is a top-level const in storage.js — expose it from the same context
run('js/storage.js');
const TOPICS = vm.runInContext('TOPICS', ctx);
const QS = ctx.window.QUESTION_BANK, META = ctx.window.SIGNS_META, SVGS = ctx.window.SIGN_SVGS;

const file = path.join(__dirname, 'permitprep-nc.db');
if (fs.existsSync(file)) fs.unlinkSync(file);
const db = new DatabaseSync(file);
db.exec(`
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_pt TEXT NOT NULL,
  name_es TEXT NOT NULL,
  icon TEXT
);
CREATE TABLE signs (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('regulatory','warning','guide','shape')),
  name_en TEXT NOT NULL, meaning_en TEXT NOT NULL,
  name_pt TEXT NOT NULL, meaning_pt TEXT NOT NULL,
  name_es TEXT NOT NULL, meaning_es TEXT NOT NULL,
  svg TEXT NOT NULL
);
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL REFERENCES topics(id),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
  question_en TEXT NOT NULL,
  choices_en TEXT NOT NULL,       -- JSON array [4]
  answer_index INTEGER NOT NULL CHECK(answer_index BETWEEN 0 AND 3),
  explanation_en TEXT NOT NULL,
  question_pt TEXT NOT NULL,
  choices_pt TEXT NOT NULL,       -- JSON array [4], same order as EN
  explanation_pt TEXT NOT NULL,
  question_es TEXT NOT NULL,
  choices_es TEXT NOT NULL,       -- JSON array [4], same order as EN
  explanation_es TEXT NOT NULL,
  sign_key TEXT REFERENCES signs(key)
);
CREATE INDEX idx_q_topic ON questions(topic);
CREATE INDEX idx_q_difficulty ON questions(difficulty);
CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT);
`);

db.exec('BEGIN');
const insT = db.prepare('INSERT INTO topics VALUES (?,?,?,?,?)');
TOPICS.forEach(t => insT.run(t.id, t.name, t.name_pt, t.name_es, t.icon));
const insS = db.prepare('INSERT INTO signs VALUES (?,?,?,?,?,?,?,?,?)');
META.forEach(m => insS.run(m.key, m.category, m.name, m.meaning, m.name_pt, m.meaning_pt, m.name_es, m.meaning_es, SVGS[m.key]));
const insQ = db.prepare('INSERT INTO questions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
QS.forEach(q => insQ.run(q.id, q.topic, q.difficulty, q.question, JSON.stringify(q.choices), q.answerIndex, q.explanation,
  q.question_pt, JSON.stringify(q.choices_pt), q.explanation_pt, q.question_es, JSON.stringify(q.choices_es), q.explanation_es,
  q.sign || null));
const insM = db.prepare('INSERT INTO meta VALUES (?,?)');
[['state', 'North Carolina'], ['source', 'NC Driver Handbook (NCDMV), original questions'], ['languages', 'en,pt,es'],
  ['exam_signs', '12 signs by shape & color, pass with 9'], ['exam_knowledge', '25 questions, pass with 20'],
  ['question_count', String(QS.length)], ['sign_count', String(META.length)]].forEach(r => insM.run(r[0], r[1]));
db.exec('COMMIT');
db.close();
console.log('wrote ' + file + ': ' + QS.length + ' questions, ' + META.length + ' signs, ' + TOPICS.length + ' topics');
