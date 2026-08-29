<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Enums\RolesEnum;

class AdminCategoriesController extends Controller
{
    /* ──────────────────────────────────────────
       INDEX
    ────────────────────────────────────────── */
public function index(Request $request)
{
    $user = $request->user();

    $query = Category::with(['parent', 'department'])
        ->withCount('products');

    // Full site admins see everything; vendors see only their own (+ legacy/global)
    if (!$user->hasRole(RolesEnum::Admin)) {
        $query->where(function ($q) use ($user) {
            $q->where('created_by', $user->id)
              ->orWhereNull('created_by');
        });
    }

    if ($search = $request->input('search')) {
        $query->where('name', 'like', "%{$search}%");
    }

    if ($request->filled('department_id')) {
        $query->where('department_id', $request->input('department_id'));
    }

    if ($request->filled('active')) {
        $query->where('active', (bool) $request->input('active'));
    }

    $query->orderBy('id', 'asc');

    return Inertia::render('Admin/Categories/Index', [
        'categories'  => $query->paginate(20)->withQueryString(),
        'departments' => Department::orderBy('name')->get(['id', 'name']),
        'filters'     => $request->only(['search', 'department_id', 'active']),
        'flash'       => [
            'success' => session('success'),
            'error'   => session('error'),
        ],
    ]);
}

    /* ──────────────────────────────────────────
       CREATE
    ────────────────────────────────────────── */
    public function create()
    {
        return Inertia::render('Admin/Categories/CategoryForm', [
            'departments'      => Department::orderBy('name')->get(['id', 'name']),
            'parentCategories' => Category::orderBy('name')->get(['id', 'name', 'department_id']),
            'flash'            => [
                'success' => session('success'),
                'error'   => session('error'),
            ],

        ]);
    }

    /* ──────────────────────────────────────────
       STORE
    ────────────────────────────────────────── */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
             'slug'          => 'required|string|max:255|unique:categories,slug',
            'description'   => 'nullable|string',
            'parent_id'     => 'nullable|exists:categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'active'        => 'nullable|boolean',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
        }

     Category::create([
    'name'          => $validated['name'],
    'description'   => $validated['description'] ?? null,
    'parent_id'     => $validated['parent_id'] ?? null,
    'department_id' => $validated['department_id'] ?? null,
    'active'        => filter_var($request->input('active', true), FILTER_VALIDATE_BOOLEAN),
    'image'         => $imagePath,
    'created_by'    => $request->user()->id, // add this
]);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category \"{$validated['name']}\" created.");
    }

    /* ──────────────────────────────────────────
       EDIT
    ────────────────────────────────────────── */
    public function edit(Category $category)
    {
        return Inertia::render('Admin/Categories/CategoryForm', [
            'category'         => $category,
            'departments'      => Department::orderBy('name')->get(['id', 'name']),
            'parentCategories' => Category::orderBy('name')->get(['id', 'name', 'department_id']),
            'flash'            => [
                'success' => session('success'),
                'error'   => session('error'),
            ],

        ]);
    }

    /* ──────────────────────────────────────────
       UPDATE
    ────────────────────────────────────────── */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
             'slug'          => 'required|string|max:255|unique:categories,slug,' . $category->id,
            'description'   => 'nullable|string',
            'parent_id'     => 'nullable|exists:categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'active'        => 'nullable|boolean',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Guard: prevent a category becoming its own parent
        if (!empty($validated['parent_id']) && (int) $validated['parent_id'] === $category->id) {
            return back()->withErrors(['parent_id' => 'A category cannot be its own parent.']);
        }

        $imagePath = $category->image;

        if ($request->hasFile('image')) {
            // Delete old image
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            $imagePath = $request->file('image')->store('categories', 'public');
        } elseif ($request->input('_remove_image')) {
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            $imagePath = null;
        }

        $category->update([
            'name'          => $validated['name'],
            'description'   => $validated['description'] ?? null,
            'parent_id'     => $validated['parent_id'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'active'        => filter_var($request->input('active', true), FILTER_VALIDATE_BOOLEAN),
            'image'         => $imagePath,
        ]);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category \"{$category->name}\" updated.");
    }

    /* ──────────────────────────────────────────
       DESTROY
    ────────────────────────────────────────── */
    public function destroy(Category $category)
    {
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        // Nullify children's parent_id so they become root categories
        Category::where('parent_id', $category->id)->update(['parent_id' => null]);

        $name = $category->name;
        $category->delete();

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category \"{$name}\" deleted.");
    }
}
