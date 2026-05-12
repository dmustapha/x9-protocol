import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { X9_ORBS } from "../constants";

type Orb = {
  baseX: number; baseY: number; size: number;
  color: string; blur: number; opacity: number; speed: number;
};

export const AnimatedBackground: React.FC<{ orbs?: readonly Orb[] }> = ({ orbs = X9_ORBS }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {orbs.map((orb, i) => {
        const x = orb.baseX + Math.sin(frame * orb.speed + i * 1.5) * 90;
        const y = orb.baseY + Math.cos(frame * orb.speed + i * 2.1) * 70;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - orb.size / 2,
              top: y - orb.size / 2,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: orb.color,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
