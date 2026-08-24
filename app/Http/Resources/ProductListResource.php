<?php

namespace App\Http\Resources;

use App\Enums\ProductHighlightEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
   public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'highlight' => $this->highlight,
            'description' => $this->description,
            'price' => $this->price,
            'status' => $this->status, // Add this line to include the status
            'image' => $this->getFirstMediaUrl('images'),
            // 'image' => $this->getMedia('images')->first()?->getUrl('small') ?? '',
            'slug' => $this->slug,
            'quantity' => $this->quantity,
            // Add this line to the returned array
            'rating_breakdown' => $this->when(isset($this->resource->rating_breakdown), function () {
                return $this->resource->rating_breakdown;
            }),

            'reviews' => $this->reviews->map(function ($review) {
                return [
                    'id' => $review->id,
                    'userName' => $review->user->name ?? 'Anonymous',
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'comment_title' => $review->comment_title,
                    'userId' => $review->user->id ?? null,
                    'createdAt' => $review->created_at->toDateTimeString(),
                    'userCreatedAt' => optional($review->user)->created_at?->toDateTimeString(),
                ];
            }),
            'reviews_count' => $this->reviews_count,
     'category' => $this->category ? [
    'id'   => $this->category->id,
    'name' => $this->category->name,
    'slug' => $this->category->slug,
] : null,
            'average_rating' => round($this->reviews_avg_rating, 1),
            'vendor' => new VendorUserResource($this->whenLoaded('vendor')),
            'images' => $this->getMedia('images')->map(function ($image) {
                return [
                    'id' => $image->id,
                    'thumb' => $image->getUrl('thumb'),
                    'small' => $image->getUrl('small'),
                    'large' => $image->getUrl('large'),
                ];
            }),
            'user' => [
                'id'         => $this->user?->id,
                 'email'        => $this->user->email,
                'name'       => $this->user?->name,
                'store_name' => $this->user?->vendor?->store_name ?? '',
            ],

            'department' => [
                'id' => $this->department->id,
                'name' => $this->department->name,
                'slug' => $this->department->slug
            ],
            'variationTypes' => $this->variationTypes->map(function ($varitionType) {
                return [
                    'id' => $varitionType->id,
                    'name' => $varitionType->name,
                    'type' => $varitionType->type,
                    'options' => $varitionType->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'name' => $option->name,
                            'images' => $option->getMedia('images')->map(function ($image) {
                                return [
                                    'id' => $image->id,
                                    'thumb' => $image->getUrl('thumb'),
                                    'small' => $image->getUrl('small'),
                                    'large' => $image->getUrl('large'),
                                ];
                            }),
                        ];
                    }),
                ];
            }),
            'variations' => $this->variations->map(function ($variation) {
                return [
                    'id' => $variation->id,
                    'price' => $variation->price,
                    'quantity' => $variation->quantity,
                    'variation_type_option_ids' => $variation->variation_type_option_ids,
                ];
            }),



        ];
    }
}
