const { getOrCreateStudent, getOrCreateStudentByName, persist } = require("./db");
const { createInitialMastery } = require("./learnerModel");
const { chooseNextQuestion } = require("./decisionEngine");
const { detectMisconception } = require("./misconceptionEngine");
const { buildSessionQueue } = require("./sessionQueue");
const questions = require("../data/questions");
const { lessons } = require("../data/questions");
const { updateMastery } = require("./learnerModel");

const ALL_KCS = ["KC1", "KC2", "KC3", "KC4", "KC5", "KC6", "KC7"];
const KC_SEQUENTIAL_ROUND_SIZE = 8;

function ensureKcRoundState(student, kc) {
  if (!student.kcRound) student.kcRound = {};
  if (!student.kcRound[kc] || !Array.isArray(student.kcRound[kc].completedCorrectIds)) {
    student.kcRound[kc] = { completedCorrectIds: [] };
  }
  return student.kcRound[kc];
}

function normalizeSelectedOption(selected_option) {
  if (Array.isArray(selected_option)) return selected_option.map((x) => String(x).trim()).sort();
  if (typeof selected_option === "boolean") return selected_option ? "true" : "false";
  return String(selected_option ?? "").trim();
}

function validateStudentId(student_id) {
  if (!student_id || typeof student_id !== "string") return false;
  return student_id.trim().length > 0;
}

// ── startSession ─────────────────────────────────────────────────────────────
// Uses NAME as the identity key — same name = same persistent student record.
async function startSession(req, res) {
  const requestedName = req.query.name;
  const name =
    typeof requestedName === "string" && requestedName.trim()
      ? requestedName.trim()
      : "Student";

  const student = getOrCreateStudentByName(name);

  // Update session metadata
  if (!student.metrics) {
    student.metrics = {
      session_start_time: Date.now(),
      session_end_time: null,
      time_taken_per_question: {},
      question_timestamp: {},
      misconception_frequency: { F001: 0, F002: 0, F003: 0, F004: 0 },
    };
  } else {
    student.metrics.session_start_time = Date.now();
    student.metrics.session_end_time = null;
  }

  student.current = null;
  persist();

  res.json({
    student_id: student.id,
    name: student.name,
    mastery: student.mastery,
    questionStates: student.questionStates || {},
    lessonsViewed: student.lessonsViewed || [],
    metrics: student.metrics,
  });
}

// ── nextQuestion ──────────────────────────────────────────────────────────────
async function nextQuestion(req, res) {
  const { student_id, active_kc } = req.query;
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }

  const student = getOrCreateStudent(student_id);
  const answeredQuestionIds = student.history?.map((h) => h.question_id) || [];

  const question = chooseNextQuestion({
    mastery: student.mastery,
    answeredQuestionIds,
    questions,
    history: student.history || [],
    remediation: student.remediation,
    activeKC: active_kc || null,
  });

  student.current = {
    question_id: question.id,
    hintLevel: 0,
    hintsUsed: 0,
    attempts: 0,
    startedAt: Date.now(),
  };
  student.remediation = null;
  persist();

  res.json({
    question: {
      id: question.id,
      prompt: question.prompt,
      visual: question.visual,
      visual2: question.visual2 || null,
      type: question.type || "mcq",
      kc: question.kc,
      difficulty: question.difficulty,
      explanationCorrect: question.explanationCorrect,
      options: question.options,
      statement: question.statement || null,
    },
    hintLevel: 0,
  });
}

// ── guidedQuestion ────────────────────────────────────────────────────────────
// Returns the easiest unanswered question for a KC to use in guided practice.
async function guidedQuestion(req, res) {
  const { kc } = req.query;
  if (!kc) return res.status(400).json({ error: "Missing kc" });

  const kcQuestions = questions.filter((q) => q.kc === kc);
  // Pick easiest (difficulty 1) first, then 2, then 3
  const sorted = [...kcQuestions].sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
  const q = sorted[0];
  if (!q) return res.status(404).json({ error: "No questions found for kc" });

  res.json({
    question: {
      id: q.id,
      prompt: q.prompt,
      visual: q.visual || null,
      visual2: q.visual2 || null,
      type: q.type || "mcq",
      kc: q.kc,
      difficulty: q.difficulty,
      options: q.options || null,
      hints: q.hints || [],
      statement: q.statement || null,
      explanationCorrect: q.explanationCorrect,
    },
  });
}

// ── sessionQueue ──────────────────────────────────────────────────────────────
// Returns 8 adaptively-selected questions for a student's KC session.
async function getSessionQueue(req, res) {
  const { student_id, kc } = req.query;
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }
  if (!kc) return res.status(400).json({ error: "Missing kc" });

  const student = getOrCreateStudent(student_id);

  const queue = buildSessionQueue({
    kc,
    allQuestions: questions,
    history: student.history || [],
    mastery: student.mastery,
    metrics: student.metrics || {},
  });

  res.json({
    queue: queue.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      visual: q.visual || null,
      visual2: q.visual2 || null,
      type: q.type || "mcq",
      kc: q.kc,
      difficulty: q.difficulty,
      options: q.options || null,
      statement: q.statement || null,
    })),
  });
}

// ── kcSequentialNext ──────────────────────────────────────────────────────────
// One question at a time per KC: adaptive pick after each correct answer; rounds of 8.
async function getKcSequentialNext(req, res) {
  const { student_id, kc } = req.query;
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }
  if (!kc || typeof kc !== "string") {
    return res.status(400).json({ error: "Missing kc" });
  }

  const student = getOrCreateStudent(student_id);
  const round = ensureKcRoundState(student, kc);

  let newRound = false;
  if (round.completedCorrectIds.length >= KC_SEQUENTIAL_ROUND_SIZE) {
    newRound = true;
    round.completedCorrectIds = [];
  }

  const remediation =
    student.remediation && student.remediation.kc === kc ? student.remediation : null;

  const question = chooseNextQuestion({
    mastery: student.mastery,
    answeredQuestionIds: [],
    questions,
    history: student.history || [],
    remediation,
    activeKC: kc,
    poolExcludeIds: round.completedCorrectIds,
  });

  if (!question) {
    return res.status(404).json({ error: "No questions found for this KC" });
  }

  student.current = {
    question_id: question.id,
    hintLevel: 0,
    hintsUsed: 0,
    attempts: 0,
    startedAt: Date.now(),
  };
  student.remediation = null;
  persist();

  res.json({
    question: {
      id: question.id,
      prompt: question.prompt,
      visual: question.visual,
      visual2: question.visual2 || null,
      type: question.type || "mcq",
      kc: question.kc,
      difficulty: question.difficulty,
      explanationCorrect: question.explanationCorrect,
      options: question.options,
      statement: question.statement || null,
    },
    hintLevel: 0,
    progress: {
      number: round.completedCorrectIds.length + 1,
      total: KC_SEQUENTIAL_ROUND_SIZE,
      completedCorrectInRound: round.completedCorrectIds.length,
    },
    meta: { newRound },
  });
}

function evaluateQuestionAnswer(question, normalized) {
  const type = question.type || "mcq";
  if (type === "fill_blank") {
    return normalized.toLowerCase() === String(question.correct_text || "").trim().toLowerCase();
  }
  if (type === "true_false") {
    const target = String(Boolean(question.correct_boolean));
    return normalized === target;
  }
  if (type === "multi_select") {
    const given = Array.isArray(normalized) ? normalized : [normalized];
    const expected = (question.correct_options || []).map((x) => String(x)).sort();
    if (given.length !== expected.length) return false;
    return expected.every((v, i) => given.sort()[i] === v);
  }
  return normalized === String(question.correct_option);
}

function recentKcAccuracy(history, kc) {
  const recent = (history || []).filter((h) => h.kc === kc).slice(-5);
  if (!recent.length) return 0.5;
  return recent.filter((h) => h.correct).length / recent.length;
}

function recommendationFromMastery(mastery) {
  const entries = Object.entries(mastery || {});
  if (!entries.length) return null;
  const weakest = entries.reduce((w, e) => (e[1] < w[1] ? e : w), entries[0]);
  return `Focus more on ${weakest[0]} with guided hints and visual practice.`;
}

// ── submitAnswer ──────────────────────────────────────────────────────────────
async function submitAnswer(req, res) {
  const { student_id, question_id, selected_option, time_taken, skip_kc_round } = req.body || {};
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }
  if (!question_id || typeof question_id !== "string") {
    return res.status(400).json({ error: "Missing question_id" });
  }

  const student = getOrCreateStudent(student_id);
  const question = questions.find((q) => q.id === question_id);
  if (!question) {
    return res.status(404).json({ error: "Unknown question_id" });
  }

  const normalized = normalizeSelectedOption(selected_option);
  const correct = evaluateQuestionAnswer(question, normalized);
  const attempts = (student.current?.attempts || 0) + 1;
  if (student.current) student.current.attempts = attempts;

  const { code, misconceptionLabel } = detectMisconception({
    question,
    selectedOption: Array.isArray(normalized) ? normalized.join("|") : normalized,
    isCorrect: correct,
  });

  const hintsUsed = student.current?.hintsUsed || 0;
  const recentAccuracy = recentKcAccuracy(student.history || [], question.kc);
  const previousMastery = student.mastery?.[question.kc] ?? 0;
  const updated_mastery = updateMastery({
    mastery: student.mastery,
    kc: question.kc,
    correct,
    difficulty: question.difficulty,
    hintsUsed,
    attempts,
    recentAccuracy,
  });
  student.mastery = updated_mastery;
  const masteryDelta = (student.mastery?.[question.kc] ?? 0) - previousMastery;

  const explanation =
    correct
      ? question.explanationCorrect
      : question.explanationsByMisconception[code]?.text || question.explanationIncorrectFallback;

  const now = Date.now();
  if (!student.metrics)
    student.metrics = {
      session_start_time: now,
      session_end_time: null,
      time_taken_per_question: {},
      question_timestamp: {},
      misconception_frequency: { F001: 0, F002: 0, F003: 0, F004: 0 },
    };

  // Store time taken
  if (typeof time_taken === "number" && time_taken > 0) {
    student.metrics.time_taken_per_question[question_id] = time_taken;
  } else if (student.current?.startedAt) {
    student.metrics.time_taken_per_question[question_id] = now - student.current.startedAt;
  }
  student.metrics.question_timestamp[question_id] = now;

  if (!correct && code) {
    const freq = student.metrics.misconception_frequency || {};
    freq[code] = (freq[code] || 0) + 1;
    student.metrics.misconception_frequency = freq;
  }

  student.history = student.history || [];
  student.history.push({
    timestamp: now,
    question_id: question.id,
    kc: question.kc,
    selected_option: normalized,
    correct,
    misconception: code || null,
    hints_used: hintsUsed,
    attempts,
    updated_mastery,
    time_taken: student.metrics.time_taken_per_question[question_id] || null,
  });

  if (!student.questionStates) student.questionStates = {};
  student.questionStates[question_id] = correct ? "correct" : "incorrect";

  if (student.current?.question_id === question_id) {
    student.current.hintLevel = 0;
    student.current.hintsUsed = 0;
    student.current.attempts = 0;
  }

  // Remediation trigger
  let remediation = null;
  if (!correct && code) {
    const recentSame = student.history
      .slice(-5)
      .filter((h) => h.kc === question.kc && h.misconception === code).length;
    if (recentSame >= 2) {
      remediation = {
        kc: question.kc,
        code,
        message: `We noticed repeated ${code}. Let's do a quick correction cycle.`,
        visualCorrection: question.visual || null,
        targetedExplanation:
          question.explanationsByMisconception?.[code]?.text ||
          "Use the hint ladder and compare numerator/denominator carefully.",
      };
      student.remediation = remediation;
    }
  }

  if (correct && question.kc && !skip_kc_round) {
    const round = ensureKcRoundState(student, question.kc);
    if (!round.completedCorrectIds.includes(question_id)) {
      round.completedCorrectIds.push(question_id);
    }
  }

  persist();

  // Response-time feedback string
  const timeTakenMs =
    typeof time_taken === "number" && time_taken > 0
      ? time_taken
      : student.metrics.time_taken_per_question[question_id];
  let responseTimeFeedback = null;
  if (typeof timeTakenMs === "number") {
    const secs = Math.round(timeTakenMs / 1000);
    if (secs < 15 && correct) responseTimeFeedback = `Great speed — answered in ${secs}s!`;
    else if (secs > 45) responseTimeFeedback = `Took ${secs}s — try to work a bit faster next time.`;
    else responseTimeFeedback = `Answered in ${secs}s.`;
  }

  res.json({
    correct,
    misconception: code || null,
    updated_mastery,
    remediation,
    responseTimeFeedback,
    feedback: {
      message: correct ? question.feedbackCorrect : question.feedbackIncorrect,
      explanation,
      misconceptionLabel: code ? misconceptionLabel : null,
      outcomeSummary: correct
        ? "You applied the concept correctly. This strengthens your mastery on this KC."
        : "Your answer indicates a gap in the current concept, so the tutor will adapt support.",
      strategyTip: correct
        ? "Try to explain why your answer is correct before moving on."
        : "Use the hint ladder and compare part-to-whole carefully before your next attempt.",
      nextStep: correct
        ? "Use Next question to continue — difficulty adapts from your recent answers."
        : "Try again, or use a hint before you answer again.",
      masteryImpact: `Mastery change on ${question.kc}: ${masteryDelta >= 0 ? "+" : ""}${masteryDelta}`,
    },
  });
}

// ── getHint ───────────────────────────────────────────────────────────────────
async function getHint(req, res) {
  const { student_id, question_id } = req.query;
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }
  if (!question_id || typeof question_id !== "string") {
    return res.status(400).json({ error: "Missing question_id" });
  }

  const student = getOrCreateStudent(student_id);
  const question = questions.find((q) => q.id === question_id);
  if (!question) return res.status(404).json({ error: "Unknown question_id" });

  if (!student.current || student.current.question_id !== question_id) {
    student.current = { question_id, hintLevel: 0, hintsUsed: 0, attempts: 0, startedAt: Date.now() };
  }

  const maxHints = (question.hints || []).length;
  const nextLevel = Math.min(maxHints, (student.current.hintLevel || 0) + 1);
  student.current.hintLevel = nextLevel;
  student.current.hintsUsed = (student.current.hintsUsed || 0) + 1;

  const hintText = question.hints[nextLevel - 1] || "";
  persist();

  res.json({ question_id, hintLevel: nextLevel, hintText, maxHints });
}

// ── getProgress ───────────────────────────────────────────────────────────────
async function getProgress(req, res) {
  const { student_id } = req.query;
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }

  const student = getOrCreateStudent(student_id);
  const history = student.history || [];
  const strongAreas = Object.entries(student.mastery || {})
    .filter(([, value]) => value >= 75)
    .map(([kc]) => kc);
  const weakAreas = Object.entries(student.mastery || {})
    .filter(([, value]) => value < 40)
    .map(([kc]) => kc);

  const chart = ALL_KCS.map((kc) => {
    const kcHistory = history.filter((h) => h.kc === kc);
    const correct = kcHistory.filter((h) => h.correct).length;
    const masteryVal = student.mastery?.[kc] || 0;
    const accuracyPct = kcHistory.length ? Math.round((correct / kcHistory.length) * 100) : 0;
    const avgProgressScore = kcHistory.length
      ? Math.round((masteryVal + accuracyPct) / 2)
      : masteryVal;
    return {
      kc,
      mastery: masteryVal,
      attempts: kcHistory.length,
      accuracy: accuracyPct,
      avgProgressScore,
      hints: kcHistory.reduce((s, h) => s + (h.hints_used || 0), 0),
    };
  });

  res.json({
    student_id: student.id,
    name: student.name,
    mastery: student.mastery,
    historyCount: history.length,
    strongAreas,
    weakAreas,
    recommendation: recommendationFromMastery(student.mastery),
    chart,
    questionStates: student.questionStates || {},
    lessonsViewed: student.lessonsViewed || [],
    metrics: student.metrics || {},
  });
}

// ── getQuestions ──────────────────────────────────────────────────────────────
async function getQuestions(req, res) {
  const payload = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    visual: question.visual,
    visual2: question.visual2 || null,
    type: question.type || "mcq",
    kc: question.kc,
    difficulty: question.difficulty,
    options: question.options || null,
    statement: question.statement || null,
  }));
  res.json({ questions: payload });
}

// ── getLessons ────────────────────────────────────────────────────────────────
async function getLessons(req, res) {
  res.json({ lessons });
}

// ── saveQuestionStates ────────────────────────────────────────────────────────
async function saveQuestionStates(req, res) {
  const { student_id, questionStates } = req.body || {};
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }

  const student = getOrCreateStudent(student_id);
  if (!student.questionStates) student.questionStates = {};

  if (questionStates && typeof questionStates === "object") {
    for (const [qid, state] of Object.entries(questionStates)) {
      student.questionStates[qid] = state;
    }
  }

  persist();
  res.json({ ok: true, questionStates: student.questionStates });
}

// ── markLessonViewed ─────────────────────────────────────────────────────────
async function markLessonViewed(req, res) {
  const { student_id, kc } = req.body || {};
  if (!validateStudentId(student_id)) {
    return res.status(400).json({ error: "Missing or invalid student_id" });
  }

  const student = getOrCreateStudent(student_id);
  if (!student.lessonsViewed) student.lessonsViewed = [];
  if (!student.lessonsViewed.includes(kc)) {
    student.lessonsViewed.push(kc);
  }

  persist();
  res.json({ ok: true, lessonsViewed: student.lessonsViewed });
}

module.exports = {
  startSession,
  nextQuestion,
  guidedQuestion,
  getSessionQueue,
  getKcSequentialNext,
  submitAnswer,
  getHint,
  getProgress,
  getQuestions,
  getLessons,
  saveQuestionStates,
  markLessonViewed,
};
