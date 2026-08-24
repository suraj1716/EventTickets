@php
$bookingsByDayJson = $bookingsByDay->map(function ($bookings) {
    return $bookings->map(function ($booking) {
        return [
            'id' => $booking->id,
            'order_id' => $booking->order_id,    // <-- expose order_id directly
            'time_slot' => $booking->time_slot,
            'user' => ['name' => $booking->user->name ?? 'N/A'],
            'vendor' => ['name' => $booking->vendor->name ?? 'N/A'],
            'order' => [
                'orderItems' => $booking->order
                    ? $booking->order->orderItems->map(fn($item) => ['product' => ['title' => $item->product->title]])->toArray()
                    : [],
            ],
        ];
    });
});


@endphp

<div
    x-data="{
        tab: '{{ $bookingsByDay->keys()->first() ?? '' }}',
        bookingsByDay: {{ $bookingsByDayJson->toJson() }}
    }"
    x-init="console.log(bookingsByDay)"
    class="max-w-5xl mx-auto p-4"
>
    <!-- Tabs -->
    <nav class="flex space-x-4 border-b border-gray-300" role="tablist" aria-label="Booking Days">
        <template x-for="(bookings, date) in bookingsByDay" :key="date">
            <button
                type="button"
                role="tab"
                @click="tab = date"
                :class="tab === date
                    ? 'border-b-4 border-blue-600 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:text-blue-600'"
                :aria-selected="tab === date"
                :aria-controls="'tab-panel-' + date"
                :id="'tab-' + date"
                class="flex items-center space-x-2 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-t"
            >
                <span x-text="new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })"></span>
                <span
                    class="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
                    x-text="bookings.length"
                    aria-label="Number of bookings"
                ></span>
            </button>
        </template>
    </nav>

    <!-- Tab Content -->
    <template x-for="(bookings, date) in bookingsByDay" :key="date">
        <section
            x-show="tab === date"
            role="tabpanel"
            :aria-labelledby="'tab-' + date"
            :id="'tab-panel-' + date"
            tabindex="0"
            class="mt-6"
        >
            <template x-if="bookings.length === 0">
                <p class="text-gray-500 italic">No bookings for this day.</p>
            </template>

            <template x-if="bookings.length > 0">
                <div class="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                 <table class="min-w-full border-collapse border border-gray-300">
    <thead class="bg-gray-50">
        <tr>
            <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Booking ID</th>
            <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Order ID</th>
            <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Time Slot</th>
            <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Customer</th>
            <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Vendor</th>
            <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Product(s)</th>
        </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
        <template x-for="booking in bookings" :key="booking.id">
            <tr class="hover:bg-blue-50 cursor-pointer"
                @click="window.location.href = '/admin/bookings/' +  booking.order_id "
                title="View Booking Details"
            >
                <td class="border border-gray-300 px-4 py-2 text-sm text-blue-600 underline" x-text=" booking.order_id"></td>
                <td class="border border-gray-300 px-4 py-2 text-sm text-blue-600 underline" x-text=" booking.order_id"></td>
                <td class="border border-gray-300 px-4 py-2 text-sm" x-text="booking.time_slot"></td>
                <td class="border border-gray-300 px-4 py-2 text-sm" x-text="booking.user.name"></td>
                <td class="border border-gray-300 px-4 py-2 text-sm" x-text="booking.vendor.name"></td>
                <td class="border border-gray-300 px-4 py-2 text-sm" x-text="booking.order.orderItems.map(i => i.product.title).join(', ') || 'N/A'"></td>
            </tr>
        </template>
    </tbody>
</table>

                </div>
            </template>
        </section>
    </template>
</div>
