<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    public function index(): Response
    {
        $galleries = Gallery::withCount('media')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($g) => [
                'id'          => $g->id,
                'title'       => $g->title,
                'active'      => (bool) $g->active,
                'image_count' => $g->media_count,
                'thumbnail'   => $g->getFirstMediaUrl('gallery', 'thumb'),
                'created_at'  => $g->created_at->format('d M Y'),
            ]);

        return Inertia::render('Admin/Gallery/Index', [
            'galleries' => $galleries,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Gallery/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'active' => ['required', 'boolean'],
            'images' => ['required', 'array', 'min:1'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $gallery = Gallery::create($validated);

        // Handle uploaded images (base64 or temp paths via Spatie)
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $hash = hash_file('sha256', $file->getRealPath());
                $extension = $file->getClientOriginalExtension();

                $gallery->addMedia($file)
                    ->usingFileName("{$hash}.{$extension}")
                    ->withResponsiveImages()
                    ->toMediaCollection('gallery');
            }
        }

        return redirect()->route('admin.gallery.index')
            ->with('success', 'Gallery created successfully.');
    }

    public function show(Gallery $gallery): Response
    {
        $images = $gallery->getMedia('gallery')->map(fn($m) => [
            'id'    => $m->id,
            'url'   => $m->getUrl(),
            'thumb' => $m->hasGeneratedConversion('thumb') ? $m->getUrl('thumb') : $m->getUrl(),
            'name'  => $m->file_name,
            'size'  => number_format($m->size / 1024, 1) . ' KB',
            'order' => $m->order_column,
        ]);

        // ← missing return here
        return  Inertia::render('Admin/Gallery/Show', [
            'gallery' => [
                'id'     => $gallery->id,
                'title'  => $gallery->title,
                'active' => (bool) $gallery->active,
                'images' => $images,
            ],
        ]);
    }

    public function edit(Gallery $gallery): Response
    {
        $images = $gallery->getMedia('gallery')->map(fn($m) => [
            'id'    => $m->id,
            'url'   => $m->getUrl(),
            'thumb' => $m->hasGeneratedConversion('thumb') ? $m->getUrl('thumb') : $m->getUrl(),
            'name'  => $m->file_name,
            'order' => $m->order_column,
        ]);

        return Inertia::render('Admin/Gallery/Edit', [
            'gallery' => [
                'id'     => $gallery->id,
                'title'  => $gallery->title,
                'active' => (bool) $gallery->active,
                'images' => $images,
            ],
        ]);
    }

    public function update(Request $request, Gallery $gallery)
    {
        $data = $request->validate([
            'title'  => 'required|string|max:255',
            'active' => 'boolean',
        ]);

        $gallery->update($data);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $hash = hash_file('sha256', $file->getRealPath());
                $extension = $file->getClientOriginalExtension();

                $gallery->addMedia($file)
                    ->usingFileName("{$hash}.{$extension}")
                    ->withResponsiveImages()
                    ->toMediaCollection('gallery');
            }
        }

        // Handle reorder: array of media IDs in new order
        if ($request->has('order')) {
            foreach ($request->input('order', []) as $position => $mediaId) {
                $gallery->media()->where('id', $mediaId)->update(['order_column' => $position + 1]);
            }
        }

        return redirect()->route('admin.gallery.show', $gallery)
            ->with('success', 'Gallery updated.');
    }

    public function destroy(Gallery $gallery)
    {
        $gallery->clearMediaCollection('gallery');
        $gallery->delete();

        return redirect()->route('admin.gallery.index')
            ->with('success', 'Gallery deleted.');
    }

    public function destroyImage(Gallery $gallery, int $mediaId)
    {
        $media = $gallery->media()->findOrFail($mediaId);
        $media->delete();

        return back()->with('success', 'Image removed.');
    }
}
