import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { Department } from "@/types";

interface CategoriesDropdownProps {
  departments: Department[];
}

export default function CategoriesDropdown({ departments }: CategoriesDropdownProps) {
  const [expandedDeptId, setExpandedDeptId] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState<boolean>(false);

  // When expandedDeptId changes, show/hide panel with delay for animation
  useEffect(() => {
    if (expandedDeptId !== null) {
      setShowPanel(true);
    } else {
      // Delay hide after animation (300ms)
      const timer = setTimeout(() => setShowPanel(false), 300);
      return () => clearTimeout(timer);
    }
  }, [expandedDeptId]);

  if (departments.length === 0) {
    return (
      <div className="px-4 py-3 text-center text-lg text-gray-500">No departments found.</div>
    );
  }

  return (
   <div className="flex overflow-hidden h-[400px]">

      {/* Department List */}
      <div className="flex-1 overflow-auto">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => setExpandedDeptId(dept.id)}
            className="text-lg w-full text-left px-4 py-1 text-gray-900  hover:bg-gray-100 flex justify-between items-center border-b border-gray-300"
            aria-expanded={expandedDeptId === dept.id}
          >
            <span className="text-left w-full px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-700 transition-colors"
>{dept.name}</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                expandedDeptId === dept.id ? "rotate-90" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Right arrow */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Sliding Panel */}
      <div
        className={`bg-white shadow-lg overflow-auto transition-all duration-300 ease-in-out ${
          expandedDeptId !== null ? "max-w-[420px] opacity-100" : "max-w-0 opacity-0"
        }`}
        style={{ width: expandedDeptId !== null ? "420px" : "0px" }}
      >
        {showPanel && (
          <div className="px-6 py-4 flex flex-col h-full">
            <button
              onClick={() => setExpandedDeptId(null)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              aria-label="Back to departments"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left arrow */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <Link
              href={`/d/${departments.find((d) => d.id === expandedDeptId)?.slug ?? ""}`}
              className="block text-gray-700 px-4 py-2 border-b border-gray-300 font-medium"
              onClick={() => setExpandedDeptId(null)}
            >
              All {departments.find((d) => d.id === expandedDeptId)?.name} Products
            </Link>

            {(departments.find((d) => d.id === expandedDeptId)?.categories ?? []).map(
              (cat, idx, arr) => (
                <Link
                  key={cat.id}
                  href={`/d/${departments.find((d) => d.id === expandedDeptId)?.slug}?category_id=${cat.id}&department_id=${expandedDeptId}&max_price=4000&sort_by=default`}
                  className={`block text-gray-700 px-4 py-2 ${
                    idx !== arr.length - 1 ? "border-b border-gray-300" : ""
                  }`}
                  onClick={() => setExpandedDeptId(null)}
                >
                  {cat.name}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
