import React, { useState } from 'react';

/**
 * Shared SpotlightCard with Emerald Obsidian radial spotlight glow on hover.
 */
export function SpotlightCard({ children, className = '', onClick, style = {} }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={style}
      className={`relative overflow-hidden rounded-2xl border border-border bg-surface text-text backdrop-blur-xl shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-focus-ring ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(54, 185, 135, 0.15), rgba(85, 211, 160, 0.05) 60%, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}

export default SpotlightCard;
