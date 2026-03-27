import { create } from "zustand";
import { api } from "../lib/api";

const emptyQuestion = null;

const useTutorStore = create((set, get) => ({
  student_id: null,
  name: "",

  mastery: { KC1: 20, KC2: 20, KC3: 20 },
  profile: null,

  currentQuestion: emptyQuestion,

  hintLevel: 1,
  hintTexts: [],

  feedback: null,

  status: "idle",
  error: null,

  // Persistent question attempts storage
  questionAttempts: {},

  startSession: async (name) => {
    set({ status: "loading", error: null });
    const safeName = encodeURIComponent((name || "Student").trim());
    const data = await api.get(`/api/start-session?name=${safeName}`);
    set({
      student_id: data.student_id,
      name: data.name || name || "Student",
      mastery: data.mastery,
      status: "ready",
    });
  },

  fetchProgress: async () => {
    const { student_id } = get();
    if (!student_id) return;
    set({ status: "loading", error: null });
    const data = await api.get(`/api/progress?student_id=${encodeURIComponent(student_id)}`);
    set({ mastery: data.mastery, profile: data, name: data.name || get().name, status: "ready" });
  },

  fetchQuestionsList: async () => {
    const data = await api.get("/api/questions");
    return data.questions || [];
  },

  fetchNextQuestion: async () => {
    const { student_id } = get();
    if (!student_id) throw new Error("Missing student_id");

    set({ status: "loading", feedback: null, hintTexts: [], hintLevel: 1 });
    const data = await api.get(`/api/next-question?student_id=${encodeURIComponent(student_id)}`);

    set({
      currentQuestion: data.question,
      hintLevel: data.hintLevel ?? 1,
      status: "ready",
    });
  },

  setCurrentQuestion: (question) => {
    set({ currentQuestion: question });
  },

  submitAnswerForQuestion: async (question_id, selected_option) => {
    const { student_id } = get();
    if (!student_id || !question_id) throw new Error("Missing session or question");
    set({ status: "loading", error: null });
    const data = await api.post("/api/submit-answer", {
      student_id,
      question_id,
      selected_option,
    });
    set({
      mastery: data.updated_mastery,
      feedback: {
        ...data.feedback,
        correct: data.correct,
        misconception: data.misconception,
        remediation: data.remediation || null,
      },
      status: "ready",
    });
    return data;
  },

  submitAnswer: async (selected_option) => {
    const { student_id, currentQuestion } = get();
    if (!student_id || !currentQuestion) throw new Error("Missing session or question");

    set({ status: "loading", error: null });
    const data = await api.post("/api/submit-answer", {
      student_id,
      question_id: currentQuestion.id,
      selected_option,
    });

    set({
      mastery: data.updated_mastery,
      feedback: {
        ...data.feedback,
        correct: data.correct,
        misconception: data.misconception,
        remediation: data.remediation || null,
      },
      status: "ready",
      // next question should reset hints; keep as-is for current question
    });

    return data;
  },

  requestHintForQuestion: async (question_id) => {
    const { student_id } = get();
    if (!student_id || !question_id) throw new Error("Missing session or question");
    const data = await api.get(
      `/api/hint?student_id=${encodeURIComponent(student_id)}&question_id=${encodeURIComponent(question_id)}`,
    );

    const level = data.hintLevel ?? 1;
    const texts = [...(get().hintTexts || [])];
    texts[level - 1] = data.hintText;

    set({
      hintLevel: level,
      hintTexts: texts,
    });

    return data;
  },

  requestHint: async () => {
    const { student_id, currentQuestion } = get();
    if (!student_id || !currentQuestion) throw new Error("Missing session or question");

    const data = await api.get(
      `/api/hint?student_id=${encodeURIComponent(student_id)}&question_id=${encodeURIComponent(
        currentQuestion.id,
      )}`,
    );

    const level = data.hintLevel ?? 1;
    const texts = [...(get().hintTexts || [])];
    texts[level - 1] = data.hintText;

    set({
      hintLevel: level,
      hintTexts: texts,
    });

    return data;
  },

  resetTutor: () => {
    set({
      student_id: null,
      name: "",
      currentQuestion: emptyQuestion,
      hintLevel: 1,
      hintTexts: [],
      feedback: null,
      mastery: { KC1: 20, KC2: 20, KC3: 20 },
      profile: null,
      status: "idle",
      error: null,
      questionAttempts: {},
    });
  },

  // Save question attempt to persistent storage
  saveQuestionAttempt: (questionId, attemptData) => {
    const { questionAttempts } = get();
    const updatedAttempts = {
      ...questionAttempts,
      [questionId]: attemptData,
    };
    set({ questionAttempts: updatedAttempts });
    // Save to localStorage
    try {
      localStorage.setItem('fractionTutor_attempts', JSON.stringify(updatedAttempts));
    } catch (e) {
      console.warn('Could not save attempts to localStorage:', e);
    }
  },

  // Load question attempts from localStorage
  loadQuestionAttempts: () => {
    try {
      const saved = localStorage.getItem('fractionTutor_attempts');
      if (saved) {
        const attempts = JSON.parse(saved);
        set({ questionAttempts: attempts });
        return attempts;
      }
    } catch (e) {
      console.warn('Could not load attempts from localStorage:', e);
    }
    return {};
  },

  // Clear all question attempts
  clearQuestionAttempts: () => {
    set({ questionAttempts: {} });
    try {
      localStorage.removeItem('fractionTutor_attempts');
    } catch (e) {
      console.warn('Could not clear attempts from localStorage:', e);
    }
  },
}));

export default useTutorStore;

