function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rateQuestionForDifficulty(q, targetDifficulty) {
  return Math.abs((q.difficulty || 1) - targetDifficulty);
}

function kcStats(history, kc) {
  const kcHistory = (history || []).filter((h) => h.kc === kc);
  const recent = kcHistory.slice(-5);
  if (!recent.length) return { accuracy: 0.5, avgHints: 0, avgAttempts: 1, avgTime: null };
  const correctCount = recent.filter((h) => h.correct).length;
  const hintSum = recent.reduce((s, h) => s + (h.hints_used || 0), 0);
  const attemptSum = recent.reduce((s, h) => s + (h.attempts || 1), 0);
  const timings = recent.map((h) => h.time_taken).filter((t) => typeof t === "number" && t > 0);
  const avgTime = timings.length ? timings.reduce((a, b) => a + b, 0) / timings.length : null;
  return {
    accuracy: correctCount / recent.length,
    avgHints: hintSum / recent.length,
    avgAttempts: attemptSum / recent.length,
    avgTime, // ms
  };
}

/** Last attempt on this KC drives immediate pacing (blend with rolling stats in chooseNextQuestion). */
function lastAttemptPace(history, kc) {
  const kcHistory = (history || []).filter((h) => h.kc === kc);
  const last = kcHistory[kcHistory.length - 1];
  if (!last) return null;
  const t = last.time_taken;
  const timeMs = typeof t === "number" && t > 0 ? t : null;
  return { correct: Boolean(last.correct), timeMs, hintsUsed: last.hints_used || 0, attempts: last.attempts || 1 };
}

const ALL_KCS = ["KC1", "KC2", "KC3", "KC4", "KC5", "KC6", "KC7"];

function selectTargetKC({ mastery, history }) {
  const master = mastery || {};
  const lowestMasteryKC = ALL_KCS.reduce(
    (best, kc) => ((master[kc] ?? 0) < (master[best] ?? 0) ? kc : best),
    "KC1"
  );
  if ((master[lowestMasteryKC] ?? 0) < 65) return lowestMasteryKC;

  return ALL_KCS.reduce((best, kc) => {
    const a = kcStats(history, kc).accuracy;
    const b = kcStats(history, best).accuracy;
    return a < b ? kc : best;
  }, "KC1");
}

function chooseNextQuestion({
  mastery,
  answeredQuestionIds,
  questions,
  history = [],
  remediation = null,
  activeKC = null,
  /** When set (e.g. KC sequential practice), only exclude these IDs from the pool for this pick. */
  poolExcludeIds = null,
}) {
  const targetKC = activeKC || remediation?.kc || selectTargetKC({ mastery, history });
  const kcCandidates = questions.filter((q) => q.kc === targetKC);
  const candidates = remediation?.code
    ? kcCandidates.filter((q) => (q.remediationTags || []).includes(remediation.code))
    : kcCandidates;

  let pool;
  if (poolExcludeIds != null) {
    const excluded = new Set(poolExcludeIds);
    pool = candidates.filter((q) => !excluded.has(q.id));
    if (pool.length === 0) {
      pool = candidates.length > 0 ? candidates : kcCandidates;
    }
  } else {
    const ids = answeredQuestionIds || [];
    const unattempted = candidates.filter((q) => !ids.includes(q.id));
    pool =
      unattempted.length > 0 ? unattempted : candidates.length > 0 ? candidates : kcCandidates;
  }

  const m = mastery?.[targetKC] ?? 0;
  const stats = kcStats(history, targetKC);
  const lastPace = lastAttemptPace(history, targetKC);

  // Blend rolling window (recent 5) with last attempt for pace: last answer weights more for "current" adaptation.
  const lastAcc = lastPace ? (lastPace.correct ? 1 : 0) : null;
  const blendedAccuracy =
    lastAcc !== null ? stats.accuracy * 0.35 + lastAcc * 0.65 : stats.accuracy;

  let blendedAvgTimeMs = stats.avgTime;
  if (lastPace?.timeMs != null) {
    blendedAvgTimeMs =
      stats.avgTime != null ? stats.avgTime * 0.4 + lastPace.timeMs * 0.6 : lastPace.timeMs;
  }

  // ── Mastery-based difficulty ──────────────────────────────────────────────
  let targetDifficulty;
  if (m < 30) {
    targetDifficulty = 1;
  } else if (m < 60) {
    targetDifficulty = 2;
  } else {
    targetDifficulty = 3;
  }

  // ── Accuracy / hint adjustments (blended accuracy + last attempt hints) ─
  if (blendedAccuracy < 0.55 || stats.avgHints >= 1.5 || stats.avgAttempts > 1.2) {
    targetDifficulty -= 1;
  }
  if (blendedAccuracy > 0.85 && stats.avgHints < 0.8) {
    targetDifficulty += 1;
  }
  if (lastPace && !lastPace.correct && lastPace.attempts >= 2) {
    targetDifficulty -= 1;
  }
  if (lastPace && lastPace.correct && lastPace.hintsUsed === 0 && lastPace.attempts === 1) {
    targetDifficulty += 1;
  }

  // ── Response time adjustment (blended + last-question seconds) ────────────
  if (blendedAvgTimeMs !== null && blendedAvgTimeMs > 0) {
    const avgSec = blendedAvgTimeMs / 1000;
    if (avgSec < 12 && blendedAccuracy >= 0.65) {
      targetDifficulty += 1;
    } else if (avgSec > 50 && blendedAccuracy < 0.55) {
      targetDifficulty -= 1;
    }
  }
  if (lastPace?.timeMs != null) {
    const sec = lastPace.timeMs / 1000;
    if (lastPace.correct && sec < 18) targetDifficulty += 1;
    if (!lastPace.correct && sec > 40) targetDifficulty -= 1;
  }

  targetDifficulty = clamp(targetDifficulty, 1, 3);

  let best = pool[0];
  for (const q of pool) {
    if (!best) { best = q; continue; }
    const dBest = rateQuestionForDifficulty(best, targetDifficulty);
    const dQ = rateQuestionForDifficulty(q, targetDifficulty);
    if (dQ < dBest) best = q;
    if (dQ === dBest && String(q.id) < String(best.id)) best = q;
  }

  return best;
}

module.exports = {
  chooseNextQuestion,
  selectTargetKC,
};
