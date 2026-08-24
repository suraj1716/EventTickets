import { FormEventHandler, FormEvent, useEffect, useState } from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import Modal from "@/Components/App/ui/Modal";
import Button from "@/Components/App/ui/Button";
import Badge from "@/Components/App/ui/Badge";
import { label, input, err, fieldWrap } from "@/Components/App/formStyles";
import { Phone } from "lucide-react";

const indexToWeekday: Record<string, string> = {
  "0": "sunday",
  "1": "monday",
  "2": "tuesday",
  "3": "wednesday",
  "4": "thursday",
  "5": "friday",
  "6": "saturday",
};
const weekdayToIndex: Record<string, string> = Object.fromEntries(
  Object.entries(indexToWeekday).map(([k, v]) => [v, k]),
);

type VendorDetailsProps = { className?: string };

export default function VendorDetails({ className }: VendorDetailsProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const props = usePage().props as any;

const user = props.auth.user;
const token = props.csrf_token;
const vendor = user?.vendor; // was: props.vendor

  const { data, setData, errors, post, processing, recentlySuccessful } =
    useForm({
      store_name: "",
      store_address: "",
      phone: "",
      booking_fee: "",
      vendor_type: "",
      start_time: "",
      end_time: "",
      slot_interval: 15,
      total_seats: 5,
      recurring_closed_days: [] as string[],
      closed_dates: [] as string[],
      facebook_url: "",
      youtube_url: "",
      tiktok_url: "",
      instagram_url: "",
    });

  useEffect(() => {
    if (vendor && vendor.status === "approved") {
      const cleanedRecurringDays = (vendor.recurring_closed_days ?? [])
        .flat()
        .map(String)
        .filter(
          (day, index, self) =>
            ["0", "1", "2", "3", "4", "5", "6"].includes(day) &&
            self.indexOf(day) === index,
        )
        .map((dayIndex) => indexToWeekday[dayIndex]);

      setData({
        store_name: vendor.store_name ?? "",
        store_address: vendor.store_address ?? "",
        phone: vendor.phone ?? "",
        booking_fee: vendor.booking_fee ?? "",
        vendor_type: vendor.vendor_type ?? "",
        facebook_url: vendor.facebook_url ?? "",
        tiktok_url: vendor.tiktok_url ?? "",
        youtube_url: vendor.youtube_url ?? "",
        instagram_url: vendor.instagram_url ?? "",
        start_time: vendor.business_start_time ?? "",
        end_time: vendor.business_end_time ?? "",
        slot_interval: vendor.slot_interval_minutes ?? 15,
        total_seats: vendor.total_seats ?? 5,
        recurring_closed_days: cleanedRecurringDays,
        closed_dates:
          vendor.closed_dates
            ?.flat()
            .filter((d): d is string => typeof d === "string") ?? [],
      });
    }
  }, [vendor]);

  const onStoreNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setData("store_name", ev.target.value.toLowerCase().replace(/\s+/g, "-"));
  };

  const updateVendor: FormEventHandler = (ev) => {
    ev.preventDefault();
    const recurringClosedDaysAsIndices = data.recurring_closed_days
      .map((day) => weekdayToIndex[day.toLowerCase()])
      .filter((val): val is string => typeof val === "string");

    setData({
      ...data,
      recurring_closed_days: recurringClosedDaysAsIndices,
    });

    post(route("vendor.store"), {
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        setSuccessMessage("your details were updated");
      },
    });
  };

  return (
    <section className={className}>
      {recentlySuccessful && successMessage && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(58,125,68,0.08)",
            border: "1px solid rgba(58,125,68,0.25)",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--color-success)",
          }}
        >
          {successMessage}
        </div>
      )}

    {vendor &&
  (vendor.status === "pending" || vendor.status === "rejected") && (
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        color: "var(--color-text-muted)",
      }}
    >
      {vendor.status === "pending" &&
        "Your vendor request is under review. Please wait for approval."}

      {vendor.status === "rejected" &&
        "Your vendor request was rejected. Please contact support."}
    </p>
  )}

      {vendor && vendor.status === "approved" && (
        <>
          <form
            onSubmit={updateVendor}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={fieldWrap}>
              <label style={label} htmlFor="store_name">
                Store Name
              </label>
              <input
                id="store_name"
                style={input}
                value={data.store_name}
                onChange={onStoreNameChange}
                required
                autoFocus
                autoComplete="store_name"
              />
              {errors.store_name && <p style={err}>{errors.store_name}</p>}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                style={input}
                value={data.phone}
                onChange={(e) => setData("phone", e.target.value)}
                required
                autoFocus
                autoComplete="phone"
                placeholder="+61xxxxxxxx"
              />
              {errors.phone && <p style={err}>{errors.phone}</p>}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="booking_fee">
                Booking Fee (in AUD)
              </label>
              <input
                id="booking_fee"
                type="number"
                step="0.01"
                style={input}
                value={data.booking_fee}
                onChange={(e) => setData("booking_fee", e.target.value)}
              />
              {errors.booking_fee && <p style={err}>{errors.booking_fee}</p>}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="vendor_type">
                Vendor Type
              </label>
              <select
                id="vendor_type"
                style={input}
                value={data.vendor_type}
                onChange={(e) => setData("vendor_type", e.target.value)}
              >
                <option value="">Select Vendor Type</option>
                <option value="appointment">Appointment</option>
                <option value="ecommerce">E-commerce</option>
              </select>
              {errors.vendor_type && <p style={err}>{errors.vendor_type}</p>}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="store_address">
                Store Address
              </label>
              <textarea
                id="store_address"
                style={{ ...input, minHeight: 80, resize: "vertical" }}
                value={data.store_address}
                onChange={(e) => setData("store_address", e.target.value)}
                placeholder="Enter your Store Address"
              />
              {errors.store_address && (
                <p style={err}>{errors.store_address}</p>
              )}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="facebook_url">
                Facebook url
              </label>
              <input
                id="facebook_url"
                style={input}
                value={data.facebook_url}
                onChange={(e) => setData("facebook_url", e.target.value)}
                placeholder="https://---------"
              />
              {errors.facebook_url && <p style={err}>{errors.facebook_url}</p>}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="youtube_url">
                Youtube url
              </label>
              <input
                id="youtube_url"
                style={input}
                value={data.youtube_url}
                onChange={(e) => setData("youtube_url", e.target.value)}
                placeholder="https://---------"
              />
              {errors.youtube_url && <p style={err}>{errors.youtube_url}</p>}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="instagram_url">
                instagram_url
              </label>
              <input
                id="instagram_url"
                style={input}
                value={data.instagram_url}
                onChange={(e) => setData("instagram_url", e.target.value)}
                placeholder="https://---------"
              />
              {errors.instagram_url && (
                <p style={err}>{errors.instagram_url}</p>
              )}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="tiktok_url">
                tiktok url
              </label>
              <input
                id="tiktok_url"
                style={input}
                value={data.tiktok_url}
                onChange={(e) => setData("tiktok_url", e.target.value)}
                placeholder="https://---------"
              />
              {errors.tiktok_url && <p style={err}>{errors.tiktok_url}</p>}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={fieldWrap}>
                <label style={label} htmlFor="start_time">
                  Start Time
                </label>
                <input
                  id="start_time"
                  type="time"
                  style={input}
                  value={data.start_time}
                  onChange={(e) => setData("start_time", e.target.value)}
                />
                {errors.start_time && <p style={err}>{errors.start_time}</p>}
              </div>

              <div style={fieldWrap}>
                <label style={label} htmlFor="end_time">
                  End Time
                </label>
                <input
                  id="end_time"
                  type="time"
                  style={input}
                  value={data.end_time}
                  onChange={(e) => setData("end_time", e.target.value)}
                />
                {errors.end_time && <p style={err}>{errors.end_time}</p>}
              </div>

              <div style={fieldWrap}>
                <label style={label} htmlFor="total_seats">
                  Total seats
                </label>
                <input
                  id="total_seats"
                  style={input}
                  value={data.total_seats}
                  onChange={(e) => setData("total_seats", e.target.value)}
                />
                {errors.total_seats && <p style={err}>{errors.total_seats}</p>}
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="slot_interval">
                Slot Interval (minutes)
              </label>
              <input
                id="slot_interval"
                type="number"
                min={5}
                style={input}
                value={data.slot_interval}
                onChange={(e) =>
                  setData("slot_interval", Number(e.target.value))
                }
              />
              {errors.slot_interval && (
                <p style={err}>{errors.slot_interval}</p>
              )}
            </div>

            <div style={fieldWrap}>
              <label style={label}>Closed Days</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {[
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ].map((day) => (
                  <label
                    key={day}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{
                        accentColor: "var(--color-accent)",
                        width: 14,
                        height: 14,
                      }}
                      checked={data.recurring_closed_days.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setData("recurring_closed_days", [
                            ...data.recurring_closed_days,
                            day,
                          ]);
                        } else {
                          setData(
                            "recurring_closed_days",
                            data.recurring_closed_days.filter((d) => d !== day),
                          );
                        }
                      }}
                    />
                    <span style={{ textTransform: "capitalize" }}>{day}</span>
                  </label>
                ))}
              </div>
              {errors.recurring_closed_days && (
                <p style={err}>{errors.recurring_closed_days}</p>
              )}
            </div>

            <div style={fieldWrap}>
              <label style={label} htmlFor="closed_dates">
                Closed Dates (comma separated)
              </label>
              <input
                id="closed_dates"
                type="text"
                style={input}
                placeholder="YYYY-MM-DD, YYYY-MM-DD"
                value={data.closed_dates.join(", ")}
                onChange={(e) => {
                  const dates = e.target.value
                    .split(",")
                    .map((date) => date.trim())
                    .filter(Boolean);
                  setData("closed_dates", dates);
                }}
              />
              {errors.closed_dates && <p style={err}>{errors.closed_dates}</p>}
            </div>

            <div>
              <Button type="submit" variant="primary" disabled={processing}>
                Update
              </Button>
            </div>
          </form>

          <form
            action={route("stripe.connect")}
            method="get"
            style={{ marginTop: 32 }}
          >
            <input type="hidden" name="_token" value={token} />
            {user.stripe_account_active && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                You are successfully connected to Stripe.
              </p>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <div style={{ flex: 1 }}>
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full"
                  disabled={user.stripe_account_active}
                >
                  Connect to Stripe
                </Button>
              </div>

              <Link
                href={route("admin.dashboard")}
                style={{ display: "block", flex: 1 }}
              >
                <Button type="button" variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
