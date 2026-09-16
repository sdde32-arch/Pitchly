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

/**
 * Bouncing Green Ball on top of the 'P'
 * Dynamic energetic physics-inspired bouncing soccer/green ball with squash and stretch.
 */
export const BouncingBall: React.FC<{
  fontSize: number;
  animated?: boolean;
  color?: string;
}> = ({ fontSize, animated = true, color = "#16A34A" }) => {
  // Balanced ball size relative to the letter 'P'
  const ballSize = Math.max(8, Math.round(fontSize * 0.32));
  // Tight, bouncy upward displacement with squash & stretch
  const bounceHeight = Math.max(7, Math.round(fontSize * 0.28));

  return (
    <div
      className="absolute left-[48%] -translate-x-1/2 pointer-events-none select-none z-20"
      style={{
        bottom: "84%",
        width: `${ballSize}px`,
        height: `${ballSize}px`,
      }}
      aria-hidden="true"
    >
      <motion.div
        className="w-full h-full rounded-full shadow-sm flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: color,
          transformOrigin: "bottom center",
          boxShadow: "0 1px 3px rgba(22, 163, 74, 0.4)",
        }}
        animate={
          animated
            ? {
                y: [0, -bounceHeight, 0],
                scaleY: [0.82, 1.1, 0.82],
                scaleX: [1.18, 0.92, 1.18],
                rotate: [0, 45, 90],
              }
            : { y: 0, scaleY: 1, scaleX: 1, rotate: 0 }
        }
        transition={{
          duration: 0.72,
          repeat: Infinity,
          ease: ["easeOut", "easeIn"],
          times: [0, 0.5, 1],
        }}
      >
        {/* Subtle soccer pentagon highlight */}
        <div
          className="w-1/3 h-1/3 rounded-full opacity-70"
          style={{ backgroundColor: "#FFFFFF" }}
        />
      </motion.div>
    </div>
  );
};

export const BouncingNeonBall = BouncingBall;
export const BouncingBallWithShadow = BouncingBall;

/**
 * Icon-only Emblem for Pitchly
 * Renders the fatter, bubbly letter 'P' with the green bouncing ball.
 */
export const PitchlyEmblem: React.FC<{
  size: number;
  animated?: boolean;
  variant?: string;
  className?: string;
}> = ({ size, animated = true, variant = "auto", className = "" }) => {
  const isDarkVariant = variant === "white" || variant === "dark";
  const textColor = isDarkVariant ? "#FFFFFF" : "var(--text-primary, #0F172A)";
  const pFontSize = Math.max(22, Math.round(size * 0.82));

  return (
    <motion.div
      className={`relative shrink-0 select-none inline-flex items-center justify-center ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      whileHover={animated ? { scale: 1.05 } : undefined}
      whileTap={animated ? { scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span className="relative inline-flex items-baseline" style={{ color: textColor }}>
        <BouncingBall fontSize={pFontSize} animated={animated} />
        <span
          className="font-display font-black tracking-tight select-none leading-none"
          style={{
            fontSize: `${pFontSize}px`,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            fontWeight: 900,
            textShadow: "0 0.5px 1px rgba(0,0,0,0.12)",
          }}
        >
          P
        </span>
      </span>
    </motion.div>
  );
};

/**
 * Main Pitchly Logo Component throughout the app:
 * - NO icon badge / separate squircle
 * - Just the clean, fatter, bubbly "Pitchly" wordmark in the exact Sora font
 * - A green bouncing ball animated on top of the capital letter 'P'
 */
export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 32,
  showText = true,
  showTagline = false,
  variant = "auto",
  animated = true,
}) => {
  let textColorClass = "text-text-primary";
  if (variant === "black" || variant === "light") {
    textColorClass = "text-[#0F172A]";
  } else if (variant === "white") {
    textColorClass = "text-white";
  } else if (variant === "dark") {
    textColorClass = "text-[#F8FAFC]";
  }

  // Fatter, bubbly font sizing
  const fontSize = Math.max(20, Math.round(size * 0.72));
  const pFontSize = Math.round(fontSize * 1.06);

  // Icon-only view (e.g. collapsed or avatar icon)
  if (!showText || variant === "icon-only") {
    return (
      <div
        className={`inline-flex items-center justify-center select-none cursor-pointer ${className}`}
        id="pitchly-brand-icon"
        aria-label="Pitchly"
      >
        <span className="relative inline-flex items-baseline">
          <BouncingBall fontSize={pFontSize} animated={animated} />
          <span
            className="font-display font-black tracking-tight select-none leading-none"
            style={{
              fontSize: `${pFontSize}px`,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            P
          </span>
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={`inline-flex items-center select-none cursor-pointer group ${textColorClass} ${className}`}
      id="pitchly-brand-logo"
      aria-label="Pitchly"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 450, damping: 24 }}
    >
      <div className="flex flex-col items-start justify-center leading-none">
        <div className="flex items-baseline justify-center">
          {/* Fatter, bubbly letter 'P' with energetic bouncing green ball right on top */}
          <span className="relative inline-flex items-baseline">
            <BouncingBall fontSize={pFontSize} animated={animated} />
            <span
              className="font-display font-black tracking-tight select-none leading-none text-current"
              style={{
                fontSize: `${pFontSize}px`,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              P
            </span>
          </span>

          {/* Rest of the fatter, bubbly wordmark "itchly" */}
          <span
            className="font-display font-black tracking-tight select-none leading-none text-current"
            style={{
              fontSize: `${fontSize}px`,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            itchly
          </span>
        </div>

        {showTagline && (
          <span
            id="pitchly-tagline"
            className="text-[8.5px] font-black tracking-[0.24em] text-primary-lime uppercase pt-1 opacity-90 group-hover:opacity-100 transition-opacity select-none leading-none"
          >
            Uganda
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const PLogo: React.FC<
  Omit<LogoProps, "showText" | "variant"> & {
    variant?: "light" | "dark" | "black" | "white" | "auto";
  }
> = (props) => {
  return <Logo {...props} showText={false} variant="icon-only" />;
};

export const LogoMark = PLogo;
