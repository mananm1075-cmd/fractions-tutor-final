/**
 * sessionQueue.js
 * Selects 8 questions adaptively from a 20-question KC pool.
 * Factors: mastery level, response time, already-answered questions.
 */

const SESSION_SIZE = 8;

function buildSessionQueue({ kc, allQuestions, history = [], mastery = {}, metrics = {} }) {
  const kcPool = allQuestions.filter((q) => q.kc === kc);

  // Find correctly answered question IDs for this KC
  const correctIds = new Set(
    (history || []).filter((h) => h.kc === kc && h.correct).map((h) => h.question_id)
  );

  // Prefer unanswered correctly; fall back to full pool if too few
  const unanswered = kcPool.filter((q) => !correctIds.has(q.id));
  const pool = unanswered.length >= SESSION_SIZE ? unanswered : kcPool;

  // ── Response time + accuracy signal (recent attempts, last answer weighted) ─
  const recentKcHistory = (history || []).filter((h) => h.kc === kc).slice(-5);
  let timeSignal = 0; // -1 = push easier, 0 = neutral, +1 = push harder

  function resolveTimeMs(h) {
    if (typeof h.time_taken === "number" && h.time_taken > 0) return h.time_taken;
    const fromMetrics = metrics?.time_taken_per_question?.[h.question_id];
    return typeof fromMetrics === "number" && fromMetrics > 0 ? fromMetrics : null;
  }

  if (recentKcHistory.length >= 1) {
    const last = recentKcHistory[recentKcHistory.length - 1];
    const lastTime = resolveTimeMs(last);
    if (lastTime != null) {
      const lastSec = lastTime / 1000;
      if (last.correct && lastSec < 18) timeSignal = 1;
      if (!last.correct && lastSec > 42) timeSignal = -1;
    }
  }
  if (recentKcHistory.length >= 3) {
    const timings = recentKcHistory.map((h) => ({
      correct: h.correct,
      time: resolveTimeMs(h),
    }));
    const fastCorrect = timings.filter((t) => t.correct && t.time !== null && t.time < 15000);
    const slowWrong = timings.filter((t) => !t.correct && t.time !== null && t.time > 45000);
    if (fastCorrect.length >= 2) timeSignal = 1;
    if (slowWrong.length >= 2) timeSignal = -1;
  }

  // ── Difficulty Distribution ─────────────────────────────────────────────
  const m = mastery?.[kc] ?? 0;
  let [nEasy, nMed, nHard] =
    m < 30 ? [4, 3, 1] : m < 60 ? [2, 3, 3] : [1, 2, 5];

  // Apply time signal adjustment
  if (timeSignal > 0) {
    nEasy = Math.max(0, nEasy - 1);
    nHard = Math.min(SESSION_SIZE - 1, nHard + 1);
  }
  if (timeSignal < 0) {
    nHard = Math.max(0, nHard - 1);
    nEasy = Math.min(SESSION_SIZE - 1, nEasy + 1);
  }

  // Ensure totals sum to SESSION_SIZE
  const total = nEasy + nMed + nHard;
  if (total !== SESSION_SIZE) nMed += SESSION_SIZE - total;

  // ── Pick Questions ──────────────────────────────────────────────────────
  const easy = pool.filter((q) => (q.difficulty || 1) === 1);
  const med = pool.filter((q) => (q.difficulty || 1) === 2);
  const hard = pool.filter((q) => (q.difficulty || 1) === 3);

  function pickN(arr, n) {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  }

  let selected = [
    ...pickN(easy, Math.min(nEasy, easy.length)),
    ...pickN(med, Math.min(nMed, med.length)),
    ...pickN(hard, Math.min(nHard, hard.length)),
  ];

  // Fill any remaining slots from the rest of the pool
  if (selected.length < SESSION_SIZE) {
    const selectedIds = new Set(selected.map((q) => q.id));
    const remaining = pool.filter((q) => !selectedIds.has(q.id));
    selected = [...selected, ...pickN(remaining, SESSION_SIZE - selected.length)];
  }

  // Sort pedagogically: easy → medium → hard
  selected.sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));

  return selected.slice(0, SESSION_SIZE);
}

module.exports = { buildSessionQueue };
