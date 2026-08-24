<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HeroBannerController extends Controller
{
    public function index(Request $request)
    {
        $query = HeroBanner::query();

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('subtitle', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->input('is_active'));
        }

        $banners = $query->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/HeroBanner/Index', [
            'banners' => $banners,
            'filters' => $request->only(['search', 'is_active']),
        ]);
    }

  public function store(Request $request)
{
    $data = $this->validateData($request);
    unset($data['image']);

    if ($request->hasFile('image')) {
        $data['image_path'] = $this->storeImage($request->file('image'));
    }

    HeroBanner::create($data);

    return back();
}

public function update(Request $request, HeroBanner $heroBanner)
{
    $data = $this->validateData($request, $heroBanner);
    unset($data['image']);

    if ($request->hasFile('image')) {
        if ($heroBanner->image_path) {
            Storage::disk('r2')->delete($heroBanner->image_path);
        }
        $data['image_path'] = $this->storeImage($request->file('image'));
    }

    $heroBanner->update($data);

    return back();
}

    public function destroy(HeroBanner $heroBanner)
    {
        if ($heroBanner->image_path) {
            Storage::disk('r2')->delete($heroBanner->image_path);
        }

        $heroBanner->delete();

        return back();
    }

    public function toggle(HeroBanner $heroBanner)
    {
        $heroBanner->update(['is_active' => ! $heroBanner->is_active]);

        return back();
    }

    private function validateData(Request $request, ?HeroBanner $heroBanner = null): array
    {
        return $request->validate([
            'title'       => 'required|string|max:255',
            'subtitle'    => 'nullable|string|max:255',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'image'       => $heroBanner ? 'nullable|image|max:5120' : 'required|image|max:5120',
            'is_active'   => 'boolean',
        ]);
    }

    private function storeImage($file): string
    {
        return $file->store('hero-banners', 'r2');
    }
}
