import { Image } from "@/types";

interface CarouselProps {
  images: Image[];
  index: number;
  onIndexChange: (index: number) => void;
}

export default function Carousel({ images, index, onIndexChange }: CarouselProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
      {/* Thumbnails */}
      <div className="mt-2 w-full lg:order-1 lg:w-24 lg:flex-shrink-0">
        <div className="flex flex-row items-center justify-start gap-3 lg:flex-col lg:items-stretch">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`
                aspect-square h-20 rounded-lg border-2 transition-all

                ${index === i ? "border-indigo-600" : "border-transparent"}
                focus:outline-none
              `}
              aria-label={`Select image ${i + 1}`}
            >
              <img
                src={image.thumb}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover rounded-md"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main Image */}
      <div className="lg:order-2 lg:ml-6 relative w-full max-w-xl rounded-xl overflow-hidden cursor-zoom-in aspect-[5/4] bg-gray-50 group">
        <img
          src={images[index]?.large}
          alt={`Selected product image ${index + 1}`}
          className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          loading="lazy"
          draggable={false}
        />
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <span className="text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
            Hover to zoom
          </span>
        </div>
      </div>
    </div>
  );
}
