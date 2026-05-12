import React from "react";
import { AbsoluteFill, staticFile, interpolate } from "remotion";
import { Audio } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CROSSFADE, FPS, AUDIO_DURATIONS, SCENE_DURATIONS, AUDIO_FILES } from "./constants";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Solution } from "./scenes/Solution";
import { Moat } from "./scenes/Moat";
import { Market } from "./scenes/Market";
import { GTM } from "./scenes/GTM";
import { Revenue } from "./scenes/Revenue";
import { Close } from "./scenes/Close";

const SceneAudio: React.FC<{ src: string; audioDuration: number }> = ({ src, audioDuration }) => (
  <Audio
    src={staticFile(src)}
    volume={(f) => {
      const fadeIn = interpolate(f, [0, Math.round(FPS * 0.3)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const fadeOut = interpolate(f, [audioDuration - FPS, audioDuration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return Math.min(fadeIn, fadeOut);
    }}
  />
);

const scenes = [
  { id: "hook"     as const, Component: Hook,     dur: SCENE_DURATIONS.hook,     audioDur: AUDIO_DURATIONS.hook },
  { id: "problem"  as const, Component: Problem,  dur: SCENE_DURATIONS.problem,  audioDur: AUDIO_DURATIONS.problem },
  { id: "solution" as const, Component: Solution, dur: SCENE_DURATIONS.solution, audioDur: AUDIO_DURATIONS.solution },
  { id: "moat"     as const, Component: Moat,     dur: SCENE_DURATIONS.moat,     audioDur: AUDIO_DURATIONS.moat },
  { id: "market"   as const, Component: Market,   dur: SCENE_DURATIONS.market,   audioDur: AUDIO_DURATIONS.market },
  { id: "gtm"      as const, Component: GTM,      dur: SCENE_DURATIONS.gtm,      audioDur: AUDIO_DURATIONS.gtm },
  { id: "revenue"  as const, Component: Revenue,  dur: SCENE_DURATIONS.revenue,  audioDur: AUDIO_DURATIONS.revenue },
  { id: "close"    as const, Component: Close,    dur: SCENE_DURATIONS.close,    audioDur: AUDIO_DURATIONS.close },
];

export const MainVideo: React.FC = () => {
  const transition = linearTiming({ durationInFrames: CROSSFADE });
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const elements: React.ReactNode[] = [
            <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.dur}>
              <scene.Component />
              <SceneAudio src={AUDIO_FILES[scene.id]} audioDuration={scene.audioDur} />
            </TransitionSeries.Sequence>,
          ];
          if (i < scenes.length - 1) {
            elements.push(
              <TransitionSeries.Transition key={`t-${scene.id}`} presentation={fade()} timing={transition} />
            );
          }
          return elements;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
