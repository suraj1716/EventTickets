import React, { useMemo, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../AdminLayout";
import {
  C,
  fontBody,
  fontDisplay,
  fontMono,
  Icons,
  AdminBtn,
  AdminPageHeader,
  ConfirmModal,
} from "@/Components/Admin/AdminComponents";

interface VenueSeat {
  id: number;
  venue_id: number;
  venue_section_id: number;
  row_label: string;
  seat_number: number;
  label: string;
  seat_type: string | null;
  is_active: boolean;
}

interface VenueSection {
  id: number;
  venue_id: number;
  name: string;
  code: string | null;
  sort_order: number;
  seats: VenueSeat[];
}

interface Venue {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  capacity: number | null;
  seating_type: string;
  sections: VenueSection[];
}

interface Props {
  venue: Venue;
}

/*
|--------------------------------------------------------------------------
| Palette — now pulled from the shared Box Office admin tokens
| (AdminComponents.tsx) instead of a standalone theme, so the seat editor
| matches every other admin screen. Two soft tints (amber for VIP/primary,
| info-blue for accessible seating) are derived here since the shared
| palette only exports the solid hues.
|--------------------------------------------------------------------------
*/

const amberSoft = "rgba(255, 182, 39, 0.12)";
const infoSoft = "rgba(124, 168, 224, 0.12)";
const errorSoft = "rgba(224, 133, 133, 0.10)";

const gridBackground: React.CSSProperties = {
  backgroundColor: C.bg,
  backgroundImage: `
        linear-gradient(rgba(247, 245, 242, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(247, 245, 242, 0.035) 1px, transparent 1px)
    `,
  backgroundSize: "28px 28px",
};

function getSeatStyle(seatType: string | null) {
  switch (seatType) {
    case "vip":
      return {
        className: "text-[#0B0B10]",
        style: {
          backgroundColor: C.amber,
          borderColor: C.amberHover,
          boxShadow: `0 4px 14px ${amberSoft}`,
        },
      };
    case "accessible":
      return {
        className: "text-[#0B0B10]",
        style: {
          backgroundColor: C.info,
          borderColor: C.info,
          boxShadow: `0 4px 14px ${infoSoft}`,
        },
      };
    default:
      return {
        className: "",
        style: {
          backgroundColor: "transparent",
          borderColor: C.border,
          color: C.text,
        },
      };
  }
}

const inputClass = `
    w-full
    border rounded-lg
    px-4 py-3
    text-sm
    seatEditorInput
    focus:outline-none
    focus:ring-2
    transition-colors
`;

const inputStyle: React.CSSProperties = {
  backgroundColor: C.bgAlt,
  borderColor: C.border,
  color: C.text,
};

/*
|--------------------------------------------------------------------------
| Motion presets
|--------------------------------------------------------------------------
*/

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

type ViewMode = "section" | "hall";

export default function Seats({ venue }: Props) {
  const [activeSection, setActiveSection] = useState<number | null>(
    venue.sections[0]?.id ?? null,
  );

  const [viewMode, setViewMode] = useState<ViewMode>("section");
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showRowForm, setShowRowForm] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<VenueSection | null>(
    null,
  );
  const [seatToDelete, setSeatToDelete] = useState<VenueSeat | null>(null);

  // Walkway/aisle markers the admin places by hand, based on what the
  // real venue actually looks like — never auto-computed. Keyed by
  // `${sectionId}::${rowLabel}::${seatId}`, meaning "there's a walkway
  // right after this seat". Lives in component state only for now —
  // it isn't sent to the backend, so it resets on reload. Persisting
  // it would need a place to store it per row (e.g. a JSON column on
  // venue_sections or venue_seats).
  const [aisles, setAisles] = useState<Set<string>>(new Set());

  function toggleAisle(seat: VenueSeat) {
    router.patch(
      route("admin.venue-seats.toggle-aisle", seat.id),
      {},
      { preserveScroll: true, preserveState: true },
    );
  }

  const sectionForm = useForm({
    name: "",
    code: "",
    sort_order: venue.sections.length,
  });

  const rowForm = useForm({
    row_label: "",
    seats: 20,
    seat_type: "standard",
  });

  function submitSection(e: React.FormEvent) {
    e.preventDefault();

    sectionForm.post(route("admin.venues.sections.store", venue.id), {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        sectionForm.reset();
        setShowSectionForm(false);
      },
    });
  }

  function submitRow(e: React.FormEvent) {
    e.preventDefault();

    if (!activeSection) {
      alert("Please select a section first.");
      return;
    }

    rowForm.post(route("admin.venues.sections.generate-row", activeSection), {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        rowForm.reset();
        setShowRowForm(false);
      },
    });
  }

  function confirmDeleteSection() {
    if (!sectionToDelete) return;
    const section = sectionToDelete;

    router.delete(route("admin.venues.sections.destroy", section.id), {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        if (activeSection === section.id) {
          const next = venue.sections.find((s) => s.id !== section.id);
          setActiveSection(next?.id ?? null);
        }
      },
      onFinish: () => setSectionToDelete(null),
    });
  }

function moveRow(sectionId: number, currentRows: { label: string }[], rowLabel: string, direction: "up" | "down") {
    const currentIndex = currentRows.findIndex((r) => r.label === rowLabel);
    if (currentIndex === -1) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= currentRows.length) return;

    const reordered = [...currentRows];
    [reordered[currentIndex], reordered[swapIndex]] = [reordered[swapIndex], reordered[currentIndex]];

    const rowLabels = reordered.map((r) => r.label);

    router.post(
        route("admin.venues.sections.rows.reorder", sectionId),
        { row_labels: rowLabels },
        { preserveScroll: true, preserveState: true },
    );
}


  function confirmDeleteSeat() {
    if (!seatToDelete) return;

    router.delete(route("admin.venues.seats.destroy", seatToDelete.id), {
      preserveScroll: true,
      preserveState: true,
      onFinish: () => setSeatToDelete(null),
    });
  }

  function deleteRow(sectionId: number, rowLabel: string) {
    router.delete(route("admin.venues.sections.rows.destroy", sectionId), {
      data: { row_label: rowLabel },
      preserveScroll: true,
      preserveState: true,
    });
  }


function deleteRowInSection(sectionId: number, rowLabel: string) {
    router.delete(route("admin.venues.sections.rows.destroy", sectionId), {
        data: { row_label: rowLabel },
        preserveScroll: true,
        preserveState: true,
    });
}

  function groupRows(seats: VenueSeat[]) {
    const grouped: Record<string, VenueSeat[]> = {};

    seats.forEach((seat) => {
      if (!grouped[seat.row_label]) grouped[seat.row_label] = [];
      grouped[seat.row_label].push(seat);
    });

    return Object.entries(grouped)
      .sort(([, seatsA], [, seatsB]) => {
        const orderA = Math.min(...seatsA.map((s) => s.sort_order));
        const orderB = Math.min(...seatsB.map((s) => s.sort_order));
        return orderA - orderB;
      })
      .map(([label, rowSeats]) => ({
        label,
        seats: rowSeats.sort((a, b) => a.seat_number - b.seat_number),
      }));
  }

  const orderedSections = useMemo(
    () => [...venue.sections].sort((a, b) => a.sort_order - b.sort_order),
    [venue.sections],
  );

  const section = venue.sections.find((item) => item.id === activeSection);

  const rows = useMemo(
    () => (section ? groupRows(section.seats) : []),
    [section],
  );

  const totalSeats = venue.sections.reduce(
    (total, s) => total + s.seats.length,
    0,
  );

  const totalRows = venue.sections.reduce((total, s) => {
    const uniqueRows = new Set(s.seats.map((seat) => seat.row_label));
    return total + uniqueRows.size;
  }, 0);

  function goToSection(id: number) {
    setActiveSection(id);
    setViewMode("section");
  }

  return (
    <AdminLayout>
      <Head title={`Seating — ${venue.name}`} />

      {/*
              This editor now shares the Box Office admin palette and
              components (C / fontMono / fontDisplay / Icons / AdminBtn /
              ConfirmModal from AdminComponents.tsx) so it matches every
              other admin screen. The paper-grid backdrop and the two
              per-seat accent hues (amber for VIP, info-blue for
              accessible) are the only things that stay specific to this
              editor — everything else is shared tokens.
            */}
      <style>{`
                .seatEditorInput::placeholder { color: ${C.textFaint}; }
                .seatEditorInput:focus { border-color: ${C.amber}; box-shadow: 0 0 0 2px ${amberSoft}; }
            `}</style>

      <AdminPageHeader
        eyebrow="Catalogue"
        title={<em style={{ fontStyle: "italic" }}>{venue.name}</em>}
        meta="Build the physical seating layout of your venue."
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <AdminBtn as="a" href={route("admin.venues.index")} variant="ghost">
              <Icons.Back /> Back
            </AdminBtn>
            <AdminBtn
              variant="ghost"
              onClick={() => setShowSectionForm(!showSectionForm)}
            >
              <Icons.Plus /> Add Section
            </AdminBtn>
            <AdminBtn
              variant="primary"
              disabled={!activeSection || viewMode !== "section"}
              onClick={() => setShowRowForm(true)}
            >
              <Icons.Plus /> Add Row
            </AdminBtn>
          </div>
        }
      />

      <div
        style={{ ...gridBackground, fontFamily: fontBody }}
        className="min-h-screen"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* =================================================
                        STAT CELLS (title-block data row)
                    ================================================= */}

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10"
          >
            <Stat label="Sections" value={venue.sections.length} />
            <Stat label="Rows" value={totalRows} />
            <Stat label="Seats" value={totalSeats} accent />
            <Stat label="Capacity" value={venue.capacity ?? "—"} />
          </motion.div>

          {/* =================================================
                        CREATE SECTION
                    ================================================= */}

          <AnimatePresence>
            {showSectionForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={submitSection}
                className="mb-8 rounded-xl border p-6 overflow-hidden"
                style={{ borderColor: C.border, backgroundColor: C.surface }}
              >
                <div className="flex justify-between mb-5">
                  <div>
                    <h2
                      className="text-sm uppercase tracking-widest"
                      style={{ color: C.amber, fontFamily: fontMono }}
                    >
                      New section
                    </h2>
                    <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                      Examples: Main Floor, Balcony, VIP, Grandstand.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSectionForm(false)}
                    className="w-8 h-8 rounded-lg text-sm transition-colors"
                    style={{ color: C.textMuted, backgroundColor: C.bgAlt }}
                  >
                    ×
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs uppercase tracking-wider mb-2"
                      style={{ color: C.textMuted, fontFamily: fontMono }}
                    >
                      Section name
                    </label>
                    <input
                      className={inputClass}
                      style={inputStyle}
                      placeholder="Main Floor"
                      value={sectionForm.data.name}
                      onChange={(e) =>
                        sectionForm.setData("name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs uppercase tracking-wider mb-2"
                      style={{ color: C.textMuted, fontFamily: fontMono }}
                    >
                      Short code
                    </label>
                    <input
                      className={inputClass}
                      style={inputStyle}
                      placeholder="MF"
                      value={sectionForm.data.code}
                      onChange={(e) =>
                        sectionForm.setData(
                          "code",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-5">
                  <AdminBtn
                    type="submit"
                    variant="primary"
                    disabled={sectionForm.processing}
                  >
                    {sectionForm.processing ? "Creating…" : "Create section"}
                  </AdminBtn>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* =================================================
                        VIEW SWITCH + SECTION LAYERS
                    ================================================= */}

          {venue.sections.length > 0 && (
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
              {/* Segmented view toggle */}
              <div
                className="inline-flex rounded-lg border p-1 shrink-0"
                style={{ borderColor: C.border, backgroundColor: C.surface }}
              >
                {(["section", "hall"] as ViewMode[]).map((mode) => {
                  const active = viewMode === mode;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className="relative px-4 py-2 rounded-md text-xs uppercase tracking-wider transition-colors"
                      style={{
                        color: active ? C.textInverse : C.textMuted,
                        fontFamily: fontMono,
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="viewModePill"
                          className="absolute inset-0 rounded-md"
                          style={{ backgroundColor: C.amber }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                      <span className="relative z-10">
                        {mode === "section" ? "By section" : "Whole hall"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Section chips — only in section mode */}
              {viewMode === "section" && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex gap-3 overflow-x-auto pb-1 flex-1"
                >
                  {orderedSections.map((item) => {
                    const active = activeSection === item.id;

                    return (
                      <motion.button
                        key={item.id}
                        variants={fadeUp}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        className="min-w-[160px] rounded-lg border px-4 py-3 text-left transition-colors shrink-0"
                        style={{
                          borderColor: active ? C.amber : C.border,
                          backgroundColor: active ? amberSoft : C.surface,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="font-semibold text-sm truncate"
                            style={{ color: active ? C.amber : C.text }}
                          >
                            {item.name}
                          </span>

                          {item.code && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded shrink-0"
                              style={{
                                color: C.textMuted,
                                backgroundColor: C.bgAlt,
                                fontFamily: fontMono,
                              }}
                            >
                              {item.code}
                            </span>
                          )}
                        </div>

                        <div
                          className="mt-1 text-xs"
                          style={{ color: C.textMuted, fontFamily: fontMono }}
                        >
                          {item.seats.length} seats
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* =================================================
                        NO SECTIONS
                    ================================================= */}

          {venue.sections.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-dashed p-16 text-center"
              style={{
                borderColor: C.borderDashed,
                backgroundColor: C.surface,
              }}
            >
              <div
                className="text-xs uppercase tracking-[0.3em] mb-3"
                style={{ color: C.amber, fontFamily: fontMono }}
              >
                Empty sheet
              </div>

              <h2
                className="text-2xl uppercase"
                style={{
                  color: C.text,
                  fontFamily: fontDisplay,
                  fontWeight: 400,
                }}
              >
                Let's build your venue
              </h2>

              <p
                className="text-sm max-w-lg mx-auto mt-3"
                style={{ color: C.textMuted }}
              >
                Think about the actual physical hall. Create areas such as Main
                Floor, Balcony, VIP or Grandstand.
              </p>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowSectionForm(true)}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg font-semibold"
                style={{ backgroundColor: C.amber, color: C.textInverse }}
              >
                <Icons.Plus />
                Create first section
              </motion.button>
            </motion.div>
          )}

          {/* =================================================
                        SHARED STAGE (whole-hall view keeps just one)
                    ================================================= */}

          {venue.sections.length > 0 && viewMode === "hall" && <StageStrip />}

          {/* =================================================
                        BY SECTION VIEW
                    ================================================= */}

          <AnimatePresence mode="wait">
            {viewMode === "section" && section && (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Section title */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-10 rounded-full"
                      style={{ backgroundColor: C.amber }}
                    />

                    <div>
                      <h2
                        className="text-xl font-semibold"
                        style={{ color: C.text }}
                      >
                        {section.name}
                      </h2>

                      <p
                        className="text-sm mt-1"
                        style={{ color: C.textMuted, fontFamily: fontMono }}
                      >
                        {rows.length} rows · {section.seats.length} seats
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSectionToDelete(section)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors self-start md:self-auto"
                    style={{
                      color: C.error,
                      borderColor: errorSoft,
                      backgroundColor: errorSoft,
                    }}
                  >
                    <Icons.Delete />
                    Delete section
                  </button>
                </div>

                {/* Stage — front elevation */}
                <StageStrip />

                {/* Row form */}
                <AnimatePresence>
                  {showRowForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      onSubmit={submitRow}
                      className="mb-8 rounded-xl border p-6 overflow-hidden"
                      style={{
                        borderColor: C.border,
                        backgroundColor: C.surface,
                      }}
                    >
                      <div className="flex justify-between mb-5">
                        <div>
                          <h3
                            className="text-sm uppercase tracking-widest"
                            style={{ color: C.info, fontFamily: fontMono }}
                          >
                            New row
                          </h3>
                          <p
                            className="text-sm mt-1"
                            style={{ color: C.textMuted }}
                          >
                            Create the actual seats in this row.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowRowForm(false)}
                          className="w-8 h-8 rounded-lg text-sm"
                          style={{
                            color: C.textMuted,
                            backgroundColor: C.bgAlt,
                          }}
                        >
                          ×
                        </button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label
                            className="block text-xs uppercase tracking-wider mb-2"
                            style={{ color: C.textMuted, fontFamily: fontMono }}
                          >
                            Row label
                          </label>
                          <input
                            className={inputClass}
                            style={inputStyle}
                            placeholder="A"
                            value={rowForm.data.row_label}
                            onChange={(e) =>
                              rowForm.setData(
                                "row_label",
                                e.target.value.toUpperCase(),
                              )
                            }
                          />
                        </div>

                        <div>
                          <label
                            className="block text-xs uppercase tracking-wider mb-2"
                            style={{ color: C.textMuted, fontFamily: fontMono }}
                          >
                            Seats
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            className={inputClass}
                            style={inputStyle}
                            value={rowForm.data.seats}
                            onChange={(e) =>
                              rowForm.setData("seats", Number(e.target.value))
                            }
                          />
                        </div>

                        <div>
                          <label
                            className="block text-xs uppercase tracking-wider mb-2"
                            style={{ color: C.textMuted, fontFamily: fontMono }}
                          >
                            Seat type
                          </label>
                          <select
                            className={inputClass}
                            style={inputStyle}
                            value={rowForm.data.seat_type}
                            onChange={(e) =>
                              rowForm.setData("seat_type", e.target.value)
                            }
                          >
                            <option value="standard">Standard</option>
                            <option value="vip">VIP</option>
                            <option value="accessible">Accessible</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end mt-5">
                        <AdminBtn type="submit" disabled={rowForm.processing}>
                          {rowForm.processing
                            ? "Creating seats…"
                            : `Create ${rowForm.data.seats || 0} seats`}
                        </AdminBtn>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Seat map */}
                {rows.length === 0 ? (
                  <div
                    className="rounded-xl border border-dashed p-14 text-center"
                    style={{
                      borderColor: C.borderDashed,
                      backgroundColor: C.bgAlt,
                    }}
                  >
                    <div
                      className="text-xs uppercase tracking-[0.3em] mb-3"
                      style={{ color: C.info, fontFamily: fontMono }}
                    >
                      No rows yet
                    </div>

                    <h3
                      className="text-lg font-semibold"
                      style={{ color: C.text }}
                    >
                      This section has no rows
                    </h3>

                    <p className="text-sm mt-2" style={{ color: C.textMuted }}>
                      Start with the first physical row closest to the stage.
                    </p>

                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setShowRowForm(true)}
                      className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg font-semibold"
                      style={{ backgroundColor: C.info, color: C.textInverse }}
                    >
                      <Icons.Plus />
                      Add first row
                    </motion.button>
                  </div>
                ) : (
      <SeatMapCard
    sectionId={section.id}
    rows={rows}
    onDeleteSeat={(seat) => setSeatToDelete(seat)}
    onDeleteRow={(rowLabel) => deleteRowInSection(section.id, rowLabel)}
    onMoveRow={(rowLabel, direction) => moveRow(section.id, rows, rowLabel, direction)}
    onToggleAisle={toggleAisle}
    size="lg"
/>
                )}

                {/* Legend */}
                {rows.length > 0 && <SeatLegend />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* =================================================
                        WHOLE HALL VIEW — every section stacked together
                    ================================================= */}

          {viewMode === "hall" && venue.sections.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {orderedSections.map((item) => {
                const itemRows = groupRows(item.seats);

                return (
                  <motion.div
                    key={item.id}
                    variants={fadeUp}
                    className="rounded-xl border overflow-hidden"
                    style={{
                      borderColor: C.border,
                      backgroundColor: C.surface,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => goToSection(item.id)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:brightness-110"
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ backgroundColor: C.amber }}
                        />
                        <div>
                          <div
                            className="font-semibold text-sm"
                            style={{ color: C.text }}
                          >
                            {item.name}
                            {item.code && (
                              <span
                                className="ml-2 text-[10px] px-2 py-0.5 rounded"
                                style={{
                                  color: C.textMuted,
                                  backgroundColor: C.bgAlt,
                                  fontFamily: fontMono,
                                }}
                              >
                                {item.code}
                              </span>
                            )}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: C.textMuted, fontFamily: fontMono }}
                          >
                            {itemRows.length} rows · {item.seats.length} seats
                          </div>
                        </div>
                      </div>

                      <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest shrink-0"
                        style={{ color: C.amber, fontFamily: fontMono }}
                      >
                        Edit section
                        <Icons.ArrowRight />
                      </span>
                    </button>

                    <div className="p-5">
                      {itemRows.length === 0 ? (
                        <div
                          className="text-center text-xs py-6"
                          style={{ color: C.textMuted, fontFamily: fontMono }}
                        >
                          No rows in this section yet
                        </div>
                      ) : (
                     <SeatMapCard
    sectionId={item.id}
    rows={itemRows}
    onDeleteSeat={(seat) => setSeatToDelete(seat)}
    onDeleteRow={(rowLabel) => deleteRowInSection(item.id, rowLabel)}
    onMoveRow={(rowLabel, direction) => moveRow(item.id, itemRows, rowLabel, direction)}
    onToggleAisle={toggleAisle}
    size="sm"
    bare
/>

                      )}
                    </div>
                  </motion.div>
                );
              })}

              <SeatLegend />
            </motion.div>
          )}
        </div>
      </div>

      {sectionToDelete && (
        <ConfirmModal
          title={`Delete "${sectionToDelete.name}"?`}
          description={`This removes the section and all ${sectionToDelete.seats.length} of its seats. This action cannot be undone.`}
          confirmLabel="Delete Section"
          onConfirm={confirmDeleteSection}
          onCancel={() => setSectionToDelete(null)}
        />
      )}

      {seatToDelete && (
        <ConfirmModal
          title={`Remove seat ${seatToDelete.label}?`}
          description="This seat will be removed from the layout. This action cannot be undone."
          confirmLabel="Remove Seat"
          onConfirm={confirmDeleteSeat}
          onCancel={() => setSeatToDelete(null)}
        />
      )}
    </AdminLayout>
  );
}

/*
|--------------------------------------------------------------------------
| Stage strip — shared "front elevation" element
|--------------------------------------------------------------------------
*/

function StageStrip() {
  return (
    <div className="mb-10 max-w-3xl mx-auto">
      <div
        className="h-14 rounded-b-[40%] flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom, ${C.surface}, ${C.bg})`,
          border: `1px solid ${C.border}`,
        }}
      >
        <div className="text-center">
          <div
            className="text-[10px] uppercase tracking-[0.5em]"
            style={{ color: C.amber, fontFamily: fontMono }}
          >
            Stage
          </div>
          <div
            className="text-[9px] mt-0.5"
            style={{ color: C.textMuted, fontFamily: fontMono }}
          >
            Front of venue
          </div>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Seat map card — reused for both single-section and whole-hall views.
| Each row is split into two halves with a center-aisle gap between them,
| mirroring how a real hall is laid out (a walkway down the middle rather
| than one unbroken line of seats). Rows too short to have a real aisle
| (fewer than 4 seats — e.g. a small box) render as one unbroken block.
|--------------------------------------------------------------------------
*/

function SeatMapCard({
  sectionId,
  rows,
  onDeleteSeat,
  onDeleteRow,
  onMoveRow,
  onToggleAisle,
  size = "lg",
  bare = false,
}: {
  sectionId: number;
  rows: { label: string; seats: VenueSeat[] }[];
  onDeleteSeat: (seat: VenueSeat) => void;
  onDeleteRow: (rowLabel: string) => void;
  onMoveRow: (rowLabel: string, direction: "up" | "down") => void;
  size?: "lg" | "sm";
  onToggleAisle: (seat: VenueSeat) => void;
  bare?: boolean;
}) {
  const seatSize = size === "lg" ? "w-8 h-8 text-[9px]" : "w-5 h-5 text-[7px]";
  const rowLabelSize =
    size === "lg" ? "w-9 h-9 text-xs" : "w-6 h-6 text-[10px]";
  const aisleWidth = size === "lg" ? 46 : 24;
  const gapWidth = size === "lg" ? 10 : 6;

  function renderSeat(seat: VenueSeat) {
    const seatStyle = getSeatStyle(seat.seat_type);

    return (
      <motion.button
        key={seat.id}
        layout
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        whileHover={{ y: -2, scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        type="button"
        title={`${seat.label} · ${seat.seat_type ?? "standard"}`}
        onClick={() => onDeleteSeat(seat)}
        className={`relative ${seatSize} rounded-t-md rounded-b-sm border font-mono font-bold ${seatStyle.className}`}
        style={seatStyle.style}
      >
        {seat.seat_number}
      </motion.button>
    );
  }

  // The gap after each seat is clickable — the admin marks a walkway
  // wherever the real venue actually has one, seat by seat. Nothing is
  // assumed or auto-split.
  function renderGap(row: { label: string }, afterSeat: VenueSeat) {
    const active = afterSeat.aisle_after;

    return (
      <button
        key={`gap-${afterSeat.id}`}
        type="button"
        title={active ? "Remove walkway here" : "Mark a walkway here"}
        onClick={() => onToggleAisle(afterSeat)}
        style={{
          position: "relative",
          width: active ? aisleWidth : gapWidth,
          height: size === "lg" ? 32 : 20,
          flexShrink: 0,
          overflow: "visible",
          border: "none",
          borderRadius: 4,
          background: "transparent",
          borderLeft: active ? `1px dashed ${C.borderDashed}` : "none",
          borderRight: active ? `1px dashed ${C.borderDashed}` : "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 9,
            lineHeight: 1,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            fontFamily: fontMono,
            fontWeight: 700,
            color: active ? C.amber : C.textFaint,
          }}
        >
          ↔
        </span>
      </button>
    );
  }

  const content = (
    <div className="min-w-[650px]">
      {!bare && (
        <div className="flex justify-center mb-8">
          <div
            className="px-5 py-1.5 rounded-full text-[10px] uppercase tracking-widest"
            style={{
              color: C.textMuted,
              border: `1px solid ${C.border}`,
              fontFamily: fontMono,
            }}
          >
            Seating map
          </div>
        </div>
      )}

      <div>
        {rows.map((row, rowIndex) => (
  <div key={row.label} className="flex items-center gap-3 mb-2.5">
    <div
      className={`${rowLabelSize} shrink-0 rounded-md flex items-center justify-center font-mono font-bold`}
      style={{ border: `1px solid ${C.border}`, color: C.amber }}
    >
      {row.label}
    </div>

    <div className="flex flex-col shrink-0">
      <button
        type="button"
        title="Move row up"
        disabled={rowIndex === 0}
        onClick={() => onMoveRow(row.label, "up")}
        className="w-5 h-4 flex items-center justify-center text-[10px] disabled:opacity-20"
        style={{ color: C.textMuted }}
      >
        ▲
      </button>
      <button
        type="button"
        title="Move row down"
        disabled={rowIndex === rows.length - 1}
        onClick={() => onMoveRow(row.label, "down")}
        className="w-5 h-4 flex items-center justify-center text-[10px] disabled:opacity-20"
        style={{ color: C.textMuted }}
      >
        ▼
      </button>
    </div>

    <button
      type="button"
      title={`Delete row ${row.label}`}
      onClick={() => {
        if (
          confirm(
            `Delete row ${row.label}? This removes all ${row.seats.length} seats in this row.`,
          )
        ) {
          onDeleteRow(row.label);
        }
      }}
      className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs"
      style={{ color: C.error, backgroundColor: errorSoft }}
    >
      ×
    </button>

    <div
      className="w-3 h-px shrink-0"
      style={{ backgroundColor: C.border }}
    />

            <div className="flex-1 flex flex-wrap items-center justify-center gap-0">
              <AnimatePresence>
                {row.seats.map((seat, i) => (
                  <React.Fragment key={seat.id}>
                    {renderSeat(seat)}
                    {i < row.seats.length - 1 && renderGap(row, seat)}
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </div>

            <div
              className="w-12 text-right text-xs shrink-0"
              style={{ color: C.textMuted, fontFamily: fontMono }}
            >
              {row.seats.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (bare) {
    return <div className="overflow-x-auto">{content}</div>;
  }

  return (
    <div
      className="rounded-xl border p-5 md:p-8 overflow-x-auto"
      style={{ borderColor: C.border, backgroundColor: C.surface }}
    >
      {content}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Legend
|--------------------------------------------------------------------------
*/

function SeatLegend() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-6 mt-6 p-4 rounded-xl border"
      style={{ borderColor: C.border, backgroundColor: C.bgAlt }}
    >
      <Legend color={C.text} outline label="Standard" />
      <Legend color={C.amber} label="VIP" />
      <Legend color={C.info} label="Accessible" />
      <span
        className="text-xs"
        style={{ color: C.textMuted, fontFamily: fontMono }}
      >
        Click a seat to remove it · click the gap between seats to mark a
        walkway
      </span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Stat cell — styled like a title-block data field
|--------------------------------------------------------------------------
*/

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-lg border px-5 py-4"
      style={{ borderColor: C.border, backgroundColor: C.surface }}
    >
      <div
        className="text-[10px] uppercase tracking-widest"
        style={{ color: C.textMuted, fontFamily: fontMono }}
      >
        {label}
      </div>

      <div
        className="text-2xl font-semibold mt-1"
        style={{ color: accent ? C.amber : C.text }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </motion.div>
  );
}

/*
|--------------------------------------------------------------------------
| Legend swatch
|--------------------------------------------------------------------------
*/

function Legend({
  color,
  label,
  outline = false,
}: {
  color: string;
  label: string;
  outline?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3.5 h-3.5 rounded-t-sm rounded-b-[2px]"
        style={
          outline
            ? { border: `1.5px solid ${color}` }
            : { backgroundColor: color }
        }
      />
      <span className="text-xs" style={{ color: C.textMuted }}>
        {label}
      </span>
    </div>
  );
}
