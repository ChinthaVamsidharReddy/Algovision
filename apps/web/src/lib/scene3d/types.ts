/**
 * A description of a real-world scene, produced by a story as a pure function of the trace.
 * The renderer (three.js, loaded only when needed) turns it into moving 3D figures, so a story can never disagree with the algorithm.
 */
export type ActorKind = "person" | "clerk";

export interface Actor3D {
  /** Stable across steps, so the same person is the same figure and walks between places. */
  id: string;
  kind: ActorKind;
  /** Where the figure stands (x along the line, z toward the viewer). */
  x: number;
  z: number;
  /** Where a brand-new figure first appears; ignored once it exists. */
  from?: { x: number; z: number };
  /** The way the figure faces when standing still, in radians (0 faces the viewer, -PI/2 faces left). */
  face?: number;
  color: number;
  /** A number floating above the head. */
  label?: string;
  holds?: "ticket";
  pose?: "idle" | "serve";
  /** Leaving the scene: finishes its walk to (x, z) and then disappears, even if later descriptions no longer list it. */
  exit?: boolean;
}

export interface Prop3D {
  id: string;
  kind: "counter" | "spot";
  x: number;
  z: number;
  sign?: string;
}

export interface Scene3D {
  /** Left and right edges the camera must keep in view. */
  minX: number;
  maxX: number;
  actors: Actor3D[];
  props: Prop3D[];
}
