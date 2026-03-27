import React from "react";
import { motion } from "framer-motion";

export default function HintBox({ hintTexts, hintLevel, onRequestHint, loading = false, error = null }) {
  const [open, setOpen] = React.useState(false);

  const maxLevel = 3;
  const nextLevel = hintLevel ?? 1;
  const canRequest = nextLevel <= maxLevel && !loading;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
        >
          Need Help?
        </button>

        <motion.button
          type="button"
          onClick={async () => {
            await onRequestHint();
            setOpen(true);
          }}
          disabled={!canRequest}
          className={[
            "rounded-xl border px-3 py-2 text-sm font-semibold transition",
            canRequest
              ? "border-indigo-500 bg-indigo-50 hover:bg-indigo-100"
              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500",
          ].join(" ")}
          whileHover={canRequest ? { y: -2 } : undefined}
          whileTap={canRequest ? { scale: 0.99 } : undefined}
        >
          {loading ? "Loading..." : `Show Hint ${Math.min(nextLevel, maxLevel)}`}
        </motion.button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((lvl) => {
            const text = hintTexts?.[lvl - 1];
            if (!text) return null;
            return (
              <motion.div
                key={lvl}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl bg-slate-50 p-3"
              >
                <div className="text-xs font-bold text-indigo-700">Hint Level {lvl}</div>
                <div className="mt-1 text-sm text-slate-700">{text}</div>
              </motion.div>
            );
          })}
          {!hintTexts?.length ? (
            <div className="text-sm text-slate-600">Press "Show Hint 1" to begin.</div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-600">Hints are available when you need them.</div>
      )}
    </div>
  );
}

