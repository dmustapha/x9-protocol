import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, TERMINAL } from "../constants";
import { MONO } from "../fonts";

type LineColor = "prompt" | "text" | "green" | "yellow" | "red" | "blue" | "purple";

export const Terminal: React.FC<{
  lines: { text: string; color: LineColor }[];
  title?: string;
  charsPerFrame?: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ lines, title = "Terminal", charsPerFrame = 0.8, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const visibleChars = Math.floor(adjustedFrame * charsPerFrame);

  const containerProg = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 120 },
  });
  const containerOp = interpolate(containerProg, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });
  const containerScale = interpolate(containerProg, [0, 1], [0.96, 1]);

  const colorMap: Record<LineColor, string> = {
    prompt: TERMINAL.prompt,
    text: TERMINAL.text,
    green: TERMINAL.green,
    yellow: TERMINAL.yellow,
    red: TERMINAL.red,
    blue: TERMINAL.blue,
    purple: TERMINAL.purple,
  };

  let charCount = 0;
  return (
    <div
      style={{
        width: 1400,
        minHeight: 200,
        background: TERMINAL.bg,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        boxShadow: `0 0 40px ${COLORS.accent}15`,
        overflow: "hidden",
        opacity: containerOp,
        transform: `scale(${containerScale})`,
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: TERMINAL.prompt,
            marginLeft: 8,
          }}
        >
          {title}
        </span>
      </div>
      {/* Lines */}
      <div style={{ padding: "16px 20px" }}>
        {lines.map((line, i) => {
          const lineStart = charCount;
          charCount += line.text.length;
          if (lineStart >= visibleChars) return null;
          const visible = Math.min(line.text.length, visibleChars - lineStart);
          const isTyping = visible < line.text.length && visible > 0;
          return (
            <div
              key={i}
              style={{
                fontFamily: MONO,
                fontSize: 15,
                lineHeight: 1.7,
                color: colorMap[line.color],
                whiteSpace: "pre",
              }}
            >
              {line.text.slice(0, visible)}
              {isTyping && (
                <span
                  style={{
                    opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                    color: COLORS.accent,
                  }}
                >
                  _
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
