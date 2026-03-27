import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import useTutorStore from "../store/useTutorStore.js";

export default function Profile() {
  const navigate = useNavigate();
  const name = useTutorStore((s) => s.name);
  const profile = useTutorStore((s) => s.profile);
  const fetchProgress = useTutorStore((s) => s.fetchProgress);

  React.useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const chart = profile?.chart || [];

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{name || "Student"} Profile</div>
            <div className="mt-1 text-sm text-slate-600">Learning analytics and recommendations</div>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => navigate("/tutor")}
            >
              Back to Tutor
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Strong Areas</div>
            <div className="mt-2 text-lg font-bold text-emerald-700">
              {(profile?.strongAreas || []).join(", ") || "In progress"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Weak Areas</div>
            <div className="mt-2 text-lg font-bold text-amber-700">
              {(profile?.weakAreas || []).join(", ") || "None"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Recommendation</div>
            <div className="mt-2 text-sm font-medium text-slate-800">
              {profile?.recommendation || "Keep practicing daily."}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-slate-700">Mastery by KC</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kc" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="mastery" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-slate-700">Accuracy by KC</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kc" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

