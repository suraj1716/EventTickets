import React from "react";
import { Link, useForm } from "@inertiajs/react";
import { router } from "@inertiajs/core";
import { Product } from "@/types";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";
import ProductRating from "./ProductRating";

interface Props {
  product: Product;
}

export default function ProductItem({ product }: Props) {
  const form = useForm({
    product_id: product.id,
    quantity: 1,
  });

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.post(route("cart.store", product.id), form.data, {
      preserveScroll: true,
    });
  };


const imageUrl = product.image?.includes('conversions')
  ? product.image.replace(/\/conversions\/(.+)-thumb\.(jpg|png|webp)/, '/$1.$2')
  : product.image;

  return (
    <div className="w-[170px] sm:w-[200px] md:w-[220px] lg:w-[270px] xl:w-[300px] mx-auto">
      <div className="relative overflow-hidden bg-white border-2 border-slate-100 shadow hover:shadow-md transition-shadow duration-300 rounded-md">
        <div className="overflow-hidden">
          <Link href={route("product.show", product.slug)}>
    <div className="w-full h-[130px] sm:h-[150px] md:h-[180px] lg:h-[200px] overflow-hidden rounded bg-slate-300">
  <img
    src={imageUrl}
    alt={product.title}
    onError={(e) => (e.currentTarget.src = '/placeholder.jpg')} // optional fallback
    className="w-full h-full object-cover transition duration-300 transform hover:-translate-y-1 hover:scale-105"
  />
</div>

          </Link>
        </div>

        {product.highlight && (
          <span
            className={`
              absolute top-0 left-0 w-20 -translate-x-5 translate-y-1 -rotate-45
              text-center text-[11px] lg:text-xs font-bold text-white
              px-2 py-1 shadow-lg select-none
              ${
                product.highlight === "sale"
                  ? "bg-red-600 animate-pulse"
                  : product.highlight === "hot"
                  ? "bg-orange-500 animate-pulse"
                  : product.highlight === "trending"
                  ? "bg-green-600 animate-pulse"
                  : "bg-black"
              }
            `}
          >
            {product.highlight.charAt(0).toUpperCase() + product.highlight.slice(1)}
          </span>
        )}

        <div className="mt-3 px-3 pb-3">
          <h5 className="text-sm sm:text-base lg:text-lg font-semibold tracking-tight text-slate-900 line-clamp-1">
            <Link href={route("product.show", product.slug)}>{product.title}</Link>
          </h5>

          <p className="text-[11px] sm:text-xs lg:text-sm text-gray-600 line-clamp-2 mt-1">
            <Link
              href={route("vendor.profile", product.user?.store_name ?? "")}
              className="hover:underline"
            >
              {product.user?.name ?? "Unknown Vendor"}
            </Link>
            &nbsp;in&nbsp;
            <Link
              href={route("product.byDepartment", product.department?.slug ?? "")}
              className="hover:underline"
            >
              {product.department?.name ?? "Unknown Department"}
            </Link>
          </p>

          <div className="mt-2 mb-3 text-xs lg:text-sm">
            <ProductRating
              rating={product.average_rating ?? 0}
              reviewsCount={product.reviews_count ?? 0}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-row items-center gap-2">
              <span className="text-xs lg:text-sm text-slate-400">Starting at</span>
              <span className="text-sm lg:text-lg font-bold text-slate-900">
                <CurrencyFormatter
                  amount={product.price ?? 0}
                  currency="AUD"
                />
              </span>
            </div>
            {/* Optional Add to Cart */}
            {/* <button
              type="button"
              onClick={addToCart}
              className="flex items-center rounded bg-slate-900 px-2 py-1 text-[10px] text-white hover:bg-gray-700"
            >
              Add
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
