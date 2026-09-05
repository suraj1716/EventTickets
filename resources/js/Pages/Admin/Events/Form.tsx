// resources/js/Pages/Admin/Events/Form.tsx
//
// Single form component for both create and edit. Mirrors the validation
// shape in EventController::validateEvent() exactly — keep the two in
// sync if either changes.

import { FormEventHandler, useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import type {
  Category,
  Event,
  EventFormInput,
  EventLegFormInput,
  TicketTierFormInput,
  Venue,
} from "@/types";
import AdminLayout from "../AdminLayout";
import { formatDatetimeLocal, formatDateInput } from "@/utils/dateFormat";
import {
  AdminPageHeader,
  AdminBtn,
  C,
  fontBody,
  fontMono,
} from "@/Components/Admin/AdminComponents";

interface Props {
  event?: Event;
  categories: Category[];
  venues: Venue[];
}

function emptyTier(): TicketTierFormInput {
  return { name: "", price: 0, quantity: 0, starts_at: "", ends_at: "" };
}

function tierQuantityTotal(leg: EventLegFormInput): number {
  return leg.tiers.reduce((sum, t) => sum + (t.quantity || 0), 0);
}

function emptyLeg(): EventLegFormInput {
  return {
    id: undefined,
    venue_id: undefined,
    venue_name: "",
    address: "",
    city: "",
    latitude: undefined,
    longitude: undefined,
    event_date: "",
    capacity: 0,
    seating_type: "general",
    tiers: [emptyTier()],
  };
}

function legsFromEvent(
  event: Event | undefined,
  venues: Venue[],
): EventLegFormInput[] {
  if (!event?.legs?.length) {
    return [emptyLeg()];
  }

  return event.legs.map((leg) => {
    // If this leg is linked to a real venue, trust the venue's current
    // capacity over whatever was last saved on the leg — the venue is
    // the source of truth and its capacity may have changed since.
    const linkedVenue = leg.venue_id
      ? venues.find((v) => v.id === leg.venue_id)
      : undefined;

    // Reserved-seating legs get their capacity from the seat map — it's
    // kept in sync server-side every time seats are imported/removed
    // (see EventSeatController), so leg.capacity is the source of truth
    // here and must NOT be overwritten by the venue's flat number.
    //
    // General-admission legs have no seat map, so the venue's capacity
    // is the only figure that exists — use it if the leg's own value
    // looks unset/stale.
    const effectiveCapacity =
      leg.seating_type === "reserved"
        ? leg.capacity
        : (linkedVenue?.capacity ?? leg.capacity);

    return {
      id: leg.id,
      venue_id: leg.venue_id,
      venue_name: leg.venue_name,
      address: leg.address ?? "",
      city: leg.city ?? "",
      latitude: leg.latitude ? parseFloat(leg.latitude) : undefined,
      longitude: leg.longitude ? parseFloat(leg.longitude) : undefined,
      event_date: formatDateInput(leg.event_date), // <-- fixed
      capacity: effectiveCapacity,
      seating_type: leg.seating_type,
      tiers: (leg.ticket_tiers ?? [emptyTier() as any]).map((t) => ({
        id: t.id,
        name: t.name,
        price: parseFloat(t.price),
        quantity: t.quantity,
        starts_at: formatDatetimeLocal(t.starts_at),
        ends_at: formatDatetimeLocal(t.ends_at),
        sold_count: t.sold_count ?? 0,
      })),
    };
  });
}

export default function EventForm({ event, categories, venues }: Props) {
  console.log("VENUES PROP:", venues);
  const isEditing = !!event;
  const [artistInput, setArtistInput] = useState("");
  const { data, setData, post, transform, processing, errors } =
    useForm<EventFormInput>({
      name: event?.name ?? "",
      description: event?.description ?? "",
      type: event?.type ?? "standalone",
      status: (event?.status as "draft" | "proposed") ?? "draft",
      languages: event?.languages ?? [],
      category_ids: event?.categories?.map((c) => c.id) ?? [],
      artists: event?.artists?.map((a) => a.name) ?? [],
      legs: legsFromEvent(event, venues),
      media: [],
      remove_media_ids: [],
    });

  // ---------- Media ----------

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const existingMedia = event?.media ?? [];
    const removedIds = data.remove_media_ids ?? [];

    // Existing media that will actually remain
    const remainingExistingCount = existingMedia.filter(
      (media) => !removedIds.includes(media.id),
    ).length;

    const currentNewFiles = data.media?.length ?? 0;

    const totalAfterUpload =
      remainingExistingCount + currentNewFiles + files.length;

    if (totalAfterUpload > 2) {
      alert("An event can have a maximum of 2 media files.");
      e.target.value = "";
      return;
    }

    setData("media", [...(data.media ?? []), ...files]);

    e.target.value = "";
  }

  function removeNewMedia(index: number) {
    setData(
      "media",
      (data.media ?? []).filter((_, i) => i !== index),
    );
  }

  function removeExistingMedia(id: number) {
    setData(
      "remove_media_ids",
      Array.from(new Set([...(data.remove_media_ids ?? []), id])),
    );
  }

  // ---------- Tour toggle ----------

  function handleTypeChange(type: "standalone" | "tour") {
    setData("type", type);
    if (type === "tour" && data.legs.length < 2) {
      setData("legs", [...data.legs, emptyLeg()]);
    }
  }

  // ---------- Locations ----------

  function updateLeg(index: number, patch: Partial<EventLegFormInput>) {
    const legs = [...data.legs];
    legs[index] = { ...legs[index], ...patch };
    setData("legs", legs);
  }

  function addLeg() {
    setData("legs", [...data.legs, emptyLeg()]);
  }

  function isLegLocked(leg: EventLegFormInput) {
    return leg.tiers.some((t) => (t.sold_count ?? 0) > 0);
  }

  function removeLeg(index: number) {
    if (data.legs.length <= 1) return;
    if (isLegLocked(data.legs[index])) return;
    setData(
      "legs",
      data.legs.filter((_, i) => i !== index),
    );
  }

  // ---------- Ticket tiers (per leg) ----------

  function updateTier(
    legIndex: number,
    tierIndex: number,
    patch: Partial<TicketTierFormInput>,
  ) {
    const legs = [...data.legs];
    const tiers = [...legs[legIndex].tiers];
    tiers[tierIndex] = { ...tiers[tierIndex], ...patch };
    legs[legIndex] = { ...legs[legIndex], tiers };
    setData("legs", legs);
  }

  function addTier(legIndex: number) {
    const legs = [...data.legs];
    legs[legIndex] = {
      ...legs[legIndex],
      tiers: [...legs[legIndex].tiers, emptyTier()],
    };
    setData("legs", legs);
  }

  function removeTier(legIndex: number, tierIndex: number) {
    const legs = [...data.legs];
    if (legs[legIndex].tiers.length <= 1) return;
    if ((legs[legIndex].tiers[tierIndex].sold_count ?? 0) > 0) return;
    legs[legIndex] = {
      ...legs[legIndex],
      tiers: legs[legIndex].tiers.filter((_, i) => i !== tierIndex),
    };
    setData("legs", legs);
  }

  // ---------- Artists ----------

  function addArtist() {
    const name = artistInput.trim();
    if (!name || data.artists?.includes(name)) return;
    setData("artists", [...(data.artists ?? []), name]);
    setArtistInput("");
  }

  function removeArtist(name: string) {
    setData(
      "artists",
      (data.artists ?? []).filter((a) => a !== name),
    );
  }

  // ---------- Categories ----------

  function toggleCategory(id: number) {
    const ids = data.category_ids ?? [];
    setData(
      "category_ids",
      ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id],
    );
  }

  // ---------- Submit ----------

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    const overCapacityLeg = data.legs.find(
      (leg) => leg.capacity > 0 && tierQuantityTotal(leg) > leg.capacity,
    );
    if (overCapacityLeg) {
      alert(
        "One or more legs have ticket quantities exceeding the venue capacity.",
      );
      return;
    }

    console.log("SUBMIT DATA:", data);

    if (isEditing) {
      transform((data) => ({
        ...data,
        _method: "PUT",
      }));

      post(route("admin.events.update", event!.id), {
        forceFormData: true,
        onSuccess: () => {
          router.post(route("admin.events.publish", event!.id));
        },
      });
    } else {
      post(route("admin.events.store"), {
        forceFormData: true,
      });
    }
  };
  function handlePublish() {
    const overCapacityLeg = data.legs.find(
      (leg) => leg.capacity > 0 && tierQuantityTotal(leg) > leg.capacity,
    );
    if (overCapacityLeg) {
      alert(
        "One or more legs have ticket quantities exceeding the venue capacity.",
      );
      return;
    }

    if (!isEditing) {
      post(route("admin.events.store"), {
        forceFormData: true,
        onSuccess: () => {
          // Handle create + publish separately if needed
        },
      });

      return;
    }

    transform((data) => ({
      ...data,
      _method: "PUT",
    }));

    post(route("admin.events.update", event!.id), {
      forceFormData: true,
      onSuccess: () => {
        router.post(route("admin.events.publish", event!.id));
      },
    });
  }

  return (
    <AdminLayout>
      <Head title={isEditing ? `Edit ${event!.name}` : "Create event"} />

      <AdminPageHeader
        eyebrow={isEditing ? "Edit event" : "New event"}
        title={isEditing ? event!.name : "Create event"}
      />

      <form onSubmit={submit} style={{ maxWidth: 640 }}>
        <Field label="Part of a tour?">
          <select
            value={data.type}
            onChange={(e) =>
              handleTypeChange(e.target.value as "standalone" | "tour")
            }
            style={inputStyle}
          >
            <option value="standalone">Standalone event, one location</option>
            <option value="tour">Multi-leg tour, several locations</option>
          </select>
        </Field>

        <Field label="Visibility">
          <select
            value={data.status}
            onChange={(e) =>
              setData("status", e.target.value as "draft" | "proposed")
            }
            style={inputStyle}
            disabled={event?.status === "published"}
          >
            <option value="draft">Draft — hidden, only visible to you</option>
            <option value="proposed">
              Proposed — visible via link, waitlist signups open
            </option>
            {event?.status === "published" && (
              <option value="published">Published — live and on sale</option>
            )}
          </select>
          <p style={{ fontSize: 11, color: C.textFaint, marginTop: 6 }}>
            {event?.status === "published"
              ? "This event is live. Visibility can't be changed back from here."
              : 'Use "Publish event" below when you\'re ready to go on sale — that overrides this setting.'}
          </p>
        </Field>

        <Field label="Event name" error={errors.name}>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData("name", e.target.value)}
            placeholder="Kirtan night with Raka Collective"
            style={inputStyle}
          />
        </Field>

        <Field label="Description" error={errors.description}>
          <textarea
            value={data.description}
            onChange={(e) => setData("description", e.target.value)}
            rows={3}
            style={inputStyle}
          />
        </Field>

        <Field label="Event media" error={errors.media}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Existing media */}
            {event?.media
              ?.filter(
                (media) => !(data.remove_media_ids ?? []).includes(media.id),
              )
              .map((media) => (
                <div
                  key={media.id}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.bgAlt,
                  }}
                >
                  {media.type === "video" ? (
                    <video
                      src={media.url}
                      controls
                      style={{
                        width: "100%",
                        maxHeight: 256,
                        objectFit: "contain",
                        background: "#000",
                      }}
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt=""
                      style={{
                        width: "100%",
                        maxHeight: 256,
                        objectFit: "contain",
                        background: "#000",
                      }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeExistingMedia(media.id)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      borderRadius: 8,
                      background: "rgba(0,0,0,0.7)",
                      padding: "6px 12px",
                      fontSize: 11,
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

            {/* New uploads */}
            {(data.media ?? []).map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.bgAlt,
                }}
              >
                {file.type.startsWith("video/") ? (
                  <video
                    src={URL.createObjectURL(file)}
                    controls
                    style={{
                      width: "100%",
                      maxHeight: 256,
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{
                      width: "100%",
                      maxHeight: 256,
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeNewMedia(index)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.7)",
                    padding: "6px 12px",
                    fontSize: 11,
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>

                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: 11,
                    color: C.textFaint,
                  }}
                >
                  {file.name}
                </div>
              </div>
            ))}

            {/* Upload button */}
            {(event?.media ?? []).filter(
              (media) => !(data.remove_media_ids ?? []).includes(media.id),
            ).length +
              (data.media?.length ?? 0) <
              2 && (
              <label
                style={{
                  display: "flex",
                  cursor: "pointer",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  border: `1px dashed ${C.borderDashed}`,
                  background: C.bgAlt,
                  padding: "32px 24px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 13, color: C.text }}>+ Add media</span>

                <span
                  style={{ marginTop: 4, fontSize: 11, color: C.textFaint }}
                >
                  Images or videos · maximum 2 files
                </span>

                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleMediaChange}
                />
              </label>
            )}

            <p style={{ fontSize: 11, color: C.textFaint }}>
              {(event?.media ?? []).filter(
                (media) => !(data.remove_media_ids ?? []).includes(media.id),
              ).length + (data.media?.length ?? 0)}{" "}
              / 2 media files
            </p>
          </div>
        </Field>

        <Field label="Artists">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {(data.artists ?? []).map((name) => (
              <span
                key={name}
                style={{
                  background: C.bgAlt,
                  color: C.text,
                  fontSize: 13,
                  padding: "4px 12px",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeArtist(name)}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.textFaint,
                    cursor: "pointer",
                  }}
                  aria-label={`Remove ${name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addArtist();
              }
            }}
            placeholder="Type a name and press enter"
            style={inputStyle}
          />
        </Field>

        <Field label="Genres">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((cat) => {
              const active = (data.category_ids ?? []).includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    fontSize: 13,
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: `1px solid ${active ? C.amber : C.border}`,
                    background: active ? C.amber : "transparent",
                    color: active ? C.textInverse : C.textMuted,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </Field>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 32,
            marginBottom: 12,
          }}
        >
          <label style={{ fontSize: 13, color: C.textMuted }}>
            {data.type === "tour" ? "Tour legs" : "Location"}
          </label>
        </div>

        {data.legs.map((leg, legIndex) => (
          <LegCard
            key={leg.id ?? `new-${legIndex}`}
            leg={leg}
            index={legIndex}
            isTour={data.type === "tour"}
            canRemove={data.legs.length > 1 && !isLegLocked(leg)}
            isLocked={isLegLocked(leg)}
            errors={errors}
            venues={venues}
            onChange={(patch) => updateLeg(legIndex, patch)}
            onRemove={() => removeLeg(legIndex)}
            onAddTier={() => addTier(legIndex)}
            onUpdateTier={(tierIndex, patch) =>
              updateTier(legIndex, tierIndex, patch)
            }
            onRemoveTier={(tierIndex) => removeTier(legIndex, tierIndex)}
          />
        ))}

        {data.type === "tour" && (
          <button
            type="button"
            onClick={addLeg}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: `1px dashed ${C.borderDashed}`,
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 13,
              color: C.textMuted,
              background: "transparent",
              cursor: "pointer",
              transition: "all 150ms ease",
              marginBottom: 24,
            }}
          >
            + Add location
          </button>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 32,
            paddingTop: 24,
            borderTop: `1px dashed ${C.borderDashed}`,
          }}
        >
          <AdminBtn type="submit" variant="ghost" disabled={processing}>
            Save
          </AdminBtn>
          <AdminBtn type="button" onClick={handlePublish} disabled={processing}>
            Publish event
          </AdminBtn>
        </div>
      </form>
    </AdminLayout>
  );
}

// ---------- Small building blocks ----------

// colorScheme: "dark" tells the browser to render native controls
// (select dropdowns, date/datetime-local pickers, their popup
// calendars, spinner arrows, etc.) using light text on a dark
// background instead of defaulting to the OS light theme, which is
// what was making these inputs unreadable — the style below only
// styles the input's own box, not those native sub-parts.
const inputStyle: React.CSSProperties = {
  colorScheme: "dark",
  width: "100%",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  fontFamily: fontBody,
  fontSize: 13,
  color: C.text,
  outline: "none",
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          color: C.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 11, color: C.error, marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

interface LegCardProps {
  leg: EventLegFormInput;
  index: number;
  isTour: boolean;
  canRemove: boolean;
  isLocked: boolean;
  errors: Record<string, string>;
  venues: Venue[];
  onChange: (patch: Partial<EventLegFormInput>) => void;
  onRemove: () => void;
  onAddTier: () => void;
  onUpdateTier: (
    tierIndex: number,
    patch: Partial<TicketTierFormInput>,
  ) => void;
  onRemoveTier: (tierIndex: number) => void;
}

function LegCard({
  leg,
  index,
  isTour,
  canRemove,
  isLocked,
  venues,
  onChange,
  onRemove,
  onAddTier,
  onUpdateTier,
  onRemoveTier,
}: LegCardProps) {
  const legSoldCount = leg.tiers.reduce(
    (sum, t) => sum + (t.sold_count ?? 0),
    0,
  );

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {isTour && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>
            Leg {index + 1}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {leg.id && (
              <a
                href={route("admin.event-legs.seats.edit", leg.id)}
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  textDecoration: "underline",
                }}
              >
                Manage seats
              </a>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                style={{
                  background: "none",
                  border: "none",
                  color: C.textFaint,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {isLocked && (
        <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 8 }}>
          {legSoldCount} ticket(s) sold across this leg's tiers — the venue,
          date, capacity, and leg itself are locked and can't be changed or
          removed.
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <select
          value={leg.venue_id ?? ""}
          disabled={isLocked}
          onChange={(e) => {
            if (isLocked) return;
            const venueId = Number(e.target.value);
            const venue = venues.find((v) => v.id === venueId);
            if (!venue) {
              onChange({
                venue_id: undefined,
                venue_name: "",
                address: "",
                city: "",
                latitude: undefined,
                longitude: undefined,
                capacity: 0,
              });

              return;
            }

            onChange({
              venue_id: venue.id,

              venue_name: venue.name,

              address: venue.address ?? "",

              city: venue.city ?? "",

              latitude: venue.latitude ? parseFloat(venue.latitude) : undefined,

              longitude: venue.longitude
                ? parseFloat(venue.longitude)
                : undefined,

              capacity: venue.capacity ?? 0,
            });
          }}
          style={inputStyle}
        >
          <option value="">Select venue</option>

          {venues
            .filter((venue) => venue.is_active)
            .map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
                {venue.city ? ` — ${venue.city}` : ""}
              </option>
            ))}
        </select>

      <input
  type="date"
  value={leg.event_date}
  disabled={isLocked}
  onChange={(e) => {
    if (isLocked) return;
    onChange({ event_date: e.target.value });
  }}
  style={{
    ...inputStyle,
    opacity: isLocked ? 0.6 : 1,
    cursor: isLocked ? "not-allowed" : "text",
  }}
/>

        <input
          type="number"
          value={leg.capacity || ""}
          readOnly={leg.seating_type === "reserved" || isLocked}
          onChange={(e) => {
            if (leg.seating_type === "reserved" || isLocked) return;
            onChange({
              capacity: parseInt(e.target.value, 10) || 0,
            });
          }}
          placeholder="Capacity"
          title={
            isLocked
              ? "This leg has sold tickets and its capacity is locked."
              : leg.seating_type === "reserved"
                ? 'Managed by the seat map — edit seats in "Manage seats" instead.'
                : undefined
          }
          style={{
            ...inputStyle,
            opacity: leg.seating_type === "reserved" || isLocked ? 0.6 : 1,
            cursor:
              leg.seating_type === "reserved" || isLocked
                ? "not-allowed"
                : "text",
          }}
        />
      </div>
      {(() => {
        const total = tierQuantityTotal(leg);
        const overCapacity = leg.capacity > 0 && total > leg.capacity;
        return overCapacity ? (
          <p style={{ fontSize: 12, color: C.error, marginBottom: 12 }}>
            Ticket quantities total {total}, which exceeds this leg's capacity
            of {leg.capacity}.
          </p>
        ) : null;
      })()}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: C.textMuted }}>Ticket tiers</span>
        <button
          type="button"
          onClick={onAddTier}
          style={{
            fontSize: 11,
            padding: "5px 10px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            color: C.textMuted,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          + Add tier
        </button>
      </div>

      {leg.tiers.map((tier, tierIndex) => {
        const isLocked = (tier.sold_count ?? 0) > 0;

        return (
          <div
            key={tierIndex}
            style={{
              borderTop: `1px dashed ${C.borderDashed}`,
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            {isLocked && (
              <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 6 }}>
                {tier.sold_count} ticket(s) sold — this tier is locked and can't
                be edited or removed.
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 0.9fr 0.7fr auto",
                gap: 8,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={tier.name}
                readOnly={isLocked}
                onChange={(e) =>
                  !isLocked && onUpdateTier(tierIndex, { name: e.target.value })
                }
                placeholder="Tier name"
                style={{ ...inputStyle, opacity: isLocked ? 0.6 : 1 }}
              />
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.textMuted,
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={tier.price || ""}
                  readOnly={isLocked}
                  onChange={(e) =>
                    !isLocked &&
                    onUpdateTier(tierIndex, {
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Price"
                  style={{
                    ...inputStyle,
                    paddingLeft: 26,
                    opacity: isLocked ? 0.6 : 1,
                  }}
                />
              </div>
              <input
                type="number"
                min={0}
                max={leg.capacity || undefined}
                value={tier.quantity || ""}
                readOnly={isLocked}
                onChange={(e) => {
                  if (isLocked) return;
                  const raw = parseInt(e.target.value, 10) || 0;
                  const otherTiersTotal =
                    tierQuantityTotal(leg) - (tier.quantity || 0);
                  const clamped = leg.capacity
                    ? Math.min(raw, Math.max(leg.capacity - otherTiersTotal, 0))
                    : raw;
                  onUpdateTier(tierIndex, { quantity: clamped });
                }}
                placeholder="Qty"
                style={{ ...inputStyle, opacity: isLocked ? 0.6 : 1 }}
              />
              {leg.tiers.length > 1 && !isLocked && (
                <button
                  type="button"
                  onClick={() => onRemoveTier(tierIndex)}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.textFaint,
                    fontSize: 13,
                    padding: "0 4px",
                    cursor: "pointer",
                  }}
                  aria-label="Remove tier"
                >
                  ×
                </button>
              )}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <input
                type="datetime-local"
                value={tier.starts_at}
                readOnly={isLocked}
                onChange={(e) =>
                  !isLocked &&
                  onUpdateTier(tierIndex, { starts_at: e.target.value })
                }
                style={{ ...inputStyle, opacity: isLocked ? 0.6 : 1 }}
              />
              <input
                type="datetime-local"
                value={tier.ends_at}
                readOnly={isLocked}
                onChange={(e) =>
                  !isLocked &&
                  onUpdateTier(tierIndex, { ends_at: e.target.value })
                }
                style={{ ...inputStyle, opacity: isLocked ? 0.6 : 1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
