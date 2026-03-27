import React from "react";
import { useNavigate } from "react-router-dom";
import useTutorStore from "../store/useTutorStore.js";
import QuestionCard from "../components/QuestionCard.jsx";
import HintBox from "../components/HintBox.jsx";
import { motion, AnimatePresence } from "framer-motion";

export default function Tutor() {
  const navigate = useNavigate();
  const name = useTutorStore((s) => s.name);
  const currentQuestion = useTutorStore((s) => s.currentQuestion);
  const mastery = useTutorStore((s) => s.mastery);
  const hintLevel = useTutorStore((s) => s.hintLevel);
  const hintTexts = useTutorStore((s) => s.hintTexts);
  const feedback = useTutorStore((s) => s.feedback);
  const status = useTutorStore((s) => s.status);
  const error = useTutorStore((s) => s.error);

  const fetchNextQuestion = useTutorStore((s) => s.fetchNextQuestion);
  const fetchQuestionsList = useTutorStore((s) => s.fetchQuestionsList);
  const submitAnswerForQuestion = useTutorStore((s) => s.submitAnswerForQuestion);
  const requestHintForQuestion = useTutorStore((s) => s.requestHintForQuestion);
  const setCurrentQuestion = useTutorStore((s) => s.setCurrentQuestion);

  const [questionOrder, setQuestionOrder] = React.useState([]);
  const [questionMap, setQuestionMap] = React.useState({});
  const [activeQuestionId, setActiveQuestionId] = React.useState(null);
  const [selectedByQuestion, setSelectedByQuestion] = React.useState({});
  const [attemptStateByQuestion, setAttemptStateByQuestion] = React.useState({});
  const [feedbackByQuestion, setFeedbackByQuestion] = React.useState({});
  const [hintsByQuestion, setHintsByQuestion] = React.useState({});
  const [hintLoading, setHintLoading] = React.useState(false);
  const [hintError, setHintError] = React.useState(null);

  const activeQuestion = activeQuestionId ? questionMap[activeQuestionId] : currentQuestion;
  const activeFeedback = activeQuestionId ? feedbackByQuestion[activeQuestionId] || null : feedback;
  const activeHintState = activeQuestionId ? hintsByQuestion[activeQuestionId] || { hintLevel: 1, hintTexts: [] } : { hintLevel, hintTexts };
  const activeAttemptState = activeQuestionId ? attemptStateByQuestion[activeQuestionId] || { attempted: false } : { attempted: false };

  const registerQuestion = React.useCallback((question, initialHintLevel = 1) => {
    if (!question?.id) return;
    setQuestionMap((prev) => ({ ...prev, [question.id]: question }));
    setQuestionOrder((prev) => (prev.includes(question.id) ? prev : [...prev, question.id]));
    setHintsByQuestion((prev) => {
      if (prev[question.id]) return prev;
      return { ...prev, [question.id]: { hintLevel: initialHintLevel, hintTexts: [] } };
    });
    setAttemptStateByQuestion((prev) => {
      if (prev[question.id]) return prev;
      return { ...prev, [question.id]: { attempted: false, correct: null } };
    });
    setActiveQuestionId(question.id);
    setCurrentQuestion(question);
  }, [setCurrentQuestion]);

  const markCurrentAsSkippedIfUnattempted = React.useCallback(() => {
    if (!activeQuestionId) return;
    const state = attemptStateByQuestion[activeQuestionId] || {
      attempted: false,
      correct: null,
      skipped: false,
    };
    if (state.attempted || state.skipped) return;

    setAttemptStateByQuestion((prev) => ({
      ...prev,
      [activeQuestionId]: {
        ...(prev[activeQuestionId] || { attempted: false, correct: null }),
        skipped: true,
      },
    }));
  }, [activeQuestionId, attemptStateByQuestion]);

  const registerQuestionList = React.useCallback((questions) => {
    const qMap = {};
    const qOrder = [];
    for (const q of questions || []) {
      if (!q?.id) continue;
      qMap[q.id] = q;
      qOrder.push(q.id);
    }
    setQuestionMap(qMap);
    setQuestionOrder(qOrder);
    setHintsByQuestion((prev) => {
      const next = { ...prev };
      for (const id of qOrder) {
        if (!next[id]) next[id] = { hintLevel: 1, hintTexts: [] };
      }
      return next;
    });
    setAttemptStateByQuestion((prev) => {
      const next = { ...prev };
      for (const id of qOrder) {
        if (!next[id]) next[id] = { attempted: false, correct: null, skipped: false };
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    Promise.all([fetchQuestionsList(), fetchNextQuestion()]).then(([allQuestions]) => {
      registerQuestionList(allQuestions);
      const q = useTutorStore.getState().currentQuestion;
      if (q?.id && allQuestions?.some((x) => x.id === q.id)) {
        registerQuestion(q, useTutorStore.getState().hintLevel || 1);
      } else if (allQuestions?.length) {
        registerQuestion(allQuestions[0], 1);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kc = activeQuestion?.kc;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-indigo-700">Fractions Tutor</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {kc ? `Working on ${kc}` : "Adaptive practice"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              {name || "Student"}
            </div>
            <motion.button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/profile")}
            >
              View Profile
            </motion.button>
            <motion.button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (!questionOrder.length) return;
                markCurrentAsSkippedIfUnattempted();
                const currentIdx = Math.max(0, questionOrder.indexOf(activeQuestionId));
                const nextIdx = (currentIdx + 1) % questionOrder.length;
                const nextId = questionOrder[nextIdx];
                const nextQuestion = questionMap[nextId];
                setActiveQuestionId(nextId);
                setCurrentQuestion(nextQuestion);
              }}
              disabled={status === "loading"}
            >
              Next Question
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
              <div className="mb-3 text-sm font-semibold text-slate-800">Question Navigator</div>
              <div className="overflow-x-auto">
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateRows: "repeat(10, minmax(0, 1fr))",
                    gridAutoFlow: "column",
                    gridAutoColumns: "minmax(84px, 1fr)",
                  }}
                >
                  {questionOrder.map((qid, idx) => {
                  const q = questionMap[qid];
                  const state = attemptStateByQuestion[qid] || { attempted: false, correct: null, skipped: false };
                  const isActive = qid === activeQuestionId;
                  const statusClasses = !state.attempted && state.skipped
                    ? "border-orange-300 bg-orange-100 text-orange-900"
                    : !state.attempted
                      ? "border-slate-200 bg-white text-slate-900"
                      : state.correct
                        ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                        : "border-rose-300 bg-rose-100 text-rose-900";
                  return (
                    <button
                      key={qid}
                      type="button"
                      onClick={() => {
                        if (qid !== activeQuestionId) {
                          markCurrentAsSkippedIfUnattempted();
                        }
                        setActiveQuestionId(qid);
                        setCurrentQuestion(q);
                      }}
                      className={[
                        "w-full rounded-xl border px-2 py-2 text-left transition",
                        statusClasses,
                        isActive ? "ring-2 ring-indigo-400" : "",
                      ].join(" ")}
                    >
                      <div className="text-xs font-bold">Q{idx + 1}</div>
                      <div className="text-[11px] font-semibold">{q?.kc}</div>
                      <div className="mt-1 text-[11px] font-medium">
                        {!state.attempted && state.skipped ? (
                          <span>Skipped</span>
                        ) : !state.attempted ? (
                          <span>Unvisited</span>
                        ) : state.correct ? (
                          <span>Correct</span>
                        ) : (
                          <span>Wrong</span>
                        )}
                      </div>
                    </button>
                  );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <QuestionCard
              question={activeQuestion}
              disabled={status === "loading" || Boolean(activeAttemptState.attempted)}
              selected_option={selectedByQuestion[activeQuestionId] ?? null}
              onSelectOption={async (opt) => {
                if (!activeQuestionId) return;
                if (activeAttemptState.attempted) return;
                setSelectedByQuestion((prev) => ({ ...prev, [activeQuestionId]: opt }));
                try {
                  const data = await submitAnswerForQuestion(activeQuestionId, opt);
                  setAttemptStateByQuestion((prev) => ({
                    ...prev,
                    [activeQuestionId]: { attempted: true, correct: data.correct, skipped: false },
                  }));
                  setFeedbackByQuestion((prev) => ({
                    ...prev,
                    [activeQuestionId]: {
                      ...data.feedback,
                      correct: data.correct,
                      misconception: data.misconception,
                      remediation: data.remediation || null,
                    },
                  }));
                } catch (e) {
                  console.error(e);
                }
              }}
            />

            <AnimatePresence mode="wait">
              {activeFeedback ? (
                <motion.div
                  key={`${activeQuestionId}-${activeFeedback?.message}`}
                  className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div
                    className={[
                      "font-bold",
                      activeFeedback.correct ? "text-emerald-700" : "text-rose-700",
                    ].join(" ")}
                  >
                    {activeFeedback.correct ? "Correct!" : "Not quite."}
                  </div>

                  <div className="mt-2 text-sm text-slate-700">{activeFeedback.message}</div>

                  {activeFeedback.misconceptionLabel ? (
                    <div className="mt-2 text-xs font-semibold text-slate-700">
                      Misconception: {activeFeedback.misconceptionLabel}
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {activeFeedback.explanation}
                  </div>
                  <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
                    <div className="font-semibold">What this means</div>
                    <div className="mt-1">{activeFeedback.outcomeSummary || "Your attempt has been recorded and used to personalize next questions."}</div>
                    <div className="mt-2 font-semibold">What to do next</div>
                    <div className="mt-1">{activeFeedback.nextStep || "Use a hint and then try a similar problem."}</div>
                    <div className="mt-2 text-xs text-indigo-700">{activeFeedback.strategyTip || "Tip: verify denominator first, then numerator."}</div>
                    {activeFeedback.masteryImpact ? (
                      <div className="mt-2 text-xs font-semibold text-indigo-800">{activeFeedback.masteryImpact}</div>
                    ) : null}
                  </div>
                  {activeFeedback.remediation ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <div className="font-semibold">{activeFeedback.remediation.message}</div>
                      <div className="mt-1">{activeFeedback.remediation.targetedExplanation}</div>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <HintBox
              hintTexts={activeHintState.hintTexts}
              hintLevel={activeHintState.hintLevel}
              loading={hintLoading}
              error={hintError}
              onRequestHint={async () => {
                if (!activeQuestionId) return;
                setHintLoading(true);
                setHintError(null);
                try {
                  const data = await requestHintForQuestion(activeQuestionId);
                  setHintsByQuestion((prev) => {
                    const current = prev[activeQuestionId] || { hintLevel: 1, hintTexts: [] };
                    const nextTexts = [...current.hintTexts];
                    nextTexts[data.hintLevel - 1] = data.hintText;
                    return {
                      ...prev,
                      [activeQuestionId]: {
                        hintLevel: data.hintLevel,
                        hintTexts: nextTexts,
                      },
                    };
                  });
                } catch (e) {
                  setHintError(e.message || "Could not load hint.");
                } finally {
                  setHintLoading(false);
                }
              }}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Your KC Mastery</div>
              <div className="mt-3 space-y-2">
                {["KC1", "KC2", "KC3"].map((k) => {
                  const m = mastery?.[k] ?? 0;
                  const label = m < 40 ? "Beginner" : m < 75 ? "Developing" : "Proficient";
                  const pct = Math.max(0, Math.min(100, Math.round(m)));
                  return (
                    <div key={k} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800">{k}</div>
                        <div className="text-xs font-semibold text-slate-600">{label}</div>
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

