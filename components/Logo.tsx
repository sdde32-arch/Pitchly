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
  const gradientId = `ballGrad_${uid}`;

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
        viewBox="0 0 24 24"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 0 4px rgba(168, 255, 0, 0.95)) drop-shadow(0 0 9px rgba(132, 204, 22, 0.65))",
        }}
      >
        <defs>
          {/* Luminous spherical gradient */}
          <radialGradient id={gradientId} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F4FFB8" />
            <stop offset="35%" stopColor="#A8FF00" />
            <stop offset="75%" stopColor="#65A30D" />
            <stop offset="100%" stopColor="#365314" />
          </radialGradient>
        </defs>

        {/* 1. Concentric ambient halo ring that pulses and breathes in sync with the bounce */}
        <motion.circle
          cx="12"
          cy="12"
          r="10.5"
          fill="none"
          stroke="#A8FF00"
          strokeWidth="0.85"
          strokeDasharray="2.5 1.5"
          animate={animated ? {
            scale: [1.15, 0.88, 0.65, 0.88, 1.15],
            opacity: [0.85, 0.5, 0.25, 0.5, 0.85],
          } : undefined}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.26, 0.5, 0.74, 1],
          }}
          style={{ transformOrigin: "12px 12px" }}
        />

        {/* 2. Floating Ball Sphere with football pattern & dynamic rotation */}
        <motion.g
          animate={animated ? {
            rotate: [0, 90, 180, 270, 360],
          } : undefined}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "12px 12px" }}
        >
          {/* Main sphere */}
          <circle
            cx="12"
            cy="12"
            r="7.5"
            fill={`url(#${gradientId})`}
            stroke="#090D05"
            strokeWidth="0.9"
          />

          {/* Center Football Pentagon */}
          <polygon
            points="12,9.2 14.7,11.1 13.7,14.3 10.3,14.3 9.3,11.1"
            fill="#090D05"
          />

          {/* Seams */}
          <line x1="12" y1="9.2" x2="12" y2="4.8" stroke="#090D05" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="14.7" y1="11.1" x2="19" y2="9.8" stroke="#090D05" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="13.7" y1="14.3" x2="16.5" y2="18.5" stroke="#090D05" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="10.3" y1="14.3" x2="7.5" y2="18.5" stroke="#090D05" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="9.3" y1="11.1" x2="5" y2="9.8" stroke="#090D05" strokeWidth="0.8" strokeLinecap="round" />

          {/* 3D Specular Highlight */}
          <circle
            cx="9.8"
            cy="9.8"
            r="1.4"
            fill="#FFFFFF"
            opacity="0.85"
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
  const ballSize = Math.max(12, Math.round(fontSize * 0.44));
  const ballTopOffset = Math.round(ballSize * 0.88);

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
