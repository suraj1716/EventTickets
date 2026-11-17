// resources/js/Pages/Events/ShowDemo.tsx
// Renders your REAL Events/Show.tsx with random event data (tour with 3 legs).
import React from "react";
import EventShow from "./Show";
import { makeEventDetails } from "@/utils/demoEventData";

export default function EventShowDemo() {
  const [seed, setSeed] = React.useState(2026);
  const props = React.useMemo(() => makeEventDetails(seed, (seed % 4) + 1, true), [seed]);
  return (
    <>
      <EventShow event={props.event} eventDetails={props.eventDetails as any} />
      <button
        onClick={() => setSeed((s) => s + 1)}
        style={{ position: "fixed", left: 20, bottom: 20, zIndex: 9999, padding: "8px 14px", background: "#FFB627", color: "#0B0B10", border: 0, borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Randomise event
      </button>
    </>
  );
}
