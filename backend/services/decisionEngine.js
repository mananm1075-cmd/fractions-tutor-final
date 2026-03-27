function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rateQuestionForDifficulty(q, targetDifficulty) {
  return Math.abs((q.difficulty || 1) - targetDifficulty);
}

function kcStats(history, kc) {
  const kcHistory = (history || []).filter((h) => h.kc === kc);
  const recent = kcHistory.slice(-5);
  if (!recent.length) return { accuracy: 0.5, avgHints: 0, avgAttempts: 1 };
  const correctCount = recent.filter((h) => h.correct).length;
  const hintSum = recent.reduce((s, h) => s + (h.hints_used || 0), 0);
  const attemptSum = recent.reduce((s, h) => s + (h.attempts || 1), 0);
  return {
    accuracy: correctCount / recent.length,
    avgHints: hintSum / recent.length,
    avgAttempts: attemptSum / recent.length,
  };
}

function selectTargetKC({ mastery, history }) {
  const master = mastery || { KC1: 20, KC2: 20, KC3: 20 };
  const kcs = ["KC1", "KC2", "KC3"];

  // Learning-path control:
  // If a KC is below threshold (<65), prioritize lowest mastery.
  // If all KCs are >=65, prioritize the lowest recent accuracy.
  const lowestMasteryKC = kcs.reduce((best, kc) => (master[kc] < master[best] ? kc : best), "KC1");
  if ((master[lowestMasteryKC] || 0) < 65) return lowestMasteryKC;

  return kcs.reduce((best, kc) => {
    const a = kcStats(history, kc).accuracy;
    const b = kcStats(history, best).accuracy;
    return a < b ? kc : best;
  }, "KC1");
}

function chooseNextQuestion({ mastery, answeredQuestionIds, questions, history = [], remediation = null }) {
  const targetKC = remediation?.kc || selectTargetKC({ mastery, history });
  const kcCandidates = questions.filter((q) => q.kc === targetKC);
  const candidates = remediation?.code
    ? kcCandidates.filter((q) => (q.remediationTags || []).includes(remediation.code))
    : kcCandidates;

  const unattempted = candidates.filter((q) => !answeredQuestionIds.includes(q.id));
  const pool = (unattempted.length > 0 ? unattempted : candidates).length
    ? unattempted.length > 0
      ? unattempted
      : candidates
    : kcCandidates;

  const m = mastery?.[targetKC] ?? 20;
  const stats = kcStats(history, targetKC);

  // Adaptive difficulty:
  // base from mastery tier + adjust down for low success/high hints/high attempts.
  let targetDifficulty = m < 45 ? 1 : m < 75 ? 2 : 3;
  if (stats.accuracy < 0.55 || stats.avgHints >= 1.5 || stats.avgAttempts > 1.2) targetDifficulty -= 1;
  if (stats.accuracy > 0.85 && stats.avgHints < 0.8) targetDifficulty += 1;
  targetDifficulty = clamp(targetDifficulty, 1, 3);

  let best = pool[0];
  for (const q of pool) {
    if (!best) {
      best = q;
      continue;
    }
    const dBest = rateQuestionForDifficulty(best, targetDifficulty);
    const dQ = rateQuestionForDifficulty(q, targetDifficulty);
    if (dQ < dBest) best = q;
    if (dQ === dBest && String(q.id) < String(best.id)) best = q;
  }

  return best;
}

module.exports = {
  chooseNextQuestion,
};

