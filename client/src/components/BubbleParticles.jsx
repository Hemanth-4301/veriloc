import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

const BubbleParticles = ({ count = 15 }) => {
  const [screenHeight, setScreenHeight] = useState(0);

  useEffect(() => {
    setScreenHeight(window.innerHeight);
  }, []);

  const bubbles = useMemo(() => {
    // Generate random bubble properties once
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 15 + 10, // 10-25px (tiny bubbles)
      left: Math.random() * 100, // 0-100%
      duration: Math.random() * 10 + 15, // 15-25s (shorter for smoother)
      delay: Math.random() * 8, // 0-8s
      opacity: Math.random() * 0.2 + 0.15, // 0.15-0.35
      innerOpacity: Math.random() * 0.3 + 0.2, // 0.2-0.5
      horizontalMovement: Math.random() * 100 - 50, // -50 to 50px
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full will-change-transform"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            top: "-100px",
            background: `radial-gradient(circle at 35% 25%, 
              rgba(255, 255, 255, ${bubble.innerOpacity}), 
              rgba(147, 197, 253, ${bubble.opacity * 0.7}) 35%,
              rgba(59, 130, 246, ${bubble.opacity * 0.5}) 65%,
              rgba(37, 99, 235, ${bubble.opacity * 0.2}) 100%)`,
            border: `0.5px solid rgba(255, 255, 255, ${bubble.opacity * 0.4})`,
            boxShadow: `
              inset ${bubble.size * 0.12}px ${bubble.size * 0.12}px ${
              bubble.size * 0.25
            }px rgba(255, 255, 255, ${bubble.innerOpacity * 0.6}),
              0 ${bubble.size * 0.08}px ${
              bubble.size * 0.3
            }px rgba(59, 130, 246, ${bubble.opacity * 0.2})
            `,
          }}
          animate={{
            y: [0, (screenHeight || 1000) + 150],
            x: [
              0,
              bubble.horizontalMovement * 0.5,
              bubble.horizontalMovement,
              bubble.horizontalMovement * 0.5,
              0,
            ],
            scale: [0.9, 1, 1.05, 1, 0.95],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
        >
          {/* Inner highlight for glass effect */}
          <div
            className="absolute rounded-full"
            style={{
              width: bubble.size * 0.35,
              height: bubble.size * 0.35,
              top: bubble.size * 0.12,
              left: bubble.size * 0.18,
              background: `radial-gradient(circle at 40% 40%, 
                rgba(255, 255, 255, ${bubble.innerOpacity * 0.8}),
                transparent 60%)`,
              filter: "blur(4px)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default BubbleParticles;
