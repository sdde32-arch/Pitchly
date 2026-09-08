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
 * Bouncing Green Ball
 * Clean, solid darker green ball without any glare or glow, bouncing directly
 * on top of the letter 'p' with physics-based squash & stretch on impact.
 * No ground shadow, no glow filter, no specular glare.
 */
export const BouncingBall: React.FC<{
  fontSize: number;
  animated?: boolean;
  color?: string;
}> = ({ fontSize, animated = true, color = "#15803D" }) => {
  // Proportional sizing: ball is balanced relative to the letter 'p'
  const ballSize = Math.max(7, Math.round(fontSize * 0.27));
  // Tight, energetic bounce: rises naturally without disconnecting from the letter
  const bounceHeight = Math.max(5, Math.round(fontSize * 0.18));

  return (
    <div
      className="absolute left-[52%] -translate-x-1/2 pointer-events-none select-none z-10"
      style={{
        bottom: "71%",
        width: `${ballSize}px`,
        height: `${ballSize}px`,
      }}
      aria-hidden="true"
    >
      <motion.div
        className="w-full h-full rounded-full"
        style={{
          backgroundColor: color,
          transformOrigin: "bottom center",
        }}
        animate={
          animated
            ? {
                y: [0, -bounceHeight, 0],
                scaleY: [0.88, 1.05, 0.88],
                scaleX: [1.12, 0.95, 1.12],
              }
            : { y: 0, scaleY: 1, scaleX: 1 }
        }
        transition={{
          duration: 0.82,
          repeat: Infinity,
          ease: ["easeOut", "easeIn"],
          times: [0, 0.5, 1],
        }}
      />
    </div>
  );
};

// Aliases for backwards compatibility with existing imports
export const BouncingNeonBall = BouncingBall;
export const BouncingBallWithShadow = BouncingBall;

/**
 * Pitchly Brand Mark Icon (Icon-only mode)
 * Renders the single letter 'p' with the green bouncing ball.
 */
export const PitchlyEmblem: React.FC<{
  size: number;
  animated?: boolean;
  variant?: string;
}> = ({ size, animated = true, variant = "auto" }) => {
  const isDarkVariant = variant === "white" || variant === "dark";
  const textColor = isDarkVariant ? "#FFFFFF" : "#0F172A";
  const pFontSize = Math.max(22, Math.round(size * 0.78));

  return (
    <motion.div
      className="relative shrink-0 select-none inline-flex items-center justify-center"
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
          className="font-display font-extrabold tracking-tight text-current select-none leading-none"
          style={{ fontSize: `${pFontSize}px`, letterSpacing: "-0.035em", lineHeight: 1 }}
        >
          p
        </span>
      </span>
    </motion.div>
  );
};

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 36,
  showText = true,
  showTagline = false,
  variant = "auto",
  animated = true,
}) => {
  // Determine color styling based on variant
  let textColorClass = "text-text-primary";
  if (variant === "black" || variant === "light") {
    textColorClass = "text-[#0F172A]";
  } else if (variant === "white") {
    textColorClass = "text-white";
  } else if (variant === "dark") {
    textColorClass = "text-[#F8FAFC]";
  }

  // Optical balance: base font size with subtle 8% emphasis on 'p' for brand presence
  const fontSize = Math.max(18, Math.round(size * 0.68));
  const pFontSize = Math.round(fontSize * 1.08);

  // When only the icon is requested (icon-only mode)
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
            className="font-display font-extrabold tracking-tight text-current select-none leading-none"
            style={{ fontSize: `${pFontSize}px`, letterSpacing: "-0.035em", lineHeight: 1 }}
          >
            p
          </span>
        </span>
      </div>
    );
  }

  // Full Brand Logo: The clean wordmark "pitchly" with the letter 'p' subtly prominent,
  // and the solid darker green ball bouncing directly on top of the letter 'p'.
  // Harmonious typography, zero glare, zero blur.
  return (
    <motion.div
      className={`inline-flex items-center select-none cursor-pointer group ${textColorClass} ${className}`}
      id="pitchly-brand-logo"
      aria-label="Pitchly"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 450, damping: 24 }}
    >
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="flex items-baseline justify-center">
          {/* Hero Letter 'p' with the solid darker green ball bouncing on top */}
          <span className="relative inline-flex items-baseline">
            <BouncingBall fontSize={pFontSize} animated={animated} />
            <span
              className="font-display font-extrabold tracking-tight text-current select-none leading-none"
              style={{ fontSize: `${pFontSize}px`, letterSpacing: "-0.035em", lineHeight: 1 }}
            >
              p
            </span>
          </span>

          {/* Harmonious continuation of the wordmark aligned at the baseline */}
          <span
            className="font-display font-extrabold tracking-tight text-current select-none leading-none"
            style={{ fontSize: `${fontSize}px`, letterSpacing: "-0.035em", lineHeight: 1 }}
          >
            itchly
          </span>
        </div>

        {showTagline && (
          <span
            id="pitchly-tagline"
            className="text-[8.5px] font-black tracking-[0.28em] text-[#15803D] uppercase pt-1.5 text-center opacity-95 group-hover:opacity-100 transition-opacity select-none leading-none"
          >
            uganda
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

