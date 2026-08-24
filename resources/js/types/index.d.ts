// resources/js/types/index.d.ts
//
// Frontend types mirroring the Laravel models/migrations and controller
// responses built for the event ticketing platform. Keep this in sync
// by hand when the backend schema changes — there's no codegen wired up.
//
// Note on decimals: Laravel's `decimal:x` cast serializes to a STRING in
// JSON (not a number), to avoid float rounding on money/coords. `price`,
// `latitude`, and `longitude` are typed as `string` below for that reason
// — parseFloat() before doing arithmetic on them.

// ---------- Enums ----------

export type EventType = 'standalone' | 'tour';
export type EventStatus = 'draft' | 'proposed' | 'published' | 'cancelled';
export type TicketStatus = 'valid' | 'used' | 'void';
export type ScanResult = 'ok' | 'already_scanned' | 'void' | 'not_found';
export type SortOption = 'date' | 'trending' | 'price_low';
export type SeatingType = 'general' | 'reserved';

// ---------- Minimal related-model stubs ----------
// (Full shapes presumably already exist elsewhere from the salon platform;
// these are just enough for the event feature's own type-checking.)

export interface Vendor {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Order {
  id: number;
  user_id: number;
  vendor_user_id: number;
  status: string;
  total_price: string; // decimal cast -> string — NOT "total"
  is_paid: boolean;

  user?: User;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  ticket_tier_id: number | null;
  gift_card_template_id: number | null;
  quantity: number;
  price: string; // decimal cast -> string

  // present when eager-loaded with .ticketTier.eventLeg.event
  ticket_tier?: TicketTier;
}

// ---------- Core models ----------

export interface Artist {
  id: number;
  name: string;
  slug: string;
}

export interface TicketTier {
  id: number;
  event_leg_id: number;
  name: string;
  price: string; // decimal:2 -> string, e.g. "45.00"
  quantity: number;
  remaining: number;
  starts_at: string; // ISO datetime
  ends_at: string; // ISO datetime
  created_at: string;
  updated_at: string;

  // present when eager-loaded
  tickets?: Ticket[];
  event_leg?: EventLeg;
}

// ---------- Venues ----------
// Shared catalog: any Admin or Vendor can create one, any Admin or Vendor
// can select any active one on an event leg. Editing/deleting an existing
// venue is restricted server-side to its creator or an Admin.

export interface Venue {
  id: number;
  created_by_user_id: number | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string;
  latitude: string | null; // decimal:7 -> string
  longitude: string | null;
  capacity: number | null;
  seating_type: SeatingType;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // present when eager-loaded / withCount'd
  created_by?: User;
  event_legs_count?: number;
}

export interface EventLeg {
  venue_address: string | null;
  venue_id?: number;
  id: number;
  event_id: number;
  venue_id: number | null;
  venue_name: string;
  address: string | null;
  city: string | null;
  latitude: string | null; // decimal:7 -> string
  longitude: string | null;
  event_date: string; // ISO date, e.g. "2026-11-14"
  capacity: number;
  sequence: number;
  created_at: string;
  updated_at: string;

  // present when eager-loaded
  ticket_tiers?: TicketTier[];
  tickets?: Ticket[];
  event?: Event;
  venue?: Venue;
  seating_type?: SeatingType;

seats?: {
  id: number;
  row_label: string;
  seat_number: number;
  label: string;
  status: 'available' | 'reserved' | 'sold' | 'blocked';
  ticket_tier_id?: number | null;
}[];
}

export interface Event {
  image_url: string;
  id: number;
  vendor_user_id: number;
  name: string;
  slug: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  languages: string[]; // cultural/language tags, e.g. ["tamil", "punjabi"]
  watchlist_enabled: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // present when eager-loaded
  vendor?: Vendor;
  legs?: EventLeg[];
  artists?: Artist[];
  categories?: Category[];

  // present when withCount('watchlist') was used
  watchlist_count?: number;
}

export interface Ticket {
  id: number;
  order_id: number;
  ticket_tier_id: number;
  event_leg_id: number;
  code: string; // e.g. "AB3F-9K2X-QQ7Z"
  qr_path: string | null;
  barcode_path: string | null;
  holder_name: string | null;
  holder_email: string | null;
  status: TicketStatus;
  scanned_at: string | null;
  scanned_by: number | null;
  created_at: string;
  updated_at: string;

  order?: Order;
  ticket_tier?: TicketTier;
  event_leg?: EventLeg;
  scanned_by_user?: User;
}

export interface EventWatchlistEntry {
  id: number;
  event_id: number;
  email: string;
  user_id: number | null;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Laravel pagination envelope ----------

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface Paginated<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

// ---------- EventSearchController ----------

export interface EventSearchFilters {
  lat?: number;
  lng?: number;
  radius_km?: number;
  city?: string;
  category_ids?: number[];
  languages?: string[];
  artist?: string;
  date_from?: string; // "YYYY-MM-DD"
  date_to?: string;
  price_min?: number;
  price_max?: number;
  type?: EventType;
  sort?: SortOption;
  page?: number;
}

export type EventSearchResponse = Paginated<Event>;

// ---------- EventController (vendor create/update form) ----------

export interface TicketTierFormInput {
  name: string;
  price: number;
  quantity: number;
  starts_at: string;
  ends_at: string;
}

export interface EventLegFormInput {
   id?: number;
  venue_id?: number;
  venue_name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  event_date: string;
  capacity: number;
  tiers: TicketTierFormInput[];
}

export interface EventFormInput {
  name: string;
  description?: string;
  type: EventType;
  status?: 'draft' | 'proposed';
  languages?: string[];
  category_ids?: number[];
  artists?: string[]; // artist names; backend firstOrCreate()s them
  legs: EventLegFormInput[];
}

// ---------- VenueController (admin create/update form) ----------

export interface VenueFormInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  seating_type: SeatingType;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  image_url?: string;
  is_active: boolean;
}

// ---------- EventWatchlistController ----------

export interface WatchlistJoinRequest {
  email: string;
}

export interface WatchlistResponse {
  joined: boolean;
  watching_count: number;
}

export interface WatchlistCountResponse {
  watching_count: number;
}

// ---------- TicketScanController ----------

export interface ScanRequest {
  code: string;
}

export interface ScanResponse {
  result: ScanResult;
  ticket?: Ticket;
  scanned_at?: string | null;
}
