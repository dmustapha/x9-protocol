import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlassCard } from "../components/GlassCard";
import { Subtitles } from "../components/Subtitles";

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = AUDIO_DURATIONS.problem;

  const sp = (delay: number, cfg = { damping: 14, stiffness: 80 }) => {
    const p = spring({ frame: frame - delay, fps, config: cfg });
    return {
      opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      y: interpolate(p, [0, 1], [16, 0]),
      scale: interpolate(p, [0, 1], [0.93, 1]),
    };
  };

  const header = sp(0, { damping: 18, stiffness: 100 });

  // Three problem items (left column)
  const p1 = sp(30);
  const p2 = sp(110);
  const p3 = sp(252);

  // "The enforcement is advisory." — standalone moment at frame 530
  const advisoryProg = spring({ frame: frame - 530, fps, config: { damping: 20, stiffness: 60 } });
  const advisoryOp = interpolate(advisoryProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const advisoryY = interpolate(advisoryProg, [0, 1], [24, 0]);
  const advisoryScale = interpolate(advisoryProg, [0, 1], [0.9, 1]);

  // Right column: void / nothing
  const voidProg = spring({ frame: frame - 40, fps, config: { damping: 16, stiffness: 70 } });
  const voidOp = interpolate(voidProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const nothingProg = spring({ frame: frame - 552, fps, config: { damping: 20, stiffness: 55 } });
  const nothingOp = interpolate(nothingProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const nothingScale = interpolate(nothingProg, [0, 1], [0.85, 1]);

  const exitOp = interpolate(frame, [dur + 10, dur + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const problems = [
    { text: "You pick from a menu of templates.", sub: "No customization to your strategy", delay: 30 },
    { text: "Settings live in someone's database.", sub: "Not yours. Not verifiable. Not on-chain.", delay: 110 },
    { text: "No way to verify the bot followed intent.", sub: "It could do anything. You'd never know.", delay: 252 },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: exitOp }}>
      <AnimatedBackground />

      <div style={{ position: "absolute", top: 72, left: 80, right: 80, zIndex: 10 }}>
        <div style={{ opacity: header.opacity, transform: `translateY(${header.y}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: COLORS.red, letterSpacing: 3, marginBottom: 8 }}>
            THE PROBLEM
          </div>
          <div style={{ fontFamily: INTER, fontSize: 48, fontWeight: 800, color: COLORS.white, lineHeight: 1.1 }}>
            Most trading tools give you a template.
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ position: "absolute", top: 200, left: 80, right: 80, bottom: 80, display: "flex", gap: 48, zIndex: 10 }}>

        {/* Left: Problem list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {problems.map(({ text, sub, delay }, i) => {
            const a = sp(delay);
            return (
              <div key={i} style={{ opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`, background: COLORS.bgCard, border: `1px solid ${COLORS.red}22`, borderLeft: `3px solid ${COLORS.red}`, borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ fontFamily: INTER, fontSize: 20, fontWeight: 700, color: COLORS.white, marginBottom: 6 }}>
                  {text}
                </div>
                <div style={{ fontFamily: INTER, fontSize: 16, color: COLORS.muted }}>
                  {sub}
                </div>
              </div>
            );
          })}

          {/* The enforcement is advisory. — standalone punchline */}
          <div style={{ opacity: advisoryOp, transform: `translateY(${advisoryY}px) scale(${advisoryScale})`, marginTop: 16 }}>
            <div style={{ fontFamily: INTER, fontSize: 28, fontWeight: 800, color: COLORS.amber, lineHeight: 1.3,
              textShadow: `0 0 20px ${COLORS.amber}60` }}>
              The enforcement is advisory.
            </div>
          </div>
        </div>

        {/* Right: void panel */}
        <div style={{ width: 460, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, opacity: voidOp, border: `1px dashed ${COLORS.muted}40`, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.3)" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COLORS.muted, letterSpacing: 3, marginBottom: 20 }}>
              ON-CHAIN VERIFICATION
            </div>
            {/* Nothing punchline */}
            <div style={{ opacity: nothingOp, transform: `scale(${nothingScale})`, textAlign: "center" }}>
              <div style={{ fontFamily: INTER, fontSize: 80, fontWeight: 900, color: COLORS.red, lineHeight: 1,
                textShadow: `0 0 40px ${COLORS.red}60` }}>
                Nothing.
              </div>
              <div style={{ fontFamily: INTER, fontSize: 16, color: COLORS.muted, marginTop: 12 }}>
                Nothing about it is verifiable on-chain.
              </div>
            </div>
          </div>
        </div>

      </div>

      <Subtitles entries={SUBTITLES.problem} />
    </AbsoluteFill>
  );
};
