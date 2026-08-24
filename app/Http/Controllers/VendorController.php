<?php

namespace App\Http\Controllers;

use App\Enums\RolesEnum;
use App\Enums\VendorStatusEnum;
use App\Http\Resources\ProductListResource;
use App\Http\Resources\VendorUserResource;
use App\Models\Department;
use App\Models\Product;
use App\Models\Vendor;
use App\Services\ProductSearchService;
use App\Services\VendorDetailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Str;

class VendorController extends Controller
{

    public function public(VendorDetailService $service)
    {
        return new VendorUserResource(
            $service->getVendorDetails()
        );
    }


    public function profile(Request $request, Vendor $vendor)
    {

        // Only approved vendors can be viewed
        if ($vendor->status !== 'approved') {
            abort(404);
        }

        // Get filters from request (can be null)
        $departmentId = $request->input('department_id');
        $categoryId = $request->input('category_id');
        $maxPrice = $request->input('max_price');
        $sortBy = $request->input('sort_by');

        // Base query for vendor's products filtered by optional criteria
        $productsQuery = Product::query()
            ->filterApproved($departmentId, $categoryId, $maxPrice)
            ->where('created_by', $vendor->user_id)
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
            ->withCount('reviews');

        // Apply sorting
        if ($sortBy) {
            switch ($sortBy) {
                case 'price_asc':
                    $productsQuery->orderBy('price', 'asc');
                    break;
                case 'price_desc':
                    $productsQuery->orderBy('price', 'desc');
                    break;
                case 'newest':
                    $productsQuery->orderBy('created_at', 'desc');
                    break;
                default:
                    $productsQuery->latest();
            }
        } else {
            $productsQuery->latest();
        }

        // Paginate products
        $paginatedProducts = $productsQuery->paginate(12)->withQueryString();

        // Load only departments that have categories with products by this vendor
        $departments = Department::whereHas('categories.products', function ($query) use ($vendor) {
            $query->where('status', 'published')
                ->where('created_by', $vendor->user_id);
        })
            ->with(['categories' => function ($query) use ($vendor) {
                $query->whereHas('products', function ($subQuery) use ($vendor) {
                    $subQuery->where('status', 'published')
                        ->where('created_by', $vendor->user_id);
                });
            }])
            ->get();



        // Return with Inertia
        return Inertia::render('Vendor/Profile', [
            'vendor' => new VendorUserResource($vendor->user),
            'products' => ProductListResource::collection($paginatedProducts),
            'departments' => $departments,
            'filters' => [
                'department_id' => $departmentId,
                'category_id' => $categoryId,
                'max_price' => $maxPrice,
                'sort_by' => $sortBy,
            ],
        ]);
    }



    // public function profile(Request $request, Vendor $vendor)
    // {
    // $keyword = $request->query('keyword');

    //     $products = Product::query()
    //         ->forWebsite()
    //         ->where('created_by', $vendor->user_id)
    //         ->paginate()
    //         ->when($keyword, function ($query, $keyword) {
    //         $query->where(function ($query) use ($keyword) {
    //             $query->where('title', 'LIKE', "%{$keyword}%")
    //                   ->orWhere('description', 'LIKE', "%{$keyword}%");
    //         });
    //     });;

    //     return Inertia::render('Vendor/Profile', [
    //         'vendor' => $vendor,
    //         'products' => ProductListResource::collection($products)
    //     ]);;
    // }


    // App\Http\Controllers\VendorController.php

    public function become(Request $request)
    {
        $user = $request->user();

        if ($user->email !== config('services.vendor_owner_email')) {
            abort(403, 'Vendor registration is not available.');
        }

        if ($user->hasRole(RolesEnum::Vendor)) {
            return back()->with('error', 'You are already a vendor.');
        }

        $vendor = $user->vendor;

        if ($vendor && $vendor->status === VendorStatusEnum::Pending->value) {
            Log::info('vendor.become rejected: already pending', ['user_id' => $user->id]);
            return back()->with('error', 'Your vendor request is already pending review.');
        }

        if (!$vendor) {
            $vendor = new Vendor();
            $vendor->user_id = $user->id;
            // store_name is NOT NULL in the DB — placeholder until the vendor
            // fills in the real one via the edit form after approval
            $vendor->store_name = 'vendor-' . $user->id;
        }

        $vendor->status = VendorStatusEnum::Pending->value;

        Log::info('vendor.become saving', [
            'user_id' => $user->id,
            'status' => $vendor->status,
            'existing_vendor' => $vendor->exists,
        ]);

        $vendor->save();

        Log::info('vendor.become saved', ['vendor_user_id' => $vendor->user_id]);

        return back()->with('success', 'Vendor request submitted — we will review it shortly.');
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $request->merge([
            'store_name' => Str::slug($request->input('store_name')),
        ]);
        // Validate input
        $validated = $request->validate(
            [
                'store_name' => [
                    'nullable',
                    'regex:/^[a-z0-9-]+$/',
                    Rule::unique('vendors', 'store_name')->ignore($user->id, 'user_id'),
                ],
                'phone' => 'required|string|max:30',
                'store_address' => 'nullable|string',
                'vendor_type' => 'nullable|string',
                'booking_fee' => 'nullable|string',
                'start_time' => 'required|string',
                'end_time' => 'required|string',
                'slot_interval' => 'required|numeric|min:5',
                'recurring_closed_days' => 'nullable|array',
                'closed_dates' => 'nullable|array',
                'total_seats'  => 'required|integer|min:1',
                'facebook_url' => 'nullable|url|max:255',
                'instagram_url' => 'nullable|url|max:255',
                'youtube_url'  => 'nullable|url|max:255',
                'tiktok_url' => 'nullable|url|max:255',
            ],
            [
                'store_name.regex' => 'Store name must only contain lowercase alphanumeric characters and dashes.',
            ]
        );

        // Convert weekday names to numeric strings
        $dayToIndex = [
            'sunday'    => '0',
            'monday'    => '1',
            'tuesday'   => '2',
            'wednesday' => '3',
            'thursday'  => '4',
            'friday'    => '5',
            'saturday'  => '6',
        ];

        $rawDays = $validated['recurring_closed_days'] ?? [];

        $convertedDays = array_values(array_filter(array_unique(array_map(function ($day) use ($dayToIndex) {
            $dayLower = strtolower(trim($day));
            return $dayToIndex[$dayLower] ?? (ctype_digit($dayLower) ? $dayLower : null);
        }, $rawDays)), function ($val) {
            return $val !== null && $val !== '';
        }));

        // Create or update vendor
        $vendor = $user->vendor ?: new Vendor();

        $vendor->user_id = $user->id;

        $vendor->store_name = $validated['store_name'];
        $vendor->store_address = $validated['store_address'] ?? null;

        $vendor->phone = $validated['phone'];

        $vendor->business_start_time = $validated['start_time'];
        $vendor->business_end_time = $validated['end_time'];
        $vendor->slot_interval_minutes = $validated['slot_interval'];

        $vendor->vendor_type = $validated['vendor_type'] ?? null;
        $vendor->booking_fee = $validated['booking_fee'] ?? null;

        $vendor->total_seats = $validated['total_seats'];

        $vendor->facebook_url = $validated['facebook_url'] ?? null;
        $vendor->instagram_url = $validated['instagram_url'] ?? null;
        $vendor->youtube_url = $validated['youtube_url'] ?? null;
        $vendor->tiktok_url = $validated['tiktok_url'] ?? null;
        $vendor->total_seats = $validated['total_seats'];
        // Save cleaned recurring_closed_days and closed_dates
        $vendor->recurring_closed_days = $convertedDays;

        $vendor->closed_dates = array_filter(
            $validated['closed_dates'] ?? [],
            fn($date) => is_string($date)
        );

        if (!$vendor->exists || $vendor->status === VendorStatusEnum::Rejected->value) {
            $vendor->status = VendorStatusEnum::Pending->value;
        }

        $vendor->save();

        // Assign vendor role if not already
        if (!$user->hasRole(RolesEnum::Vendor)) {
            $user->assignRole(RolesEnum::Vendor);
        }

        return back()->with('success', 'Vendor profile saved successfully.');
    }
}
