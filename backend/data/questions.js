const baseExplanations = {
  F001: { text: "F001: You may have swapped numerator and denominator or compared incorrectly." },
  F002: { text: "F002: Denominator meaning is being confused with shaded/selected parts." },
  F003: { text: "F003: Equivalent/compare rule is not applied consistently." },
  F004: { text: "F004: Recount and apply the rule step by step." },
};

function makeMcq(item) {
  return {
    type: "mcq",
    feedbackCorrect: "Great work.",
    feedbackIncorrect: "Try again by using the hint ladder.",
    explanationIncorrectFallback: "Use the definition of numerator/denominator and compare carefully.",
    explanationsByMisconception: baseExplanations,
    remediationTags: item.remediationTags || [],
    ...item,
  };
}

function makeFill(item) {
  return {
    type: "fill_blank",
    options: null,
    feedbackCorrect: "Correct numeric fraction.",
    feedbackIncorrect: "Check numerator and denominator carefully.",
    explanationsByMisconception: baseExplanations,
    remediationTags: item.remediationTags || [],
    ...item,
  };
}

function makeTF(item) {
  return {
    type: "true_false",
    options: ["True", "False"],
    feedbackCorrect: "Nice reasoning.",
    feedbackIncorrect: "Re-evaluate the statement using a common denominator.",
    explanationsByMisconception: baseExplanations,
    remediationTags: item.remediationTags || [],
    ...item,
  };
}

function makeMulti(item) {
  return {
    type: "multi_select",
    feedbackCorrect: "Excellent, you selected all valid options.",
    feedbackIncorrect: "Remember: select every option that matches the rule.",
    explanationsByMisconception: baseExplanations,
    remediationTags: item.remediationTags || [],
    ...item,
  };
}

const questions = [
  // KC1: fraction representation (8)
  makeMcq({ id: "KC1_Q1", kc: "KC1", difficulty: 1, prompt: "Circle has 1 of 2 parts shaded. Which fraction?", visual: { type: "circle", numerator: 1, denominator: 2 }, options: ["1/2", "2/1", "1/1", "2/2"], correct_option: "1/2", misconceptionByOption: { "2/1": { code: "F001", label: "Swapped" }, "1/1": { code: "F002", label: "Whole confusion" }, "2/2": { code: "F003", label: "Denominator confusion" } }, explanationCorrect: "1 shaded out of 2 total parts is 1/2.", hints: ["Count shaded first.", "Count total equal parts.", "Write shaded/total = 1/2."], remediationTags: ["F001", "F002"] }),
  makeMcq({ id: "KC1_Q2", kc: "KC1", difficulty: 1, prompt: "Bar has 3 of 4 parts shaded. Which fraction?", visual: { type: "bar", numerator: 3, denominator: 4 }, options: ["3/4", "4/3", "1/4", "3/3"], correct_option: "3/4", misconceptionByOption: { "4/3": { code: "F001", label: "Swapped" }, "1/4": { code: "F002", label: "Wrong numerator" }, "3/3": { code: "F003", label: "Wrong denominator" } }, explanationCorrect: "3 shaded out of 4 total gives 3/4.", hints: ["Denominator is total parts.", "Numerator is shaded parts.", "Answer is 3/4."], remediationTags: ["F001"] }),
  makeMcq({ id: "KC1_Q3", kc: "KC1", difficulty: 2, prompt: "Circle has 2 of 3 parts shaded. Which fraction?", visual: { type: "circle", numerator: 2, denominator: 3 }, options: ["2/3", "3/2", "2/2", "3/3"], correct_option: "2/3", misconceptionByOption: { "3/2": { code: "F001", label: "Swapped" }, "2/2": { code: "F002", label: "Whole confusion" }, "3/3": { code: "F003", label: "Wrong denominator" } }, explanationCorrect: "2 shaded out of 3 total is 2/3.", hints: ["Find shaded parts.", "Find total parts.", "Write 2/3."], remediationTags: ["F001", "F003"] }),
  makeFill({ id: "KC1_Q4", kc: "KC1", difficulty: 2, prompt: "Fill in: 5 shaded parts out of 8 total parts = __", correct_text: "5/8", explanationCorrect: "Fraction format is shaded/total = 5/8.", hints: ["Write numerator first.", "Total parts becomes denominator.", "Answer 5/8."] }),
  makeTF({ id: "KC1_Q5", kc: "KC1", difficulty: 2, prompt: "True or False: In 3/7, 7 means total equal parts.", correct_boolean: true, explanationCorrect: "Denominator is total equal parts.", hints: ["Look at denominator role.", "It counts total parts.", "So this is True."] }),
  makeMulti({ id: "KC1_Q6", kc: "KC1", difficulty: 3, prompt: "Select all fractions that represent 2 shaded out of 6 parts.", options: ["2/6", "1/3", "6/2", "4/6"], correct_options: ["2/6", "1/3"], explanationCorrect: "2/6 and 1/3 are equivalent.", hints: ["Think equivalent fractions.", "Simplify 2/6.", "2/6 = 1/3."] }),
  makeMcq({ id: "KC1_Q7", kc: "KC1", difficulty: 3, prompt: "A shape has 4 shaded out of 10 equal parts.", options: ["2/5", "4/10", "5/2", "10/4"], correct_option: "4/10", misconceptionByOption: { "2/5": { code: "F003", label: "Simplified but not asked form" }, "5/2": { code: "F001", label: "Swapped" }, "10/4": { code: "F001", label: "Swapped" } }, explanationCorrect: "Asked fraction from picture is 4/10.", hints: ["Use direct count.", "Do not swap numbers.", "4/10 is direct representation."] }),
  makeFill({ id: "KC1_Q8", kc: "KC1", difficulty: 1, prompt: "Fill in: numerator is 6 and denominator is 9. Fraction = __", correct_text: "6/9", explanationCorrect: "Fraction is numerator/denominator = 6/9.", hints: ["Write top number first.", "Then denominator.", "6/9."] }),

  // KC2: equivalent fractions (8)
  makeMcq({ id: "KC2_Q1", kc: "KC2", difficulty: 1, prompt: "Which is equivalent to 1/2?", visual: { type: "circle", numerator: 1, denominator: 2 }, options: ["2/4", "1/4", "3/4", "2/2"], correct_option: "2/4", misconceptionByOption: { "1/4": { code: "F002", label: "Scaled one side" }, "3/4": { code: "F003", label: "Wrong scaling" }, "2/2": { code: "F004", label: "Not equivalent" } }, explanationCorrect: "Multiply top and bottom by 2.", hints: ["Scale both by same number.", "Try x2.", "1/2 = 2/4."], remediationTags: ["F003"] }),
  makeMcq({ id: "KC2_Q2", kc: "KC2", difficulty: 2, prompt: "Which is equivalent to 3/4?", options: ["6/8", "3/8", "4/6", "5/8"], correct_option: "6/8", misconceptionByOption: { "3/8": { code: "F002", label: "Denominator-only change" }, "4/6": { code: "F003", label: "Mismatched scaling" }, "5/8": { code: "F004", label: "Random ratio" } }, explanationCorrect: "3/4 x 2/2 = 6/8.", hints: ["Scale both numbers equally.", "Multiply by 2.", "6/8."] }),
  makeMcq({ id: "KC2_Q3", kc: "KC2", difficulty: 2, prompt: "Which is equivalent to 2/3?", options: ["4/6", "2/6", "3/2", "4/3"], correct_option: "4/6", misconceptionByOption: { "2/6": { code: "F002", label: "Scaled one side" }, "3/2": { code: "F001", label: "Swapped" }, "4/3": { code: "F003", label: "Wrong denominator" } }, explanationCorrect: "2/3 x 2/2 = 4/6.", hints: ["Scale both top and bottom.", "Try x2.", "4/6."] }),
  makeFill({ id: "KC2_Q4", kc: "KC2", difficulty: 1, prompt: "Fill in equivalent fraction: 1/3 = __/6", correct_text: "2/6", explanationCorrect: "Multiply both by 2.", hints: ["3 becomes 6 by x2.", "Do same on numerator.", "2/6."] }),
  makeFill({ id: "KC2_Q5", kc: "KC2", difficulty: 3, prompt: "Fill in equivalent fraction: 5/8 = __/24", correct_text: "15/24", explanationCorrect: "8 to 24 is x3, so 5 to 15 is x3.", hints: ["Find denominator scale.", "Apply same to numerator.", "15/24."] }),
  makeTF({ id: "KC2_Q6", kc: "KC2", difficulty: 2, prompt: "True or False: 4/6 and 2/3 are equivalent.", correct_boolean: true, explanationCorrect: "4/6 simplifies to 2/3.", hints: ["Try simplify 4/6.", "Divide by 2.", "It becomes 2/3 -> True."] }),
  makeMulti({ id: "KC2_Q7", kc: "KC2", difficulty: 3, prompt: "Select all fractions equivalent to 3/5.", options: ["6/10", "9/15", "3/10", "12/20"], correct_options: ["6/10", "9/15", "12/20"], explanationCorrect: "All selected fractions are 3/5 scaled.", hints: ["Multiply by 2,3,4.", "Equivalent ratios stay same.", "Select 6/10, 9/15, 12/20."] }),
  makeMcq({ id: "KC2_Q8", kc: "KC2", difficulty: 1, prompt: "Which is NOT equivalent to 1/2?", options: ["2/4", "3/6", "4/8", "2/3"], correct_option: "2/3", misconceptionByOption: { "2/4": { code: "F004", label: "Missed negative condition" }, "3/6": { code: "F004", label: "Missed negative condition" }, "4/8": { code: "F004", label: "Missed negative condition" } }, explanationCorrect: "2/3 is not equal to 1/2.", hints: ["Test by simplifying.", "2/4,3/6,4/8 simplify to 1/2.", "2/3 does not."] }),

  // KC3: compare/order/equality (8)
  makeMcq({ id: "KC3_Q1", kc: "KC3", difficulty: 1, prompt: "Which is greater?", visual: { type: "bar", numerator: 1, denominator: 2, label: "1/2" }, visual2: { type: "bar", numerator: 2, denominator: 3, label: "2/3" }, options: ["1/2", "2/3", "Equal", "Cannot compare"], correct_option: "2/3", misconceptionByOption: { "1/2": { code: "F001", label: "Compared poorly" }, "Equal": { code: "F003", label: "False equality" }, "Cannot compare": { code: "F004", label: "Strategy uncertainty" } }, explanationCorrect: "2/3 > 1/2 using common denominator.", hints: ["Convert to sixths.", "1/2=3/6, 2/3=4/6.", "4/6 is bigger."] }),
  makeMcq({ id: "KC3_Q2", kc: "KC3", difficulty: 2, prompt: "Which is greater?", options: ["3/4", "2/3", "Equal", "Not sure"], correct_option: "3/4", misconceptionByOption: { "2/3": { code: "F001", label: "Numerator-only comparison" }, "Equal": { code: "F003", label: "False equality" }, "Not sure": { code: "F004", label: "No strategy" } }, explanationCorrect: "3/4=9/12 and 2/3=8/12.", hints: ["Use denominator 12.", "Convert both.", "9/12 > 8/12."] }),
  makeMcq({ id: "KC3_Q3", kc: "KC3", difficulty: 3, prompt: "Compare 4/6 and 2/3.", options: ["4/6", "2/3", "Equal", "Not equal"], correct_option: "Equal", misconceptionByOption: { "4/6": { code: "F001", label: "Denominator bias" }, "2/3": { code: "F001", label: "Denominator bias" }, "Not equal": { code: "F003", label: "Missed equivalence" } }, explanationCorrect: "4/6 simplifies to 2/3.", hints: ["Simplify 4/6.", "Divide by 2.", "Equal values."] }),
  makeFill({ id: "KC3_Q4", kc: "KC3", difficulty: 2, prompt: "Fill in with >, <, or = : 5/8 __ 3/4", correct_text: "<", explanationCorrect: "5/8 = 0.625 and 3/4 = 0.75, so 5/8 < 3/4.", hints: ["Use common denominator 8.", "3/4 = 6/8.", "5/8 < 6/8."] }),
  makeFill({ id: "KC3_Q5", kc: "KC3", difficulty: 1, prompt: "Fill in with >, <, or = : 2/5 __ 2/7", correct_text: ">", explanationCorrect: "Same numerator; smaller denominator means bigger parts.", hints: ["Same numerator rule.", "Compare denominators.", "2/5 > 2/7."] }),
  makeTF({ id: "KC3_Q6", kc: "KC3", difficulty: 2, prompt: "True or False: 7/10 is greater than 2/3.", correct_boolean: true, explanationCorrect: "7/10=21/30 and 2/3=20/30.", hints: ["Use denominator 30.", "Compare numerators.", "21/30 > 20/30."] }),
  makeMulti({ id: "KC3_Q7", kc: "KC3", difficulty: 3, prompt: "Select all fractions greater than 1/2.", options: ["3/5", "4/9", "5/8", "2/5"], correct_options: ["3/5", "5/8"], explanationCorrect: "3/5 and 5/8 are above 1/2.", hints: ["Compare each to 1/2.", "Use cross multiplication.", "Select 3/5 and 5/8."] }),
  makeMcq({ id: "KC3_Q8", kc: "KC3", difficulty: 3, prompt: "Order from least to greatest.", statement: ["2/3", "3/5", "5/6"], options: ["3/5, 2/3, 5/6", "2/3, 3/5, 5/6", "5/6, 2/3, 3/5", "3/5, 5/6, 2/3"], correct_option: "3/5, 2/3, 5/6", misconceptionByOption: { "2/3, 3/5, 5/6": { code: "F003", label: "Ordering confusion" }, "5/6, 2/3, 3/5": { code: "F001", label: "Reversed order" }, "3/5, 5/6, 2/3": { code: "F003", label: "Middle/end swap" } }, explanationCorrect: "Approx values: 0.6, 0.67, 0.83.", hints: ["Convert to decimals/common denominator.", "Check each magnitude.", "Least to greatest is 3/5,2/3,5/6."] }),
];

module.exports = questions;

