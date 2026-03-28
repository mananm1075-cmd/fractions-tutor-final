const express = require("express");
const {
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
} = require("../services/tutorController");

const router = express.Router();

router.get("/start-session", startSession);
router.get("/next-question", nextQuestion);
router.get("/guided-question", guidedQuestion);
router.get("/session-queue", getSessionQueue);
router.get("/kc-sequential-next", getKcSequentialNext);
router.post("/submit-answer", submitAnswer);
router.get("/hint", getHint);
router.get("/progress", getProgress);
router.get("/questions", getQuestions);
router.get("/lessons", getLessons);
router.post("/save-question-states", saveQuestionStates);
router.post("/mark-lesson-viewed", markLessonViewed);

module.exports = router;
