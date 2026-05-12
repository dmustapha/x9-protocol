import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile, Img } from "remotion";
import { COLORS, SOCIAL_DURATION } from "./constants";
import { INTER, MONO } from "./fonts";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { GlowText } from "./components/GlowText";

const VERTICAL_ORBS = [
  { baseX: 200,  baseY: 300,  size: 400, color: "#22c55e", blur: 120, opacity: 0.12, speed: 0.006 },
  { baseX: 880,  baseY: 1600, size: 360, color: "#166534", blur: 110, opacity: 0.10, speed: 0.005 },
  { baseX: 540,  baseY: 960,  size: 480, color: "#a855f7", blur: 140, opacity: 0.08, speed: 0.008 },
  { baseX: 100,  baseY: 1400, size: 320, color: "#0090ff", blur: 100, opacity: 0.07, speed: 0.007 },
];

export const SocialClip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SOCIAL_DURATION;

  const exitOp = interpolate(frame, [dur - 20, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoProg = spring({ frame: frame - 20, fps, config: { damping: 18, stiffness: 155 } });
  const logoOp = interpolate(logoProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const logoScale = interpolate(logoProg, [0, 1], [0.85, 1]);
  const sepOp = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlOp = interpolate(frame, [100, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <AnimatedBackground orbs={VERTICAL_ORBS} />
      <AbsoluteFill style={{ flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "80px 60px", zIndex: 10, opacity: exitOp }}>
        <GlowText text="11" fontSize={180} color={COLORS.accent} delay={0} fontWeight={900} glowIntensity={1.5} style={{ marginBottom: 0, lineHeight: 1 }} />
        <GlowText text="INTEGRATIONS" fontSize={28} color={COLORS.offWhite} delay={10} fontWeight={600} style={{ letterSpacing: 4, marginBottom: 60 }} />
        <div style={{ width: 200, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.accent}50, transparent)`, marginBottom: 60, opacity: sepOp }} />
        <div style={{ opacity: logoOp, transform: `scale(${logoScale})`, marginBottom: 24 }}>
          <Img src={staticFile("assets/logo.png")} style={{ width: 100, height: 100, borderRadius: 20, boxShadow: `0 0 40px ${COLORS.accent}40` }} />
        </div>
        <GlowText text="x9 protocol" fontSize={60} color={COLORS.white} delay={30} fontWeight={900} style={{ marginBottom: 20 }} />
        <GlowText text="One loop. Total control." fontSize={34} color={COLORS.accent} delay={50} fontWeight={700} glowIntensity={0.8} style={{ textAlign: "center", marginBottom: 32 }} />
        <GlowText text="Autonomous agents with cryptographic policy enforcement" fontSize={20} color={COLORS.muted} delay={70} fontWeight={500} style={{ textAlign: "center", lineHeight: 1.5 }} />
        <div style={{ marginTop: 60, fontFamily: MONO, fontSize: 18, color: COLORS.accentDim, opacity: urlOp }}>x9-protocol.vercel.app</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
