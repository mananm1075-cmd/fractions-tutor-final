const express = require("express");
const {
  startSession,
  nextQuestion,
  submitAnswer,
  getHint,
  getProgress,
  getQuestions,
} = require("../services/tutorController");

const router = express.Router();

router.get("/start-session", startSession);
router.get("/next-question", nextQuestion);
router.post("/submit-answer", submitAnswer);
router.get("/hint", getHint);
router.get("/progress", getProgress);
router.get("/questions", getQuestions);

module.exports = router;

