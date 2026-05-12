import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS, FPS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlassCard } from "../components/GlassCard";
import { Subtitles } from "../components/Subtitles";

export const Revenue: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = AUDIO_DURATIONS.revenue;

  const sp = (delay: number, cfg = { damping: 14, stiffness: 80 }) => {
    const p = spring({ frame: frame - delay, fps, config: cfg });
    return {
      opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      y: interpolate(p, [0, 1], [16, 0]),
      scale: interpolate(p, [0, 1], [0.93, 1]),
    };
  };

  const header = sp(0, { damping: 18, stiffness: 100 });
  const pricingAnim = sp(20, { damping: 20, stiffness: 90 });

  // Agent counter 0 → 1000 starting at frame 196
  const agentCount = Math.floor(interpolate(frame, [196, 380], [0, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const counterProg = spring({ frame: frame - 196, fps, config: { damping: 18, stiffness: 80 } });
  const counterOp = interpolate(counterProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const arrAnim = sp(410, { damping: 18, stiffness: 80 });

  const exitOp = interpolate(frame, [dur + 10, dur + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: exitOp }}>
      <AnimatedBackground />

      <div style={{ position: "absolute", top: 72, left: 80, right: 80, zIndex: 10 }}>
        <div style={{ opacity: header.opacity, transform: `translateY(${header.y}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 8 }}>
            REVENUE MODEL
          </div>
          <div style={{ fontFamily: INTER, fontSize: 48, fontWeight: 800, color: COLORS.white }}>
            Per-agent subscription.
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 200, left: 80, right: 80, zIndex: 10, display: "flex", gap: 40, alignItems: "flex-start" }}>

        {/* Pricing */}
        <div style={{ flex: 1, opacity: pricingAnim.opacity, transform: `translateY(${pricingAnim.y}px) scale(${pricingAnim.scale})` }}>
          <div style={{ fontFamily: INTER, fontSize: 96, fontWeight: 900, color: COLORS.accent, lineHeight: 1, textShadow: `0 0 60px ${COLORS.accent}50` }}>
            $15–$30
          </div>
          <div style={{ fontFamily: INTER, fontSize: 24, color: COLORS.offWhite, marginTop: 8 }}>
            per agent / month
          </div>
        </div>

        {/* Counter + ARR */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ opacity: counterOp }}>
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "24px 28px" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COLORS.muted, letterSpacing: 3, marginBottom: 10 }}>
                ACTIVE AGENTS
              </div>
              <div style={{ fontFamily: INTER, fontSize: 72, fontWeight: 900, color: COLORS.white, lineHeight: 1 }}>
                {agentCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ opacity: arrAnim.opacity, transform: `translateY(${arrAnim.y}px) scale(${arrAnim.scale})`, background: `rgba(0,255,136,0.08)`, border: `1px solid ${COLORS.accent}44`, borderRadius: 16, padding: "24px 28px" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: 3, marginBottom: 10 }}>
              ARR AT 1K AGENTS
            </div>
            <div style={{ fontFamily: INTER, fontSize: 42, fontWeight: 900, color: COLORS.accent, lineHeight: 1 }}>
              $180K – $360K
            </div>
            <div style={{ fontFamily: INTER, fontSize: 16, color: COLORS.muted, marginTop: 8 }}>
              Trade volume take-rate scales that further.
            </div>
          </div>
        </div>

      </div>

      <Subtitles entries={SUBTITLES.revenue} />
    </AbsoluteFill>
  );
};
