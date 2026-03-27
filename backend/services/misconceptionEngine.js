function detectMisconception({ question, selectedOption, isCorrect }) {
  if (isCorrect) return { code: null, misconceptionLabel: null };

  const mapping = question?.misconceptionByOption || {};
  const entry = mapping[selectedOption];

  if (entry) {
    return { code: entry.code, misconceptionLabel: entry.label };
  }

  // fallback: unknown wrong option -> generic misconception
  return { code: "F004", misconceptionLabel: "Review required (unclassified)" };
}

module.exports = {
  detectMisconception,
};

