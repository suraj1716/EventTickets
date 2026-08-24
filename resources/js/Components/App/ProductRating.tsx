import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

interface ProductRatingProps {
  rating: number;
  reviewsCount?: number;
  size?: "sm" | "md";
  onRate?: (rating: number) => void;
}

const renderStars = (
  rating: number,
  iconSize: string,
  onRate?: (rating: number) => void
) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let Icon;
    if (rating >= i) {
      Icon = FaStar;
    } else if (rating > i - 1 && rating < i) {
      Icon = FaStarHalfAlt;
    } else {
      Icon = FaRegStar;
    }

    stars.push(
      <button
        key={i}
        type="button"
        onClick={() => onRate && onRate(i)}
        className={`focus:outline-none ${onRate ? "cursor-pointer" : "cursor-default"}`}
        aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
      >
        <Icon className={`text-yellow-400 ${iconSize}`} />
      </button>
    );
  }
  return stars;
};

const ProductRating: React.FC<ProductRatingProps> = ({
  rating,
  reviewsCount = 0,
  size = "md",
  onRate,
}) => {
   const iconSize =
    size === "sm"
      ? "w-4 h-4 sm:w-6 sm:h-6"
      : "w-6 h-6";
  const spacing = size === "sm" ? "space-x-1" : "space-x-2";

  return (
    <div className={`flex items-center ${spacing}`}>
      <div className="flex gap-1">
        {renderStars(rating, iconSize, onRate)}
      </div>
      {reviewsCount > 0 && (
        <span className="text-sm text-gray-600">({reviewsCount})</span>
      )}
    </div>
  );
};

export default ProductRating;
