import { create } from "zustand";
import { api } from "../lib/api";

const ALL_KCS = ["KC1", "KC2", "KC3", "KC4", "KC5", "KC6", "KC7"];

const SESSION_STORAGE_KEY = "fractions-tutor-session";

function persistSessionToStorage(student_id, name) {
  if (typeof localStorage === "undefined" || !student_id) return;
  try {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ student_id, name: name || "Student", savedAt: Date.now() })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

const KC_TITLES = {
  KC1: "KC1: Parts of a Fraction",
  KC2: "KC2: Unit Fractions",
  KC3: "KC3: Visual Matching",
  KC4: "KC4: Number Line",
  KC5: "KC5: Recognizing Equivalence",
  KC6: "KC6: Generating Equivalence",
  KC7: "KC7: Compare Same Denominator",
};

const emptyQuestion = null;

const useTutorStore = create((set, get) => ({
  student_id: null,
  name: "",

  // All KC mastery starts at 0 for new students
  mastery: Object.fromEntries(ALL_KCS.map((k) => [k, 0])),
  profile: null,

  currentQuestion: emptyQuestion,

  hintLevel: 0,
  hintTexts: [],

  feedback: null,

  status: "idle",
  error: null,

  activeKC: "KC1",
  lessonPhase: "lesson",
  lessons: {},
  lessonsViewed: [],

  questionStates: {},
  allQuestions: [],

  // Session queue: 8 adaptively-selected questions for the current KC
  sessionQueue: [],

  KC_TITLES,
  ALL_KCS,

  // ── startSession ──────────────────────────────────────────────────────────
  startSession: async (name) => {
    set({ status: "loading", error: null });
    const safeName = encodeURIComponent((name || "Student").trim());
    const data = await api.get(`/api/start-session?name=${safeName}`);

    set({
      student_id: data.student_id,
      name: data.name || name || "Student",
      mastery: data.mastery,
      questionStates: data.questionStates || {},
      lessonsViewed: data.lessonsViewed || [],
      status: "ready",
      // Reset session-local state for a clean start
      sessionQueue: [],
      activeKC: "KC1",
      lessonPhase: (data.lessonsViewed || []).includes("KC1") ? "questions" : "lesson",
    });
    persistSessionToStorage(data.student_id, data.name || name || "Student");
  },

  /** Resume last student from localStorage; server db holds mastery/history by student id. */
  restoreSessionFromStorage: async () => {
    if (typeof localStorage === "undefined") return false;
    let parsed;
    try {
      parsed = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    } catch {
      return false;
    }
    if (!parsed?.student_id) return false;

    set({ status: "loading", error: null });
    try {
      const data = await api.get(
        `/api/progress?student_id=${encodeURIComponent(parsed.student_id)}`
      );
      const lessonsViewed = data.lessonsViewed || [];
      set({
        student_id: data.student_id,
        name: data.name || parsed.name || "Student",
        mastery: data.mastery,
        profile: data,
        questionStates: data.questionStates || {},
        lessonsViewed,
        status: "ready",
        sessionQueue: [],
        activeKC: "KC1",
        lessonPhase: lessonsViewed.includes("KC1") ? "questions" : "lesson",
      });
      persistSessionToStorage(data.student_id, data.name || parsed.name || "Student");
      return true;
    } catch {
      set({ status: "idle", error: null });
      return false;
    }
  },

  getSavedSessionPreview: () => {
    if (typeof localStorage === "undefined") return null;
    try {
      const parsed = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
      if (!parsed?.student_id) return null;
      return { name: parsed.name || "Student", student_id: parsed.student_id };
    } catch {
      return null;
    }
  },

  fetchProgress: async () => {
    const { student_id } = get();
    if (!student_id) return;
    set({ status: "loading", error: null });
    const data = await api.get(`/api/progress?student_id=${encodeURIComponent(student_id)}`);
    set({
      mastery: data.mastery,
      profile: data,
      name: data.name || get().name,
      questionStates: data.questionStates || get().questionStates,
      lessonsViewed: data.lessonsViewed ?? get().lessonsViewed,
      status: "ready",
    });
    const sid = get().student_id;
    if (sid) persistSessionToStorage(sid, data.name || get().name);
  },

  fetchQuestionsList: async () => {
    const data = await api.get("/api/questions");
    const qs = data.questions || [];
    set({ allQuestions: qs });
    return qs;
  },

  fetchLessons: async () => {
    try {
      const data = await api.get("/api/lessons");
      set({ lessons: data.lessons || {} });
      return data.lessons || {};
    } catch {
      return {};
    }
  },

  // Fetch 8 adaptive questions for a KC session
  fetchSessionQueue: async (kc) => {
    const { student_id } = get();
    if (!student_id || !kc) return [];
    try {
      const data = await api.get(
        `/api/session-queue?student_id=${encodeURIComponent(student_id)}&kc=${encodeURIComponent(kc)}`
      );
      const queue = data.queue || [];
      set({ sessionQueue: queue });
      return queue;
    } catch (e) {
      console.error("fetchSessionQueue error:", e);
      return [];
    }
  },

  markLessonViewed: async (kc) => {
    const { student_id, lessonsViewed } = get();
    if (lessonsViewed.includes(kc)) return;
    const next = [...lessonsViewed, kc];
    set({ lessonsViewed: next });
    if (student_id) {
      try {
        await api.post("/api/mark-lesson-viewed", { student_id, kc });
      } catch {
        // non-blocking
      }
    }
  },

  setActiveKC: (kc) => {
    const { lessonsViewed } = get();
    const phase = lessonsViewed.includes(kc) ? "questions" : "lesson";
    set({
      activeKC: kc,
      lessonPhase: phase,
      feedback: null,
      hintTexts: [],
      hintLevel: 0,
      sessionQueue: [], // will be re-fetched for new KC
    });
  },

  setLessonPhase: (phase) => set({ lessonPhase: phase }),

  fetchNextQuestion: async () => {
    const { student_id, activeKC } = get();
    if (!student_id) throw new Error("Missing student_id");

    set({ status: "loading", feedback: null, hintTexts: [], hintLevel: 0 });
    const data = await api.get(
      `/api/next-question?student_id=${encodeURIComponent(student_id)}&active_kc=${encodeURIComponent(activeKC || "KC1")}`
    );

    set({
      currentQuestion: data.question,
      hintLevel: data.hintLevel ?? 0,
      status: "ready",
    });
  },

  setCurrentQuestion: (question) => {
    set({ currentQuestion: question });
  },

  submitAnswerForQuestion: async (question_id, selected_option, time_taken) => {
    const { student_id } = get();
    if (!student_id || !question_id) throw new Error("Missing session or question");

    set({ status: "loading", error: null });
    const data = await api.post("/api/submit-answer", {
      student_id,
      question_id,
      selected_option,
      time_taken: time_taken || null,
    });

    const newState = data.correct ? "correct" : "incorrect";
    set((prev) => ({
      mastery: data.updated_mastery,
      feedback: {
        ...data.feedback,
        correct: data.correct,
        misconception: data.misconception,
        remediation: data.remediation || null,
        responseTimeFeedback: data.responseTimeFeedback || null,
      },
      questionStates: { ...prev.questionStates, [question_id]: newState },
      status: "ready",
    }));

    return data;
  },

  saveQuestionState: async (question_id, state) => {
    const { student_id } = get();
    set((prev) => ({
      questionStates: { ...prev.questionStates, [question_id]: state },
    }));
    if (student_id) {
      try {
        await api.post("/api/save-question-states", {
          student_id,
          questionStates: { [question_id]: state },
        });
      } catch {
        // non-blocking
      }
    }
  },

  requestHintForQuestion: async (question_id) => {
    const { student_id } = get();
    if (!student_id || !question_id) throw new Error("Missing session or question");

    const data = await api.get(
      `/api/hint?student_id=${encodeURIComponent(student_id)}&question_id=${encodeURIComponent(question_id)}`
    );

    const level = data.hintLevel ?? 1;
    const texts = [...(get().hintTexts || [])];
    texts[level - 1] = data.hintText;

    set({ hintLevel: level, hintTexts: texts });
    return data;
  },

  resetTutor: () => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    set({
      student_id: null,
      name: "",
      currentQuestion: emptyQuestion,
      hintLevel: 0,
      hintTexts: [],
      feedback: null,
      mastery: Object.fromEntries(ALL_KCS.map((k) => [k, 0])),
      profile: null,
      status: "idle",
      error: null,
      activeKC: "KC1",
      lessonPhase: "lesson",
      lessons: {},
      lessonsViewed: [],
      questionStates: {},
      allQuestions: [],
      sessionQueue: [],
    });
  },
}));

export default useTutorStore;
