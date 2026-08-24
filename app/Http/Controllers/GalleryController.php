<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GalleryController extends Controller
{
    public function index(): \Inertia\Response
    {
        $galleryItems = Cache::remember('gallery:index', 300, function () {
            return Gallery::with([
                // Only load media belonging to the 'gallery' collection,
                // instead of every collection attached to the model.
                'media' => fn($q) => $q->where('collection_name', 'gallery'),
            ])
                ->where('active', true)
                ->latest()
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'images' => $item->getMedia('gallery')->map(fn($media) => [
                        'url' => $media->getFullUrl(),
                        'id' => $media->id,
                    ]),
                ]);
        });

        return Inertia::render('Gallery/Index', [
            'galleryItems' => $galleryItems,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $gallery = Gallery::create([
            'title' => $data['title'],
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $gallery->addMedia($image)->toMediaCollection('gallery');
            }
        }

        // Invalidate the cached listing so the new item shows up immediately
        // instead of waiting up to 5 minutes for the cache to expire.
        Cache::forget('gallery:index');

        return redirect()->back()->with('success', 'Gallery item added.');
    }
}
