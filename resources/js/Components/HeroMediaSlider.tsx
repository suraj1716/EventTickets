import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Event } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;


export default function HeroMediaSlider({
  media,
  eventName,
}: {
  media: NonNullable<Event["media"]>;
  eventName: string;
}) {
  const [index, setIndex] = useState(0);

  const items = media.slice(0, 2);
  const hasMultiple = items.length > 1;

  function goTo(i: number) {
    setIndex((i + items.length) % items.length);
  }

  return (
    <div className="absolute inset-0 h-full w-full">
      <AnimatePresence mode="wait">
        {items.map((item, i) =>
          i === index ? (
            <motion.div
              key={item.id ?? i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-0 h-full w-full"
            >
              {item.type === "video" ? (
                <video
                  src={
                    item.path.startsWith("http")
                      ? item.path
                      : `/storage/${item.path}`
                  }
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <img
                  src={
                    item.path.startsWith("http")
                      ? item.path
                      : `/storage/${item.path}`
                  }
                  alt={eventName}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </motion.div>
          ) : null,
        )}
      </AnimatePresence>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous media"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur text-white/80 hover:text-white hover:border-white/30 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next media"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur text-white/80 hover:text-white hover:border-white/30 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id ?? i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to media ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
