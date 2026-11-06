"use client";
import { motion, useReducedMotion } from "framer-motion";

export default function Fireworks() {
  const reduced = useReducedMotion();
  if (reduced)
    return (
      <div className="reduced-celebration" aria-hidden="true">
        ✦ ✧ ✦
      </div>
    );
  return (
    <div className="fireworks" aria-hidden="true">
      {[0, 1, 2].map((burst) => (
        <div
          className="firework-origin"
          key={burst}
          style={{
            left: `${24 + burst * 26}%`,
            top: `${30 + (burst % 2) * 16}%`,
          }}
        >
          {Array.from({ length: 22 }, (_, i) => {
            const angle = (i / 22) * Math.PI * 2;
            const distance = 90 + ((i * 29) % 110);
            return (
              <motion.i
                key={i}
                style={{
                  background: ["#c1f17d", "#f2c96d", "#ffffff", "#91d4b3"][
                    i % 4
                  ],
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: [
                    0,
                    Math.sin(angle) * distance,
                    Math.sin(angle) * distance + 70,
                  ],
                  scale: [0, 1.3, 0.5],
                  opacity: [1, 1, 0],
                  rotate: i * 47,
                }}
                transition={{
                  duration: 1.7,
                  delay: burst * 0.25,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
