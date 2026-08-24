import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import ProductRating from "./ProductRating";
import { useForm, usePage } from "@inertiajs/react";

interface RatingBreakdown {
  5: number; // percent
  4: number;
  3: number;
  2: number;
  1: number;
}
interface Review {
  id: number;
  userName: string;
  rating: number;
  userId: number;
  comment: string | null;
  comment_title: string | null;
  createdAt: string;
}
interface ProductRatingProps {
  rating: number;
  reviewsCount?: number;
  size?: "sm" | "md";
  onRate?: (rating: number) => void;
  ratingBreakdown?: RatingBreakdown; // new prop for bars
  productId: number;
  reviews: Review[];
  authUserId: number | null;
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
        className={`focus:outline-none ${
          onRate ? "cursor-pointer" : "cursor-default"
        }`}
        aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
      >
        <Icon className={`text-yellow-400 ${iconSize}`} />
      </button>
    );
  }
  return stars;
};

const AdvanceProductRating: React.FC<ProductRatingProps> = ({
  rating,
  reviewsCount = 0,
  size = "md",
  onRate,
  ratingBreakdown,
  productId,
  reviews = [],
}) => {
  const iconSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  const spacing = size === "sm" ? "space-x-1" : "space-x-2";
  const { data, setData, post, processing, errors, reset } = useForm({
    rating: 0,
    comment: "",
    comment_title: "", // ← added
  });

  const maxCount = Math.max(...Object.values(ratingBreakdown || {}), 1); // avoid division by zero

  const { auth } = usePage().props as {
    auth: {
      user: {
        id: number;
      };
    };
  };

  const authUserId = auth?.user?.id ?? null;

  const alreadyReviewed =
    authUserId !== null &&
    reviews.some((review) => review.userId === authUserId);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("reviews.store", productId), {
      onSuccess: () => reset(),
    });
  };

  return (
    <div className="flex flex-col max-w-md">
      {/* Overall stars and rating */}
      <div className={`flex items-center ${spacing} mb-2`}>
        {renderStars(rating, iconSize, onRate)}
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {rating.toFixed(2)} out of 5
        </span>
      </div>

      {/* Reviews count */}
      {reviewsCount > 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {reviewsCount.toLocaleString()} global ratings
        </span>
      )}

      {/* Rating breakdown bars */}
      {ratingBreakdown && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const starKey = star as keyof RatingBreakdown;
            const count = ratingBreakdown[starKey];
            // Calculate width as a percentage relative to maxCount
            const widthPercent = (count / maxCount) * 100;

            return (
              <div key={star} className="flex items-center">
                <button
                  className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline w-12 text-left"
                  onClick={() => onRate && onRate(star)}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  {star} star
                </button>
                <div className="w-2/4 h-5 mx-4 bg-gray-200 rounded-sm dark:bg-gray-700">
                  <div
                    className="h-5 bg-yellow-300 rounded-sm"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

{/* Review Form */}
      <div className="mt-10">
        {alreadyReviewed ? (
          <p className="text-green-700 font-medium">
            You have already submitted a review for this product.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Rating
              </label>
              <ProductRating
                rating={data.rating}
                size="md"
                onRate={(rating) => setData("rating", rating)}
              />
              {errors.rating && (
                <div className="text-red-600 text-sm mt-1">{errors.rating}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={data.comment_title || ""}
                onChange={(e) => setData("comment_title", e.target.value)}
                className="border px-2 py-1 rounded w-full"
                placeholder="Short title for your review"
              />
              {errors.comment_title && (
                <div className="text-red-600 text-sm">
                  {errors.comment_title}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Comment</label>
              <textarea
                value={data.comment}
                onChange={(e) => setData("comment", e.target.value)}
                className="border px-2 py-1 rounded w-full"
                rows={4}
                placeholder="Write your review..."
              />
              {errors.comment && (
                <div className="text-red-600 text-sm">{errors.comment}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={processing || data.rating === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Write a Review
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdvanceProductRating;
