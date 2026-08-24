<x-filament::page class="text-gray-800 print:bg-white print:text-black">

    {{-- Print Button --}}
    <div class="flex justify-end mb-6 print:hidden">
        <button onclick="window.print()" class="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700 text-sm">
            Print Invoice
        </button>
    </div>

    {{-- Invoice Wrapper --}}
    <div id="invoice-print-area" class="bg-white p-6 shadow rounded h-100 border print:shadow-none print:border-none print:p-6 print:m-6">

        {{-- Header --}}
        <div class="h-[500px] mb-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-800 print-three-cols">

                {{-- Order Details --}}
                <div>
                    <h3 class="text-base font-semibold mb-4">Order Details</h3>
                    <p class="mb-2">Order ID: <span class="font-medium">{{ $record->id }}</span></p>
                    <p class="mb-2">Order Date: <span class="font-medium">{{ $record->created_at->format('F d, Y') }}</span></p>
                    <p class="mb-2">Status: <span class="capitalize font-medium">{{ $record->status }}</span></p>
                    @if ($record->booking)
                        <p class="mb-1">Booking Date: {{ $record->booking->booking_date }}</p>
                        <p>Time Slot: {{ $record->booking->time_slot }}</p>
                    @endif
                </div>

                {{-- Vendor Info --}}
                <div>
                    <h3 class="text-base font-semibold mb-4">Vendor Details</h3>
                    <p class="mb-2">Name: {{ $record->vendorUser->name ?? 'N/A' }}</p>
                    <p class="mb-2">Store: {{ $record->vendorUser->vendor->store_name ?? 'N/A' }}</p>
                    <p>Address: {{ $record->vendorUser->vendor->store_address ?? 'N/A' }}</p>
                </div>

                {{-- Shipping Info --}}
                <div>
                    <h3 class="text-base font-semibold mb-4">Shipping Address</h3>
                    @if ($record->shippingAddress)
                        <p class="mb-1">{{ $record->shippingAddress->full_name }}</p>
                        <p class="mb-1">{{ $record->shippingAddress->address_line1 }}</p>
                        <p class="mb-1">{{ $record->shippingAddress->city }}, {{ $record->shippingAddress->state }} {{ $record->shippingAddress->postal_code }}</p>
                        <p class="mb-1">{{ $record->shippingAddress->country }}</p>
                        <p>Phone: {{ $record->shippingAddress->phone }}</p>
                    @else
                        <p class="italic text-gray-400">Not provided</p>
                    @endif
                </div>
            </div>
        </div>
        <div class="h-10 print:h-4"></div>

        {{-- Items Table --}}
        <div class="overflow-x-auto mt-8">
            <table class="w-full table-auto text-sm border-collapse min-w-[700px]">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="p-3 border">#</th>
                        <th class="p-3 border">Image</th>
                        <th class="p-3 border">Product</th>
                        <th class="p-3 border">Variations</th>
                        <th class="p-3 border">Attachment</th>
                        <th class="p-3 border">Designer</th>
                        <th class="p-3 border">Quantity</th>
                        <th class="p-3 border">Price</th>
                        <th class="p-3 border">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($record->orderItems as $index => $item)
                        <tr class="hover:bg-gray-50">
                            <td class="p-3 border align-top">{{ $index + 1 }}</td>
                            <td class="p-3 border align-top">
                                @php
                                    $optionIds = is_array($item->variation_type_option_ids)
                                        ? array_values($item->variation_type_option_ids)
                                        : array_values(json_decode($item->variation_type_option_ids, true) ?? []);

                                    $imageUrl = null;
                                    foreach ($optionIds as $id) {
                                        $opt = \App\Models\VariationTypeOption::with('media')->find((int) $id);
                                        if ($opt && $opt->getMedia('images')->count() > 0) {
                                            $imageUrl = $opt->getFirstMediaUrl('images', 'thumb');
                                            break;
                                        }
                                    }
                                    if (!$imageUrl && $item->product && $item->product->getMedia('images')->count() > 0) {
                                        $imageUrl = $item->product->getFirstMediaUrl('images', 'thumb');
                                    }
                                @endphp

                                @if ($imageUrl)
                                    <img src="{{ $imageUrl }}" class="w-8 h-8 object-contain rounded border mb-1" />
                                @else
                                    <span class="italic text-gray-400">No image available</span>
                                @endif
                            </td>
                            <td class="p-3 border align-top">{{ $item->product->title ?? 'N/A' }}</td>
                            <td class="p-3 border align-top">
                                @php
                                    $variationLabels = [];
                                    foreach ($optionIds as $optionId) {
                                        $option = \App\Models\VariationTypeOption::with('variationType')->find($optionId);
                                        if ($option) {
                                            $variationLabels[] = ($option->variationType->name ?? 'Type') . ': ' . $option->name;
                                        }
                                    }
                                @endphp
                                @if (count($variationLabels) > 0)
                                    {!! implode('<br>', $variationLabels) !!}
                                @else
                                    <span class="italic text-gray-400">No variations</span>
                                @endif
                            </td>
                            <td class="p-3 border align-top">
                                @if ($item->attachment_path)
                                    <a href="{{ asset('storage/' . $item->attachment_path) }}" target="_blank" class="text-blue-600 underline text-xs">
                                        {{ $item->attachment_name ?? basename($item->attachment_path) }}
                                    </a>
                                @else
                                    <span class="italic text-gray-400">None</span>
                                @endif
                            </td>
                            <td class="p-3 border align-top">
                                @if ($item->designer)
                                    <span class="text-green-700 font-medium">Yes</span>
                                @else
                                    <span class="text-gray-500 italic">No</span>
                                @endif
                            </td>
                            <td class="p-3 border align-top">{{ $item->quantity }}</td>
                            <td class="p-3 border align-top">${{ number_format($item->price, 2) }}</td>
                            <td class="p-3 border align-top">${{ number_format($item->price * $item->quantity, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot class="bg-gray-50">
                    <tr>
                        <td colspan="8" class="p-3 text-right font-semibold border text-sm">Booking Fee</td>
                        <td class="p-3 border font-bold text-gray-900 text-sm">
                            ${{ number_format($record->booking_fee ?? 0, 2) }}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="8" class="p-3 text-right font-semibold border text-sm">Grand Total</td>
                        <td class="p-3 border font-bold text-green-700 text-sm">
                            ${{ number_format($record->total_price, 2) }}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>

    {{-- Print styles --}}
    <style>
        @media print {
            body * {
                visibility: hidden !important;
            }

            #invoice-print-area,
            #invoice-print-area * {
                visibility: visible !important;
                color: #1f2937 !important;
                font-size: 11px;
            }

            #invoice-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 1rem;
                margin: 0;
                background-color: white;
                z-index: 9999;
            }

            .print-three-cols {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 1.5rem !important;
            }

            aside,
            nav,
            .fi-sidebar,
            .fi-topbar,
            .print\:hidden {
                display: none !important;
            }
        }
    </style>

</x-filament::page>
