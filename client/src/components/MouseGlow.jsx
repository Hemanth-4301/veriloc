import React, { useEffect, useRef } from "react";

const MouseGlow = () => {
  const glowRef = useRef(null);
  const rafRef = useRef(0);
  const targetPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };

    const update = () => {
      if (!glowRef.current) return;
      const size = 380; // diameter of glow
      const x = targetPos.current.x - size / 2;
      const y = targetPos.current.y - size / 2;
      glowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      rafRef.current = 0;
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed z-40 w-[380px] h-[380px] rounded-full opacity-0 md:opacity-20 mix-blend-screen blur-3xl transition-opacity duration-300"
      style={{
        background:
          "radial-gradient(closest-side, rgba(99,102,241,0.35), rgba(168,85,247,0.25), rgba(0,0,0,0))",
        left: 0,
        top: 0,
      }}
    />
  );
};

export default MouseGlow;


