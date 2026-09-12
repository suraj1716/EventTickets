#!/usr/bin/env bash
#
# fix-staff-visibility.sh — trims the sidebar and fixes vendor-scoping for
# Staff accounts: hides vendor-owner-only screens, hides "New Event" from
# anyone without events.create, adds a real "Switch Vendor" nav entry,
# fixes two controllers that were still scoping by raw user id instead of
# actingVendorId(), and redacts the other-vendor event name that leaked
# out of the Permissions Test page.
#
# Run from the repo root:
#   bash scripts/fix-staff-visibility.sh
#
# Safe to re-run — every step checks whether it's already applied.

set -euo pipefail

if [ ! -f "artisan" ]; then
  echo "Run this from the Laravel project root (artisan not found here)." >&2
  exit 1
fi

CHANGED=0
note() { echo "  - $1"; }
step()  { echo; echo "==> $1"; }

# ─────────────────────────────────────────────────────────────────────
step "1/4  Sharing actingVendorId + staffVendors on the auth user"
# ─────────────────────────────────────────────────────────────────────
F="app/Http/Resources/AuthUserResource.php"
if ! grep -q "actingVendorId" "$F"; then
  perl -0777 -pi -e "s/('roles' => \\\$this->getRoleNames\(\),\n)/\$1            \/\/ Only meaningful for Staff — lets the sidebar render a\n            \/\/ \"Switch Vendor\" link and know which vendor is currently\n            \/\/ active without every page controller having to pass it.\n            'actingVendorId' => \\\$this->isStaffRole() ? \\\$this->actingVendorId() : null,\n            'staffVendors' => \\\$this->isStaffRole()\n                ? \\\$this->activeVendors()->get(['users.id', 'users.name'])\n                : [],\n/" "$F"
  note "added actingVendorId + staffVendors to the shared auth.user payload"
  CHANGED=1
else
  note "already added, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "2/4  Fixing vendor scoping in Tickets/Orders admin controllers"
# ─────────────────────────────────────────────────────────────────────
F="app/Http/Controllers/EventTicketsController.php"
if grep -q '\$request->user()->id' "$F"; then
  perl -pi -e "s/\\\$request->user\(\)->id/\\\$request->user()->actingVendorId()/g" "$F"
  note "EventTicketsController now scopes by actingVendorId() (2 spots)"
  CHANGED=1
else
  note "EventTicketsController already fixed, skipped"
fi

F="app/Http/Controllers/EventOrdersController.php"
if grep -q '\$request->user()->id' "$F"; then
  perl -pi -e "s/\\\$request->user\(\)->id/\\\$request->user()->actingVendorId()/g" "$F"
  note "EventOrdersController now scopes by actingVendorId()"
  CHANGED=1
else
  note "EventOrdersController already fixed, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "3/4  Redacting the other-vendor event name in the Permissions Test page"
# ─────────────────────────────────────────────────────────────────────
F="app/Http/Controllers/Admin/PermissionsTestController.php"
if grep -qF "'event' => ['id' => \$event->id, 'name' => \$event->name, 'vendor_user_id' => \$event->vendor_user_id]," "$F"; then
  python3 - "$F" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path) as f:
    content = f.read()

old = """            $checks[] = [
                'event' => ['id' => $event->id, 'name' => $event->name, 'vendor_user_id' => $event->vendor_user_id],"""

new = """            // The "other vendor's event" row exists purely to demonstrate
            // that the deny check works \u2014 a non-Admin viewer (Vendor or
            // Staff) has no legitimate reason to see that event's real
            // name, even on a diagnostic page. Admins already see
            // everything everywhere, so no need to redact for them.
            $eventPayload = $label === 'other' && ! $user->isAdmin()
                ? ['id' => $event->id, 'name' => '(a different vendor\\'s event)', 'vendor_user_id' => $event->vendor_user_id]
                : ['id' => $event->id, 'name' => $event->name, 'vendor_user_id' => $event->vendor_user_id];

            $checks[] = [
                'event' => $eventPayload,"""

assert content.count(old) == 1, f"expected exactly one match, found {content.count(old)}"
content = content.replace(old, new)
with open(path, "w") as f:
    f.write(content)
PYEOF
  note "the 'other vendor' comparison row no longer leaks a real event name to non-Admins"
  CHANGED=1
else
  note "already fixed, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "4/4  Trimming the sidebar for Staff + adding a real Switch Vendor link"
# ─────────────────────────────────────────────────────────────────────
F="resources/js/Pages/Admin/AdminLayout.tsx"

if grep -q 'console.log("AUTH ROLES:"' "$F"; then
  perl -0777 -pi -e 's/console\.log\("AUTH ROLES:", roles\);\nconsole\.log\("IS ADMIN:", isAdmin\);\nconsole\.log\("IS VENDOR:", isVendor\);\n//' "$F"
  note "removed leftover debug console.log calls"
  CHANGED=1
fi

if ! grep -q "Repeat," "$F"; then
  perl -pi -e 's/(\s*)UserPlus,\n/\1UserPlus,\n\1Repeat,\n/' "$F"
  note "added Repeat icon import"
  CHANGED=1
fi

if ! grep -q "hideForStaff" "$F"; then
  perl -0777 -pi -e "s/(  adminOnly\?: boolean;\n  adminOrVendor\?: boolean;\n)\};/\${1}  \/\/ Staff get the full vendor dashboard's data (scoped to whichever\n  \/\/ vendor they're acting as), but not its full feature set — these are\n  \/\/ vendor-owner-only screens (catalog\/finance\/staff-management) that\n  \/\/ Staff's permission set was never meant to include.\n  hideForStaff\?: boolean;\n  \/\/ Gate purely on the acting role's actual permission grant (see\n  \/\/ RolesAndPermissionsSeeder) rather than a hand-maintained role flag —\n  \/\/ use this when the nav item maps directly onto one permission.\n  requiresPermission\?: string;\n  \/\/ Only ever relevant to Staff working more than one vendor — see the\n  \/\/ vendor-count check in the filter below.\n  staffOnly\?: boolean;\n};/" "$F"
  note "extended NavItem type (hideForStaff / requiresPermission / staffOnly)"
  CHANGED=1
fi

# Tag the specific nav items (each check is independent + idempotent —
# grep for the exact untagged line so re-running is a no-op).
tag_item() {
  local old="$1" new="$2" desc="$3"
  if grep -qF "$old" "$F" && ! grep -qF "$new" "$F"; then
    perl -pi -e "s/\Q$old\E/$new/" "$F"
    note "$desc"
    CHANGED=1
  fi
}

tag_item \
  '{ label: "New Event", href: "admin.events.create", icon: PlusCircle, countKey: null },' \
  '{ label: "New Event", href: "admin.events.create", icon: PlusCircle, countKey: null, requiresPermission: "events.create" },' \
  "New Event hidden unless events.create permission is held"

tag_item \
  '{ label: "Venues", href: "admin.venues.index", icon: MapPin, countKey: null },' \
  '{ label: "Venues", href: "admin.venues.index", icon: MapPin, countKey: null, hideForStaff: true },' \
  "Venues tab hidden from Staff (still usable as a dropdown inside the event form)"

tag_item \
  '{ label: "Watchlist", href: "admin.events.watchlist.index", icon: Eye, countKey: null },' \
  '{ label: "Watchlist", href: "admin.events.watchlist.index", icon: Eye, countKey: null, hideForStaff: true },' \
  "Watchlist hidden from Staff (not in their permission set — revisit if that's wrong)"

tag_item \
  '{ label: "Products", href: "admin.products.index", icon: Package, countKey: null },' \
  '{ label: "Products", href: "admin.products.index", icon: Package, countKey: null, hideForStaff: true },' \
  "Products hidden from Staff"

tag_item \
  '{ label: "Gallery", href: "admin.gallery.index", icon: Images, countKey: null },' \
  '{ label: "Gallery", href: "admin.gallery.index", icon: Images, countKey: null, hideForStaff: true },' \
  "Gallery hidden from Staff"

tag_item \
  '{ label: "Bookings", href: "admin.bookings.index", icon: CalendarDays, countKey: "bookings" },' \
  '{ label: "Bookings", href: "admin.bookings.index", icon: CalendarDays, countKey: "bookings", hideForStaff: true },' \
  "Bookings hidden from Staff"

tag_item \
  '{ label: "Vouchers", href: "admin.vouchers.index", icon: Gift, countKey: "vouchers" },' \
  '{ label: "Vouchers", href: "admin.vouchers.index", icon: Gift, countKey: "vouchers", hideForStaff: true },' \
  "Vouchers hidden from Staff"

tag_item \
  '{ label: "Gift-Cards", href: "admin.gift-card-templates.index", icon: CreditCard, countKey: null },' \
  '{ label: "Gift-Cards", href: "admin.gift-card-templates.index", icon: CreditCard, countKey: null, hideForStaff: true },' \
  "Gift-Cards hidden from Staff"

tag_item \
  '{ label: "Payouts", href: "admin.payouts.index", icon: Wallet, countKey: null },' \
  '{ label: "Payouts", href: "admin.payouts.index", icon: Wallet, countKey: null, hideForStaff: true },' \
  "Payouts hidden from Staff"

tag_item \
  '{ label: "Staffs", href: "admin.vendor.staff.index", icon: Users, countKey: null },' \
  '{ label: "Staffs", href: "admin.vendor.staff.index", icon: Users, countKey: null, hideForStaff: true },' \
  "Staffs (staff management) hidden from Staff — a staff account should not manage other staff"

if ! grep -q '"Switch Vendor"' "$F"; then
  perl -pi -e 's/(\s*\{ label: "Team", href: "admin\.vendor\.team\.index".*?\},\n)/$1      { label: "Switch Vendor", href: "admin.switch-vendor.index", icon: Repeat, countKey: null, staffOnly: true },\n/' "$F"
  note "added a real 'Switch Vendor' nav link (previously only reachable via the Permissions Test page or a direct URL)"
  CHANGED=1
fi

if ! grep -q "const isStaff = roles.includes" "$F"; then
  perl -0777 -pi -e 's/(const isVendor = roles\.includes\("Vendor"\);\n)/${1}  const isStaff = roles.includes("Staff");\n  const permissions = authUser?.permissions ?? [];\n  const staffVendors = authUser?.staffVendors ?? [];\n/' "$F"
  note "derived isStaff / permissions / staffVendors from the auth user"
  CHANGED=1
fi

if ! grep -q "item.hideForStaff" "$F"; then
  perl -0777 -pi -e "s/(    if \(item\.adminOrVendor\) \{\n      return isAdmin \|\| isVendor;\n    \}\n)(\n    return true;)/\${1}\n    if (item.hideForStaff \&\& isStaff) {\n      return false;\n    }\n\n    if (item.requiresPermission \&\& !permissions.includes(item.requiresPermission)) {\n      return false;\n    }\n\n    if (item.staffOnly) {\n      return isStaff \&\& staffVendors.length > 1;\n    }\n\${2}/" "$F"
  note "extended the nav filter to apply hideForStaff / requiresPermission / staffOnly"
  CHANGED=1
fi

echo
if [ "$CHANGED" -eq 1 ]; then
  echo "Done. Review the diff (git diff / git status), then just rebuild the frontend:"
  echo
  echo "  npm run build   # or your usual dev/watch command"
else
  echo "Nothing to do — repo already matches the fixed state."
fi
