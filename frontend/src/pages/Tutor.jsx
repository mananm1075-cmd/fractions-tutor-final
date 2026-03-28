import React from "react";
import { useNavigate } from "react-router-dom";
import useTutorStore from "../store/useTutorStore.js";
import QuestionCard from "../components/QuestionCard.jsx";
import HintBox from "../components/HintBox.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── KC Tabs ───────────────────────────────────────────────────────────────────
function KCTabs({ activeKC, allKCs, kcTitles, onSelect }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1">
      {allKCs.map((kc) => (
        <button
          key={kc}
          type="button"
          onClick={() => onSelect(kc)}
          className={[
            "rounded-lg border px-2 py-1 text-xs font-semibold transition",
            kc === activeKC
              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          {kc}
        </button>
      ))}
    </div>
  );
}

function ProgressiveQuestionRail({ currentNumber, total }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-700 mb-2">
        {total} questions this round — only the current one is shown; the rest unlock in order.
      </div>
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const done = n < currentNumber;
          const current = n === currentNumber;
          const locked = n > currentNumber;
          return (
            <div
              key={n}
              title={
                locked
                  ? `Question ${n} — locked until you answer the previous one correctly`
                  : current
                    ? `Question ${n} — current`
                    : `Question ${n} — completed`
              }
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border-2 transition",
                locked ? "border-slate-200 bg-slate-100 text-slate-400" : "",
                current ? "border-indigo-500 bg-indigo-100 text-indigo-800 ring-2 ring-indigo-300 scale-110" : "",
                done ? "border-emerald-400 bg-emerald-100 text-emerald-800" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {done ? "✓" : locked ? "?" : n}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Teaching Phase: Step 1 — Concept Intro ────────────────────────────────────
function TeachIntro({ lesson, onNext }) {
  if (!lesson) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-500">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5">Step 1 of 3</span>
        <span>Concept Introduction</span>
      </div>
      <div className="mt-3 text-xl font-extrabold text-indigo-900">{lesson.title}</div>

      <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm text-slate-700 leading-relaxed border border-indigo-100">
        {lesson.explanation}
      </div>

      {lesson.keyRules && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
            Key Rules to Remember
          </div>
          <ul className="space-y-1">
            {lesson.keyRules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                <span className="mt-0.5 text-emerald-500 font-bold">✓</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
      >
        Next: See a Worked Example →
      </button>
    </motion.div>
  );
}

// ── Teaching Phase: Step 2 — Worked Example ───────────────────────────────────
function TeachExample({ lesson, onNext }) {
  if (!lesson) return null;
  const we = lesson.workedExample;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-500">
        <span className="rounded-full bg-violet-100 px-2 py-0.5">Step 2 of 3</span>
        <span>Worked Example</span>
      </div>
      <div className="mt-3 text-xl font-extrabold text-violet-900">{lesson.title}</div>

      {we ? (
        <>
          <div className="mt-4 rounded-xl bg-violet-50 border border-violet-100 p-4">
            <div className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">Problem</div>
            <div className="text-sm font-semibold text-slate-800">{we.problem}</div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Solution Steps</div>
            {(we.steps || []).map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{step}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Answer</div>
            <div className="text-sm font-semibold text-emerald-900">{we.answer}</div>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{lesson.example}</div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition"
      >
        Next: Try Guided Practice →
      </button>
    </motion.div>
  );
}

// ── Teaching Phase: Step 3 — Guided Practice ──────────────────────────────────
function TeachGuided({ lesson, studentId, kc, onComplete }) {
  const [gQuestion, setGQuestion] = React.useState(null);
  const [gSelected, setGSelected] = React.useState(null);
  const [gFeedback, setGFeedback] = React.useState(null);
  const [gAttempted, setGAttempted] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [questionStartedAt, setQuestionStartedAt] = React.useState(null);
  const [elapsedSec, setElapsedSec] = React.useState(0);

  React.useEffect(() => {
    setLoading(true);
    api.get(`/api/guided-question?kc=${encodeURIComponent(kc)}`)
      .then((d) => { setGQuestion(d.question); setLoading(false); })
      .catch(() => setLoading(false));
  }, [kc]);

  React.useEffect(() => {
    if (!gQuestion || gAttempted) {
      setQuestionStartedAt(null);
      setElapsedSec(0);
      return;
    }
    const t0 = Date.now();
    setQuestionStartedAt(t0);
    setElapsedSec(0);
    const iv = setInterval(() => setElapsedSec(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [gQuestion, gAttempted]);

  async function handleSelect(opt) {
    if (gAttempted) return;
    setGSelected(opt);
    const timeTaken =
      questionStartedAt != null ? Date.now() - questionStartedAt : null;
    try {
      const data = await api.post("/api/submit-answer", {
        student_id: studentId,
        question_id: gQuestion.id,
        selected_option: opt,
        time_taken: timeTaken,
        skip_kc_round: true,
      });
      setGFeedback(data);
      setGAttempted(true);
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Loading guided practice question…</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-600">
        <span className="rounded-full bg-amber-100 px-2 py-0.5">Step 3 of 3</span>
        <span>Guided Practice</span>
      </div>
      <div className="mt-1 text-sm text-slate-500">
        All hints are visible. Take your time and try this question.
      </div>
      {!gAttempted && gQuestion && (
        <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm font-bold text-slate-700 tabular-nums">
          ⏱ {formatTime(elapsedSec)}
        </div>
      )}

      {gQuestion && (
        <>
          {/* Show all hints pre-revealed */}
          {(gQuestion.hints || []).length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-1">
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Hints</div>
              {gQuestion.hints.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="text-amber-500 font-bold">💡</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <QuestionCard
              question={gQuestion}
              disabled={gAttempted}
              selected_option={gSelected}
              onSelectOption={handleSelect}
            />
          </div>

          {gFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={[
                "mt-4 rounded-xl border p-4",
                gFeedback.correct
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50",
              ].join(" ")}
            >
              <div className={["font-bold text-sm", gFeedback.correct ? "text-emerald-700" : "text-rose-700"].join(" ")}>
                {gFeedback.correct ? "✓ Correct!" : "✗ Not quite — but that's okay!"}
              </div>
              <div className="mt-1 text-sm text-slate-700">{gFeedback.feedback?.explanation}</div>

              <button
                type="button"
                onClick={onComplete}
                className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition"
              >
                Begin Independent Learning →
              </button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Main Tutor Component ──────────────────────────────────────────────────────
export default function Tutor() {
  const navigate = useNavigate();

  const name = useTutorStore((s) => s.name);
  const student_id = useTutorStore((s) => s.student_id);
  const mastery = useTutorStore((s) => s.mastery);
  const status = useTutorStore((s) => s.status);
  const error = useTutorStore((s) => s.error);
  const activeKC = useTutorStore((s) => s.activeKC);
  const lessons = useTutorStore((s) => s.lessons);
  const lessonsViewed = useTutorStore((s) => s.lessonsViewed);
  const KC_TITLES = useTutorStore((s) => s.KC_TITLES);
  const ALL_KCS = useTutorStore((s) => s.ALL_KCS);

  const submitAnswerForQuestion = useTutorStore((s) => s.submitAnswerForQuestion);
  const requestHintForQuestion = useTutorStore((s) => s.requestHintForQuestion);
  const setCurrentQuestion = useTutorStore((s) => s.setCurrentQuestion);
  const setActiveKC = useTutorStore((s) => s.setActiveKC);
  const setLessonPhase = useTutorStore((s) => s.setLessonPhase);
  const markLessonViewed = useTutorStore((s) => s.markLessonViewed);
  const fetchProgress = useTutorStore((s) => s.fetchProgress);
  const fetchLessons = useTutorStore((s) => s.fetchLessons);

  const [teachStep, setTeachStep] = React.useState(() =>
    useTutorStore.getState().lessonsViewed.includes("KC1") ? null : "intro"
  );

  const [seqLoading, setSeqLoading] = React.useState(false);
  const [seqError, setSeqError] = React.useState(null);
  const [seqQuestion, setSeqQuestion] = React.useState(null);
  const [seqProgress, setSeqProgress] = React.useState(null);
  const [seqMeta, setSeqMeta] = React.useState(null);
  /** null = can answer; 'wrong' = show retry; 'correct' = show next */
  const [seqOutcome, setSeqOutcome] = React.useState(null);
  const [seqFeedback, setSeqFeedback] = React.useState(null);
  const [seqSelected, setSeqSelected] = React.useState(null);

  const [questionStartTime, setQuestionStartTime] = React.useState(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [frozenSeconds, setFrozenSeconds] = React.useState(null);

  const [hintLevel, setHintLevel] = React.useState(0);
  const [hintTexts, setHintTexts] = React.useState([]);
  const [hintLoading, setHintLoading] = React.useState(false);
  const [hintError, setHintError] = React.useState(null);

  const seqQuestionId = seqQuestion?.id;
  const inTeachingPhase = teachStep !== null;

  const loadSequentialQuestion = React.useCallback(async () => {
    if (!student_id || !activeKC) return;
    setSeqLoading(true);
    setSeqError(null);
    try {
      const d = await api.get(
        `/api/kc-sequential-next?student_id=${encodeURIComponent(student_id)}&kc=${encodeURIComponent(activeKC)}`
      );
      setSeqQuestion(d.question);
      setSeqProgress(d.progress);
      setSeqMeta(d.meta || null);
      setSeqOutcome(null);
      setSeqFeedback(null);
      setSeqSelected(null);
      setHintLevel(0);
      setHintTexts([]);
      setCurrentQuestion(d.question);
      setQuestionStartTime(Date.now());
      setFrozenSeconds(null);
    } catch (e) {
      setSeqError(e.message || "Could not load question.");
      setSeqQuestion(null);
    } finally {
      setSeqLoading(false);
    }
  }, [student_id, activeKC, setCurrentQuestion]);

  React.useEffect(() => {
    if (student_id) fetchProgress();
  }, [student_id, fetchProgress]);

  React.useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const prevKCRef = React.useRef(activeKC);
  React.useEffect(() => {
    if (prevKCRef.current === activeKC) return;
    prevKCRef.current = activeKC;
    const isViewed = lessonsViewed.includes(activeKC);
    setTeachStep(isViewed ? null : "intro");
  }, [activeKC, lessonsViewed]);

  React.useEffect(() => {
    if (inTeachingPhase || !student_id) return;
    loadSequentialQuestion();
  }, [inTeachingPhase, student_id, activeKC, loadSequentialQuestion]);

  React.useEffect(() => {
    if (!questionStartTime || seqOutcome !== null || inTeachingPhase) {
      return;
    }
    setElapsedSeconds(0);
    const start = questionStartTime;
    const iv = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [questionStartTime, seqOutcome, inTeachingPhase]);

  const kc = activeKC;

  const roundPct = seqProgress
    ? Math.round((seqProgress.completedCorrectInRound / Math.max(1, seqProgress.total)) * 100)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-indigo-700">Fractions Tutor</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {KC_TITLES[activeKC] || (kc ? `Working on ${kc}` : "Adaptive practice")}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              {name || "Student"}
            </div>
            {!inTeachingPhase && (
              <div
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-mono font-bold tabular-nums transition-colors",
                  seqOutcome !== null
                    ? "border-slate-200 bg-slate-50 text-slate-600"
                    : elapsedSeconds > 45
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : elapsedSeconds > 20
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
                title="Time for this question only"
              >
                ⏱ {formatTime(frozenSeconds != null ? frozenSeconds : elapsedSeconds)}
              </div>
            )}
            <motion.button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/profile")}
            >
              View Profile
            </motion.button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error.message || String(error)}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-slate-800">Your path</div>
              <KCTabs
                activeKC={activeKC}
                allKCs={ALL_KCS}
                kcTitles={KC_TITLES}
                onSelect={(nextKc) => setActiveKC(nextKc)}
              />

              {!inTeachingPhase && seqProgress && (
                <>
                  <div className="mb-2 text-center text-sm font-bold text-slate-800">
                    Question {seqProgress.number} of {seqProgress.total}
                  </div>
                  <ProgressiveQuestionRail
                    currentNumber={seqProgress.number}
                    total={seqProgress.total}
                  />
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Round progress (correct so far)</span>
                      <span>{roundPct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${roundPct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </>
              )}

              {inTeachingPhase && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 font-semibold">
                  Complete the lesson first — then you&apos;ll get 8 questions, one at a time.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {teachStep === "intro" && (
                <TeachIntro
                  key={`intro-${activeKC}`}
                  lesson={lessons[activeKC]}
                  onNext={() => setTeachStep("example")}
                />
              )}
              {teachStep === "example" && (
                <TeachExample
                  key={`example-${activeKC}`}
                  lesson={lessons[activeKC]}
                  onNext={() => setTeachStep("guided")}
                />
              )}
              {teachStep === "guided" && (
                <TeachGuided
                  key={`guided-${activeKC}`}
                  lesson={lessons[activeKC]}
                  studentId={student_id}
                  kc={activeKC}
                  onComplete={async () => {
                    await markLessonViewed(activeKC);
                    setLessonPhase("questions");
                    setTeachStep(null);
                  }}
                />
              )}

              {teachStep === null && (
                <motion.div
                  key={`practice-${activeKC}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {seqMeta?.newRound ? (
                    <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                      <span className="font-bold">New round.</span> The next 8 questions adapt to how you
                      answered before — faster, accurate work tends to raise difficulty.
                    </div>
                  ) : null}

                  {seqLoading && !seqQuestion ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                      Loading your question…
                    </div>
                  ) : null}

                  {seqError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      {seqError}
                      <button
                        type="button"
                        className="mt-2 block text-sm font-bold text-rose-900 underline"
                        onClick={() => loadSequentialQuestion()}
                      >
                        Retry
                      </button>
                    </div>
                  ) : null}

                  {seqQuestion ? (
                    <>
                      <QuestionCard
                        question={seqQuestion}
                        disabled={
                          status === "loading" ||
                          seqLoading ||
                          seqOutcome === "correct" ||
                          seqOutcome === "wrong"
                        }
                        selected_option={seqSelected}
                        onSelectOption={async (opt) => {
                          if (!seqQuestionId || seqOutcome !== null) return;
                          setSeqSelected(opt);
                          const timeTaken = questionStartTime ? Date.now() - questionStartTime : null;
                          try {
                            const data = await submitAnswerForQuestion(seqQuestionId, opt, timeTaken);
                            const secs =
                              typeof timeTaken === "number" && timeTaken > 0
                                ? Math.max(1, Math.round(timeTaken / 1000))
                                : elapsedSeconds;
                            setFrozenSeconds(secs);
                            setSeqOutcome(data.correct ? "correct" : "wrong");
                            setSeqFeedback({
                              ...data.feedback,
                              correct: data.correct,
                              misconception: data.misconception,
                              remediation: data.remediation || null,
                              responseTimeFeedback: data.responseTimeFeedback || null,
                            });
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                      />

                      <AnimatePresence mode="wait">
                        {seqFeedback && (
                          <motion.div
                            key={`fb-${seqQuestionId}`}
                            className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                          >
                            <div
                              className={[
                                "font-bold",
                                seqFeedback.correct ? "text-emerald-700" : "text-rose-700",
                              ].join(" ")}
                            >
                              {seqFeedback.correct ? "✓ Correct!" : "✗ Not quite."}
                            </div>

                            {seqFeedback.responseTimeFeedback && (
                              <div className="mt-1 text-xs font-semibold text-slate-500">
                                {seqFeedback.responseTimeFeedback}
                              </div>
                            )}

                            <div className="mt-2 text-sm text-slate-700">{seqFeedback.message}</div>

                            {seqFeedback.misconceptionLabel && (
                              <div className="mt-2 text-xs font-semibold text-slate-600">
                                Misconception: {seqFeedback.misconceptionLabel}
                              </div>
                            )}

                            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                              {seqFeedback.explanation}
                            </div>

                            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
                              <div className="font-semibold">What this means</div>
                              <div className="mt-1">
                                {seqFeedback.outcomeSummary || "Your attempt has been recorded."}
                              </div>
                              <div className="mt-2 font-semibold">What to do next</div>
                              <div className="mt-1">{seqFeedback.nextStep}</div>
                              <div className="mt-2 text-xs text-indigo-700">{seqFeedback.strategyTip}</div>
                              {seqFeedback.masteryImpact && (
                                <div className="mt-2 text-xs font-semibold text-indigo-800">
                                  {seqFeedback.masteryImpact}
                                </div>
                              )}
                            </div>

                            {seqFeedback.remediation && (
                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <div className="font-semibold">{seqFeedback.remediation.message}</div>
                                <div className="mt-1">{seqFeedback.remediation.targetedExplanation}</div>
                              </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {seqOutcome === "wrong" && (
                                <button
                                  type="button"
                                  className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900 transition"
                                  onClick={() => {
                                    setSeqOutcome(null);
                                    setSeqFeedback(null);
                                    setSeqSelected(null);
                                    setFrozenSeconds(null);
                                    setQuestionStartTime(Date.now());
                                    setHintLevel(0);
                                    setHintTexts([]);
                                  }}
                                >
                                  Try again
                                </button>
                              )}
                              {seqOutcome === "correct" && (
                                <button
                                  type="button"
                                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50"
                                  disabled={seqLoading}
                                  onClick={() => loadSequentialQuestion()}
                                >
                                  Next question →
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {teachStep === null && seqQuestionId && seqOutcome !== "correct" && (
              <HintBox
                hintTexts={hintTexts}
                hintLevel={hintLevel}
                loading={hintLoading}
                error={hintError}
                maxHints={3}
                onRequestHint={async () => {
                  if (!seqQuestionId || seqOutcome === "correct") return;
                  setHintLoading(true);
                  setHintError(null);
                  try {
                    const data = await requestHintForQuestion(seqQuestionId);
                    const level = data.hintLevel ?? 1;
                    const texts = [...hintTexts];
                    texts[level - 1] = data.hintText;
                    setHintLevel(level);
                    setHintTexts(texts);
                  } catch (e) {
                    setHintError(e.message || "Could not load hint.");
                  } finally {
                    setHintLoading(false);
                  }
                }}
              />
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Your KC Mastery</div>
              <div className="mt-3 space-y-2">
                {ALL_KCS.map((k) => {
                  const m = mastery?.[k] ?? 0;
                  const label = m < 40 ? "Beginner" : m < 75 ? "Developing" : "Proficient";
                  const pct = Math.max(0, Math.min(100, Math.round(m)));
                  return (
                    <div key={k} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-800">{k}</div>
                        <div className="text-xs font-semibold text-slate-500">{label}</div>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
