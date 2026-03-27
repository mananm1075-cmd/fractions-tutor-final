import React, { useState } from "react";
import { motion } from "framer-motion";

function polarToCartesian(cx, cy, r, angleRad) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function wedgePath({ cx, cy, r, startAngle, endAngle }) {
  // startAngle/endAngle in radians; SVG arc uses sweepFlag to draw clockwise/ccw.
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);

  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  const sweepFlag = "1";

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y} Z`;
}

function initShaded(denominator, numerator) {
  const d = Math.max(1, Number(denominator) || 1);
  const n = Math.max(0, Math.min(d, Number(numerator) || 0));
  const arr = Array.from({ length: d }, (_, i) => i < n);
  return arr;
}

export default function FractionVisualizer({ visual, interactive = true }) {
  const { type, numerator, denominator } = visual || {};
  const d = Math.max(1, Number(denominator) || 1);

  const [shaded, setShaded] = useState(() => initShaded(d, numerator));

  // When visual changes, reset shading to match the given numerator.
  React.useEffect(() => {
    setShaded(initShaded(d, numerator));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, d, numerator]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      {type === "circle" ? (
        <div className="flex items-center justify-center">
          <motion.svg
            width={200}
            height={200}
            viewBox="0 0 200 200"
            className="select-none"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
          >
            {Array.from({ length: d }).map((_, i) => {
              const angleStep = (2 * Math.PI) / d;
              const startAngle = -Math.PI / 2 + i * angleStep;
              const endAngle = startAngle + angleStep;

              const path = wedgePath({ cx: 100, cy: 100, r: 85, startAngle, endAngle });
              const isOn = shaded[i];

              return (
                <path
                  key={i}
                  d={path}
                  stroke="rgba(15, 23, 42, 0.25)"
                  strokeWidth={1}
                  style={{
                    fill: isOn ? "rgba(99, 102, 241, 0.75)" : "rgba(226, 232, 240, 0.95)",
                    cursor: interactive ? "pointer" : "default",
                    transition: "fill 150ms ease",
                  }}
                  onClick={() => {
                    if (!interactive) return;
                    setShaded((prev) => {
                      const next = [...prev];
                      next[i] = !next[i];
                      return next;
                    });
                  }}
                />
              );
            })}

          </motion.svg>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-end justify-between gap-1">
            {Array.from({ length: d }).map((_, i) => {
              const isOn = shaded[i];
              return (
                <motion.button
                  key={i}
                  type="button"
                  className="h-14 flex-1 rounded-md border border-slate-200"
                  style={{
                    background: isOn ? "rgba(99, 102, 241, 0.75)" : "rgba(226, 232, 240, 0.95)",
                    cursor: interactive ? "pointer" : "default",
                  }}
                  initial={false}
                  animate={{ opacity: isOn ? 1 : 0.95 }}
                  whileHover={interactive ? { y: -2 } : undefined}
                  onClick={() => {
                    if (!interactive) return;
                    setShaded((prev) => {
                      const next = [...prev];
                      next[i] = !next[i];
                      return next;
                    });
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

