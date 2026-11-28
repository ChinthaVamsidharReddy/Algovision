"use client";

import { useEffect, useRef } from "react";
import type { Scene3D } from "@/lib/scene3d/types";
import { createStage, type Stage } from "./stage";

/** The 3D picture of a scene description. Loaded lazily, so three.js only downloads when someone opens a 3D story. */
export default function SceneCanvas({ scene, width, height }: { scene: Scene3D; width: number; height: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const latest = useRef(scene);
  latest.current = scene;
  const applied = useRef<Scene3D | null>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let st: Stage;
    try {
      st = createStage(el, width, height);
    } catch {
      return; // WebGL refused to start: the scene stays empty and the narration still tells the story
    }
    stage.current = st;
    st.update(latest.current, true);
    applied.current = latest.current;
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => st.setVisible(entries.some((e) => e.isIntersecting)), { threshold: 0.05 });
      io.observe(el);
    }
    // the colours of the floor follow the light and dark theme
    const mo = new MutationObserver(() => st.update(latest.current, true));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      io?.disconnect();
      mo.disconnect();
      st.dispose();
      stage.current = null;
    };
  }, [width, height]);

  useEffect(() => {
    if (!stage.current || applied.current === scene) return;
    applied.current = scene;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    stage.current.update(scene, reduce === true);
  }, [scene]);

  return <canvas ref={canvas} style={{ width, height }} data-testid="scene3d-canvas" data-people={scene.actors.filter((a) => a.kind === "person" && !a.exit).length} className="absolute left-0 top-0 rounded-lg" />;
}
