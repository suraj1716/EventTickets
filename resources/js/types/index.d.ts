// resources/js/types/index.d.ts

// ---------- Enums ----------

export type EventType = 'standalone' | 'tour';

export type EventStatus =
  | 'draft'
  | 'proposed'
  | 'published'
  | 'cancelled';

export type TicketStatus =
  | 'valid'
  | 'used'
  | 'void';

export type ScanResult =
  | 'ok'
  | 'already_scanned'
  | 'void'
  | 'not_found';

export type SortOption =
  | 'date'
  | 'trending'
  | 'price_low';

export type SeatingType =
  | 'general'
  | 'reserved';


// ---------- Minimal related models ----------

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
  total_price: string;
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
  price: string;

  ticket_tier?: TicketTier;
}


// ---------- Artist ----------

export interface Artist {
  id: number;
  name: string;
  slug: string;
}


// ---------- Ticket Tier ----------

export interface TicketTier {
  id: number;
  event_leg_id: number;
  name: string;

  // Laravel decimal cast serializes as string
  price: string;

  quantity: number;
  remaining: number;

  starts_at: string;
  ends_at: string;

  created_at: string;
  updated_at: string;

  tickets?: Ticket[];
  event_leg?: EventLeg;
}


// ---------- Venue ----------

export interface Venue {
  id: number;

  created_by_user_id: number | null;

  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string;

  latitude: string | null;
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

  created_by?: User;

  event_legs_count?: number;
}


// ---------- Venue Seat ----------

export interface VenueSeat {
  id: number;
  venue_id: number;
  venue_section_id: number;
  row_label: string;
  seat_number: number;
  label: string;
  is_active: boolean;
    created_at?: string;
  updated_at?: string;
 aisle_after: boolean;

}


// ---------- Event Seat ----------

export interface EventSeat {
  id: number;

  event_leg_id: number;

  venue_seat_id: number | null;

  ticket_tier_id: number | null;

  row_label: string;
  seat_number: number;
  label: string;

  status:
    | 'available'
    | 'reserved'
    | 'sold'
    | 'blocked';

  created_at?: string;
  updated_at?: string;

  ticket_tier?: TicketTier;
  venue_seat?: VenueSeat;
}


// ---------- Event Media ----------
//
// IMPORTANT:
// This is the DATABASE media object returned by Laravel.
//
// Do NOT use File[] here.
// File[] is only for the create/edit upload form.

export interface EventMedia {
  id: number;
  event_id: number;
  type: 'image' | 'video';
  path: string;
  url: string;
  position: number;
  mime_type?: string;
  size?: number;
  created_at?: string;
  updated_at?: string;
}


// ---------- Event Leg ----------

export interface EventLeg {
  id: number;

  event_id: number;

  venue_id: number | null;

  venue_name: string;

  address: string | null;

  city: string | null;

  latitude: string | null;
  longitude: string | null;

  event_date: string;

  capacity: number;

  sequence: number;

  seating_type?: SeatingType;

  created_at: string;
  updated_at: string;

  ticket_tiers?: TicketTier[];

  tickets?: Ticket[];

  seats?: EventSeat[];

  event?: Event;

  venue?: Venue;

  venue_address?: string | null;
}


// ---------- Event ----------

export interface Event {
  image_url: string | null;
  id: number;
  vendor_user_id: number;
  name: string;
  slug: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  languages: string[];
  watchlist_enabled: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  media: EventMedia[];
  remove_media_ids?: number[];

  vendor?: Vendor;
  legs?: EventLeg[];
  artists?: Artist[];
  categories?: Category[];

  watchlist_count?: number;
}


// ---------- Ticket ----------

export interface Ticket {
  id: number;

  order_id: number;

  ticket_tier_id: number;

  event_leg_id: number;

  code: string;

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


// ---------- Event Watchlist ----------

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


// ---------- Pagination ----------

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


// ---------- Event Search ----------

export interface EventSearchFilters {
  lat?: number;
  lng?: number;

  radius_km?: number;

  city?: string;

  category_ids?: number[];

  languages?: string[];

  artist?: string;

  date_from?: string;

  date_to?: string;

  price_min?: number;

  price_max?: number;

  type?: EventType;

  sort?: SortOption;

  page?: number;
}

export type EventSearchResponse =
  Paginated<Event>;


// ---------- Ticket Tier Form ----------

export interface TicketTierFormInput {
  name: string;

  price: number;

  quantity: number;

  starts_at: string;

  ends_at: string;
}


// ---------- Event Media Upload ----------
//
// Used ONLY by create/edit forms.
//
// This is deliberately separate from EventMedia.
//
// Browser File:
//
// file: File
//
// Database media:
//
// media: EventMedia

export interface EventMediaUpload {
  id?: number;

  file: File;

  type?: 'image' | 'video';

  position: number;
}


// ---------- Event Leg Form ----------

export interface EventLegFormInput {
  id?: number;

  venue_id?: number | null;

  venue_name: string;

  address: string;

  city: string;

  latitude?: number;

  longitude?: number;

  event_date: string;

  capacity: number;

  seating_type?: SeatingType;

  tiers: TicketTierFormInput[];
}


// ---------- Event Form ----------

export interface EventFormInput {
  name: string;
  description?: string;
  type: EventType;
  status?: 'draft' | 'proposed';
  languages?: string[];
  category_ids?: number[];
  artists?: string[];
  legs: EventLegFormInput[];

  media?: File[];
  remove_media_ids?: number[];
}


// ---------- Venue Form ----------

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


// ---------- Watchlist ----------

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


// ---------- Ticket Scan ----------

export interface ScanRequest {
  code: string;
}

export interface ScanResponse {
  result: ScanResult;

  ticket?: Ticket;

  scanned_at?: string | null;
}
