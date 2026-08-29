import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../AdminLayout';
import { fontBody } from '@/Components/Admin/AdminComponents';

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
| Design tokens — "drafting table" palette
| Kept deliberately small: one ink, one warm accent (amber, for the
| primary/most important seats and actions), one cool accent (teal, for
| accessible seating only), one functional danger red for delete.
|--------------------------------------------------------------------------
*/

const C = {
    void: '#0A1929',
    panel: '#0E2038',
    panelSoft: '#0C1B30',
    line: '#1C3552',
    lineFaint: 'rgba(146, 180, 208, 0.09)',
    ink: '#DCE7F0',
    inkMuted: '#7E96AC',
    amber: '#E7A94C',
    amberSoft: 'rgba(231, 169, 76, 0.12)',
    teal: '#4FB6A6',
    tealSoft: 'rgba(79, 182, 166, 0.12)',
    danger: '#E2665B',
    dangerSoft: 'rgba(226, 102, 91, 0.1)',
};

const gridBackground: React.CSSProperties = {
    backgroundColor: C.void,
    backgroundImage: `
        linear-gradient(${C.lineFaint} 1px, transparent 1px),
        linear-gradient(90deg, ${C.lineFaint} 1px, transparent 1px)
    `,
    backgroundSize: '28px 28px',
};

function getSeatStyle(seatType: string | null) {
    switch (seatType) {
        case 'vip':
            return {
                className: 'text-white',
                style: {
                    backgroundColor: C.amber,
                    borderColor: '#F2C480',
                    boxShadow: `0 4px 14px ${C.amberSoft}`,
                },
            };
        case 'accessible':
            return {
                className: 'text-white',
                style: {
                    backgroundColor: C.teal,
                    borderColor: '#84D3C6',
                    boxShadow: `0 4px 14px ${C.tealSoft}`,
                },
            };
        default:
            return {
                className: '',
                style: {
                    backgroundColor: 'transparent',
                    borderColor: C.line,
                    color: C.ink,
                },
            };
    }
}

const inputClass = `
    w-full
    bg-[#0A1929]
    border rounded-lg
    px-4 py-3
    text-sm
    placeholder:text-[#5A7188]
    focus:outline-none
    focus:ring-2
    transition-colors
`;

const inputStyle: React.CSSProperties = {
    borderColor: C.line,
    color: C.ink,
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
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

type ViewMode = 'section' | 'hall';

export default function Seats({ venue }: Props) {
    const [activeSection, setActiveSection] = useState<number | null>(
        venue.sections[0]?.id ?? null
    );

    const [viewMode, setViewMode] = useState<ViewMode>('section');
    const [showSectionForm, setShowSectionForm] = useState(false);
    const [showRowForm, setShowRowForm] = useState(false);

    const sectionForm = useForm({
        name: '',
        code: '',
        sort_order: venue.sections.length,
    });

    const rowForm = useForm({
        row_label: '',
        seats: 20,
        seat_type: 'standard',
    });

    function submitSection(e: React.FormEvent) {
        e.preventDefault();

        sectionForm.post(route('admin.venues.sections.store', venue.id), {
            preserveScroll: true,
            onSuccess: () => {
                sectionForm.reset();
                setShowSectionForm(false);
            },
        });
    }

    function submitRow(e: React.FormEvent) {
        e.preventDefault();

        if (!activeSection) {
            alert('Please select a section first.');
            return;
        }

        rowForm.post(route('admin.venues.sections.generate-row', activeSection), {
            preserveScroll: true,
            onSuccess: () => {
                rowForm.reset();
                setShowRowForm(false);
            },
        });
    }

    function deleteSection(section: VenueSection) {
        if (!confirm(`Delete "${section.name}" and all of its seats?`)) return;

        router.delete(route('admin.venues.sections.destroy', section.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (activeSection === section.id) {
                    const next = venue.sections.find((s) => s.id !== section.id);
                    setActiveSection(next?.id ?? null);
                }
            },
        });
    }

    function deleteSeat(seat: VenueSeat) {
        if (!confirm(`Remove seat ${seat.label}?`)) return;

        router.delete(route('admin.venues.seats.destroy', seat.id), {
            preserveScroll: true,
        });
    }

    function groupRows(seats: VenueSeat[]) {
        const grouped: Record<string, VenueSeat[]> = {};

        seats.forEach((seat) => {
            if (!grouped[seat.row_label]) grouped[seat.row_label] = [];
            grouped[seat.row_label].push(seat);
        });

        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
            .map(([label, rowSeats]) => ({
                label,
                seats: rowSeats.sort((a, b) => a.seat_number - b.seat_number),
            }));
    }

    const orderedSections = useMemo(
        () => [...venue.sections].sort((a, b) => a.sort_order - b.sort_order),
        [venue.sections]
    );

    const section = venue.sections.find((item) => item.id === activeSection);

    const rows = useMemo(() => (section ? groupRows(section.seats) : []), [section]);

    const totalSeats = venue.sections.reduce((total, s) => total + s.seats.length, 0);

    const totalRows = venue.sections.reduce((total, s) => {
        const uniqueRows = new Set(s.seats.map((seat) => seat.row_label));
        return total + uniqueRows.size;
    }, 0);

    function goToSection(id: number) {
        setActiveSection(id);
        setViewMode('section');
    }

    return (
        <AdminLayout>
            <Head title={`Seating — ${venue.name}`} />

            {/*
              This editor keeps its own "drafting table" palette (see the
              design-token comment above) rather than the Box Office admin
              theme — that's deliberate, not an oversight. It does now pull
              its base typeface from the shared AdminComponents tokens, so
              a site-wide font change (like the reskin patch) still reaches
              it even though the color system stays independent.
            */}
            <div style={{ ...gridBackground, fontFamily: fontBody }} className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-8">

                    {/* =================================================
                        TITLE BLOCK
                    ================================================= */}

                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8 pb-6"
                        style={{ borderBottom: `1px solid ${C.line}` }}
                    >
                        <div>
                            <Link
                                href={route('admin.venues.index')}
                                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors hover:opacity-80"
                                style={{ color: C.inkMuted }}
                            >
                                ← Back to venues
                            </Link>

                            <div className="flex items-baseline gap-3 mt-3">
                                <span
                                    className="text-[10px] font-mono uppercase tracking-[0.3em]"
                                    style={{ color: C.amber }}
                                >
                                    Seating layout
                                </span>
                            </div>

                            <h1
                                className="text-3xl font-semibold tracking-tight mt-1"
                                style={{ color: C.ink }}
                            >
                                {venue.name}
                            </h1>

                            <p className="text-sm mt-2" style={{ color: C.inkMuted }}>
                                Build the physical seating layout of your venue.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => setShowSectionForm(!showSectionForm)}
                                className="px-5 py-3 rounded-lg text-sm font-medium border transition-colors"
                                style={{
                                    borderColor: C.line,
                                    color: C.ink,
                                    backgroundColor: C.panel,
                                }}
                            >
                                + Add section
                            </motion.button>

                            <motion.button
                                whileHover={activeSection && viewMode === 'section' ? { y: -1 } : {}}
                                whileTap={activeSection && viewMode === 'section' ? { scale: 0.97 } : {}}
                                type="button"
                                disabled={!activeSection || viewMode !== 'section'}
                                onClick={() => setShowRowForm(true)}
                                title={viewMode === 'hall' ? 'Switch to a single section to add a row' : undefined}
                                className="px-5 py-3 rounded-lg text-sm font-semibold text-[#0A1929] disabled:opacity-30 transition-opacity"
                                style={{ backgroundColor: C.amber }}
                            >
                                + Add row
                            </motion.button>
                        </div>
                    </motion.div>

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
                        <Stat label="Capacity" value={venue.capacity ?? '—'} />
                    </motion.div>

                    {/* =================================================
                        CREATE SECTION
                    ================================================= */}

                    <AnimatePresence>
                        {showSectionForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                onSubmit={submitSection}
                                className="mb-8 rounded-xl border p-6 overflow-hidden"
                                style={{ borderColor: C.line, backgroundColor: C.panel }}
                            >
                                <div className="flex justify-between mb-5">
                                    <div>
                                        <h2
                                            className="text-sm font-mono uppercase tracking-widest"
                                            style={{ color: C.amber }}
                                        >
                                            New section
                                        </h2>
                                        <p className="text-sm mt-1" style={{ color: C.inkMuted }}>
                                            Examples: Main Floor, Balcony, VIP, Grandstand.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowSectionForm(false)}
                                        className="w-8 h-8 rounded-lg text-sm transition-colors"
                                        style={{ color: C.inkMuted, backgroundColor: C.panelSoft }}
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className="block text-xs font-mono uppercase tracking-wider mb-2"
                                            style={{ color: C.inkMuted }}
                                        >
                                            Section name
                                        </label>
                                        <input
                                            className={inputClass}
                                            style={inputStyle}
                                            placeholder="Main Floor"
                                            value={sectionForm.data.name}
                                            onChange={(e) => sectionForm.setData('name', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs font-mono uppercase tracking-wider mb-2"
                                            style={{ color: C.inkMuted }}
                                        >
                                            Short code
                                        </label>
                                        <input
                                            className={inputClass}
                                            style={inputStyle}
                                            placeholder="MF"
                                            value={sectionForm.data.code}
                                            onChange={(e) =>
                                                sectionForm.setData('code', e.target.value.toUpperCase())
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-5">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        type="submit"
                                        disabled={sectionForm.processing}
                                        className="px-5 py-2.5 rounded-lg font-semibold text-sm text-[#0A1929]"
                                        style={{ backgroundColor: C.amber }}
                                    >
                                        {sectionForm.processing ? 'Creating…' : 'Create section'}
                                    </motion.button>
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
                                style={{ borderColor: C.line, backgroundColor: C.panel }}
                            >
                                {(['section', 'hall'] as ViewMode[]).map((mode) => {
                                    const active = viewMode === mode;

                                    return (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setViewMode(mode)}
                                            className="relative px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors"
                                            style={{ color: active ? '#0A1929' : C.inkMuted }}
                                        >
                                            {active && (
                                                <motion.div
                                                    layoutId="viewModePill"
                                                    className="absolute inset-0 rounded-md"
                                                    style={{ backgroundColor: C.amber }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                                />
                                            )}
                                            <span className="relative z-10">
                                                {mode === 'section' ? 'By section' : 'Whole hall'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Section chips — only in section mode */}
                            {viewMode === 'section' && (
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
                                                    borderColor: active ? C.amber : C.line,
                                                    backgroundColor: active ? C.amberSoft : C.panel,
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        className="font-semibold text-sm truncate"
                                                        style={{ color: active ? C.amber : C.ink }}
                                                    >
                                                        {item.name}
                                                    </span>

                                                    {item.code && (
                                                        <span
                                                            className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0"
                                                            style={{
                                                                color: C.inkMuted,
                                                                backgroundColor: C.panelSoft,
                                                            }}
                                                        >
                                                            {item.code}
                                                        </span>
                                                    )}
                                                </div>

                                                <div
                                                    className="mt-1 text-xs font-mono"
                                                    style={{ color: C.inkMuted }}
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
                            style={{ borderColor: C.line, backgroundColor: C.panel }}
                        >
                            <div
                                className="text-xs font-mono uppercase tracking-[0.3em] mb-3"
                                style={{ color: C.amber }}
                            >
                                Empty sheet
                            </div>

                            <h2 className="text-2xl font-semibold" style={{ color: C.ink }}>
                                Let's build your venue
                            </h2>

                            <p
                                className="text-sm max-w-lg mx-auto mt-3"
                                style={{ color: C.inkMuted }}
                            >
                                Think about the actual physical hall. Create areas such as
                                Main Floor, Balcony, VIP or Grandstand.
                            </p>

                            <motion.button
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => setShowSectionForm(true)}
                                className="mt-6 px-6 py-3 rounded-lg font-semibold text-[#0A1929]"
                                style={{ backgroundColor: C.amber }}
                            >
                                + Create first section
                            </motion.button>
                        </motion.div>
                    )}

                    {/* =================================================
                        SHARED STAGE (whole-hall view keeps just one)
                    ================================================= */}

                    {venue.sections.length > 0 && viewMode === 'hall' && (
                        <StageStrip />
                    )}

                    {/* =================================================
                        BY SECTION VIEW
                    ================================================= */}

                    <AnimatePresence mode="wait">
                        {viewMode === 'section' && section && (
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
                                                style={{ color: C.ink }}
                                            >
                                                {section.name}
                                            </h2>

                                            <p
                                                className="text-sm font-mono mt-1"
                                                style={{ color: C.inkMuted }}
                                            >
                                                {rows.length} rows · {section.seats.length} seats
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => deleteSection(section)}
                                        className="px-3 py-2 rounded-lg text-xs border transition-colors self-start md:self-auto"
                                        style={{
                                            color: C.danger,
                                            borderColor: C.dangerSoft,
                                            backgroundColor: C.dangerSoft,
                                        }}
                                    >
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
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                            onSubmit={submitRow}
                                            className="mb-8 rounded-xl border p-6 overflow-hidden"
                                            style={{ borderColor: C.line, backgroundColor: C.panel }}
                                        >
                                            <div className="flex justify-between mb-5">
                                                <div>
                                                    <h3
                                                        className="text-sm font-mono uppercase tracking-widest"
                                                        style={{ color: C.teal }}
                                                    >
                                                        New row
                                                    </h3>
                                                    <p
                                                        className="text-sm mt-1"
                                                        style={{ color: C.inkMuted }}
                                                    >
                                                        Create the actual seats in this row.
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowRowForm(false)}
                                                    className="w-8 h-8 rounded-lg text-sm"
                                                    style={{
                                                        color: C.inkMuted,
                                                        backgroundColor: C.panelSoft,
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <label
                                                        className="block text-xs font-mono uppercase tracking-wider mb-2"
                                                        style={{ color: C.inkMuted }}
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
                                                                'row_label',
                                                                e.target.value.toUpperCase()
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        className="block text-xs font-mono uppercase tracking-wider mb-2"
                                                        style={{ color: C.inkMuted }}
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
                                                            rowForm.setData('seats', Number(e.target.value))
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        className="block text-xs font-mono uppercase tracking-wider mb-2"
                                                        style={{ color: C.inkMuted }}
                                                    >
                                                        Seat type
                                                    </label>
                                                    <select
                                                        className={inputClass}
                                                        style={inputStyle}
                                                        value={rowForm.data.seat_type}
                                                        onChange={(e) =>
                                                            rowForm.setData('seat_type', e.target.value)
                                                        }
                                                    >
                                                        <option value="standard">Standard</option>
                                                        <option value="vip">VIP</option>
                                                        <option value="accessible">Accessible</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex justify-end mt-5">
                                                <motion.button
                                                    whileTap={{ scale: 0.97 }}
                                                    type="submit"
                                                    disabled={rowForm.processing}
                                                    className="px-6 py-3 rounded-lg font-semibold text-sm text-[#0A1929]"
                                                    style={{ backgroundColor: C.teal }}
                                                >
                                                    {rowForm.processing
                                                        ? 'Creating seats…'
                                                        : `Create ${rowForm.data.seats || 0} seats`}
                                                </motion.button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

                                {/* Seat map */}
                                {rows.length === 0 ? (
                                    <div
                                        className="rounded-xl border border-dashed p-14 text-center"
                                        style={{ borderColor: C.line, backgroundColor: C.panelSoft }}
                                    >
                                        <div
                                            className="text-xs font-mono uppercase tracking-[0.3em] mb-3"
                                            style={{ color: C.teal }}
                                        >
                                            No rows yet
                                        </div>

                                        <h3 className="text-lg font-semibold" style={{ color: C.ink }}>
                                            This section has no rows
                                        </h3>

                                        <p className="text-sm mt-2" style={{ color: C.inkMuted }}>
                                            Start with the first physical row closest to the stage.
                                        </p>

                                        <motion.button
                                            whileHover={{ y: -1 }}
                                            whileTap={{ scale: 0.97 }}
                                            type="button"
                                            onClick={() => setShowRowForm(true)}
                                            className="mt-5 px-5 py-2.5 rounded-lg font-semibold text-[#0A1929]"
                                            style={{ backgroundColor: C.teal }}
                                        >
                                            + Add first row
                                        </motion.button>
                                    </div>
                                ) : (
                                    <SeatMapCard
                                        rows={rows}
                                        onDeleteSeat={deleteSeat}
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

                    {viewMode === 'hall' && venue.sections.length > 0 && (
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
                                        style={{ borderColor: C.line, backgroundColor: C.panel }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => goToSection(item.id)}
                                            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:brightness-110"
                                            style={{ borderBottom: `1px solid ${C.line}` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-1 h-8 rounded-full"
                                                    style={{ backgroundColor: C.amber }}
                                                />
                                                <div>
                                                    <div
                                                        className="font-semibold text-sm"
                                                        style={{ color: C.ink }}
                                                    >
                                                        {item.name}
                                                        {item.code && (
                                                            <span
                                                                className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded"
                                                                style={{
                                                                    color: C.inkMuted,
                                                                    backgroundColor: C.panelSoft,
                                                                }}
                                                            >
                                                                {item.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div
                                                        className="text-xs font-mono mt-0.5"
                                                        style={{ color: C.inkMuted }}
                                                    >
                                                        {itemRows.length} rows · {item.seats.length} seats
                                                    </div>
                                                </div>
                                            </div>

                                            <span
                                                className="text-[10px] font-mono uppercase tracking-widest shrink-0"
                                                style={{ color: C.amber }}
                                            >
                                                Edit section →
                                            </span>
                                        </button>

                                        <div className="p-5">
                                            {itemRows.length === 0 ? (
                                                <div
                                                    className="text-center text-xs font-mono py-6"
                                                    style={{ color: C.inkMuted }}
                                                >
                                                    No rows in this section yet
                                                </div>
                                            ) : (
                                                <SeatMapCard
                                                    rows={itemRows}
                                                    onDeleteSeat={deleteSeat}
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
                    background: `linear-gradient(to bottom, ${C.panel}, ${C.void})`,
                    border: `1px solid ${C.line}`,
                }}
            >
                <div className="text-center">
                    <div
                        className="text-[10px] font-mono uppercase tracking-[0.5em]"
                        style={{ color: C.amber }}
                    >
                        Stage
                    </div>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: C.inkMuted }}>
                        Front of venue
                    </div>
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Seat map card — reused for both single-section and whole-hall views
|--------------------------------------------------------------------------
*/

function SeatMapCard({
    rows,
    onDeleteSeat,
    size = 'lg',
    bare = false,
}: {
    rows: { label: string; seats: VenueSeat[] }[];
    onDeleteSeat: (seat: VenueSeat) => void;
    size?: 'lg' | 'sm';
    bare?: boolean;
}) {
    const seatSize = size === 'lg' ? 'w-8 h-8 text-[9px]' : 'w-5 h-5 text-[7px]';
    const rowLabelSize = size === 'lg' ? 'w-9 h-9 text-xs' : 'w-6 h-6 text-[10px]';

    const content = (
        <div className="min-w-[650px]">
            {!bare && (
                <div className="flex justify-center mb-8">
                    <div
                        className="px-5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest"
                        style={{ color: C.inkMuted, border: `1px solid ${C.line}` }}
                    >
                        Seating map
                    </div>
                </div>
            )}

            <div>
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center gap-3 mb-2.5">
                        <div
                            className={`${rowLabelSize} shrink-0 rounded-md flex items-center justify-center font-mono font-bold`}
                            style={{ border: `1px solid ${C.line}`, color: C.amber }}
                        >
                            {row.label}
                        </div>

                        <div className="w-3 h-px shrink-0" style={{ backgroundColor: C.line }} />

                        <div className="flex-1 flex flex-wrap justify-center gap-1.5">
                            <AnimatePresence>
                                {row.seats.map((seat) => {
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
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            type="button"
                                            title={`${seat.label} · ${seat.seat_type ?? 'standard'}`}
                                            onClick={() => onDeleteSeat(seat)}
                                            className={`relative ${seatSize} rounded-t-md rounded-b-sm border font-mono font-bold ${seatStyle.className}`}
                                            style={seatStyle.style}
                                        >
                                            {seat.seat_number}
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        <div
                            className="w-12 text-right text-xs font-mono shrink-0"
                            style={{ color: C.inkMuted }}
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
            style={{ borderColor: C.line, backgroundColor: C.panel }}
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
            style={{ borderColor: C.line, backgroundColor: C.panelSoft }}
        >
            <Legend color={C.ink} outline label="Standard" />
            <Legend color={C.amber} label="VIP" />
            <Legend color={C.teal} label="Accessible" />
            <span className="text-xs font-mono" style={{ color: C.inkMuted }}>
                Click a seat to remove it
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
            style={{ borderColor: C.line, backgroundColor: C.panel }}
        >
            <div
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: C.inkMuted }}
            >
                {label}
            </div>

            <div
                className="text-2xl font-semibold mt-1"
                style={{ color: accent ? C.amber : C.ink }}
            >
                {typeof value === 'number' ? value.toLocaleString() : value}
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
                style={outline ? { border: `1.5px solid ${color}` } : { backgroundColor: color }}
            />
            <span className="text-xs" style={{ color: C.inkMuted }}>
                {label}
            </span>
        </div>
    );
}
