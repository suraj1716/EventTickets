// resources/js/Components/Events/EventPolicy.tsx
//
// Buyer-side policy section for Events/Show.tsx.
// Long free text (events.policy) — clamped to ~8 lines with a Read more
// toggle so it never pushes the ticket panel off screen.
//
// Same Box Office palette as Events/Show.tsx.

import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  policy?: string | null;
  title?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function EventPolicy({
  policy,
  title = "Policy",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Only show the toggle when the text actually overflows the clamp —
  // a three-line policy shouldn't get a pointless "Read more".
  useLayoutEffect(() => {
    const el = textRef.current;

    if (!el) return;

    setClamped(el.scrollHeight > el.clientHeight + 4);
  }, [policy]);

  if (!policy || policy.trim() === "") {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-[#6B6775] mb-3">
        {title}
      </h2>

      <div className="rounded-2xl border border-[#26232E] bg-[#15141B] p-5">
        <p
          ref={textRef}
          className={[
            "whitespace-pre-line text-[15px] leading-relaxed text-[#D8D5DE]",
            expanded ? "" : "line-clamp-[8]",
          ].join(" ")}
        >
          {policy}
        </p>

        {(clamped || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="mt-3 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wider text-[#FFB627] hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </motion.section>
  );
}
