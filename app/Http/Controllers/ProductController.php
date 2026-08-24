<?php

namespace App\Http\Controllers;

use App\Http\Resources\DepartmentResource;
use App\Http\Resources\ProductGroupResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductListResource;
use App\Models\Category;
use App\Models\CategoryGroup;
use App\Models\Department;
use App\Models\HeroBanner;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Services\ProductSearchService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ProductController extends Controller
{



public function home(Request $request)
{
    $banners = HeroBanner::where('is_active', true)
        ->latest()
        ->get();

    $categories = Cache::remember('home:categories', 1, function () {
        return Category::whereHas('products', function ($q) {
            $q->where('status', 'published');
        })
        ->withCount(['products' => function ($q) {
            $q->where('status', 'published');
        }])
        ->with('department')
        ->get();
    });

    // departments, productGroups, products, and allproducts were computed
    // and shipped here previously, but Home.tsx never renders them — the
    // header/nav reads 'dpts' from HandleInertiaRequests' shared props
    // instead, which was already computing the same department data
    // separately. This was pure duplicate work + wasted payload on every
    // homepage load.
    return Inertia::render('Home', [
        'banners' => $banners,
        'categories' => $categories,
    ]);
}









    public function show(Product $product)
    {
        // Was re-querying from scratch here even though $product is already
        // resolved via route-model binding. ->load() reuses that instance.
        $product->load([
            'variationTypes.options',
            'variations',
            'category',
            'user:id,name,created_at',
            'reviews.user:id,name'
        ]);
        $product->loadCount('reviews');
        $product->loadAvg('reviews', 'rating');

        $relatedInCategoryCount = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('status', 'published')
            ->count();

        $relatedProducts = Product::with(['media', 'user', 'category'])
            ->where('id', '!=', $product->id)
            ->when(
                $relatedInCategoryCount >= 3,
                fn($query) => $query->where('category_id', $product->category_id),
                fn($query) => $query->where('department_id', $product->department_id)
            )
            ->latest()
            ->take(8)
            ->get();


        // Calculate rating breakdown
        $rawBreakdown = $product->reviews()
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating');

        // Ensure all 1-5 stars are included, defaulting to 0 if missing
        $ratingBreakdown = collect([5, 4, 3, 2, 1])->mapWithKeys(function ($star) use ($rawBreakdown) {
            return [$star => $rawBreakdown[$star] ?? 0];
        });


        // Prepare reviews for frontend
        $reviews = $product->reviews->map(function ($review) {
            return [
                'id' => $review->id,
                'userName' => $review->user->name ?? 'Anonymous',
                'rating' => $review->rating,
                'comment' => $review->comment,
                'createdAt' => $review->created_at->toDateTimeString(),
                'userCreatedAt' => optional($review->user)->created_at?->toDateTimeString(), // 👈 Add this
            ];
        });

        return Inertia::render('Product/Show', [
            'product' => new ProductResource($product),
            'relatedProducts' => ProductResource::collection($relatedProducts),
            'variationOptions' => request('option', []),
            'reviews' => $reviews,  // send reviews explicitly
            'ratingBreakdown' => $ratingBreakdown, // pass it to the frontend
        ]);
    }




    public function byDepartment(Request $request, $slug)
    {
        $department = Department::with(['categories' => function ($query) {
            $query->whereHas('products', function ($q) {
                $q->filterApproved();
            });
        }])->where('slug', $slug)->firstOrFail();

        $categoryId = $request->integer('category_id');
        $maxPrice = $request->float('max_price');
        $keyword = $request->query('keyword');
        $sortBy = $request->query('sort_by');

        // 1. Query all products for this department with filters, ready for pagination
        $productsQuery = Product::query()
            ->whereHas('category', function ($q) use ($department) {
                $q->where('department_id', $department->id);
            })
            ->filterApproved(
                [$department->id],
                $categoryId ? [$categoryId] : null,
                $maxPrice
            )
            ->with(['category', 'department', 'user.vendor', 'variationTypes.options.media', 'variations', 'media', 'reviews.user'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->when($keyword, fn($q) => $q->where('title', 'like', "%{$keyword}%"))
            ->when($sortBy, function ($q) use ($sortBy) {
                switch ($sortBy) {
                    case 'price_asc':
                        return $q->orderBy('price', 'asc');
                    case 'price_desc':
                        return $q->orderBy('price', 'desc');
                    case 'newest':
                        return $q->orderBy('created_at', 'desc');
                    default:
                        return $q->latest();
                }
            }, fn($q) => $q->latest());

        $pagedProducts = $productsQuery->paginate(12);

        // 2. Fetch active product groups with their grouped products for this department + filters
        $productGroups = ProductGroup::where('active', true)
            ->with([
                'groupedProducts' => function ($query) use ($department, $categoryId, $maxPrice, $keyword) {
                    $query->whereHas('category', function ($q) use ($department) {
                        $q->where('department_id', $department->id);
                    })
                        ->filterApproved(
                            [$department->id],
                            $categoryId ? [$categoryId] : null,
                            $maxPrice
                        )
                        ->when($keyword, fn($q) => $q->where('title', 'like', "%{$keyword}%"))
                        ->withAvg('reviews', 'rating')
                        ->withCount('reviews')
                        ->with([
                            'user.vendor',
                            'department',
                            'variationTypes.options.media',
                            'variations',
                            'media',
                            'reviews.user'
                        ]);
                }
            ])
            ->get();

        // Convert to resource
        $productGroupsResource = ProductGroupResource::collection($productGroups)->toArray($request);

        // 3. Fetch categories & departments as you had before
        $categories = $department->categories()
            ->whereHas('products', function ($q) use ($categoryId, $maxPrice, $keyword, $department) {
                $q->filterApproved([$department->id], $categoryId ? [$categoryId] : null, $maxPrice);
                if ($keyword) {
                    $q->where('title', 'like', "%{$keyword}%");
                }
            })
            ->get();

        $departments = Department::whereHas('categories.products', function ($query) {
            $query->filterApproved();
        })
            ->withCount(['products as products_count' => function ($query) {
                $query->filterApproved();
            }])
            ->with(['categories' => function ($query) {
                $query->whereHas('products', function ($q2) {
                    $q2->filterApproved();
                });
            }])
            ->get();

        $categoryGroups = CategoryGroup::with(['categories.department'])
            ->where('active', true)
            ->get()
            ->map(function ($group) {
                $group->image_url; // Touch accessor
                return $group;
            });

        // 4. Return data to your Inertia page
        return Inertia::render('Department/Index', [
            'department' => new DepartmentResource($department),
            'products' => ProductListResource::collection($pagedProducts),  // paginated all products
            'productGroups' => $productGroupsResource,                      // grouped products
            'categoryGroups' => $categoryGroups,
            'categories' => $categories,
            'departments' => $departments,
            'filters' => [
                'category_id' => $categoryId,
                'max_price' => $maxPrice,
                'sort_by' => $sortBy,
                'keyword' => $keyword,
                'department_id' => $department->id,
            ],
            'appName' => config('app.name'),
        ]);
    }




    public function search(Request $request)
    {
        // ── All products for accordion (no pagination) ────────────────
        // This doesn't depend on the logged-in user or query filters, so
        // it's cached — previously it re-ran a 5-relation-deep query
        // against the entire catalog on every single request to this page.
        $allProducts = Cache::rememberForever('search:allProducts', function () {
            return Product::forWebsite()
                ->with([
                    'department',
                    'category',
                    'user.vendor',
                    'variationTypes.options.media',
                    'variations',
                    'media',
                    'reviews.user',
                ])
                ->withAvg('reviews', 'rating')
                ->withCount('reviews')
                ->latest()
                ->get();
        });

        $productGroups = Cache::remember('search:productGroups', 60, function () {
            return ProductGroup::where('active', true)
                ->with([
                    'groupedProducts' => function ($query) {
                        $query->withAvg('reviews', 'rating')
                            ->withCount('reviews')
                            ->with([
                                'user.vendor',
                                'department',
                                'variationTypes.options.media',
                                'variations',
                                'media',
                                'reviews.user'
                            ]);
                    }
                ])
                ->get();
        });

        $productGroupsResource = ProductGroupResource::collection($productGroups);
        $productGroupsArray = $productGroupsResource->toArray($request);

        $categoryGroups = CategoryGroup::with(['categories.department'])
            ->where('active', true)
            ->get()
            ->map(function ($group) {
                $group->image_url;
                return $group;
            });

        $departments = Department::whereHas('categories.products', function ($query) {
            $query->forWebsite();
        })
            ->with(['categories' => function ($query) {
                $query->whereHas('products', function ($q) {
                    $q->forWebsite();
                });
            }])
            ->get();

        $keyword   = $request->query('keyword');
        $categoryId = $request->query('category_id');
        $maxPrice  = $request->query('max_price');
        $sortBy    = $request->query('sort_by');

        $searchedProduct = null;

        if ($keyword) {
            $searchedProduct = Product::query()
                ->forWebsite()
                ->with([
                    'user.vendor',
                    'department',
                    'category',
                    'variationTypes.options.media',
                    'variations',
                    'media',
                    'reviews.user',
                ])
                ->withAvg('reviews', 'rating')
                ->withCount('reviews')
                ->where('title', 'LIKE', "%{$keyword}%")
                ->paginate(12)
                ->withQueryString();
        }

        $allGroupedProducts = $productGroups
            ->flatMap(fn($group) => $group->groupedProducts)
            ->unique('id')
            ->values();

        $page    = request()->get('page', 1);
        $perPage = 12;
        $offset  = ($page - 1) * $perPage;

        $pagedProducts = new LengthAwarePaginator(
            $allGroupedProducts->slice($offset, $perPage)->values(),
            $allGroupedProducts->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return Inertia::render('Shop/ListProducts', [
            'allProducts'      => ProductListResource::collection($allProducts),  // ← all, no pagination
            'products'         => ProductListResource::collection($pagedProducts),
            'searchedProducts' => $searchedProduct
                ? ProductListResource::collection($searchedProduct)
                : null,
            'filters' => [
                'keyword'     => $keyword,
                'category_id' => $categoryId,
                'max_price'   => $maxPrice,
                'sort_by'     => $sortBy,
            ],
            'departments'  => $departments,
            'categoryGroups' => $categoryGroups,
            'productGroups'  => $productGroupsArray,
        ]);
    }




    public function showProductGroup(ProductGroup $productGroup)
    {
        // Paginated products with every relation ProductListResource needs —
        // previously this query had zero eager loading at all, so every
        // field (media, reviews, category, department, vendor, variations)
        // triggered a fresh query per product on the page.
        $products = $productGroup->products()
            ->where('status', 'published')
            ->with([
                'category',
                'department',
                'user.vendor',
                'variationTypes.options.media',
                'variations',
                'media',
                'reviews.user',
            ])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->latest()
            ->paginate(12);

        return Inertia::render('showProductGroup/Show', [
            'productGroup' => $productGroup,
            'products' => ProductListResource::collection($products),
        ]);
    }
}
