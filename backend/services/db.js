const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

let dbCache = null;

function ensureDBFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ students: {} }, null, 2), "utf-8");
  }
}

function loadDB() {
  ensureDBFile();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    dbCache = JSON.parse(raw || "{}");
  } catch {
    dbCache = {};
  }
  if (!dbCache.students) dbCache.students = {};
}

function getDB() {
  if (!dbCache) loadDB();
  return dbCache;
}

function persist() {
  ensureDBFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2), "utf-8");
}

function createStudent(student_id, initial) {
  const now = Date.now();
  return {
    id: student_id,
    name: initial?.name || "Student",
    createdAt: now,
    mastery: initial?.mastery || { KC1: 0, KC2: 0, KC3: 0, KC4: 0, KC5: 0, KC6: 0, KC7: 0 },
    current: null,
    history: [],
    remediation: null,
    questionStates: {},
    metrics: {
      session_start_time: now,
      session_end_time: null,
      time_taken_per_question: {},
      question_timestamp: {},
      misconception_frequency: { F001: 0, F002: 0, F003: 0, F004: 0 },
    },
    lessonsViewed: [],
    // Per-KC session queues (which 8 questions were selected this session)
    sessionQueues: {},
    // Per-KC sequential rounds: question IDs answered correctly in the current round of 8
    kcRound: {},
  };
}

function migrateStudent(s) {
  if (!s.questionStates) s.questionStates = {};
  if (!s.metrics) {
    s.metrics = {
      session_start_time: Date.now(),
      session_end_time: null,
      time_taken_per_question: {},
      question_timestamp: {},
      misconception_frequency: { F001: 0, F002: 0, F003: 0, F004: 0 },
    };
  }
  if (!s.lessonsViewed) s.lessonsViewed = [];
  if (!s.sessionQueues) s.sessionQueues = {};
  if (!s.kcRound || typeof s.kcRound !== "object") s.kcRound = {};
  // Ensure all KCs exist in mastery
  const allKCs = ["KC1", "KC2", "KC3", "KC4", "KC5", "KC6", "KC7"];
  for (const kc of allKCs) {
    if (typeof s.mastery[kc] !== "number") s.mastery[kc] = 0;
  }
  // Unpracticed KCs should stay at 0% (fixes legacy rows that stored a fake default like 20).
  const attemptedKcs = new Set((s.history || []).map((h) => h.kc).filter(Boolean));
  for (const kc of allKCs) {
    if (!attemptedKcs.has(kc)) s.mastery[kc] = 0;
  }
}

function getOrCreateStudent(student_id, initial) {
  const db = getDB();
  const id =
    student_id && typeof student_id === "string" && student_id.trim().length > 0
      ? student_id
      : crypto.randomUUID();

  if (!db.students[id]) {
    db.students[id] = createStudent(id, initial);
  } else {
    migrateStudent(db.students[id]);
  }
  return db.students[id];
}

/**
 * Look up a student by name (case-insensitive, trimmed).
 * Returns existing student record or creates a new one.
 * This is the primary lookup for the name-based identity system.
 */
function getOrCreateStudentByName(name) {
  const db = getDB();
  const normalizedName = (name || "Student").trim().toLowerCase();

  // Search for existing student with matching name
  for (const [id, student] of Object.entries(db.students)) {
    if ((student.name || "").trim().toLowerCase() === normalizedName) {
      migrateStudent(student);
      return student;
    }
  }

  // No existing student found — create new one
  const newId = crypto.randomUUID();
  const newStudent = createStudent(newId, {
    name: (name || "Student").trim(),
    mastery: { KC1: 0, KC2: 0, KC3: 0, KC4: 0, KC5: 0, KC6: 0, KC7: 0 },
  });
  db.students[newId] = newStudent;
  return newStudent;
}

module.exports = {
  getOrCreateStudent,
  getOrCreateStudentByName,
  persist,
};
