import React from "react";
import { useNavigate } from "react-router-dom";
import useTutorStore from "../store/useTutorStore.js";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const startSession = useTutorStore((s) => s.startSession);
  const restoreSessionFromStorage = useTutorStore((s) => s.restoreSessionFromStorage);
  const status = useTutorStore((s) => s.status);
  const [name, setName] = React.useState(() => {
    try {
      const raw = localStorage.getItem("fractions-tutor-session");
      if (!raw) return "";
      const p = JSON.parse(raw);
      return typeof p?.name === "string" ? p.name : "";
    } catch {
      return "";
    }
  });
  const [savedPreview, setSavedPreview] = React.useState(null);

  React.useEffect(() => {
    setSavedPreview(useTutorStore.getState().getSavedSessionPreview());
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-b from-indigo-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="text-4xl font-extrabold tracking-tight text-slate-900">
            Fractions Intelligent Tutor
          </div>
          <div className="mt-3 text-slate-600">
            Adaptive practice with hints, misconceptions support, and fraction visuals.
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-700" htmlFor="student-name">
              Student Name
            </label>
            <input
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder="Enter your name"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <motion.button
              type="button"
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-white font-bold shadow-sm hover:bg-indigo-700 transition"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={async () => {
                await startSession(name || "Student");
                navigate("/tutor");
              }}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Starting..." : "Start Learning"}
            </motion.button>
            {savedPreview ? (
              <motion.button
                type="button"
                className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-5 py-3 text-indigo-800 font-bold shadow-sm hover:bg-indigo-100 transition"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={async () => {
                  const ok = await restoreSessionFromStorage();
                  if (ok) navigate("/tutor");
                }}
                disabled={status === "loading"}
              >
                Continue as {savedPreview.name}
              </motion.button>
            ) : null}
            <div className="text-sm text-slate-500">
              Progress is saved by name in the local database. Same name loads your history.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

