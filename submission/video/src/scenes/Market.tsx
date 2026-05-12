import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlassCard } from "../components/GlassCard";
import { Subtitles } from "../components/Subtitles";

export const Market: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = AUDIO_DURATIONS.market;

  const sp = (delay: number, cfg = { damping: 14, stiffness: 80 }) => {
    const p = spring({ frame: frame - delay, fps, config: cfg });
    return {
      opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      y: interpolate(p, [0, 1], [16, 0]),
      scale: interpolate(p, [0, 1], [0.93, 1]),
    };
  };

  const header = sp(0, { damping: 18, stiffness: 100 });
  const statProg = spring({ frame: frame - 20, fps, config: { damping: 18, stiffness: 100 } });
  const statOp = interpolate(statProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const statScale = interpolate(statProg, [0, 1], [0.85, 1]);

  const traderStat = sp(185);
  const adjCard = sp(440);

  const exitOp = interpolate(frame, [dur + 10, dur + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: exitOp }}>
      <AnimatedBackground />

      <div style={{ position: "absolute", top: 72, left: 80, right: 80, zIndex: 10 }}>
        <div style={{ opacity: header.opacity, transform: `translateY(${header.y}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 8 }}>
            THE MARKET
          </div>
          <div style={{ fontFamily: INTER, fontSize: 48, fontWeight: 800, color: COLORS.white }}>
            Solana is already there.
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 200, left: 80, right: 80, zIndex: 10 }}>

        {/* Primary stat */}
        <div style={{ opacity: statOp, transform: `scale(${statScale})`, marginBottom: 40 }}>
          <div style={{ fontFamily: INTER, fontSize: 96, fontWeight: 900, color: COLORS.accent, lineHeight: 1,
            textShadow: `0 0 60px ${COLORS.accent}60` }}>
            $1B – $4B
          </div>
          <div style={{ fontFamily: INTER, fontSize: 22, color: COLORS.offWhite, marginTop: 8 }}>
            DEX volume every single day on Solana
          </div>
        </div>

        {/* Traders stat */}
        <div style={{ opacity: traderStat.opacity, transform: `translateY(${traderStat.y}px) scale(${traderStat.scale})`, marginBottom: 40, display: "flex", alignItems: "baseline", gap: 16 }}>
          <div style={{ fontFamily: INTER, fontSize: 64, fontWeight: 900, color: COLORS.white, lineHeight: 1 }}>
            Millions
          </div>
          <div style={{ fontFamily: INTER, fontSize: 22, color: COLORS.offWhite }}>
            of active traders already on-chain, already using wallets.
          </div>
        </div>

        {/* Adjacent market */}
        <div style={{ opacity: adjCard.opacity, transform: `translateY(${adjCard.y}px) scale(${adjCard.scale})`, background: COLORS.bgCard, border: `1px solid ${COLORS.blue}33`, borderLeft: `3px solid ${COLORS.blue}`, borderRadius: 16, padding: "20px 28px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COLORS.blue, letterSpacing: 3, marginBottom: 8 }}>
            ADJACENT MARKET
          </div>
          <div style={{ fontFamily: INTER, fontSize: 20, fontWeight: 700, color: COLORS.white }}>
            Small crypto funds without engineering teams.
          </div>
          <div style={{ fontFamily: INTER, fontSize: 16, color: COLORS.muted, marginTop: 6 }}>
            Want automated execution without sending funds to a CEX.
          </div>
        </div>

      </div>

      <Subtitles entries={SUBTITLES.market} />
    </AbsoluteFill>
  );
};
