const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

let dbCache = null;
let dirty = false;

function ensureDBFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ students: {} }, null, 2), "utf-8");
  }
}

function loadDB() {
  ensureDBFile();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  dbCache = JSON.parse(raw || "{}");
  if (!dbCache.students) dbCache.students = {};
}

function getDB() {
  if (!dbCache) loadDB();
  return dbCache;
}

function markDirty() {
  dirty = true;
}

function persist() {
  // Controller calls `persist()` after mutations. For a simple local JSON DB,
  // always write to disk to avoid missing dirty-flag updates.
  ensureDBFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2), "utf-8");
  dirty = false;
}

function createStudent(student_id, initial) {
  const now = Date.now();
  return {
    id: student_id,
    name: initial?.name || "Student",
    createdAt: now,
    mastery: initial?.mastery || { KC1: 20, KC2: 20, KC3: 20 },
    current: null,
    history: [],
    remediation: null,
  };
}

function getOrCreateStudent(student_id, initial) {
  const db = getDB();

  const id = student_id && typeof student_id === "string" && student_id.trim().length > 0 ? student_id : crypto.randomUUID();

  if (!db.students[id]) {
    db.students[id] = createStudent(id, initial);
    markDirty();
  }

  return db.students[id];
}

module.exports = {
  getOrCreateStudent,
  persist,
};

