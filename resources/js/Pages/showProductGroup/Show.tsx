import ProductItem from "@/Components/App/ProductItem";
import Breadcrumbs from "@/Components/Core/Breadcrumbs";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useMemo } from "react";
import { Product, ProductGroup, PaginationProps } from "@/types";

interface ProductGroupShowProps {
  productGroup: ProductGroup;
  products: PaginationProps<Product>;
}

export default function ProductGroupShow({
  productGroup,
  products,
}: ProductGroupShowProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: productGroup.name, current: true },
  ];

return (
  <AuthenticatedLayout>
    <Head title={`Products - ${productGroup.name}`} />

    <div className="bg-gray-100 py-6 px-4 lg:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb top-left */}
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Page Title centered */}
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          {productGroup.name} Products
        </h1>
      </div>
    </div>

    {/* side bar banner for mobile */}

<div className="block lg:hidden w-full my-6">
  {Array.isArray(productGroup?.images) && productGroup.images.length > 2 && (
    <img
      src={productGroup.images_urls[2]}
      alt={productGroup.name}
      className="w-full h-auto object-cover rounded-md shadow-md"
    />
  )}
</div>


    <div className="container mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
      {/* side bar banner for desktop */}
      <aside className="hidden lg:flex sticky top-5 w-full lg:w-1/5 bg-white items-center justify-center rounded-md shadow-md overflow-hidden">
        {Array.isArray(productGroup?.images) && productGroup.images.length > 2 && (
          <img
            src={productGroup.images_urls[1]}
            alt={productGroup.name}
            className="w-full h-full object-cover"
          />
        )}
      </aside>

      {/* Product Listing */}
      <main className="w-full lg:w-4/5">
        {products.data.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No products found.</div>
        ) : (
       <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 xs:gap-x-10 lg:gap-x-10">
  {products.data.map((product) => (
    <ProductItem key={product.id} product={product} />
  ))}
</div>

        )}
      </main>
    </div>
  </AuthenticatedLayout>
);

}
