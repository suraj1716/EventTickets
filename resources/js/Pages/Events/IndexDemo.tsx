// resources/js/Pages/Events/IndexDemo.tsx
// Renders your REAL Events/Index.tsx (search events) with 12 random events,
// categories and filters.
import React from "react";
import EventsIndex from "./Index";
import { makeCategories, makeEventList } from "@/utils/demoEventData";

export default function EventsIndexDemo() {
  const [seed, setSeed] = React.useState(2026);
  const events = React.useMemo(() => {
    const data = makeEventList(seed, 12);
    return { data, total: data.length, has_more: false };
  }, [seed]);
  return (
    <>
      {/* Demo-only: events.data is available on the very first render here, so Index.tsx's
          empty-state motion.div is reused for the card grid and its fade-in is interrupted
          part-way (grid variants never set opacity/scale). Force the final state. */}
      <style>{`.xl\\:grid-cols-3, .xl\\:grid-cols-3 > div { opacity: 1 !important; transform: none !important; }`}</style>
      <EventsIndex events={events as any} filters={{} as any} categories={makeCategories() as any} filteredVendor={null} />
      <button
        onClick={() => setSeed((s) => s + 1)}
        style={{ position: "fixed", left: 20, bottom: 20, zIndex: 9999, padding: "8px 14px", background: "#FFB627", color: "#0B0B10", border: 0, borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Randomise events
      </button>
    </>
  );
}
