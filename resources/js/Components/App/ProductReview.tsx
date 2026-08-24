import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import ProductRating from "./ProductRating";

interface Review {
  id: number;
  userName: string;
  rating: number;
  userId: number;
  comment: string | null;
  comment_title: string | null;
  createdAt: string;
  userCreatedAt: string;
}

interface ProductReviewProps {
  productId: number;
  reviews: Review[];
  authUserId: number | null;
}

const ProductReview: React.FC<ProductReviewProps> = ({
  productId,
  reviews = [],
}) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    rating: 0,
    comment: "",
    comment_title: "", // ← added
  });

  const [expandedReviews, setExpandedReviews] = useState<{
    [id: number]: boolean;
  }>({});

  const toggleExpand = (id: number) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isLongComment = (comment: string | null) => {
    if (!comment) return false;
    return comment.split("\n").length > 4 || comment.length > 300;
  };

 return (
  <div className="w-full max-w-2xl space-y-8">
    <div>
      {(!reviews || reviews.length === 0) && <p>No reviews yet.</p>}

      {reviews.map((review) => {
        const isExpanded = expandedReviews[review.id] ?? false;
        const comment = review.comment ?? "";

        return (
          <div key={review.id} className="w-full py-1">
            <div className="flex flex-col mb-1">
              <article className="p-6 bg-white dark:bg-gray-800 rounded-lg  w-full">
                <div className="flex items-center mb-4">
                  <img
                    className="w-10 h-10 me-4 rounded-full"
                    src="/docs/images/people/profile-picture-5.jpg"
                    alt=""
                  />
                  <div className="font-medium dark:text-white">
                    <p>
                      {review.userName}{" "}
                      <time
                        dateTime={review.userCreatedAt}
                        className="block text-sm text-gray-500 dark:text-gray-400"
                      >
                        Joined on{" "}
                        {new Date(
                          review.userCreatedAt
                        ).toLocaleDateString()}
                      </time>
                    </p>
                  </div>
                </div>

                <div className="flex items-center mb-1 space-x-1 rtl:space-x-reverse">
                  <ProductRating rating={review.rating} size="sm" />
                  <h3 className="ms-2 text-l font-semibold text-gray-900 dark:text-white">
                    {review.comment_title}
                  </h3>
                </div>

                <footer className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    Reviewed at{" "}
                    <time dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </time>
                  </p>
                </footer>

                {/* Comment */}
                {review.comment && (
                  <div className="w-full">
                    <p
                      className={`text-gray-700 dark:text-gray-300 break-words whitespace-pre-line ${
                        !isExpanded ? "line-clamp-4" : ""
                      }`}
                    >
                      {comment}
                    </p>

                    {isLongComment(comment) && (
                      <button
                        onClick={() => toggleExpand(review.id)}
                        className="text-blue-600 hover:underline text-sm mt-1"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}
              </article>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

};

export default ProductReview;
