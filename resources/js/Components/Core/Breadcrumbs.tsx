import React from "react";
import { Link } from "@inertiajs/react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
return (
  <nav className="px-4 sm:px-0" aria-label="Breadcrumb">
    <ol
      role="list"
      className="flex flex-wrap items-center gap-x-1 gap-y-1 sm:gap-x-2"
    >
      {items.map((item, index) => (
        <li key={index} className="flex items-center whitespace-nowrap">
          {index !== 0 && (
            <span className="text-gray-400 mx-2 select-none">/</span>
          )}
          {item.href && !item.current ? (
            <Link
              href={item.href}
              className="rounded-md px-1 py-1 text-sm font-medium text-purple-600 focus:text-gray-900 focus:shadow hover:text-gray-800"
            >
              {item.label}
            </Link>
          ) : (
            <span
              aria-current={item.current ? "page" : undefined}
              className="rounded-md px-1 py-1 text-sm font-bold text-gray-900"
            >
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);


};

export default Breadcrumbs;
