import React from "react";
import { motion } from "framer-motion";

function getLabel(mastery) {
  if (mastery < 40) return "Beginner";
  if (mastery < 75) return "Developing";
  return "Proficient";
}

export default function ProgressBar({ mastery, kc, avgProgressScore }) {
  const percent = Math.max(0, Math.min(100, Math.round(mastery || 0)));
  const avg =
    typeof avgProgressScore === "number"
      ? Math.max(0, Math.min(100, Math.round(avgProgressScore)))
      : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-900">{kc}</div>
        <div className="text-sm text-slate-600">{getLabel(mastery)}</div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="mt-2 text-xs text-slate-500">Mastery: {percent}%</div>
      {avg !== null && (
        <div className="mt-1 text-xs font-semibold text-indigo-600">
          Avg progress score: {avg}%
          <span className="ml-1 font-normal text-slate-400">(mastery + accuracy)</span>
        </div>
      )}
    </div>
  );
}

