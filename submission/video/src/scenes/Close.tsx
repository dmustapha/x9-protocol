import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, SUBTITLES, AUDIO_DURATIONS, SCENE_DURATIONS } from "../constants";
import { INTER, MONO } from "../fonts";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { GlowText } from "../components/GlowText";
import { Subtitles } from "../components/Subtitles";

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioDur = AUDIO_DURATIONS.close;
  const sceneDur = SCENE_DURATIONS.close;

  // Corner brackets SVG fade in
  const bracketOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Brand gradient (after leading 46-frame silence)
  const brandProg = spring({ frame: frame - 55, fps, config: { damping: 18, stiffness: 100 } });
  const brandOp = interpolate(brandProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const brandScale = interpolate(brandProg, [0, 1], [0.9, 1]);

  const nameProg = spring({ frame: frame - 100, fps, config: { damping: 15, stiffness: 80 } });
  const nameOp = interpolate(nameProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const nameY = interpolate(nameProg, [0, 1], [20, 0]);

  const tagProg = spring({ frame: frame - 150, fps, config: { damping: 15, stiffness: 80 } });
  const tagOp = interpolate(tagProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const tagY = interpolate(tagProg, [0, 1], [16, 0]);

  // "The moment to define it is now." — key pause at frame 547 in audio
  const momentProg = spring({ frame: frame - 560, fps, config: { damping: 22, stiffness: 60 } });
  const momentOp = interpolate(momentProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const momentY = interpolate(momentProg, [0, 1], [20, 0]);

  // URL at frame 590
  const urlProg = spring({ frame: frame - 590, fps, config: { damping: 18, stiffness: 80 } });
  const urlOp = interpolate(urlProg, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const urlY = interpolate(urlProg, [0, 1], [12, 0]);

  // Fade to black: frame 718 → 778
  const fadeToBlack = interpolate(frame, [718, 778], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const CORNER = 55;

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <AnimatedBackground />

      {/* Corner brackets */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: bracketOp, zIndex: 5 }} viewBox="0 0 1920 1080">
        <g stroke={COLORS.accent} strokeWidth="2" fill="none" opacity="0.5">
          <path d={`M 60 ${60 + CORNER} L 60 60 L ${60 + CORNER} 60`} />
          <path d={`M ${1920 - 60 - CORNER} 60 L ${1920 - 60} 60 L ${1920 - 60} ${60 + CORNER}`} />
          <path d={`M 60 ${1080 - 60 - CORNER} L 60 ${1080 - 60} L ${60 + CORNER} ${1080 - 60}`} />
          <path d={`M ${1920 - 60 - CORNER} ${1080 - 60} L ${1920 - 60} ${1080 - 60} L ${1920 - 60} ${1080 - 60 - CORNER}`} />
        </g>
      </svg>

      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, gap: 0 }}>

        {/* "x9" large mark */}
        <div style={{ opacity: brandOp, transform: `scale(${brandScale})`, marginBottom: 16 }}>
          <div style={{
            fontFamily: INTER, fontSize: 120, fontWeight: 900, lineHeight: 1,
            background: `linear-gradient(135deg, ${COLORS.accentBright}, ${COLORS.accent}, ${COLORS.cyan})`,
            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: "none",
          }}>
            x9
          </div>
        </div>

        {/* "I'm Dami, building this full time." */}
        <div style={{ opacity: nameOp, transform: `translateY(${nameY}px)`, marginBottom: 12 }}>
          <div style={{ fontFamily: INTER, fontSize: 28, fontWeight: 600, color: COLORS.offWhite, textAlign: "center" }}>
            I'm Dami, building this full time.
          </div>
        </div>

        {/* Tagline */}
        <div style={{ opacity: tagOp, transform: `translateY(${tagY}px)`, marginBottom: 56 }}>
          <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 500, color: COLORS.muted, textAlign: "center", maxWidth: 700, lineHeight: 1.5 }}>
            Autonomous agents with cryptographic policy enforcement — not a feature bolt-on.
          </div>
        </div>

        {/* "The moment to define it is now." */}
        <div style={{ opacity: momentOp, transform: `translateY(${momentY}px)`, marginBottom: 40 }}>
          <div style={{
            fontFamily: INTER, fontSize: 36, fontWeight: 800, color: COLORS.accent, textAlign: "center",
            textShadow: `0 0 30px ${COLORS.accent}60`,
          }}>
            The moment to define it is now.
          </div>
        </div>

        {/* URL */}
        <div style={{ opacity: urlOp, transform: `translateY(${urlY}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: COLORS.white, textAlign: "center",
            background: `${COLORS.accent}11`, border: `1px solid ${COLORS.accent}33`, borderRadius: 10, padding: "10px 28px" }}>
            x9-protocol.vercel.app
          </div>
        </div>

      </AbsoluteFill>

      {/* Fade to black overlay */}
      <AbsoluteFill style={{ background: "#000", opacity: fadeToBlack, zIndex: 100 }} />

      <Subtitles entries={SUBTITLES.close} />
    </AbsoluteFill>
  );
};
