
import React, { useState, useRef } from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
    AdminPageHeader,
    AdminBtn,
    FlashMessage,
    Icons,
} from "../../../Components/Admin/AdminComponents";
import {
    useAdminForm,
    inputClass,
} from "../../../Components/Admin/useAdminForm";

interface Venue {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    capacity: number | null;
    seating_type: "general" | "reserved";
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    notes: string | null;
    image_url: string | null;
    is_active: boolean | number;
}

interface Props {
    venue?: Venue;
    flash: {
        success?: string;
        error?: string;
    };
}

const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    marginBottom: 6,
};

const fieldWrap: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
};

const hintStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    color: "var(--color-text-muted)",
    marginTop: 4,
    lineHeight: 1.5,
};

const errorStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    color: "#c0392b",
    marginTop: 4,
};

function Card({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--color-border)",
                    background: "var(--color-bg-alt)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        width: 3,
                        height: 16,
                        background: "var(--color-accent)",
                        borderRadius: 2,
                    }}
                />

                <span
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                        fontWeight: 500,
                    }}
                >
                    {title}
                </span>
            </div>

            <div style={{ padding: "20px" }}>{children}</div>
        </div>
    );
}

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            style={{
                width: 44,
                height: 24,
                borderRadius: "var(--radius-full)",
                background: checked
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 200ms ease",
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    position: "absolute",
                    top: 3,
                    left: checked ? 23 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 200ms ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
            />
        </button>
    );
}

function SaveBar({
    isEdit,
    venueName,
    processing,
    onSubmit,
    cancelHref,
}: {
    isEdit: boolean;
    venueName?: string;
    processing: boolean;
    onSubmit: () => void;
    cancelHref: string;
}) {
    return (
        <div
            style={{
                position: "sticky",
                bottom: 0,
                zIndex: 40,
                background: "var(--color-surface)",
                borderTop: "1px solid var(--color-border)",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                margin: "24px -28px -32px",
            }}
        >
            <span
                style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.04em",
                }}
            >
                {isEdit
                    ? `Editing: ${venueName}`
                    : "New venue — unsaved"}
            </span>

            <div style={{ display: "flex", gap: 8 }}>
                <AdminBtn
                    as="a"
                    href={cancelHref}
                    variant="ghost"
                    size="sm"
                >
                    Cancel
                </AdminBtn>

                <AdminBtn
                    onClick={onSubmit}
                    disabled={processing}
                    variant="accent"
                >
                    <Icons.Check />

                    {processing
                        ? "Saving…"
                        : isEdit
                          ? "Update Venue"
                          : "Create Venue"}
                </AdminBtn>
            </div>
        </div>
    );
}

export default function VenueForm({ venue, flash }: Props) {
    const isEdit = !!venue;

    const {
        data,
        set,
        errors,
        processing,
        post,
        put,
    } = useAdminForm({
        name: venue?.name ?? "",

        address: venue?.address ?? "",
        city: venue?.city ?? "",
        state: venue?.state ?? "",
        postcode: venue?.postcode ?? "",
        country: venue?.country ?? "",

        latitude: venue?.latitude?.toString() ?? "",
        longitude: venue?.longitude?.toString() ?? "",

        capacity: venue?.capacity?.toString() ?? "",
        seating_type: venue?.seating_type ?? "general",

        contact_name: venue?.contact_name ?? "",
        contact_email: venue?.contact_email ?? "",
        contact_phone: venue?.contact_phone ?? "",

        notes: venue?.notes ?? "",

        is_active: venue ? Boolean(venue.is_active) : true,

        image: null as File | null,
        _remove_image: false,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(
        venue?.image_url ?? null
    );

    const fileRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] ?? null;

        set("image", file);
        set("_remove_image", false);

        if (file) {
            const reader = new FileReader();

            reader.onload = (event) => {
                setImagePreview(
                    event.target?.result as string
                );
            };

            reader.readAsDataURL(file);
        } else {
            setImagePreview(venue?.image_url ?? null);
        }
    };

    const removeImage = () => {
        set("image", null);
        set("_remove_image", true);
        setImagePreview(null);

        if (fileRef.current) {
            fileRef.current.value = "";
        }
    };

    const buildFormData = () => {
        const fd = new FormData();

        fd.append("name", data.name ?? "");

        fd.append("address", data.address ?? "");
        fd.append("city", data.city ?? "");
        fd.append("state", data.state ?? "");
        fd.append("postcode", data.postcode ?? "");
        fd.append("country", data.country ?? "");

        fd.append("latitude", data.latitude ?? "");
        fd.append("longitude", data.longitude ?? "");

        fd.append("capacity", data.capacity ?? "");
        fd.append("seating_type", data.seating_type);

        fd.append(
            "contact_name",
            data.contact_name ?? ""
        );

        fd.append(
            "contact_email",
            data.contact_email ?? ""
        );

        fd.append(
            "contact_phone",
            data.contact_phone ?? ""
        );

        fd.append("notes", data.notes ?? "");

        fd.append(
            "is_active",
            data.is_active ? "1" : "0"
        );

        if (data.image) {
            fd.append("image", data.image);
        }

        if (data._remove_image) {
            fd.append("_remove_image", "1");
        }

        return fd;
    };

    const handleSubmit = () => {
        if (isEdit) {
            put(
                route(
                    "admin.venues.update",
                    venue!.id
                ),
                {
                    transform: buildFormData,
                }
            );
        } else {
            post(
                route("admin.venues.store"),
                {
                    transform: buildFormData,
                }
            );
        }
    };

    return (
        <>
            <Head
                title={
                    isEdit
                        ? `Edit — ${venue!.name}`
                        : "New Venue"
                }
            />

            <AdminLayout>
                <AdminPageHeader
                    eyebrow="Events"
                    title={
                        isEdit ? (
                            <>
                                <em
                                    style={{
                                        fontStyle: "italic",
                                    }}
                                >
                                    {venue!.name}
                                </em>
                            </>
                        ) : (
                            "New Venue"
                        )
                    }
                    action={
                        <AdminBtn
                            as="a"
                            href={route(
                                "admin.venues.index"
                            )}
                            variant="ghost"
                        >
                            <Icons.Back /> Back
                        </AdminBtn>
                    }
                />

                <FlashMessage flash={flash} />

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(0, 1fr) 300px",
                        gap: 20,
                        alignItems: "start",
                    }}
                >
                    {/* LEFT COLUMN */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                        }}
                    >
                        {/* BASIC DETAILS */}
                        <Card title="Venue Details">
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                <div style={fieldWrap}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color: errors.name
                                                ? "#c0392b"
                                                : "var(--color-text-muted)",
                                        }}
                                    >
                                        Venue Name *
                                    </label>

                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            set(
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Sydney Opera House"
                                        maxLength={255}
                                        style={inputClass(
                                            errors,
                                            "name"
                                        )}
                                    />

                                    {errors.name && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {errors.name}
                                        </span>
                                    )}
                                </div>

                                <div style={fieldWrap}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color: errors.address
                                                ? "#c0392b"
                                                : "var(--color-text-muted)",
                                        }}
                                    >
                                        Address
                                    </label>

                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={(e) =>
                                            set(
                                                "address",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Street address"
                                        maxLength={255}
                                        style={inputClass(
                                            errors,
                                            "address"
                                        )}
                                    />

                                    {errors.address && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {errors.address}
                                        </span>
                                    )}
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(3, minmax(0, 1fr))",
                                        gap: 16,
                                    }}
                                >
                                    <div style={fieldWrap}>
                                        <label
                                            style={{
                                                ...labelStyle,
                                                color: errors.city
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                            }}
                                        >
                                            City
                                        </label>

                                        <input
                                            type="text"
                                            value={data.city}
                                            onChange={(e) =>
                                                set(
                                                    "city",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Sydney"
                                            style={inputClass(
                                                errors,
                                                "city"
                                            )}
                                        />

                                        {errors.city && (
                                            <span
                                                style={errorStyle}
                                            >
                                                {errors.city}
                                            </span>
                                        )}
                                    </div>

                                    <div style={fieldWrap}>
                                        <label
                                            style={{
                                                ...labelStyle,
                                                color: errors.state
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                            }}
                                        >
                                            State
                                        </label>

                                        <input
                                            type="text"
                                            value={data.state}
                                            onChange={(e) =>
                                                set(
                                                    "state",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="NSW"
                                            style={inputClass(
                                                errors,
                                                "state"
                                            )}
                                        />

                                        {errors.state && (
                                            <span
                                                style={errorStyle}
                                            >
                                                {errors.state}
                                            </span>
                                        )}
                                    </div>

                                    <div style={fieldWrap}>
                                        <label
                                            style={{
                                                ...labelStyle,
                                                color: errors.postcode
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                            }}
                                        >
                                            Postcode
                                        </label>

                                        <input
                                            type="text"
                                            value={data.postcode}
                                            onChange={(e) =>
                                                set(
                                                    "postcode",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="2000"
                                            style={inputClass(
                                                errors,
                                                "postcode"
                                            )}
                                        />

                                        {errors.postcode && (
                                            <span
                                                style={errorStyle}
                                            >
                                                {errors.postcode}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={fieldWrap}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color: errors.country
                                                ? "#c0392b"
                                                : "var(--color-text-muted)",
                                        }}
                                    >
                                        Country
                                    </label>

                                    <input
                                        type="text"
                                        value={data.country}
                                        onChange={(e) =>
                                            set(
                                                "country",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Australia"
                                        style={inputClass(
                                            errors,
                                            "country"
                                        )}
                                    />

                                    {errors.country && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {errors.country}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* LOCATION */}
                        <Card title="Location">
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily:
                                            "var(--font-body)",
                                        fontSize: "11px",
                                        color: "var(--color-text-muted)",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Optional coordinates used
                                    for maps and location
                                    services.
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(2, minmax(0, 1fr))",
                                        gap: 16,
                                    }}
                                >
                                    <div style={fieldWrap}>
                                        <label
                                            style={{
                                                ...labelStyle,
                                                color:
                                                    errors.latitude
                                                        ? "#c0392b"
                                                        : "var(--color-text-muted)",
                                            }}
                                        >
                                            Latitude
                                        </label>

                                        <input
                                            type="number"
                                            step="any"
                                            value={data.latitude}
                                            onChange={(e) =>
                                                set(
                                                    "latitude",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="-33.8568"
                                            style={inputClass(
                                                errors,
                                                "latitude"
                                            )}
                                        />

                                        {errors.latitude && (
                                            <span
                                                style={errorStyle}
                                            >
                                                {errors.latitude}
                                            </span>
                                        )}
                                    </div>

                                    <div style={fieldWrap}>
                                        <label
                                            style={{
                                                ...labelStyle,
                                                color:
                                                    errors.longitude
                                                        ? "#c0392b"
                                                        : "var(--color-text-muted)",
                                            }}
                                        >
                                            Longitude
                                        </label>

                                        <input
                                            type="number"
                                            step="any"
                                            value={data.longitude}
                                            onChange={(e) =>
                                                set(
                                                    "longitude",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="151.2153"
                                            style={inputClass(
                                                errors,
                                                "longitude"
                                            )}
                                        />

                                        {errors.longitude && (
                                            <span
                                                style={errorStyle}
                                            >
                                                {errors.longitude}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* SEATING */}
                        <Card title="Seating">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
                                    gap: 16,
                                }}
                            >
                                <div style={fieldWrap}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color:
                                                errors.seating_type
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                        }}
                                    >
                                        Seating Type *
                                    </label>

                                    <select
                                        value={data.seating_type}
                                        onChange={(e) =>
                                            set(
                                                "seating_type",
                                                e.target
                                                    .value as
                                                    | "general"
                                                    | "reserved"
                                            )
                                        }
                                        style={inputClass(
                                            errors,
                                            "seating_type"
                                        )}
                                    >
                                        <option value="general">
                                            General Admission
                                        </option>

                                        <option value="reserved">
                                            Reserved Seating
                                        </option>
                                    </select>

                                    {errors.seating_type && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {
                                                errors.seating_type
                                            }
                                        </span>
                                    )}
                                </div>

                                <div style={fieldWrap}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color:
                                                errors.capacity
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                        }}
                                    >
                                        Capacity
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        value={data.capacity}
                                        onChange={(e) =>
                                            set(
                                                "capacity",
                                                e.target.value
                                            )
                                        }
                                        placeholder="500"
                                        style={inputClass(
                                            errors,
                                            "capacity"
                                        )}
                                    />

                                    {errors.capacity && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {errors.capacity}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* CONTACT */}
                        <Card title="Contact">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
                                    gap: 16,
                                }}
                            >
                                <div style={fieldWrap}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color:
                                                errors.contact_name
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                        }}
                                    >
                                        Contact Name
                                    </label>

                                    <input
                                        type="text"
                                        value={data.contact_name}
                                        onChange={(e) =>
                                            set(
                                                "contact_name",
                                                e.target.value
                                            )
                                        }
                                        style={inputClass(
                                            errors,
                                            "contact_name"
                                        )}
                                    />

                                    {errors.contact_name && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {
                                                errors.contact_name
                                            }
                                        </span>
                                    )}
                                </div>

                                <div style={fieldWrap}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color:
                                                errors.contact_phone
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                        }}
                                    >
                                        Contact Phone
                                    </label>

                                    <input
                                        type="text"
                                        value={data.contact_phone}
                                        onChange={(e) =>
                                            set(
                                                "contact_phone",
                                                e.target.value
                                            )
                                        }
                                        style={inputClass(
                                            errors,
                                            "contact_phone"
                                        )}
                                    />

                                    {errors.contact_phone && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {
                                                errors.contact_phone
                                            }
                                        </span>
                                    )}
                                </div>

                                <div
                                    style={{
                                        ...fieldWrap,
                                        gridColumn:
                                            "1 / -1",
                                    }}
                                >
                                    <label
                                        style={{
                                            ...labelStyle,
                                            color:
                                                errors.contact_email
                                                    ? "#c0392b"
                                                    : "var(--color-text-muted)",
                                        }}
                                    >
                                        Contact Email
                                    </label>

                                    <input
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(e) =>
                                            set(
                                                "contact_email",
                                                e.target.value
                                            )
                                        }
                                        style={inputClass(
                                            errors,
                                            "contact_email"
                                        )}
                                    />

                                    {errors.contact_email && (
                                        <span
                                            style={errorStyle}
                                        >
                                            {
                                                errors.contact_email
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* NOTES */}
                        <Card title="Additional Details">
                            <div style={fieldWrap}>
                                <label
                                    style={{
                                        ...labelStyle,
                                        color: errors.notes
                                            ? "#c0392b"
                                            : "var(--color-text-muted)",
                                    }}
                                >
                                    Notes
                                </label>

                                <textarea
                                    value={data.notes}
                                    onChange={(e) =>
                                        set(
                                            "notes",
                                            e.target.value
                                        )
                                    }
                                    rows={5}
                                    placeholder="Internal notes about this venue..."
                                    style={{
                                        ...inputClass(
                                            errors,
                                            "notes"
                                        ),
                                        resize: "vertical",
                                        lineHeight: 1.6,
                                    }}
                                />

                                {errors.notes && (
                                    <span
                                        style={errorStyle}
                                    >
                                        {errors.notes}
                                    </span>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                        }}
                    >
                        {/* STATUS */}
                        <Card title="Status">
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent:
                                            "space-between",
                                        gap: 12,
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontFamily:
                                                    "var(--font-body)",
                                                fontSize: "13px",
                                                color:
                                                    "var(--color-text)",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Active
                                        </div>

                                        <div
                                            style={{
                                                fontFamily:
                                                    "var(--font-body)",
                                                fontSize: "11px",
                                                color:
                                                    "var(--color-text-muted)",
                                                marginTop: 2,
                                            }}
                                        >
                                            Available for event
                                            bookings
                                        </div>
                                    </div>

                                    <Toggle
                                        checked={
                                            data.is_active
                                        }
                                        onChange={(v) =>
                                            set(
                                                "is_active",
                                                v
                                            )
                                        }
                                    />
                                </div>

                                <div
                                    style={{
                                        padding:
                                            "10px 14px",
                                        background:
                                            "var(--color-bg-alt)",
                                        borderRadius:
                                            "var(--radius-sm)",
                                        border: "1px solid var(--color-border)",
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "space-between",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily:
                                                "var(--font-body)",
                                            fontSize: "11px",
                                            color:
                                                "var(--color-text-muted)",
                                        }}
                                    >
                                        Status
                                    </span>

                                    <span
                                        style={{
                                            fontFamily:
                                                "var(--font-body)",
                                            fontSize: "10px",
                                            letterSpacing:
                                                "0.1em",
                                            textTransform:
                                                "uppercase",
                                            color:
                                                data.is_active
                                                    ? "var(--color-success)"
                                                    : "var(--color-text-muted)",
                                            background:
                                                data.is_active
                                                    ? "rgba(58,125,68,0.08)"
                                                    : "var(--color-bg)",
                                            padding:
                                                "3px 10px",
                                            borderRadius:
                                                "var(--radius-full)",
                                            border: `1px solid ${
                                                data.is_active
                                                    ? "rgba(58,125,68,0.25)"
                                                    : "var(--color-border)"
                                            }`,
                                        }}
                                    >
                                        {data.is_active
                                            ? "● Active"
                                            : "○ Inactive"}
                                    </span>
                                </div>

                                {errors.is_active && (
                                    <span
                                        style={errorStyle}
                                    >
                                        {errors.is_active}
                                    </span>
                                )}
                            </div>
                        </Card>

                        {/* IMAGE */}
                        <Card title="Venue Image">
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        aspectRatio:
                                            "16/9",
                                        background:
                                            "var(--color-bg-alt)",
                                        border:
                                            "1px solid var(--color-border)",
                                        borderRadius:
                                            "var(--radius-sm)",
                                        overflow:
                                            "hidden",
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        position:
                                            "relative",
                                    }}
                                >
                                    {imagePreview ? (
                                        <>
                                            <img
                                                src={
                                                    imagePreview
                                                }
                                                alt="Venue preview"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit:
                                                        "cover",
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    removeImage
                                                }
                                                style={{
                                                    position:
                                                        "absolute",
                                                    top: 8,
                                                    right: 8,
                                                    width: 28,
                                                    height: 28,
                                                    background:
                                                        "rgba(12,10,8,0.7)",
                                                    border:
                                                        "1px solid rgba(255,255,255,0.15)",
                                                    borderRadius:
                                                        "var(--radius-sm)",
                                                    color: "white",
                                                    cursor:
                                                        "pointer",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    fontSize: 14,
                                                }}
                                            >
                                                ×
                                            </button>
                                        </>
                                    ) : (
                                        <div
                                            style={{
                                                textAlign:
                                                    "center",
                                                color:
                                                    "var(--color-text-muted)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    opacity: 0.3,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <Icons.Image />
                                            </div>

                                            <span
                                                style={{
                                                    fontFamily:
                                                        "var(--font-body)",
                                                    fontSize:
                                                        "11px",
                                                    opacity: 0.5,
                                                }}
                                            >
                                                No image
                                                uploaded
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handleImageChange
                                    }
                                    style={{
                                        display: "none",
                                    }}
                                />

                                <AdminBtn
                                    variant="ghost"
                                    onClick={() =>
                                        fileRef.current?.click()
                                    }
                                >
                                    <Icons.Upload />

                                    {imagePreview
                                        ? "Replace Image"
                                        : "Upload Image"}
                                </AdminBtn>

                                {errors.image && (
                                    <span
                                        style={errorStyle}
                                    >
                                        {errors.image}
                                    </span>
                                )}

                                <p
                                    style={{
                                        fontFamily:
                                            "var(--font-body)",
                                        fontSize: "10px",
                                        color:
                                            "var(--color-text-muted)",
                                        margin: 0,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    JPEG, PNG or WebP ·
                                    Max 2 MB ·
                                    Recommended
                                    1200 × 675 px
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>

                <SaveBar
                    isEdit={isEdit}
                    venueName={venue?.name}
                    processing={processing}
                    onSubmit={handleSubmit}
                    cancelHref={route(
                        "admin.venues.index"
                    )}
                />
            </AdminLayout>
        </>
    );
}
