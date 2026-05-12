import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlassCard } from "../components/GlassCard";
import { Subtitles } from "../components/Subtitles";

export const Moat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = AUDIO_DURATIONS.moat;

  const sp = (delay: number, cfg = { damping: 14, stiffness: 80 }) => {
    const p = spring({ frame: frame - delay, fps, config: cfg });
    return {
      opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      y: interpolate(p, [0, 1], [16, 0]),
      scale: interpolate(p, [0, 1], [0.93, 1]),
    };
  };

  const header = sp(0, { damping: 18, stiffness: 100 });
  const swigCard = sp(40);
  const identityCard = sp(190);

  // 3 tech badges: Metaplex, Bonfida, Ika
  const badges = [
    { name: "Metaplex Core", color: COLORS.purple },
    { name: "Bonfida SNS",   color: COLORS.blue },
    { name: "Ika MPC",       color: COLORS.cyan },
  ];

  const closingProg = spring({ frame: frame - 620, fps, config: { damping: 16, stiffness: 70 } });
  const closingOp = interpolate(closingProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const closingY = interpolate(closingProg, [0, 1], [16, 0]);

  const exitOp = interpolate(frame, [dur + 10, dur + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: exitOp }}>
      <AnimatedBackground />

      <div style={{ position: "absolute", top: 72, left: 80, right: 80, zIndex: 10 }}>
        <div style={{ opacity: header.opacity, transform: `translateY(${header.y}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 8 }}>
            THE MOAT
          </div>
          <div style={{ fontFamily: INTER, fontSize: 48, fontWeight: 800, color: COLORS.white, lineHeight: 1.1 }}>
            Defensible by design.
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 200, left: 80, right: 80, zIndex: 10, display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Swig enforcement card */}
        <div style={{
          opacity: swigCard.opacity, transform: `translateY(${swigCard.y}px) scale(${swigCard.scale})`,
          background: COLORS.bgCard, border: `1px solid ${COLORS.accent}33`, borderLeft: `3px solid ${COLORS.accent}`,
          borderRadius: 16, padding: "24px 32px",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 8 }}>
            ENFORCEMENT LAYER — NOT THE AI LAYER
          </div>
          <div style={{ fontFamily: INTER, fontSize: 24, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>
            Swig's policy runs at the transaction level.
          </div>
          <div style={{ fontFamily: INTER, fontSize: 18, color: COLORS.offWhite, lineHeight: 1.5 }}>
            Before the chain processes anything. The agent cannot exceed your limits — even if Claude decides it should.
          </div>
        </div>

        {/* On-chain identity card */}
        <div style={{
          opacity: identityCard.opacity, transform: `translateY(${identityCard.y}px) scale(${identityCard.scale})`,
          background: COLORS.bgCard, border: `1px solid ${COLORS.purple}33`, borderLeft: `3px solid ${COLORS.purple}`,
          borderRadius: 16, padding: "24px 32px",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.purple, letterSpacing: 3, marginBottom: 12 }}>
            PERMANENT ON-CHAIN IDENTITY
          </div>
          <div style={{ fontFamily: INTER, fontSize: 20, fontWeight: 700, color: COLORS.white, marginBottom: 16 }}>
            Every agent gets three primitives a competitor can't fake:
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {badges.map(({ name, color }, i) => {
              const p = spring({ frame: frame - (385 + i * 60), fps, config: { damping: 14, stiffness: 80 } });
              const op = interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
              const scale = interpolate(p, [0, 1], [0.9, 1]);
              return (
                <div key={i} style={{
                  opacity: op, transform: `scale(${scale})`,
                  background: `${color}11`, border: `1px solid ${color}44`, borderRadius: 10,
                  padding: "10px 20px", fontFamily: MONO, fontSize: 14, fontWeight: 700, color,
                }}>
                  {name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Closing line */}
        <div style={{ opacity: closingOp, transform: `translateY(${closingY}px)` }}>
          <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 700, color: COLORS.muted, borderTop: `1px solid ${COLORS.border}`, paddingTop: 20 }}>
            A competitor who wants to copy this needs the same on-chain primitives — not just the same interface.
          </div>
        </div>

      </div>

      <Subtitles entries={SUBTITLES.moat} />
    </AbsoluteFill>
  );
};
