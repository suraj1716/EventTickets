import { useState, useMemo } from 'react'
import { Head, router } from '@inertiajs/react'
import { toast } from 'react-toastify'
import {
  AdminPageHeader,
  AdminTable,
  FilterBar,
  Td,
  StatusBadge,
  ActionBtn,
  Icons,
} from '../../../Components/Admin/AdminComponents'
import AdminLayout from '../AdminLayout'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  id: number
  date: string
  time: string | null
  customer: string | null
  service: string | null
  service_id: number | null
  assigned_staff_id: number | null
  assigned_staff: string | null
}

interface StaffMember {
  id: number
  name: string
}

interface ServiceOption {
  id: number
  name: string
}

interface Props {
  bookings: Booking[]
  staff: StaffMember[]
  services: ServiceOption[]
  filters: {
    from: string
    to: string
    service_id: string | null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const cur = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (cur <= end) {
    if (cur.getDay() !== 0) dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    top: dateStr === today() ? 'Today' : SHORT_DAYS[d.getDay()],
    sub: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
    isToday: dateStr === today(),
  }
}

// ── Assign Staff Drawer ───────────────────────────────────────────────────────

function AssignDrawer({
  booking,
  staff,
  onClose,
  onAssign,
}: {
  booking: Booking
  staff: StaffMember[]
  onClose: () => void
  onAssign: (bookingId: number, staffId: number) => void
}) {
  const [selected, setSelected] = useState<number | ''>('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    onAssign(booking.id, Number(selected))
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-overlay)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          width: 420,
          maxWidth: 'calc(100vw - 32px)',
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-xl)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 400,
              color: 'var(--color-text)',
            }}
          >
            Assign Staff
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}
          >
            ✕
          </button>
        </div>

        {/* Booking summary */}
        <div
          style={{
            padding: 'var(--space-lg) var(--space-xl)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Booking #{booking.id}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
            {booking.customer ?? '—'}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {booking.service ?? '—'}
          </div>
          {booking.time && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)', marginTop: 2 }}>
              {booking.date} · {booking.time}
            </div>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-xs)',
              }}
            >
              Select Staff Member
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : '')}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            >
              <option value="">— Select staff —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: '0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RosterIndex({ bookings, staff, services, filters }: Props) {
  const [from, setFrom] = useState(filters.from)
  const [to, setTo] = useState(filters.to)
  const [serviceId, setServiceId] = useState(filters.service_id ?? '')
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings)
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null)

  const dates = useMemo(() => getDatesInRange(from, to), [from, to])

  const filtered = useMemo(
    () =>
      localBookings.filter(
        (b) =>
          dates.includes(b.date) &&
          (serviceId === '' || b.service_id === Number(serviceId))
      ),
    [localBookings, dates, serviceId]
  )

  const unassigned = filtered.filter((b) => b.assigned_staff_id === null)
  const todayTotal = filtered.filter((b) => b.date === today()).length
  const weekTotal = filtered.length

  // ── Handlers ────────────────────────────────────────────────────────────────

  function applyFilters() {
    router.get(
      route('admin.roster.index'),
      { from, to, service_id: serviceId || undefined },
      { preserveState: true, replace: true }
    )
  }

  function handleAssign(bookingId: number, staffId: number) {
    const member = staff.find((s) => s.id === staffId)
    setLocalBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, assigned_staff_id: staffId, assigned_staff: member?.name ?? null }
          : b
      )
    )
    router.post(
      route('admin.roster.assign', bookingId),
      { staff_id: staffId },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => toast.success('Staff assigned'),
        onError: () => toast.error('Failed to assign staff'),
      }
    )
  }

  function handleDeassign(bookingId: number) {
    setLocalBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, assigned_staff_id: null, assigned_staff: null } : b
      )
    )
    router.post(
      route('admin.roster.deassign', bookingId),
      {},
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => toast.success('Assignment removed'),
        onError: () => toast.error('Failed to remove assignment'),
      }
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <Head title="Roster" />

      {assigningBooking && (
        <AssignDrawer
          booking={assigningBooking}
          staff={staff}
          onClose={() => setAssigningBooking(null)}
          onAssign={handleAssign}
        />
      )}

      <AdminPageHeader
        eyebrow="Schedule"
        title="Roster"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            />
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            >
              <option value="">All services</option>
              {services.map((sv) => (
                <option key={sv.id} value={sv.id}>
                  {sv.name}
                </option>
              ))}
            </select>
            <button
              onClick={applyFilters}
              style={{
                padding: '0.5rem 1.25rem',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        }
      />

      {/* Unassigned warning */}
      {unassigned.length > 0 && (
        <div
          style={{
            margin: '0 0 var(--space-lg)',
            padding: 'var(--space-md) var(--space-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            {unassigned.length} booking{unassigned.length > 1 ? 's' : ''}
          </span>
          awaiting staff assignment
        </div>
      )}

      {/* Summary metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {[
          { label: 'Today', value: todayTotal },
          { label: 'Range total', value: weekTotal },
          { label: 'Unassigned', value: unassigned.length, warn: unassigned.length > 0 },
          { label: 'Staff', value: staff.length },
        ].map(({ label, value, warn }) => (
          <div
            key={label}
            style={{
              padding: 'var(--space-lg)',
              border: `1px solid var(--color-border)`,
              background: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: warn ? 'var(--color-error, #c0392b)' : 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: warn ? 'var(--color-error, #c0392b)' : 'var(--color-text)',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Roster grid */}
      <div style={{ overflowX: 'auto' }}>
        <AdminTable
          headers={[
            'Staff',
            ...dates.map((d) => {
              const { top, sub } = fmtDayLabel(d)
              return `${top}\n${sub}`
            }),
            'Total',
          ]}
        >
          {/* Staff rows */}
          {staff.map((member) => {
            const staffBookings = filtered.filter((b) => b.assigned_staff_id === member.id)
            return (
              <tr key={member.id}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {member.name}
                    </span>
                  </div>
                </Td>

                {dates.map((d) => {
                  const dayBookings = staffBookings
                    .filter((b) => b.date === d)
                    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
                  const isToday = d === today()
                  return (
                    <Td key={d}>
                      <div style={{ background: isToday ? 'var(--color-bg)' : undefined, minWidth: 110 }}>
                        {dayBookings.length === 0 ? (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)' }}>—</span>
                        ) : (
                          dayBookings.map((b) => (
                            <div
                              key={b.id}
                              style={{
                                padding: '4px 8px',
                                marginBottom: 4,
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                fontSize: 'var(--text-xs)',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{b.customer ?? '—'}</span>
                                <button
                                  onClick={() => handleDeassign(b.id)}
                                  title="Remove assignment"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-light)',
                                    fontSize: 11,
                                    padding: 0,
                                    lineHeight: 1,
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                              <div style={{ color: 'var(--color-text-muted)' }}>{b.service ?? '—'}</div>
                              {b.time && (
                                <div style={{ color: 'var(--color-text-light)' }}>{b.time}</div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </Td>
                  )
                })}

                <Td muted>
                  <StatusBadge status={staffBookings.length > 0 ? 'active' : 'inactive'} label={String(staffBookings.length || '—')} />
                </Td>
              </tr>
            )
          })}

          {/* Unassigned row */}
          {unassigned.length > 0 && (
            <tr>
              <Td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: 'var(--color-text-light)',
                      flexShrink: 0,
                    }}
                  >
                    ?
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    No preference
                  </span>
                </div>
              </Td>

              {dates.map((d) => {
                const dayU = unassigned.filter((b) => b.date === d)
                return (
                  <Td key={d}>
                    {dayU.length === 0 ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)' }}>—</span>
                    ) : (
                      dayU.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            padding: '4px 8px',
                            marginBottom: 4,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            fontSize: 'var(--text-xs)',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{b.customer ?? '—'}</div>
                          <div style={{ color: 'var(--color-text-muted)' }}>{b.service ?? '—'}</div>
                          {b.time && <div style={{ color: 'var(--color-text-light)' }}>{b.time}</div>}
                          <button
                            onClick={() => setAssigningBooking(b)}
                            style={{
                              marginTop: 4,
                              width: '100%',
                              padding: '3px 0',
                              fontFamily: 'var(--font-body)',
                              fontSize: 'var(--text-xs)',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              background: 'var(--color-primary)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Assign
                          </button>
                        </div>
                      ))
                    )}
                  </Td>
                )
              })}

              <Td muted>
                <StatusBadge status="inactive" label={String(unassigned.length)} />
              </Td>
            </tr>
          )}

          {/* Day totals row */}
          <tr>
            <Td muted>
              <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Day totals
              </span>
            </Td>
            {dates.map((d) => {
              const count = filtered.filter((b) => b.date === d && b.assigned_staff_id !== null).length
              return (
                <Td key={d} muted>
                  <span style={{ fontWeight: count ? 600 : 400, color: count ? 'var(--color-text)' : 'var(--color-text-light)' }}>
                    {count || '—'}
                  </span>
                </Td>
              )
            })}
            <Td muted>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{weekTotal}</span>
            </Td>
          </tr>
        </AdminTable>
      </div>
    </AdminLayout>
  )
}
