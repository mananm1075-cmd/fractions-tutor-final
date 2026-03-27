import React from "react";
import { motion } from "framer-motion";
import FractionVisualizer from "./FractionVisualizer.jsx";

export default function QuestionCard({ question, onSelectOption, disabled, selected_option }) {
  if (!question) return null;

  const { prompt, kc, difficulty, options, visual, visual2, type, statement } = question;
  const isInteractiveVisual = type === "visual_select";

  const [fillValue, setFillValue] = React.useState("");
  const [multiSelected, setMultiSelected] = React.useState([]);

  React.useEffect(() => {
    setFillValue("");
    setMultiSelected([]);
  }, [question?.id]);

  return (
    <motion.div
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-indigo-700">
          {kc} • Difficulty {difficulty}
        </div>
      </div>

      <div className="mt-3 text-lg font-semibold text-slate-900">{prompt}</div>
      {Array.isArray(statement) ? (
        <div className="mt-2 text-sm text-slate-700">{statement.join(" , ")}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {visual ? <FractionVisualizer visual={visual} interactive={isInteractiveVisual} /> : <div className="hidden md:block" />}
        {visual2 ? <FractionVisualizer visual={visual2} /> : <div className="hidden md:block" />}
      </div>

      {type === "fill_blank" ? (
        <div className="mt-5">
          <div className="text-sm font-medium text-slate-700">Type your answer:</div>
          <div className="mt-3 flex gap-2">
            <input
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value)}
              disabled={disabled}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              placeholder='e.g. 5/8 or ">"'
            />
            <button
              type="button"
              onClick={() => onSelectOption(fillValue)}
              disabled={disabled || !fillValue.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      ) : null}

      {type === "multi_select" ? (
        <div className="mt-5">
          <div className="text-sm font-medium text-slate-700">Select all that apply:</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map((opt) => {
              const isSelected = multiSelected.includes(opt);
              return (
                <motion.button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    setMultiSelected((prev) =>
                      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
                    );
                  }}
                  className={[
                    "rounded-xl border px-4 py-3 text-left text-base font-semibold transition",
                    isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onSelectOption(multiSelected)}
            disabled={disabled || multiSelected.length === 0}
            className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
          >
            Submit Selection
          </button>
        </div>
      ) : null}

      {(type === "mcq" || type === "true_false" || type === "visual_select" || !type) && options ? (
        <div className="mt-5">
          <div className="text-sm font-medium text-slate-700">Choose the correct answer:</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map((opt) => {
              const isSelected = selected_option === opt;
              return (
                <motion.button
                  key={opt}
                  type="button"
                  onClick={() => onSelectOption(type === "true_false" ? String(opt).toLowerCase() === "true" : opt)}
                  disabled={disabled}
                  whileHover={disabled ? undefined : { y: -2 }}
                  whileTap={disabled ? undefined : { scale: 0.99 }}
                  className={[
                    "rounded-xl border px-4 py-3 text-left text-base font-semibold transition",
                    disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                    isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

