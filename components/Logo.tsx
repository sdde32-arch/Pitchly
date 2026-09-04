import React from "react";
import { motion } from "motion/react";

export interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
  variant?: "light" | "dark" | "black" | "white" | "auto" | "icon-only";
  animated?: boolean;
}

interface FootballBallProps {
  size: number;
  animated?: boolean;
}

const GlowingFootballBall: React.FC<FootballBallProps> = ({ size, animated = true }) => {
  const uid = React.useId().replace(/:/g, "");
  const slimeGradId = `slimeGrad_${uid}`;
  const patchGradId = `patchGrad_${uid}`;
  const rimGradId = `rimGrad_${uid}`;
  const auraGradId = `auraGrad_${uid}`;
  const luminousCoreId = `luminousCore_${uid}`;
  const clipId = `ballClip_${uid}`;

  // Bounce physics: Rise up with deceleration, peak at apex, accelerate down with impact squish
  return (
    <motion.div
      className="relative flex items-center justify-center shrink-0 select-none pointer-events-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transformOrigin: "bottom center",
      }}
      animate={animated ? {
        y: [0, -4.5, -9.5, -4.5, 0],
        scaleY: [0.82, 1.08, 1, 1.06, 0.82],
        scaleX: [1.18, 0.93, 1, 0.94, 1.18],
      } : undefined}
      transition={{
        duration: 1.1,
        repeat: Infinity,
        ease: ["easeOut", "easeOut", "easeIn", "easeIn"],
        times: [0, 0.26, 0.5, 0.74, 1],
      }}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter:
            "drop-shadow(0 0 4.5px #CCFF00) drop-shadow(0 0 12px rgba(168, 255, 0, 0.95)) drop-shadow(0 0 24px rgba(168, 255, 0, 0.65)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))",
        }}
      >
        <defs>
          {/* Spherical clip path for the ball perimeter */}
          <clipPath id={clipId}>
            <circle cx="24" cy="24" r="17.5" />
          </clipPath>

          {/* Glowing electric slime green leather sphere gradient with 3D volume */}
          <radialGradient id={slimeGradId} cx="30%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#F6FFB0" />
            <stop offset="22%" stopColor="#D8FF1A" />
            <stop offset="52%" stopColor="#A8FF00" />
            <stop offset="80%" stopColor="#65A30D" />
            <stop offset="100%" stopColor="#223C04" />
          </radialGradient>

          {/* Deep pitch black contrast pentagon patches */}
          <radialGradient id={patchGradId} cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#142C0D" />
            <stop offset="55%" stopColor="#071504" />
            <stop offset="100%" stopColor="#010601" />
          </radialGradient>

          {/* Ambient outer slime blooming glow disk */}
          <radialGradient id={auraGradId} cx="50%" cy="50%" r="50%">
            <stop offset="25%" stopColor="#CCFF00" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#A8FF00" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
          </radialGradient>

          {/* Luminous inner slime radiance overlay */}
          <radialGradient id={luminousCoreId} cx="32%" cy="28%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="42%" stopColor="#CCFF00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#A8FF00" stopOpacity="0" />
          </radialGradient>

          {/* Spherical ambient rim shadow */}
          <radialGradient id={rimGradId} cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#000000" stopOpacity="0" />
            <stop offset="90%" stopColor="#000000" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#020801" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* 1. Blooming Slime Glow Aura disk expanding and breathing behind the ball */}
        <motion.circle
          cx="24"
          cy="24"
          r="23"
          fill={`url(#${auraGradId})`}
          animate={animated ? {
            scale: [1.18, 0.95, 0.78, 0.95, 1.18],
            opacity: [0.95, 0.65, 0.35, 0.65, 0.95],
          } : undefined}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.26, 0.5, 0.74, 1],
          }}
          style={{ transformOrigin: "24px 24px" }}
        />

        {/* 2. Concentric electric slime orbit ring pulsing in sync with bounce rhythm */}
        <motion.circle
          cx="24"
          cy="24"
          r="21.5"
          fill="none"
          stroke="#CCFF00"
          strokeWidth="1.3"
          strokeDasharray="3.5 2"
          animate={animated ? {
            scale: [1.15, 0.92, 0.72, 0.92, 1.15],
            opacity: [0.95, 0.6, 0.25, 0.6, 0.95],
          } : undefined}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.26, 0.5, 0.74, 1],
          }}
          style={{ transformOrigin: "24px 24px" }}
        />

        {/* 3. Floating Glowing Slime Football Sphere with 32-panel football print & smooth in-flight spin */}
        <motion.g
          animate={animated ? {
            rotate: [0, 360],
          } : undefined}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "24px 24px" }}
        >
          {/* Main sphere with clip path so all patches and outer seams curl around curvature */}
          <g clipPath={`url(#${clipId})`}>
            {/* Luminous Slime Green Base Leather Sphere */}
            <circle
              cx="24"
              cy="24"
              r="17.5"
              fill={`url(#${slimeGradId})`}
            />

            {/* Connecting Seams forming hexagonal panels */}
            <g stroke="#051403" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              {/* Radial seams connecting center pentagon to the 5 outer pentagons */}
              <line x1="24.0" y1="17.4" x2="24.0" y2="12.2" />
              <line x1="30.3" y1="22.0" x2="35.2" y2="20.4" />
              <line x1="27.9" y1="29.3" x2="30.9" y2="33.5" />
              <line x1="20.1" y1="29.3" x2="17.1" y2="33.5" />
              <line x1="17.7" y1="22.0" x2="12.8" y2="20.4" />

              {/* Seams connecting adjacent outer pentagons to complete the surrounding hexagons */}
              <line x1="29.6" y1="9.4" x2="36.1" y2="14.2" />
              <line x1="39.6" y1="24.8" x2="37.1" y2="32.5" />
              <line x1="28.0" y1="39.1" x2="20.0" y2="39.1" />
              <line x1="10.9" y1="32.5" x2="8.4" y2="24.8" />
              <line x1="11.9" y1="14.2" x2="18.4" y2="9.4" />

              {/* Perimeter seams reaching the ball horizon */}
              <line x1="18.4" y1="9.4" x2="13.0" y2="6.0" />
              <line x1="29.6" y1="9.4" x2="35.0" y2="6.0" />
              <line x1="36.1" y1="14.2" x2="41.0" y2="12.0" />
              <line x1="39.6" y1="24.8" x2="42.5" y2="27.0" />
              <line x1="37.1" y1="32.5" x2="42.0" y2="35.0" />
              <line x1="28.0" y1="39.1" x2="29.0" y2="42.0" />
              <line x1="20.0" y1="39.1" x2="19.0" y2="42.0" />
              <line x1="10.9" y1="32.5" x2="6.0" y2="35.0" />
              <line x1="8.4" y1="24.8" x2="5.5" y2="27.0" />
              <line x1="11.9" y1="14.2" x2="7.0" y2="12.0" />
            </g>

            {/* Iconic Dark Obsidian Pentagon Patches */}
            <g fill={`url(#${patchGradId})`} stroke="#051403" strokeWidth="0.8" strokeLinejoin="round">
              {/* Center Pentagon */}
              <polygon points="24,17.4 30.3,22.0 27.9,29.3 20.1,29.3 17.7,22.0" />

              {/* Top Pentagon */}
              <polygon points="24.0,12.2 29.6,9.4 28.7,4.5 19.3,4.5 18.4,9.4" />

              {/* Top-Right Pentagon */}
              <polygon points="35.2,20.4 39.6,24.8 43.5,22.6 40.5,13.7 36.1,14.2" />

              {/* Bottom-Right Pentagon */}
              <polygon points="30.9,33.5 28.0,39.1 31.3,43.5 38.9,36.5 37.1,32.5" />

              {/* Bottom-Left Pentagon */}
              <polygon points="17.1,33.5 10.9,32.5 9.1,36.5 16.7,43.5 20.0,39.1" />

              {/* Top-Left Pentagon */}
              <polygon points="12.8,20.4 11.9,14.2 7.5,13.7 4.5,22.6 8.4,24.8" />
            </g>

            {/* Inner Luminous Slime Glow Bloom */}
            <circle
              cx="24"
              cy="24"
              r="17.5"
              fill={`url(#${luminousCoreId})`}
            />

            {/* Spherical Rim Shading for true 3D curvature */}
            <circle
              cx="24"
              cy="24"
              r="17.5"
              fill={`url(#${rimGradId})`}
            />

            {/* 3D Specular Highlight Gloss */}
            <ellipse
              cx="19.5"
              cy="18.5"
              rx="3.8"
              ry="2.2"
              transform="rotate(-30 19.5 18.5)"
              fill="#FFFFFF"
              opacity="0.65"
            />
            <ellipse
              cx="19.5"
              cy="18.5"
              rx="2.2"
              ry="1.2"
              transform="rotate(-30 19.5 18.5)"
              fill="#FFFFFF"
              opacity="0.85"
            />
          </g>

          {/* Crisp perimeter outline for contrast against any background */}
          <circle
            cx="24"
            cy="24"
            r="17.5"
            fill="none"
            stroke="#051403"
            strokeWidth="1.2"
            opacity="0.9"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
};

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 34,
  showText = true,
  showTagline = false,
  variant = "auto",
  animated = true,
}) => {
  // Determine color styling based on variant
  let textColorClass = "text-[#0F172A] dark:text-[#F8FAFC]";

  if (variant === "black" || variant === "light") {
    textColorClass = "text-[#0F172A]";
  } else if (variant === "white") {
    textColorClass = "text-white";
  } else if (variant === "dark") {
    textColorClass = "text-[#F8FAFC]";
  }

  // Calculate typography and ball sizing proportionally
  const fontSize = Math.round(size * 0.76);
  const ballSize = Math.max(16, Math.round(fontSize * 0.52));
  const ballTopOffset = Math.round(ballSize * 0.85);

  // When only the icon is requested (icon-only mode)
  if (!showText || variant === "icon-only") {
    return (
      <motion.div
        className={`inline-flex items-center justify-center select-none cursor-pointer pt-2 group ${className}`}
        id="pitchly-brand-icon"
        aria-label="Pitchly"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 450, damping: 20 }}
      >
        <div className="relative inline-flex flex-col items-center justify-center">
          {/* Glowing Green Football positioned directly above the letter P */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: `-${ballTopOffset}px`,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <GlowingFootballBall size={ballSize} animated={animated} />
          </div>

          <span
            className={`font-display font-black tracking-tight leading-none ${textColorClass}`}
            style={{ fontSize: `${fontSize}px` }}
          >
            p
          </span>
        </div>
      </motion.div>
    );
  }

  // Full Brand Logo: The crowned 'p' with the bouncing glowing green circular football on top of it,
  // followed seamlessly by 'itchly' with natural typography and zero baseline/kerning gap
  return (
    <motion.div
      className={`inline-flex items-center select-none cursor-pointer pt-2 group ${textColorClass} ${className}`}
      id="pitchly-brand-logo"
      aria-label="Pitchly"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
    >
      <div className="flex flex-col justify-center">
        <div className="inline-flex items-baseline leading-none">
          {/* The letter 'p' crowned with the bouncing glowing green circular football */}
          <span className="relative inline-flex items-center justify-center">
            {/* Glowing Green Circular Football Icon directly above the letter 'p' */}
            <span
              className="absolute flex items-center justify-center pointer-events-none z-10"
              style={{
                top: `-${ballTopOffset}px`,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <GlowingFootballBall size={ballSize} animated={animated} />
            </span>

            {/* Letter 'p' completely static and stationary */}
            <span
              className="font-display font-black tracking-tight leading-none text-current inline-block select-none"
              style={{
                fontSize: `${fontSize}px`,
                letterSpacing: "-0.04em",
              }}
            >
              p
            </span>
          </span>

          {/* Seamless remainder of the wordmark 'itchly' */}
          <span
            className="font-display font-black tracking-tight leading-none text-current"
            style={{
              fontSize: `${fontSize}px`,
              letterSpacing: "-0.04em",
            }}
          >
            itchly
          </span>
        </div>

        {showTagline && (
          <span
            id="pitchly-tagline"
            className="text-[8.5px] font-black tracking-[0.22em] text-primary-lime uppercase pt-0.5 opacity-90 group-hover:opacity-100 transition-opacity"
          >
            uganda
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const PLogo: React.FC<Omit<LogoProps, "showText" | "variant"> & { variant?: "light" | "dark" | "black" | "white" | "auto" }> = (props) => {
  return <Logo {...props} showText={false} variant="icon-only" />;
};

export const LogoMark = PLogo;
