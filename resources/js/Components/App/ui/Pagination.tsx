// resources/js/Components/App/ui/Pagination.tsx
//
// Laravel-style pagination link list. Previously reimplemented with inline
// styles in Order/OrdersHistory.tsx, and separately as scoped CSS
// (.vp-pagination / .vp-page-link) in Vendor/Profile.tsx. This version uses
// global .pagination / .pagination-link classes (add these to index.css —
// see the snippet at the bottom of this file) so every paginated list can
// share one definition instead of each page inventing its own.
//
// Usage:
//   <Pagination links={products.meta.links} />

import React from "react";
import { Link } from "@inertiajs/react";

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export default function Pagination({ links }: { links: PaginationLink[] }) {
  if (!links || links.length <= 3) return null;

  return (
    <div className="pagination">
      {links.map((link, i) =>
        link.url ? (
          <Link
            key={i}
            href={link.url}
            className={`pagination-link${link.active ? " active" : ""}`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ) : (
          <span
            key={i}
            className="pagination-link disabled"
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        )
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Add this to index.css (near the .btn/.card rules):
───────────────────────────────────────────── */
//
// .pagination {
//   display: flex;
//   justify-content: center;
//   gap: 6px;
//   flex-wrap: wrap;
//   margin-top: var(--space-2xl);
// }
// .pagination-link {
//   font-family: var(--font-body);
//   font-size: var(--text-xs);
//   letter-spacing: 0.05em;
//   padding: 8px 14px;
//   border: 1px solid var(--color-border);
//   border-radius: var(--radius-sm);
//   color: var(--color-text-muted);
//   background: var(--color-surface);
//   text-decoration: none;
//   transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
// }
// .pagination-link:hover { border-color: var(--color-accent); color: var(--color-text); }
// .pagination-link.active {
//   background: var(--color-primary);
//   border-color: var(--color-primary);
//   color: var(--color-text-inverse);
// }
// .pagination-link.disabled {
//   pointer-events: none;
//   opacity: 0.5;
// }
