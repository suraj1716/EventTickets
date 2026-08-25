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
import { formatDatetimeLocal, formatDateInput } from '@/utils/dateFormat';

interface Props {
  event?: Event;
  categories: Category[];
  venues: Venue[];
}

function emptyTier(): TicketTierFormInput {
  return { name: "", price: 0, quantity: 0, starts_at: "", ends_at: "" };
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
    tiers: [emptyTier()],
  };
}

function legsFromEvent(event?: Event): EventLegFormInput[] {
  if (!event?.legs?.length) {
    return [emptyLeg()];
  }

  return event.legs.map((leg) => ({
    id: leg.id,
    venue_id: leg.venue_id,
    venue_name: leg.venue_name,
    address: leg.address ?? '',
    city: leg.city ?? '',
    latitude: leg.latitude ? parseFloat(leg.latitude) : undefined,
    longitude: leg.longitude ? parseFloat(leg.longitude) : undefined,
    event_date: formatDateInput(leg.event_date),   // <-- fixed
    capacity: leg.capacity,
    tiers: (leg.ticket_tiers ?? [emptyTier() as any]).map((t) => ({
      id: t.id,
      name: t.name,
      price: parseFloat(t.price),
      quantity: t.quantity,
      starts_at: formatDatetimeLocal(t.starts_at),
      ends_at: formatDatetimeLocal(t.ends_at),
    })),
  }));
}

export default function EventForm({ event, categories, venues }: Props) {
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
    legs: legsFromEvent(event),
    media: [],
    remove_media_ids: [],
  });



    // ---------- Media ----------

function handleMediaChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const files = Array.from(e.target.files ?? []);

  if (files.length === 0) {
    return;
  }

  const existingMedia = event?.media ?? [];
  const removedIds = data.remove_media_ids ?? [];

  // Existing media that will actually remain
  const remainingExistingCount = existingMedia.filter(
    (media) => !removedIds.includes(media.id)
  ).length;

  const currentNewFiles = data.media?.length ?? 0;

  const totalAfterUpload =
    remainingExistingCount +
    currentNewFiles +
    files.length;

  if (totalAfterUpload > 2) {
    alert("An event can have a maximum of 2 media files.");
    e.target.value = "";
    return;
  }

  setData("media", [
    ...(data.media ?? []),
    ...files,
  ]);

  e.target.value = "";
}

function removeNewMedia(index: number) {
  setData(
    "media",
    (data.media ?? []).filter((_, i) => i !== index)
  );
}

function removeExistingMedia(id: number) {
  setData(
    "remove_media_ids",
    Array.from(
      new Set([
        ...(data.remove_media_ids ?? []),
        id,
      ])
    )
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

  function removeLeg(index: number) {
    if (data.legs.length <= 1) return;
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

  console.log("SUBMIT DATA:", data);

  if (isEditing) {
    transform((data) => ({
      ...data,
      _method: "PUT",
    }));

    post(route("admin.events.update", event!.id), {
      forceFormData: true,
      onSuccess: () => {
        router.post(route("admin.vendor.events.publish", event!.id));
      },
    });
  } else {
    post(route("admin.events.store"), {
      forceFormData: true,
    });
  }
};
function handlePublish() {
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
      router.post(route("admin.vendor.events.publish", event!.id));
    },
  });
}

  return (
    <AdminLayout>
      <Head title={isEditing ? `Edit ${event!.name}` : "Create event"} />

      <form onSubmit={submit} className="max-w-2xl">
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          {isEditing ? "Edit event" : "New event"}
        </p>
        <h1 className="text-2xl font-semibold text-white mb-6">
          {isEditing ? event!.name : "Create event"}
        </h1>


    <Field label="Part of a tour?">
  <select
    value={data.type}
    onChange={(e) => handleTypeChange(e.target.value as 'standalone' | 'tour')}
    className={inputClass}
  >
    <option value="standalone">Standalone event, one location</option>
    <option value="tour">Multi-leg tour, several locations</option>
  </select>
</Field>

<Field label="Visibility">
  <select
    value={data.status}
    onChange={(e) => setData('status', e.target.value as 'draft' | 'proposed')}
    className={inputClass}
    disabled={event?.status === 'published'}
  >
    <option value="draft">Draft — hidden, only visible to you</option>
    <option value="proposed">Proposed — visible via link, waitlist signups open</option>
    {event?.status === 'published' && (
      <option value="published">Published — live and on sale</option>
    )}
  </select>
  <p className="text-xs text-neutral-600 mt-1.5">
    {event?.status === 'published'
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
            className={inputClass}
          />
        </Field>

        <Field label="Description" error={errors.description}>
          <textarea
            value={data.description}
            onChange={(e) => setData("description", e.target.value)}
            rows={3}
            className={inputClass}
          />
        </Field>
<Field label="Event media" error={errors.media}>
  <div className="space-y-3">

    {/* Existing media */}
    {event?.media
      ?.filter(
        (media) =>
          !(data.remove_media_ids ?? []).includes(media.id)
      )
      .map((media) => (
        <div
          key={media.id}
          className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
        >
          {media.type === "video" ? (
            <video
              src={media.url}
              controls
              className="w-full max-h-64 object-contain bg-black"
            />
          ) : (
            <img
              src={media.url}
              alt=""
              className="w-full max-h-64 object-contain bg-black"
            />
          )}

          <button
            type="button"
            onClick={() => removeExistingMedia(media.id)}
            className="absolute top-2 right-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white hover:bg-red-600 transition-colors"
          >
            Remove
          </button>
        </div>
      ))}

    {/* New uploads */}
    {(data.media ?? []).map((file, index) => (
      <div
        key={`${file.name}-${index}`}
        className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
      >
        {file.type.startsWith("video/") ? (
          <video
            src={URL.createObjectURL(file)}
            controls
            className="w-full max-h-64 object-contain bg-black"
          />
        ) : (
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-full max-h-64 object-contain bg-black"
          />
        )}

        <button
          type="button"
          onClick={() => removeNewMedia(index)}
          className="absolute top-2 right-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white hover:bg-red-600 transition-colors"
        >
          Remove
        </button>

        <div className="px-3 py-2 text-xs text-neutral-500">
          {file.name}
        </div>
      </div>
    ))}

    {/* Upload button */}
    {(
      (event?.media ?? []).filter(
        (media) =>
          !(data.remove_media_ids ?? []).includes(media.id)
      ).length +
      (data.media?.length ?? 0)
    ) < 2 && (
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 px-6 py-8 text-center hover:border-neutral-500 transition-colors">
        <span className="text-sm text-neutral-300">
          + Add media
        </span>

        <span className="mt-1 text-xs text-neutral-600">
          Images or videos · maximum 2 files
        </span>

        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleMediaChange}
        />
      </label>
    )}

    <p className="text-xs text-neutral-600">
      {(
        (event?.media ?? []).filter(
          (media) =>
            !(data.remove_media_ids ?? []).includes(media.id)
        ).length +
        (data.media?.length ?? 0)
      )}{" "}
      / 2 media files
    </p>
  </div>
</Field>
        <Field label="Artists">
          <div className="flex flex-wrap gap-2 mb-2">
            {(data.artists ?? []).map((name) => (
              <span
                key={name}
                className="bg-neutral-800 text-neutral-200 text-sm px-3 py-1 rounded-full inline-flex items-center gap-2"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeArtist(name)}
                  className="text-neutral-500 hover:text-white"
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
            className={inputClass}
          />
        </Field>

        <Field label="Genres">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = (data.category_ids ?? []).includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "bg-white text-black border-white"
                      : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="flex items-center justify-between mt-8 mb-3">
          <label className="text-sm text-neutral-400">
            {data.type === "tour" ? "Tour legs" : "Location"}
          </label>
        </div>

        {data.legs.map((leg, legIndex) => (
          <LegCard
            key={leg.id ?? `new-${legIndex}`}
            leg={leg}
            index={legIndex}
            isTour={data.type === "tour"}
            canRemove={data.legs.length > 1}
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
            className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-700 rounded-xl py-3 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors mb-6"
          >
            + Add location
          </button>
        )}

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-neutral-800">
         <button
  type="submit"
  disabled={processing}
  className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
>
  Save
</button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={processing}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            Publish event
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

// ---------- Small building blocks ----------

// color-scheme: dark tells the browser to render native controls
// (select dropdowns, date/datetime-local pickers, their popup
// calendars, spinner arrows, etc.) using light text on a dark
// background instead of defaulting to the OS light theme, which is
// what was making these inputs unreadable — the Tailwind classes
// below only style the input's own box, not those native sub-parts.
const inputClass =
  "[color-scheme:dark] w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600";

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
    <div className="mb-5">
      <label className="block text-sm text-neutral-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface LegCardProps {
  leg: EventLegFormInput;
  index: number;
  isTour: boolean;
  canRemove: boolean;
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
  venues,
  onChange,
  onRemove,
  onAddTier,
  onUpdateTier,
  onRemoveTier,
}: LegCardProps) {
  console.log("LegCard", index, leg.id, leg); // TEMP — remove after checking

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-3">
      {isTour && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-400">
            Leg {index + 1}
          </span>
          <div className="flex items-center gap-3">
            {leg.id && (
              <a
                href={route("admin.event-legs.seats.edit", leg.id)}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                Manage seats
              </a>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-neutral-500 hover:text-red-400 text-xs"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <select
          value={leg.venue_id ?? ""}
          onChange={(e) => {
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
          className={inputClass}
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
          onChange={(e) => onChange({ event_date: e.target.value })}
          className={inputClass}
        />

        <input
          type="number"
          value={leg.capacity || ""}
          onChange={(e) =>
            onChange({
              capacity: parseInt(e.target.value, 10) || 0,
            })
          }
          placeholder="Capacity"
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-neutral-400">Ticket tiers</span>
        <button
          type="button"
          onClick={onAddTier}
          className="text-xs px-2.5 py-1 rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          + Add tier
        </button>
      </div>

      {leg.tiers.map((tier, tierIndex) => (
        <div key={tierIndex} className="border-t border-neutral-800 pt-3 mt-3">
          <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_auto] gap-2 mb-2 items-center">
            <input
              type="text"
              value={tier.name}
              onChange={(e) =>
                onUpdateTier(tierIndex, { name: e.target.value })
              }
              placeholder="Tier name"
              className={inputClass}
            />
            <input
              type="number"
              step="0.01"
              value={tier.price || ""}
              onChange={(e) =>
                onUpdateTier(tierIndex, {
                  price: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Price"
              className={inputClass}
            />
            <input
              type="number"
              value={tier.quantity || ""}
              onChange={(e) =>
                onUpdateTier(tierIndex, {
                  quantity: parseInt(e.target.value, 10) || 0,
                })
              }
              placeholder="Qty"
              className={inputClass}
            />
            {leg.tiers.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveTier(tierIndex)}
                className="text-neutral-500 hover:text-red-400 text-sm px-1"
                aria-label="Remove tier"
              >
                ×
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={tier.starts_at}
              onChange={(e) =>
                onUpdateTier(tierIndex, { starts_at: e.target.value })
              }
              className={inputClass}
            />
            <input
              type="datetime-local"
              value={tier.ends_at}
              onChange={(e) =>
                onUpdateTier(tierIndex, { ends_at: e.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
