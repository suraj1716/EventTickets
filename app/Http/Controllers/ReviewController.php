<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
       public function store(Request $request, Product $product)
{
    $request->validate([
        'rating' => 'required|integer|min:1|max:5',
        'comment' => 'nullable|string|max:1000',
        'comment_title' => 'nullable|string|max:25',

    ]);

    // Prevent multiple reviews from same user
    if ($product->reviews()->where('user_id', Auth::id())->exists()) {
        return back()->withErrors(['rating' => 'You have already submitted a review.']);
    }

    $product->reviews()->create([
        'user_id' => Auth::id(),
        'rating' => $request->rating,
        'comment' => $request->comment,
         'comment_title' => $request->comment_title,
    ]);

    return back();
}

}
