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
  const uniqueId = React.useId().replace(/:/g, "");

  // Balanced ball size relative to the letter 'P'
  const ballSize = Math.max(9, Math.round(fontSize * 0.36));
  // Natural upward bounce displacement
  const bounceHeight = Math.max(8, Math.round(fontSize * 0.34));

  const primaryColor = color || "#16A34A";

  return (
    <div
      className="absolute left-[48%] -translate-x-1/2 pointer-events-none select-none z-20"
      style={{
        bottom: "82%",
        width: `${ballSize}px`,
        height: `${ballSize}px`,
      }}
      aria-hidden="true"
    >
      {/* Dynamic Ground Contact Shadow on top of letter 'P' */}
      <motion.div
        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: `${Math.max(6, Math.round(ballSize * 0.72))}px`,
          height: `${Math.max(2, Math.round(ballSize * 0.18))}px`,
          backgroundColor: "#000000",
          filter: "blur(0.8px)",
          transformOrigin: "center center",
        }}
        animate={
          animated
            ? {
                scaleX: [1.2, 0.45, 1.2],
                scaleY: [1.1, 0.45, 1.1],
                opacity: [0.35, 0.08, 0.35],
              }
            : { scaleX: 1, scaleY: 1, opacity: 0.25 }
        }
        transition={{
          duration: 0.72,
          repeat: Infinity,
          times: [0, 0.5, 1],
          ease: ["easeOut", "easeIn"],
        }}
      />

      {/* Physics-driven bouncing container with natural vertical trajectory */}
      <motion.div
        className="w-full h-full relative"
        animate={
          animated
            ? {
                y: [0, -bounceHeight, 0],
              }
            : { y: 0 }
        }
        transition={{
          duration: 0.72,
          repeat: Infinity,
          times: [0, 0.5, 1],
          ease: ["easeOut", "easeIn"],
        }}
      >
        {/* Natural squash & stretch on impact and apex */}
        <motion.div
          className="w-full h-full"
          style={{
            transformOrigin: "bottom center",
          }}
          animate={
            animated
              ? {
                  scaleY: [0.84, 1.08, 1.0, 1.08, 0.84],
                  scaleX: [1.18, 0.94, 1.0, 0.94, 1.18],
                }
              : { scaleY: 1, scaleX: 1 }
          }
          transition={{
            duration: 0.72,
            repeat: Infinity,
            times: [0, 0.15, 0.5, 0.85, 1],
            ease: "easeInOut",
          }}
        >
          {/* Whole Green Ball with smooth spherical lighting and NO patterns or markings */}
          <svg
            viewBox="0 0 32 32"
            className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(22,163,74,0.35)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id={`greenBall-${uniqueId}`} cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="45%" stopColor="#22C55E" />
                <stop offset="85%" stopColor={primaryColor} />
                <stop offset="100%" stopColor="#15803D" />
              </radialGradient>
            </defs>
            <circle
              cx="16"
              cy="16"
              r="14"
              fill={`url(#greenBall-${uniqueId})`}
            />
          </svg>
        </motion.div>
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
