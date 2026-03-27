function createInitialMastery() {
  // Mastery is tracked per KC on 0..100.
  return {
    KC1: 20,
    KC2: 20,
    KC3: 20,
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function updateMastery({
  mastery,
  kc,
  correct,
  difficulty,
  hintsUsed = 0,
  attempts = 1,
  recentAccuracy = 0.5,
}) {
  const current = mastery?.[kc];
  const base = typeof current === "number" ? current : 20;

  // Multi-factor mastery update:
  // - correctness
  // - difficulty
  // - hint dependence
  // - attempts used
  // - recent accuracy trend
  const diff = typeof difficulty === "number" ? difficulty : 1;
  const diffWeight = diff === 1 ? 0.8 : diff === 2 ? 1 : 1.25;
  const attemptPenalty = Math.max(0, attempts - 1) * 2.5;
  const hintPenalty = hintsUsed * 2;
  const trendBonus = recentAccuracy >= 0.8 ? 2 : recentAccuracy <= 0.4 ? -2 : 0;

  let next = base;
  if (correct) {
    next = base + 8 * diffWeight - attemptPenalty - hintPenalty + trendBonus;
  } else {
    next = base - 7 * diffWeight - Math.min(6, hintPenalty / 2) + trendBonus;
  }

  mastery[kc] = clamp(Math.round(next), 0, 100);
  return mastery;
}

module.exports = {
  createInitialMastery,
  updateMastery,
};

