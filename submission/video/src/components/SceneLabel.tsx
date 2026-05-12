import React from "react";
import { COLORS } from "../constants";
import { MONO } from "../fonts";

export const SceneLabel: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 12,
      fontWeight: 700,
      color: COLORS.accent,
      letterSpacing: 3,
      opacity: 0.8,
    }}
  >
    {text}
  </div>
);
