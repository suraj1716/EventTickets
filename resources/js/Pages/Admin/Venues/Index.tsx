import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminTable,
  AdminBtn,
  ActionBtn,
  FilterBar,
  Pagination,
  StatusBadge,
  Tr,
  Td,
  FlashMessage,
  ConfirmModal,
  Icons,
  C,
  fontMono,
} from "../../../Components/Admin/AdminComponents";

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

interface Props {
  venues: { data: Venue[]; links: any[] };
  filters: { search?: string };
  flash?: { success?: string; error?: string };
}

export default function VenuesIndex({ venues, filters, flash }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);

  function handleDelete() {
    if (!deleteTarget) return;
    router.delete(route("admin.venues.destroy", deleteTarget.id), {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setDeleteTarget(null),
    });
  }

  function locationOf(venue: Venue) {
    return (
      [venue.city, venue.state, venue.postcode, venue.country]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return (
    <>
      <Head title="Venues" />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Venues"
          meta={`${venues.data.length} records shown`}
          action={
            <AdminBtn
              as="a"
              href={route("admin.venues.create")}
              variant="accent"
            >
              <Icons.Plus />
              Create Venue
            </AdminBtn>
          }
        />

        <FlashMessage flash={flash ?? {}} />

        <FilterBar
          routeName="admin.venues.index"
          filters={filters}
          fields={[
            { key: "search", placeholder: "Search venues…", flex: true },
          ]}
        />

        <AdminTable
          headers={[
            "#",
            "Venue",
            "Location",
            "Capacity",
            "Seating",
            "Events",
            "Status",
            "Actions",
          ]}
          empty="✦ No venues found"
        >
          {venues.data.map((venue) => (
            <Tr key={venue.id}>
              <Td muted>{venue.id}</Td>

              <Td>
                <span style={{ fontWeight: 500 }}>{venue.name}</span>
                {venue.address && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: C.textMuted,
                      marginTop: 2,
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {venue.address}
                  </div>
                )}
              </Td>

              <Td muted>{locationOf(venue)}</Td>

              <Td muted>
                {venue.capacity ? venue.capacity.toLocaleString() : "—"}
              </Td>

              <Td>
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: "11px",
                    textTransform: "capitalize",
                    background: C.bgAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    padding: "2px 8px",
                    color: C.textMuted,
                  }}
                >
                  {venue.seating_type}
                </span>
              </Td>

              <Td muted>{venue.event_legs_count}</Td>

              <Td>
                <StatusBadge
                  status={venue.is_active ? "active" : "draft"}
                  label={venue.is_active ? "Active" : "Inactive"}
                />
              </Td>

              <Td>
                <div style={{ display: "flex", gap: 4 }}>
                  <AdminBtn
                    as="a"
                    href={route("admin.venues.seats.index", venue.id)}
                    variant="ghost"
                    size="sm"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ width: 13, height: 13, display: "block" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 10V6a2 2 0 012-2h8a2 2 0 012 2v4M4 10h16v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM6 15v4m12-4v4"
                      />
                    </svg>
                    Manage Seats
                  </AdminBtn>
                  <ActionBtn
                    variant="edit"
                    title="Edit"
                    as="a"
                    href={route("admin.venues.edit", venue.id)}
                  >
                    <Icons.Edit />
                  </ActionBtn>
                  {venue.event_legs_count === 0 && (
                    <ActionBtn
                      variant="delete"
                      title="Delete"
                      onClick={() => setDeleteTarget(venue)}
                    >
                      <Icons.Delete />
                    </ActionBtn>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>

        <Pagination links={venues.links} />

        {deleteTarget && (
          <ConfirmModal
            title={`Delete "${deleteTarget.name}"?`}
            description="This will permanently remove the venue. This action cannot be undone."
            confirmLabel="Delete Venue"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
