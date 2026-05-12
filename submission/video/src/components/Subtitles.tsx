import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { INTER } from "../fonts";
import { SubEntry } from "../constants";

export const Subtitles: React.FC<{ entries: SubEntry[] }> = ({ entries }) => {
  const frame = useCurrentFrame();
  const active = entries.find((e) => frame >= e.start && frame < e.end);
  if (!active) return null;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", zIndex: 50 }}>
      <div
        style={{
          background: "rgba(0,0,0,0.65)",
          borderRadius: 8,
          padding: "10px 28px",
          marginBottom: 56,
          maxWidth: 1400,
        }}
      >
        <div
          style={{
            fontFamily: INTER,
            fontSize: 26,
            fontWeight: 600,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {active.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
