import React, { useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import type { PageProps as MyPageProps, Department } from "@/types";

type DataItem = {
  department: string;
};

type DepartmentProps = {
  data?: DataItem[];
};

function Department() {
  const { dpts, data } = usePage().props as MyPageProps & DepartmentProps;

  const scrollRef = useRef<HTMLUListElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const getUniqueDepartment = (
    data: DataItem[] | undefined,
    property: keyof DataItem
  ): string[] => {
    const values = data?.map((item) => item[property]) ?? [];
    return Array.from(new Set(values));
  };

  const uniqueDepartments = getUniqueDepartment(data, "department");


  return (
 <div className="relative w-full space-x-10">
  {/* Left scroll button */}
  <button
    onClick={scrollLeft}
    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-40 text-white font-bold z-10"
  >
    &lt;
  </button>

  {/* Scrollable UL container */}
  <div className="overflow-hidden">
    <ul
      ref={scrollRef}
      className="flex overflow-x-auto whitespace-nowrap gap-6 py-4  items-start scrollbar-hide"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Official departments */}
    {dpts
  .filter((department) => department.active && department.productsCount > 0)
  .map((department) => {

    const isActive = route().current("product.byDepartment", department.slug);
    const imageUrl = department.image_url
      ? 	department.image_url
      : "/images/department-placeholder.png";

    return (
      <li
        key={department.id}
        className="list-none flex flex-col items-center justify-start space-y-1 min-w-[100px]"
      >
        <img
          src={imageUrl}
          alt={department.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg transition-transform duration-300 hover:scale-105"
        />
        <Link
          href={route("product.byDepartment", department.slug)}
          preserveScroll={true}
          preserveState={true}
          className={`text-center px-3 py-1 rounded-full text-xs font-medium transition ${
            isActive
              ? "bg-indigo-600 text-white shadow-md"
              : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
          }`}
        >
          {department.name}
        </Link>
      </li>
    );
  })}

    </ul>
  </div>

  {/* Right scroll button */}
  <button
    onClick={scrollRight}
    className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-60 text-white font-bold z-10"
  >
    &gt;
  </button>
</div>

  );
}

export default Department;
