import React from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../components/ProgressBar.jsx";
import useTutorStore from "../store/useTutorStore.js";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const student_id = useTutorStore((s) => s.student_id);
  const name = useTutorStore((s) => s.name);
  const mastery = useTutorStore((s) => s.mastery);
  const profile = useTutorStore((s) => s.profile);
  const fetchProgress = useTutorStore((s) => s.fetchProgress);

  const chartByKc = React.useMemo(() => {
    const rows = profile?.chart || [];
    return Object.fromEntries(rows.map((r) => [r.kc, r]));
  }, [profile?.chart]);

  React.useEffect(() => {
    if (student_id) fetchProgress();
  }, [student_id, fetchProgress]);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-extrabold text-slate-900">Dashboard</div>
            <div className="mt-1 text-sm text-slate-600">Your mastery by knowledge component ({name || "Student"})</div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700 font-bold hover:bg-slate-50 transition"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/profile")}
            >
              View Profile
            </motion.button>
            <motion.button
              type="button"
              className="rounded-2xl bg-indigo-600 px-4 py-2 text-white font-bold hover:bg-indigo-700 transition"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/tutor")}
            >
              Go to Tutor
            </motion.button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {["KC1", "KC2", "KC3", "KC4", "KC5", "KC6", "KC7"].map((kc) => (
            <ProgressBar
              key={kc}
              kc={kc}
              mastery={mastery?.[kc] ?? 0}
              avgProgressScore={
                (chartByKc[kc]?.attempts ?? 0) > 0 ? chartByKc[kc]?.avgProgressScore : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

