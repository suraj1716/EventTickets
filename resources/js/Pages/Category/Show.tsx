import ProductItem from "@/Components/App/ProductItem";
import Breadcrumbs from "@/Components/Core/Breadcrumbs";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  Category,
  CategoryGroup,
  Department,
  PaginationProps,
  Product,
} from "@/types"; // adjust path if needed
import { Head, Link } from "@inertiajs/react";
import { useMemo } from "react";

type ShowProps = {
  category: Category & { department: Department };
  department: Department;
  products: PaginationProps<Product>;
  categoryGroups: CategoryGroup[];
};

export default function Show({
  category,
  department,
  products,
  categoryGroups,
}: ShowProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    {
      label: category.department.name,
      href: route("product.byDepartment", category.department.slug),
    },
    { label: category.name, current: true },
  ];

  // Shows Random Image from All Active CategoryGroup
  const randomActiveGroup = useMemo(() => {
    const activeGroups = categoryGroups.filter((group) => group.active);
    if (activeGroups.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * activeGroups.length);
    return activeGroups[randomIndex];
  }, [categoryGroups]);

  return (
    <AuthenticatedLayout>
      <Head title="Shop" />

      <div className="bg-gray-100 py-6 px-4 lg:px-20">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb top-left */}
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {/* Page Title centered */}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 text-center">
            Shop Products {category.name}
          </h1>
        </div>
      </div>

      <div className="block lg:hidden">
        <aside className="w-full lg:w-1/4 bg-white xs:h-auto h-[500px] lg:sticky top-4 self-start">
          {randomActiveGroup && (
            <img
              src={randomActiveGroup.image_url}
              alt={randomActiveGroup.name}
              className="w-full h-full object-cover"
            />
          )}
        </aside>

        <div className="grid grid-cols-1 xs:p-5 xs:mt-5 xs:grid-cols-2 lg:grid-cols-3 xs:gap-y-5 p-10">
          {products.data.map((product) => (
            <div
              key={product.id}
              className="w-full lg:h-[400px]"
            >
              <ProductItem product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* desktop */}
      <div className="hidden lg:block">
        <div className=" container mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="sticky top-5 w-full lg:w-1/4 bg-white h-[500px] flex items-center justify-center">
            {categoryGroups.length > 0 &&
              (() => {
                const randomIndex = Math.floor(
                  Math.random() * categoryGroups.length
                );
                const randomGroup = categoryGroups[randomIndex];
                return (
                  <div
                    key={randomGroup.id}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={randomGroup.image_url}
                      alt={randomGroup.name}
                      className="h-[450px] w-full object-cover rounded"
                    />
                  </div>
                );
              })()}
          </aside>

          {/* Products Section */}
          <main className="w-full lg:w-3/4">
            {products.data.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.data.map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
