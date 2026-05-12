import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlassCard } from "../components/GlassCard";
import { Subtitles } from "../components/Subtitles";

export const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = AUDIO_DURATIONS.solution;

  const sp = (delay: number, cfg = { damping: 14, stiffness: 80 }) => {
    const p = spring({ frame: frame - delay, fps, config: cfg });
    return {
      opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      y: interpolate(p, [0, 1], [16, 0]),
      scale: interpolate(p, [0, 1], [0.93, 1]),
    };
  };

  const header = sp(0, { damping: 18, stiffness: 100 });

  // 4 feature cards, triggered by narration beats
  const cards = [
    {
      delay: 24,
      tag: "DEPLOY",
      title: "Two minutes, zero friction.",
      detail: "Deploy an autonomous AI agent on Solana in under two minutes.",
      color: COLORS.accent,
      accent: false,
    },
    {
      delay: 107,
      tag: "PLAIN ENGLISH",
      title: "Describe your strategy. Claude handles the rest.",
      detail: "Claude Sonnet converts your intent into a typed Swig policy — exact limits, exact tokens.",
      color: COLORS.blue,
      accent: false,
    },
    {
      delay: 290,
      tag: "ON-CHAIN ENFORCEMENT",
      title: "Cryptographic policy. Before any transaction.",
      detail: "Swig enforces the policy at the transaction level before it touches your funds. Not our server. The chain.",
      color: COLORS.cyan,
      accent: false,
    },
    {
      delay: 800,
      tag: "AUTONOMOUS",
      title: "You never touch it again.",
      detail: "Claude Haiku monitors 31 tokens every 5 minutes and trades within your exact constraints.",
      color: COLORS.accent,
      accent: true,
    },
  ];

  const exitOp = interpolate(frame, [dur + 10, dur + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: exitOp }}>
      <AnimatedBackground />

      <div style={{ position: "absolute", top: 72, left: 80, right: 80, zIndex: 10 }}>
        <div style={{ opacity: header.opacity, transform: `translateY(${header.y}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 8 }}>
            THE SOLUTION
          </div>
          <div style={{ fontFamily: INTER, fontSize: 48, fontWeight: 800, color: COLORS.white, lineHeight: 1.1 }}>
            x9 protocol
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 200, left: 80, right: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, zIndex: 10 }}>
        {cards.map(({ delay, tag, title, detail, color, accent }, i) => {
          const a = sp(delay);
          return (
            <div key={i} style={{
              opacity: a.opacity,
              transform: `translateY(${a.y}px) scale(${a.scale})`,
              background: accent ? `rgba(0,255,136,0.08)` : COLORS.bgCard,
              border: `1px solid ${color}${accent ? "55" : "22"}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 16,
              padding: "24px 28px",
              boxShadow: accent ? `0 0 40px ${color}20` : "none",
            }}>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color, letterSpacing: 3, marginBottom: 10 }}>
                {tag}
              </div>
              <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 800, color: accent ? COLORS.accent : COLORS.white, marginBottom: 10, lineHeight: 1.2 }}>
                {title}
              </div>
              <div style={{ fontFamily: INTER, fontSize: 16, color: COLORS.offWhite, lineHeight: 1.5 }}>
                {detail}
              </div>
            </div>
          );
        })}
      </div>

      <Subtitles entries={SUBTITLES.solution} />
    </AbsoluteFill>
  );
};
