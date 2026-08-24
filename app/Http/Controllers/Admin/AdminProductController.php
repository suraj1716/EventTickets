<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductStatusEnum;
use App\Enums\RolesEnum;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Department;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\VariationType;
use App\Models\VariationTypeOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminProductController extends Controller
{
    private function isAdmin(): bool
    {
        return Auth::user()->hasRole(RolesEnum::Admin->value);
    }

    private function authorizeProduct(Product $product): void
    {
        if (!$this->isAdmin() && $product->created_by !== Auth::id()) {
            abort(403, 'Unauthorized.');
        }
    }

    // ── LIST ──────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Product::withoutGlobalScopes()
            ->with(['department', 'category', 'vendor', 'media'])
            ->withCount('variations')
            ->latest();

        // Vendors only see their own products
        if (!$this->isAdmin()) {
            $query->where('created_by', Auth::id());
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $products = $query->paginate(15)->withQueryString();

        $productData         = $products->toArray();
        $productData['data'] = $products->getCollection()->map(function ($product) {
            $arr          = $product->toArray();
            $arr['thumb'] = $product->getFirstMediaUrl('images', 'thumb')
                ?: $product->getFirstMediaUrl('images');
            return $arr;
        })->toArray();

        return Inertia::render('Admin/Products/Index', [
            'products'    => $productData,
            'departments' => Department::orderBy('name')->get(['id', 'name']),
            'filters'     => $request->only(['search', 'status', 'department_id']),
            'isAdmin'     => $this->isAdmin(),
        ]);
    }

    // ── CREATE FORM ───────────────────────────────────────────────────────────
    public function create()
    {
        return Inertia::render('Admin/Products/Form', [
            'product'     => null,
            'departments' => Department::with('categories')->orderBy('name')->get(),
            'statuses'    => ProductStatusEnum::cases(),
        ]);
    }

    // ── STORE ─────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'slug'          => 'required|string|unique:products,slug',
            'description'   => 'required|string',
            'price'         => 'required|numeric|min:0',
            'quantity'      => 'required|integer|min:0',
            'status'        => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'category_id'   => 'required|exists:categories,id',
            'highlight'     => 'nullable|string',
        ]);

        $validated['created_by']           = Auth::id();
        $validated['updated_by']           = Auth::id();
        $validated['deleted_combinations'] = [];

        $product = Product::create($validated);

        return redirect()->route('admin.products.edit', $product->id)
            ->with('success', 'Product created successfully.');
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    public function update(Request $request, Product $product)
    {
        $this->authorizeProduct($product);

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'slug'          => 'required|string|unique:products,slug,' . $product->id,
            'description'   => 'required|string',
            'price'         => 'required|numeric|min:0',
            'quantity'      => 'required|integer|min:0',
            'status'        => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'category_id'   => 'required|exists:categories,id',
            'highlight'     => 'nullable|string',
        ]);

        $validated['updated_by'] = Auth::id();
        $product->update($validated);

        return back()->with('success', 'Product updated.');
    }

    // ── EDIT FORM ─────────────────────────────────────────────────────────────
    public function edit(Product $product)
    {
        $this->authorizeProduct($product);

        $product->load([
            'department',
            'category',
            'variationTypes.options.media',
            'variations',
            'media',
        ]);

        return Inertia::render('Admin/Products/Form', [
            'product'     => $product,
            'departments' => Department::with('categories')->orderBy('name')->get(),
            'statuses'    => ProductStatusEnum::cases(),
            'images'      => $product->getMedia('images')->map(fn($m) => [
                'id'    => $m->id,
                'url'   => $m->getFullUrl(),
                'thumb' => $m->hasGeneratedConversion('thumb')
                    ? $m->getFullUrl('thumb')
                    : $m->getFullUrl(),
                'name'  => $m->file_name,
                'size'  => $m->human_readable_size,
            ]),
            'variationTypes' => $product->variationTypes->map(fn($vt) => [
                'id'      => $vt->id,
                'name'    => $vt->name,
                'type'    => $vt->type,
                'options' => $vt->options->map(fn($o) => [
                    'id'             => $o->id,
                    'name'           => $o->name,
                    'price_modifier' => $o->price_modifier ?? 0,
                    'image'          => $o->getFirstMediaUrl('images', 'thumb'),
                ]),
            ]),
            'variations' => $product->variations->map(fn($v) => [
                'id'                        => $v->id,
                'variation_type_option_ids' => is_string($v->variation_type_option_ids)
                    ? json_decode($v->variation_type_option_ids, true)
                    : $v->variation_type_option_ids,
                'price'    => $v->price,
                'quantity' => $v->quantity,
            ]),
        ]);
    }


    // ── DELETE ────────────────────────────────────────────────────────────────
    public function destroy(Product $product)
    {
        $this->authorizeProduct($product);

        $product->clearMediaCollection('images');
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted.');
    }

    // ── IMAGES: upload ────────────────────────────────────────────────────────
    public function uploadImages(Request $request, Product $product)
    {
        $this->authorizeProduct($product);

        $request->validate([
            'images'   => 'required|array',
            'images.*' => 'image|max:10240',
        ]);

        foreach ($request->file('images') as $file) {
    $hash = hash_file('sha256', $file->getRealPath());
    $extension = $file->getClientOriginalExtension();

    $product->addMedia($file)
        ->usingFileName("{$hash}.{$extension}")
        ->toMediaCollection('images');
}

        return back()->with('success', 'Images uploaded.');
    }

    // ── IMAGES: delete one ────────────────────────────────────────────────────
    public function deleteImage(Product $product, int $mediaId)
    {
        $this->authorizeProduct($product);

        $media = $product->getMedia('images')->firstWhere('id', $mediaId);
        if ($media) $media->delete();

        return back()->with('success', 'Image deleted.');
    }

    // ── VARIATION TYPES: save (upsert) ────────────────────────────────────────
    public function saveVariationTypes(Request $request, Product $product)
    {
        $this->authorizeProduct($product);

        $request->validate([
            'variation_types'                            => 'required|array',
            'variation_types.*.name'                     => 'required|string',
            'variation_types.*.type'                     => 'required|string',
            'variation_types.*.options'                  => 'array',
            'variation_types.*.options.*.name'           => 'required|string',
            'variation_types.*.options.*.price_modifier' => 'nullable|numeric',
        ]);

        DB::transaction(function () use ($request, $product) {
            $submittedTypeIds = [];

            foreach ($request->variation_types as $typeData) {
                $vt = isset($typeData['id'])
                    ? VariationType::find($typeData['id'])
                    : new VariationType(['product_id' => $product->id]);

                $vt->fill([
                    'product_id' => $product->id,
                    'name'       => $typeData['name'],
                    'type'       => $typeData['type'],
                ]);
                $vt->save();
                $submittedTypeIds[] = $vt->id;

                $submittedOptionIds = [];
                foreach ($typeData['options'] ?? [] as $optData) {
                    $opt = isset($optData['id'])
                        ? VariationTypeOption::find($optData['id'])
                        : new VariationTypeOption(['variation_type_id' => $vt->id]);

                    $opt->fill([
                        'variation_type_id' => $vt->id,
                        'name'              => $optData['name'],
                        'price_modifier'    => $optData['price_modifier'] ?? 0,
                    ]);
                    $opt->save();

                    if (isset($optData['image_file'])) {
                        $opt->clearMediaCollection('images');
                        $opt->addMediaFromBase64($optData['image_file'])
                            ->toMediaCollection('images');
                    }

                    $submittedOptionIds[] = $opt->id;
                }

                $vt->options()->whereNotIn('id', $submittedOptionIds)->delete();
            }

            $product->variationTypes()->whereNotIn('id', $submittedTypeIds)->delete();
        });

        return back()->with('success', 'Variation types saved.');
    }

    // ── VARIATIONS: save (upsert) ─────────────────────────────────────────────
    public function saveVariations(Request $request, Product $product)
    {
        $this->authorizeProduct($product);

        $request->validate([
            'variations'                             => 'required|array',
            'variations.*.price'                     => 'required|numeric|min:0',
            'variations.*.quantity'                  => 'required|integer|min:0',
            'variations.*.variation_type_option_ids' => 'required|array',
        ]);

        DB::transaction(function () use ($request, $product) {
            $existingIds  = $product->variations()->pluck('id')->toArray();
            $submittedIds = collect($request->variations)->pluck('id')->filter()->toArray();
            $toDelete     = array_diff($existingIds, $submittedIds);

            $deletedCombos = $product->variations()
                ->whereIn('id', $toDelete)
                ->pluck('variation_type_option_ids')
                ->toArray();

            $product->variations()->whereIn('id', $toDelete)->delete();

            foreach ($request->variations as $varData) {
                $optionIds = $varData['variation_type_option_ids'];
                sort($optionIds);

                $variation = isset($varData['id'])
                    ? ProductVariation::find($varData['id'])
                    : new ProductVariation(['product_id' => $product->id]);

                $variation->fill([
                    'product_id'                => $product->id,
                    'variation_type_option_ids' => $optionIds,
                    'price'                     => $varData['price'],
                    'quantity'                  => $varData['quantity'],
                ]);
                $variation->save();
            }

            $existing                    = $product->deleted_combinations ?? [];
            $product->deleted_combinations = collect($existing)
                ->merge($deletedCombos)
                ->unique()
                ->values()
                ->all();
            $product->save();
        });

        return back()->with('success', 'Variations saved.');
    }

    // ── VARIATIONS: generate all combinations ─────────────────────────────────
    public function generateVariations(Product $product)
    {
        $this->authorizeProduct($product);

        $product->load('variationTypes.options');
        $types = $product->variationTypes;

        if ($types->isEmpty()) {
            return back()->withErrors(['generate' => 'Add variation types first.']);
        }

        $combos = [[]];
        foreach ($types as $type) {
            $temp = [];
            foreach ($type->options as $option) {
                foreach ($combos as $combo) {
                    $temp[] = array_merge($combo, [$option->id]);
                }
            }
            $combos = $temp;
        }

        DB::transaction(function () use ($product, $combos) {
            foreach ($combos as $combo) {
                $ids = $combo;
                sort($ids);

                $deletedCombos = array_map(function ($c) {
                    $c = (array) $c;
                    sort($c);
                    return $c;
                }, $product->deleted_combinations ?? []);

                if (in_array($ids, $deletedCombos)) continue;

                $exists = $product->variations->first(function ($v) use ($ids) {
                    $vIds = is_string($v->variation_type_option_ids)
                        ? json_decode($v->variation_type_option_ids, true)
                        : (array) $v->variation_type_option_ids;
                    sort($vIds);
                    return $vIds === $ids;
                });

                if (!$exists) {
                    ProductVariation::create([
                        'product_id'                => $product->id,
                        'variation_type_option_ids' => $ids,
                        'price'                     => $product->price,
                        'quantity'                  => $product->quantity,
                    ]);
                }
            }
        });

        return back()->with('success', 'Combinations generated.');
    }
}
