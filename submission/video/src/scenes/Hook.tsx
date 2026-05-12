import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlowText } from "../components/GlowText";
import { Subtitles } from "../components/Subtitles";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = AUDIO_DURATIONS.hook;

  // "24" counter — markets run 24h
  const countVal = Math.min(Math.floor(interpolate(frame, [5, 80], [0, 24], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 24);

  const counterProg = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 100 } });
  const counterOp = interpolate(counterProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const counterScale = interpolate(counterProg, [0, 1], [0.85, 1]);

  // Subtitle: "The average trader does not." — pause hold at frame ~112
  const contrastProg = spring({ frame: frame - 112, fps, config: { damping: 20, stiffness: 70 } });
  const contrastOp = interpolate(contrastProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const contrastY = interpolate(contrastProg, [0, 1], [12, 0]);

  // Brand line
  const brandProg = spring({ frame: frame - 220, fps, config: { damping: 15, stiffness: 80 } });
  const brandOp = interpolate(brandProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const brandY = interpolate(brandProg, [0, 1], [20, 0]);

  // Tagline
  const tagProg = spring({ frame: frame - 280, fps, config: { damping: 15, stiffness: 80 } });
  const tagOp = interpolate(tagProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const tagY = interpolate(tagProg, [0, 1], [16, 0]);

  // Exit
  const exitOp = interpolate(frame, [dur + 10, dur + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: exitOp }}>
      <AnimatedBackground />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10 }}>

        {/* Main counter: 24h */}
        <div style={{ opacity: counterOp, transform: `scale(${counterScale})`, textAlign: "center", marginBottom: 8 }}>
          <span style={{
            fontFamily: INTER, fontSize: 180, fontWeight: 900,
            color: COLORS.accent,
            textShadow: `0 0 40px ${COLORS.accent}80, 0 0 120px ${COLORS.accent}30`,
            lineHeight: 1,
          }}>
            {countVal}
          </span>
          <span style={{
            fontFamily: INTER, fontSize: 72, fontWeight: 900,
            color: COLORS.accent, opacity: 0.7, marginLeft: 8,
          }}>
            h
          </span>
        </div>

        {/* "crypto markets run" label */}
        <div style={{ opacity: counterOp, fontFamily: MONO, fontSize: 16, fontWeight: 700, color: COLORS.muted, letterSpacing: 4, textTransform: "uppercase", marginBottom: 64 }}>
          crypto markets run every hour of every day
        </div>

        {/* Separator */}
        <div style={{
          width: interpolate(frame, [100, 160], [0, 400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.border}, transparent)`,
          marginBottom: 48,
        }} />

        {/* "The average trader does not." */}
        <div style={{ opacity: contrastOp, transform: `translateY(${contrastY}px)`, textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: INTER, fontSize: 42, fontWeight: 700, color: COLORS.offWhite, lineHeight: 1.3 }}>
            The average trader does not.
          </div>
        </div>

        {/* Brand */}
        <div style={{ opacity: brandOp, transform: `translateY(${brandY}px)`, textAlign: "center", marginBottom: 16 }}>
          <div style={{
            fontFamily: INTER, fontSize: 56, fontWeight: 900,
            background: `linear-gradient(135deg, ${COLORS.accentBright}, ${COLORS.accent})`,
            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            x9 protocol
          </div>
        </div>

        {/* Tagline */}
        <div style={{ opacity: tagOp, transform: `translateY(${tagY}px)` }}>
          <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 500, color: COLORS.muted, textAlign: "center", letterSpacing: 1 }}>
            That gap is the product opportunity.
          </div>
        </div>

      </AbsoluteFill>
      <Subtitles entries={SUBTITLES.hook} />
    </AbsoluteFill>
  );
};
