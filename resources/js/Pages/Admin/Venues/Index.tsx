import React, { FormEvent, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { AdminBtn, AdminPageHeader, Icons } from "@/Components/Admin/AdminComponents";

type Venue = {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    capacity: number | null;
    seating_type: "general" | "reserved";
    is_active: boolean;
    event_legs_count: number;
};

type PaginatedVenues = {
    data: Venue[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type Props = {
    venues: PaginatedVenues;
    filters: {
        search?: string;
    };
};

export default function Index({ venues, filters }: Props) {
    const [search, setSearch] = useState(filters?.search ?? "");

    function submitSearch(e: FormEvent) {
        e.preventDefault();

        router.get(
            route("admin.venues.index"),
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    }

    function clearSearch() {
        setSearch("");

        router.get(
            route("admin.venues.index"),
            {},
            {
                preserveState: true,
                replace: true,
            }
        );
    }

    function deleteVenue(venue: Venue) {
        if (venue.event_legs_count > 0) {
            alert(
                "This venue is being used by an event and cannot be deleted. Deactivate it instead."
            );
            return;
        }

        if (!confirm(`Delete venue "${venue.name}"?`)) {
            return;
        }

        router.delete(route("admin.venues.destroy", venue.id), {
            preserveScroll: true,
        });
    }

    return (
        <>
        <AdminLayout>
            <Head title="Venues" />

            <div className="min-h-screen bg-gray-50">
                    {/* Header */}
                     <AdminPageHeader
                              eyebrow="Catalogue"
                              title="Venues"
                              meta={`${venues.data.length} records shown`}
                              action={
                                <AdminBtn as="a" href={route("admin.venues.create")} variant="accent">
                                  <Icons.Plus />
                                  Create Venue
                                </AdminBtn>

                              }
                            />

                    {/* Search */}
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <form
                            onSubmit={submitSearch}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search venues..."
                                    className="w-full rounded-lg border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                Search
                            </button>

                            {filters?.search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Clear
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Venue
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Location
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Capacity
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Seating
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Events
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {venues.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center"
                                            >
                                                <div className="text-sm font-medium text-gray-900">
                                                    No venues found
                                                </div>

                                                <div className="mt-1 text-sm text-gray-500">
                                                    Create your first venue to
                                                    use it for events.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        venues.data.map((venue) => (
                                            <tr
                                                key={venue.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {venue.name}
                                                    </div>

                                                    {venue.address && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            {venue.address}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {[
                                                        venue.city,
                                                        venue.state,
                                                        venue.postcode,
                                                        venue.country,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ") || "—"}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {venue.capacity
                                                        ? venue.capacity.toLocaleString()
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                                                        {venue.seating_type}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {venue.event_legs_count}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {venue.is_active ? (
                                                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>

                                               <td className="px-6 py-4 text-right">
    <div className="flex justify-end gap-2">

        {/* Manage physical venue seating */}
        <Link
            href={route(
                "admin.venues.seats.index",
                venue.id
            )}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
            💺 Manage Seats
        </Link>

        {/* Edit venue */}
        <Link
            href={route(
                "admin.venues.edit",
                venue.id
            )}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
            Edit
        </Link>

        {/* Delete */}
        {venue.event_legs_count === 0 && (
            <button
                type="button"
                onClick={() => deleteVenue(venue)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
                Delete
            </button>
        )}

    </div>
</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {venues.last_page > 1 && (
                            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing{" "}
                                    <span className="font-medium text-gray-700">
                                        {venues.from ?? 0}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium text-gray-700">
                                        {venues.to ?? 0}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium text-gray-700">
                                        {venues.total}
                                    </span>{" "}
                                    venues
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {venues.links.map((link, index) => (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url ?? "#"}
                                            preserveScroll
                                            className={`rounded-lg px-3 py-1.5 text-sm ${
                                                link.active
                                                    ? "bg-gray-900 text-white"
                                                    : link.url
                                                      ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                                      : "cursor-not-allowed text-gray-300"
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
            </div>
            </AdminLayout>
        </>
    );
}
