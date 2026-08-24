<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class AdminDepartmentsController extends Controller
{
    /* ──────────────────────────────────────────
       INDEX
    ────────────────────────────────────────── */
    public function index(Request $request)
    {
        $query = Department::withCount(['categories', 'products'])->latest();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%");
        }

        if ($request->filled('active')) {
            $query->where('active', (bool) $request->input('active'));
        }

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $query->paginate(20)->withQueryString(),
            'filters'     => $request->only(['search', 'active']),
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
        return Inertia::render('Admin/Departments/DepartmentForm', [
            'flash'  => ['success' => session('success'), 'error' => session('error')],
            // 'errors' => [],
        ]);
    }

    /* ──────────────────────────────────────────
       STORE
    ────────────────────────────────────────── */
   public function store(Request $request)
{
    $validated = $request->validate([
        'name'             => 'required|string|max:255|unique:departments,name',
        'slug'             => 'nullable|string|max:255|unique:departments,slug',
        'meta_title'       => 'nullable|string|max:60',
        'meta_description' => 'nullable|string|max:160',
        'active'           => 'nullable|boolean',
        'image'            => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
    ]);

    $imagePath = null;
    if ($request->hasFile('image')) {
        $imagePath = $request->file('image')->store('departments', 'public');
    }

    Department::create([
        'name'             => $validated['name'],
        'slug'             => $validated['slug'] ?? Str::slug($validated['name']),
        'meta_title'       => $validated['meta_title'] ?? null,
        'meta_description' => $validated['meta_description'] ?? null,
        'active'           => filter_var($request->input('active', true), FILTER_VALIDATE_BOOLEAN),
        'image'            => $imagePath,
    ]);

    return redirect()
        ->route('admin.departments.index')
        ->with('success', "Department \"{$validated['name']}\" created.");
}

    /* ──────────────────────────────────────────
       EDIT
    ────────────────────────────────────────── */
    public function edit(Department $department)
    {
        return Inertia::render('Admin/Departments/DepartmentForm', [
            'department' => $department,
            'flash'      => ['success' => session('success'), 'error' => session('error')],

        ]);
    }

    /* ──────────────────────────────────────────
       UPDATE
    ────────────────────────────────────────── */
    public function update(Request $request, Department $department)
    {
        Log::info('meta_title length: ' . strlen($request->input('meta_title', '')));
        Log::info('meta_title value: ' . $request->input('meta_title'));
        try {
            $validated = $request->validate([
                'name'             => "required|string|max:255|unique:departments,name,{$department->id}",
                'slug'             => "nullable|string|max:255|unique:departments,slug,{$department->id}",
                'meta_title'       => 'nullable|string|max:60',
                'meta_description' => 'nullable|string|max:160',
                'active'           => 'nullable|boolean',
                'image'            => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::info('VALIDATION FAILED', $e->errors());
            throw $e;
        }

        $imagePath = $department->image;

        if ($request->hasFile('image')) {
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            $imagePath = $request->file('image')->store('departments', 'public');
        } elseif ($request->input('_remove_image')) {
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            $imagePath = null;
        }

        $department->update([
            'name'             => $validated['name'],
            'slug'             => $validated['slug'] ?? Str::slug($validated['name']),
            'meta_title'       => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
            'active'           => filter_var($request->input('active', true), FILTER_VALIDATE_BOOLEAN),
            'image'            => $imagePath,
        ]);

        return redirect()
            ->route('admin.departments.index')
            ->with('success', "Department \"{$department->name}\" updated.");
    }

    /* ──────────────────────────────────────────
       DESTROY
    ────────────────────────────────────────── */
    public function destroy(Department $department)
    {
        if ($department->categories()->count() > 0) {
            return back()->with('error', "Cannot delete \"{$department->name}\" — it still has categories assigned.");
        }

        if ($department->image) {
            Storage::disk('public')->delete($department->image);
        }

        $name = $department->name;
        $department->delete();

        return redirect()
            ->route('admin.departments.index')
            ->with('success', "Department \"{$name}\" deleted.");
    }
}
