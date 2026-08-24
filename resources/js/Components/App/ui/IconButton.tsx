// resources/js/Components/App/ui/IconButton.tsx
//
// Consolidates the "circular translucent gold/dark button with an SVG or ×
// glyph inside" pattern found hand-rolled in multiple places: Gallery's
// Lightbox (prev/next/close), Home.tsx's category modal close button,
// Vouchers/Index.tsx, BookingWidget.tsx, OrdersHistory.tsx, etc. — each
// with slightly different sizes/opacities/colors.
//
// Two tones cover what's been seen in the wild:
//   "gold"  — translucent gold bg/border, white icon (used on photos/dark overlays)
//   "dark"  — translucent dark bg, white icon (used on lighter modal chrome)
//
// Usage:
//   <IconButton onClick={onClose} aria-label="Close">×</IconButton>
//   <IconButton onClick={onPrev} aria-label="Previous" size={48}>
//     <ArrowIcon />
//   </IconButton>

import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "gold" | "dark";
  size?: number;
  children: React.ReactNode;
}

const toneStyles: Record<"gold" | "dark", React.CSSProperties> = {
  gold: {
    background: "rgba(201,169,110,0.12)",
    border: "1px solid rgba(201,169,110,0.3)",
  },
  dark: {
    background: "rgba(18,16,13,0.65)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
};

export default function IconButton({
  tone = "gold",
  size = 40,
  style,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      style={{
        width: size,
        height: size,
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...toneStyles[tone],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
