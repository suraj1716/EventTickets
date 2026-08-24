import AdvanceProductRating from "@/Components/App/AdvanceProductRating";
import ProductCarousel from "@/Components/App/ProductCarousel";
import ProductItem from "@/Components/App/ProductItem";
import ProductRating from "@/Components/App/ProductRating";
import Rating from "@/Components/App/ProductReview";
import ProductReview from "@/Components/App/ProductReview";
import Review from "@/Components/App/ProductReview";
import Breadcrumbs from "@/Components/Core/Breadcrumbs";
import Carousel from "@/Components/Core/Carousel";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import parse from "html-react-parser";
import {
  PaginationProps,
  Product,
  ProductListItem,
  VariationTypeOption,
} from "@/types";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";
import { arraysAreEqual } from "@/utils/helpers";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import React, { useEffect, useMemo, useState } from "react";

function Show({
  product,
  relatedProducts,
  ratingBreakdown,
  variationOptions,
}: {
  relatedProducts: PaginationProps<Product>;
  product: Product;
  variationOptions: number[];
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}) {
  const form = useForm<{
    option_ids: Record<string, number>;
    quantity: number;
    price: number | null;
    designer: boolean;
    attachment?: File | null;
  }>({
    option_ids: {},
    quantity: 1,
    price: 0,
    designer: false,
    attachment: null,
  });
  const reviews = product.reviews;
  const designCharge = 20;
  const [designer, setdesigner] = useState(false);
  const { url } = usePage();
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, VariationTypeOption>
  >({});
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );

  const { auth } = usePage().props as {
    auth: {
      user: {
        id: number;
      } | null;
    };
  };

  const images = useMemo(() => {
    const imageSet = new Map<
      number,
      { id: number; thumb: string; small: string; large: string }
    >();

    // Collect images from all selected options
    for (let option of Object.values(selectedOptions)) {
      if (Array.isArray(option.images)) {
        option.images.forEach((image) => {
          const id = image.id || 0;
          if (!imageSet.has(id)) {
            imageSet.set(id, {
              id,
              thumb: image.thumb || "/placeholder.jpg",
              small: image.small || image.thumb || "/placeholder.jpg",
              large: image.large || image.thumb || "/placeholder.jpg",
            });
          }
        });
      }
    }

    // If no images from selected options, use product images
    if (imageSet.size === 0 && Array.isArray(product.images)) {
      product.images.forEach((image) => {
        const id = image.id || 0;
        if (!imageSet.has(id)) {
          imageSet.set(id, {
            id,
            thumb: image.thumb || "/placeholder.jpg",
            small: image.small || image.thumb || "/placeholder.jpg",
            large: image.large || image.thumb || "/placeholder.jpg",
          });
        }
      });
    }

    // If still no images, use placeholder
    if (imageSet.size === 0) {
      imageSet.set(0, {
        id: 0,
        thumb: "/placeholder.jpg",
        small: "/placeholder.jpg",
        large: "/placeholder.jpg",
      });
    }

    return Array.from(imageSet.values());
  }, [product, selectedOptions]);

  const computedProduct = useMemo(() => {
    const selectedOptionIds = Object.values(selectedOptions)
      .map((op) => op.id)
      .sort();

    if (Array.isArray(product.variations)) {
      for (let variation of product.variations) {
        let optionIds = variation.variation_type_option_ids.slice().sort();

        if (arraysAreEqual(selectedOptionIds, optionIds)) {
          return {
            ...product,
            price: variation.price,
            quantity:
              variation.quantity === null
                ? Number.MAX_VALUE
                : variation.quantity,
          };
        }
      }
    }

    return {
      price: product.price,
      quantity: product.quantity,
    };
  }, [product, selectedOptions]);

  useEffect(() => {
    for (let type of product.variationTypes) {
      const selectedOptionId: number = variationOptions[type.id];
      chooseOption(
        type.id,
        type.options.find((option) => option.id === selectedOptionId) ||
          type.options[0],
        false
      );
    }
  }, []);

  const getOptionIdsMap = (newOptions: object): Record<string, number> => {
    return Object.fromEntries(
      Object.entries(newOptions).map(([a, b]) => {
        return [a, b.id];
      })
    );
  };

  const chooseOption = (
    typeId: number,
    option: VariationTypeOption,
    updateRouter: boolean = true
  ) => {
    setSelectedOptions((prevSelectedOptions) => {
      const newOptions = {
        ...prevSelectedOptions,
        [typeId]: option,
      };

      if (option.images?.length > 0) {
        const imageId = option.images[0]?.id;
        const index = images.findIndex((img) => img.id === imageId);
        if (index !== -1) setCarouselIndex(index);
      }

      if (updateRouter) {
        router.get(
          url,
          {
            options: getOptionIdsMap(newOptions),
          },
          {
            preserveScroll: true,
            preserveState: true,
          }
        );
      }
      return newOptions;
    });
  };

  const onQuantityChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    form.setData("quantity", parseInt(ev.target.value));
  };

  const finalPrice = useMemo(() => {
    const basePrice = Number(computedProduct.price); // ensure it's a number
    return form.data.designer ? basePrice + designCharge : basePrice;
  }, [computedProduct.price, form.data.designer]);

  useEffect(() => {
    form.setData("price", finalPrice);
  }, [finalPrice]);

  const addToCart = () => {
    const requiredVariationTypeIds = product.variationTypes.map((vt) => vt.id);
    const selectedOptionTypeIds = Object.keys(selectedOptions).map(Number);

    const allOptionsSelected = requiredVariationTypeIds.every((id) =>
      selectedOptionTypeIds.includes(id)
    );

    if (!allOptionsSelected) {
      alert("Please select all product options before adding to cart.");
      return;
    }

    const formData = new FormData();

    formData.append("price", String(finalPrice));
    form.data.quantity; // ✅ correct
    // ✅ correct way to update
    formData.append("quantity", form.data.quantity.toString());
    Object.entries(selectedOptions).forEach(([typeId, option]) => {
      formData.append(`option_ids[${typeId}]`, String(option.id));
    });

    formData.append("designer", form.data.designer ? "1" : "0");
    if (form.data.attachment) {
      formData.append("attachment", form.data.attachment);
    }

    router.post(route("cart.store", product.id), formData, {
      preserveScroll: true,
      preserveState: true,
      forceFormData: true,
      onError: (errors) => {
        console.error("Error adding to cart:", errors);
      },
      onSuccess: () => {
      },
    });
  };

  const getValidOptionsForType = (typeId: number): Set<number> => {
    const variationTypes = product.variationTypes;
    const currentType = variationTypes.find((t) => t.id === typeId);
    if (!currentType) return new Set();

    // Get all selected option IDs except for the current type
    const selectedOptionIdsExceptCurrent = Object.entries(selectedOptions)
      .filter(([selectedTypeIdStr, opt]) => {
        const selectedTypeId = Number(selectedTypeIdStr);
        return selectedTypeId !== typeId && opt !== undefined;
      })
      .map(([_, opt]) => opt!.id);

    // Find variations that include all currently selected options except current type
    const matchingVariations = product.variations.filter((variation) =>
      selectedOptionIdsExceptCurrent.every((selectedId) =>
        variation.variation_type_option_ids.includes(selectedId)
      )
    );

    const validOptionIds = new Set<number>();

    // Collect only options from currentType that appear in these matching variations
    currentType.options.forEach((option) => {
      const optionId = option.id;

      // Check if there exists at least one matching variation that includes this option
      const exists = matchingVariations.some((variation) =>
        variation.variation_type_option_ids.includes(optionId)
      );

      if (exists) {
        validOptionIds.add(optionId);
      }
    });

    return validOptionIds;
  };

  const renderProductVariationTypes = () => {
    const variationTypes = product.variationTypes;
    const firstType = variationTypes[0];

    return (
      <>
        {variationTypes.map((type) => {
          const validOptionIds = getValidOptionsForType(type.id);

          return (
            <div key={type.id} className="mb-6">
              <b className="block mb-6 text-lg font-semibold text-gray-800">
                {type.name}
              </b>

              {type.type === "Image" && (
                <div className="flex flex-wrap gap-3">
                  {type.options
                    .filter(
                      (option) =>
                        validOptionIds.has(option.id) ||
                        selectedOptions[type.id]?.id === option.id
                    )
                    .map((option) => (
                      <label
                        key={option.id}
                        className={`cursor-pointer rounded-lg border  duration-150
                        ${
                          selectedOptions[type.id]?.id === option.id
                            ? "ring-2 ring-indigo-600 shadow-md"
                            : "ring-1 ring-gray-300 hover:ring-indigo-400"
                        }`}
                        onClick={() => chooseOption(type.id, option)}
                        tabIndex={0}
                        role="button"
                        aria-pressed={
                          selectedOptions[type.id]?.id === option.id
                            ? "true"
                            : "false"
                        }
                      >
                        {option.images?.[0]?.thumb && (
                          <img
                            src={option.images[0].thumb}
                            alt={option.name || ""}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                      </label>
                    ))}
                </div>
              )}

              {type.type === "Radio" && (
                <div className="mt-3 flex flex-wrap items-center gap-3 select-none">
                  {type.options
                    .filter(
                      (option) =>
                        validOptionIds.has(option.id) ||
                        selectedOptions[type.id]?.id === option.id
                    )
                    .map((option) => (
                      <label
                        key={option.id}
                        className="cursor-pointer mb-3"
                        aria-pressed={
                          selectedOptions[type.id]?.id === option.id
                            ? "true"
                            : "false"
                        }
                      >
                        <input
                          type="radio"
                          name={`variation_type_${type.id}`}
                          value={option.id}
                          className="peer sr-only"
                          onChange={() => chooseOption(type.id, option)}
                          checked={selectedOptions[type.id]?.id === option.id}
                        />
                        <span className="peer-checked:bg-indigo-600 peer-checked:text-white rounded-lg border border-indigo-600 px-6 py-2 font-semibold transition-colors">
                          {option.name}
                        </span>
                      </label>
                    ))}
                </div>
              )}

              {type.type === "Select" && (
                <div className="mt-3">
                  <select
                    className="w-full rounded-lg border border-gray-400 px-4 py-2 font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedOptions[type.id]?.id ?? ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selected = type.options.find(
                        (opt) => opt.id === selectedId
                      );
                      if (selected) chooseOption(type.id, selected);
                    }}
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    {type.options
                      .filter(
                        (option) =>
                          validOptionIds.has(option.id) ||
                          selectedOptions[type.id]?.id === option.id
                      )
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };

  //   const renderVariationSelectors = () => (
  //     <>
  //       {product.variationTypes.map((type) => (

  // <div className="mt-3 flex select-none flex-wrap items-center gap-1">
  //           <label className="">
  //             <input type="radio" name="type" value="Powder" className="peer sr-only" checked />
  //             <p className="peer-checked:bg-black peer-checked:text-white rounded-lg border border-black px-6 py-2 font-bold">{type.name}</p>
  //           </label>
  //           <label className="">
  //             <input type="radio" name="type" value="Whole Bean" className="peer sr-only" />
  //             <p className="peer-checked:bg-black peer-checked:text-white rounded-lg border border-black px-6 py-2 font-bold">Whole Bean</p>
  //           </label>
  //           <label className="">
  //             <input type="radio" name="type" value="Groud" className="peer sr-only" />
  //             <p className="peer-checked:bg-black peer-checked:text-white rounded-lg border border-black px-6 py-2 font-bold">Groud</p>
  //           </label>
  //         </div>

  //         // <div key={type.id} className="mb-6">
  //         //   <h3 className="text-sm font-medium text-gray-700 mb-2">
  //         //     {type.name}
  //         //   </h3>

  //         //   {type.type === "Image" && (
  //         //     <div className="flex space-x-3">
  //         //       {type.options.map((option) => (
  //         //         <button
  //         //           key={option.id}
  //         //           onClick={() => chooseOption(type.id, option)}
  //         //           className={`w-8 h-8 rounded-full border-2 focus:outline-none ${
  //         //             selectedOptions[type.id]?.id === option.id
  //         //               ? "border-indigo-500"
  //         //               : "border-gray-300"
  //         //           }`}
  //         //           style={{
  //         //             backgroundImage: option.images?.[0]?.thumb
  //         //               ? `url(${option.images[0].thumb})`
  //         //               : undefined,
  //         //             backgroundSize: "cover",
  //         //             backgroundPosition: "center",
  //         //           }}
  //         //           aria-label={option.name}
  //         //           title={option.name}
  //         //         />
  //         //       ))}
  //         //     </div>
  //         //   )}

  //         //   {type.type === "Radio" && (
  //         //     <select
  //         //       value={selectedOptions[type.id]?.id || ""}
  //         //       onChange={(e) => {
  //         //         const option = type.options.find(
  //         //           (o) => o.id === Number(e.target.value)
  //         //         );
  //         //         if (option) chooseOption(type.id, option);
  //         //       }}
  //         //       className="rounded border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
  //         //     >
  //         //       {type.options.map((option) => (
  //         //         <option key={option.id} value={option.id}>
  //         //           {option.name}
  //         //         </option>
  //         //       ))}
  //         //     </select>
  //         //   )}
  //         // </div>

  //       ))}
  //     </>
  //   );

  return (
    <AuthenticatedLayout>
      <Head title={product.title} />

      <section className="py-12 sm:py-16">
        <div className="w-full px-4 md:px-5 pt-1">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              {
                label: product.user.store_name || "Vendor",
                href: route("vendor.profile", {
                  vendor: product.user.store_name,
                }),
              },
              {
                label: product.department?.name || "Department",
                href: route("product.byDepartment", product.department.slug),
              },
              {
                label: product.category?.name || "Category",
                href: route("product.byDepartment", product.department.slug),
              },
              { label: product.title, current: true },
            ]}
          />
        </div>
        <div className="container mx-auto px-5 max-w-7xl">
          {/* Breadcrumbs */}

          {/* Main grid */}
          <div className="mt-8 flex flex-col lg:flex-row gap-5 lg:gap-10">
            {/* Carousel */}
            <div className="w-full lg:w-[50%]">
              <Carousel
                images={images.map((img) => ({
                  ...img,
                  alt: product.title,
                }))}
                index={carouselIndex}
                onIndexChange={setCarouselIndex}
              />
            </div>

            {/* Product details */}
            <div className="w-full lg:w-[45%] flex flex-col lg:px-10">
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight sm:text-4xl">
                {product.title}
              </h1>

              <div className="mt-3 text-sm font-semibold text-indigo-600 tracking-wide mb-6">
                <Link
                  href={route("vendor.profile", product.user.store_name)}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                >
                  {product.user.name}
                </Link>
                <span className="mx-1 text-gray-500">in</span>
                <Link
                  href={route("product.byDepartment", product.department.slug)}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                >
                  {product.department.name}
                </Link>
              </div>

              <ProductRating
                size="md"
                rating={product.average_rating ?? 0}
                reviewsCount={product.reviews_count ?? 0}
              />

              <div className="mt-6">{renderProductVariationTypes()}</div>

              <label className="mt-6 inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.data.designer}
                  onChange={(e) => form.setData("designer", e.target.checked)}
                  className="form-checkbox text-indigo-600 h-5 w-5"
                  aria-checked={form.data.designer}
                />
                <span className="ml-3 text-gray-900 font-medium">
                  Need designer? (adds ${designCharge} to price)
                </span>
              </label>

              <div className="mt-5">
                <div
                  className="mt-5 relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50
               dark:border-gray-600 dark:bg-gray-800 p-6 text-center hover:border-indigo-500 focus-within:border-indigo-500"
                  onClick={() => document.getElementById("attachment")?.click()}
                >
                  <input
                    id="attachment"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      form.setData("attachment", e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Got a file? Drag it here or click to upload your attachment!
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    (Images or PDFs welcome 📎)
                  </p>
                </div>

                {form.errors.attachment && (
                  <p className="mt-1 text-xs text-red-600">
                    {form.errors.attachment}
                  </p>
                )}
              </div>

              {/* Price & Add to Cart */}
              <div className="mt-10 flex flex-col space-y-5 border-t border-b border-gray-200 py-6 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
                <div>
                  <h2 className="text-4xl font-extrabold text-gray-900">
                    <CurrencyFormatter amount={finalPrice} currency="AUD" />
                  </h2>
                </div>

                <button
                  onClick={addToCart}
                  type="button"
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-10 py-3 text-lg font-bold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="Add product to cart"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-3 h-6 w-6 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Add to cart
                </button>
              </div>

              {/* Shipping info */}
              <ul className="mt-10 space-y-4 text-sm font-medium text-gray-600">
                <li className="flex items-center">
                  <svg
                    className="mr-3 h-6 w-6 text-gray-500 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Free shipping worldwide
                </li>

                <li className="flex items-center">
                  <svg
                    className="mr-3 h-6 w-6 text-gray-500 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Cancel Anytime
                </li>
              </ul>
            </div>
          </div>

          {/* Related Products */}
          <section className="bg-slate-50 mt-12 relative left-1/2 right-1/2 w-screen -translate-x-1/2">
            <h2 className="ml-14 py-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl lg:ml-0">
              Related Products
            </h2>
            {relatedProducts?.data?.length > 0 && (
              <ProductCarousel
                products={relatedProducts.data}
                title=""
                sectionClassName="py-5 bg-gray-50"
                wrapperClassName="w-full px-2 sm:px-4"
              />
            )}
          </section>

          {/* Tabs section */}
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-3 lg:px-10 mt-10 lg:mt-0">
              <div className="border-b border-gray-300">
                <nav className="flex gap-8 overflow-x-auto no-scrollbar">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("description");
                    }}
                    className={`border-b-2 py-4 text-sm font-semibold whitespace-nowrap hover:border-gray-400 hover:text-gray-800 ${
                      activeTab === "description"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-600"
                    }`}
                  >
                    Description
                  </a>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("reviews");
                    }}
                    className={`inline-flex items-center border-b-2 py-4 text-sm font-semibold whitespace-nowrap hover:border-gray-400 hover:text-gray-800 ${
                      activeTab === "reviews"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-600"
                    }`}
                  >
                    Reviews
                    <span className="ml-2 rounded-full bg-gray-500 px-2 py-px text-xs font-bold text-gray-100">
                      {product.reviews_count || 0}
                    </span>
                  </a>
                </nav>
              </div>

              <div className="mt-8 flow-root sm:mt-12">
                {activeTab === "description" && (
                  <>
                    <div className="prose max-w-none text-gray-900 dark:text-gray-100">
                      {parse(product.description)}
                    </div>
                  </>
                )}

                {activeTab === "reviews" && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Reviews</h2>

                    <AdvanceProductRating
                      rating={product.average_rating ?? 0}
                      reviewsCount={product.reviews_count ?? 0}
                      ratingBreakdown={ratingBreakdown}
                      productId={product.id}
                      reviews={reviews}
                      authUserId={auth?.user?.id ?? null}
                    />

                    <div className="mt-10 bg-background-gray rounded-lg p-6">
                      <h3 className="text-2xl font-semibold mb-4">
                        Customers Words
                      </h3>
                      <ProductReview
                        productId={product.id}
                        reviews={product.reviews}
                        authUserId={auth?.user?.id ?? null}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuthenticatedLayout>
  );
}

export default Show;
