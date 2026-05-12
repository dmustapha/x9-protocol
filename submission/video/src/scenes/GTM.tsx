import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlassCard } from "../components/GlassCard";
import { Subtitles } from "../components/Subtitles";

export const GTM: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = AUDIO_DURATIONS.gtm;

  const sp = (delay: number, cfg = { damping: 14, stiffness: 80 }) => {
    const p = spring({ frame: frame - delay, fps, config: cfg });
    return {
      opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      y: interpolate(p, [0, 1], [16, 0]),
      scale: interpolate(p, [0, 1], [0.93, 1]),
    };
  };

  const header = sp(0, { damping: 18, stiffness: 100 });
  const outputCard = sp(10);

  const channels = [
    { label: "Solana Twitter", detail: "P&L curves, block events, Claude's exact reasoning — the content Solana Twitter engages with.", color: COLORS.accent, delay: 135 },
    { label: "Phantom", detail: "Native wallet integration. Already where the users are.", color: COLORS.purple, delay: 280 },
    { label: "Metaplex", detail: "Ecosystem distribution from day one. Agents as NFTs.", color: COLORS.cyan, delay: 400 },
  ];

  const exitOp = interpolate(frame, [dur + 10, dur + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: exitOp }}>
      <AnimatedBackground />

      <div style={{ position: "absolute", top: 72, left: 80, right: 80, zIndex: 10 }}>
        <div style={{ opacity: header.opacity, transform: `translateY(${header.y}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 8 }}>
            GO-TO-MARKET
          </div>
          <div style={{ fontFamily: INTER, fontSize: 48, fontWeight: 800, color: COLORS.white, lineHeight: 1.1 }}>
            Shareable output by default.
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 200, left: 80, right: 80, display: "flex", gap: 40, zIndex: 10 }}>

        {/* Left: output types */}
        <div style={{ width: 420 }}>
          <div style={{
            opacity: outputCard.opacity,
            transform: `translateY(${outputCard.y}px) scale(${outputCard.scale})`,
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: "24px 28px",
          }}>
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 16 }}>
              EVERY AGENT GENERATES
            </div>
            {["P&L curves", "Block events with reasoning", "Claude's exact trade rationale"].map((item, i) => {
              const p = spring({ frame: frame - (30 + i * 40), fps, config: { damping: 14, stiffness: 80 } });
              const op = interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
              const y2 = interpolate(p, [0, 1], [8, 0]);
              return (
                <div key={i} style={{ opacity: op, transform: `translateY(${y2}px)`, display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.accent, flexShrink: 0 }} />
                  <div style={{ fontFamily: INTER, fontSize: 18, color: COLORS.white }}>{item}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: channels */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {channels.map(({ label, detail, color, delay }, i) => {
            const a = sp(delay);
            return (
              <div key={i} style={{
                opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`,
                background: COLORS.bgCard, border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`,
                borderRadius: 14, padding: "18px 24px",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color, letterSpacing: 2, marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontFamily: INTER, fontSize: 16, color: COLORS.offWhite, lineHeight: 1.4 }}>
                  {detail}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <Subtitles entries={SUBTITLES.gtm} />
    </AbsoluteFill>
  );
};
