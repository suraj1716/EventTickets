import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import ProductItem from "./ProductItem"; // adjust path as needed
import type { Product } from "@/types"; // adjust type as needed

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  wrapperClassName?: string;
  sectionClassName?: string;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  title,
  wrapperClassName = "",
  sectionClassName = "bg-white rounded-lg  px-4 py-6 sm:px-6",
}) => {
  return (
    <div className={`w-full ${wrapperClassName}`}>
      <div className={sectionClassName}>
        {title && <h2 className="text-xl font-bold mb-5 ml-10">{title}</h2>}

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No products found.
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Navigation]}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            navigation
            loop
            breakpoints={{
              320: { slidesPerView: 2.5, spaceBetween: 8 },
              375: { slidesPerView: 2.1, spaceBetween: 8 },
              480: { slidesPerView: 3.2, spaceBetween: 12 },
              640: { slidesPerView: 3.8, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 20 },
              1024: { slidesPerView: 4, spaceBetween: 28 }, // reduced count, more spacing
              1280: { slidesPerView: 3.5, spaceBetween: 25 },
              1536: { slidesPerView: 3.8, spaceBetween: 36 },
            }}
            className="w-full"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductItem product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </div>
  );
};

export default ProductCarousel;
