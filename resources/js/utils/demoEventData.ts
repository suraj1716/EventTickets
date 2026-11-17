// resources/js/utils/demoEventData.ts
// Random but realistic data in the exact shapes of @/types (Event, EventLeg,
// TicketTier, Venue, Category) for demoing Events/Show and Admin/Events/Form.

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Inline gradient "photo" so demos need no network / storage.
function art(a: string, b: string, label: string) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>` +
    `<rect width='1600' height='900' fill='url(#g)'/>` +
    `<circle cx='1250' cy='250' r='180' fill='rgba(255,255,255,0.12)'/>` +
    `<text x='80' y='820' font-family='Impact,sans-serif' font-size='96' fill='rgba(255,255,255,0.85)'>${label}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const PALETTES: [string, string][] = [["#FF6F91", "#2B1055"], ["#FFB627", "#7A1F3D"], ["#4FD1C5", "#1B2A49"], ["#8B6BFF", "#0B0B10"]];
const CITIES = [
  { city: "Sydney", state: "NSW", postcode: "2000", lat: "-33.8688", lng: "151.2093" },
  { city: "Melbourne", state: "VIC", postcode: "3000", lat: "-37.8136", lng: "144.9631" },
  { city: "Brisbane", state: "QLD", postcode: "4000", lat: "-27.4698", lng: "153.0251" },
  { city: "Perth", state: "WA", postcode: "6000", lat: "-31.9505", lng: "115.8605" },
];
const VENUE_NAMES = ["The Enmore Theatre", "Forum Melbourne", "The Tivoli", "Astor Theatre", "Hordern Pavilion", "The Fortitude Music Hall"];
const ARTISTS = ["Luna Vale", "The Paper Kites", "Remi Okoro", "Skyline Collective", "DJ Marlow", "Nova & The Echoes"];
const LANGS = ["English", "Hindi", "Nepali", "Mandarin"];

export function makeCategories() {
  return ["Music", "Comedy", "Festival", "Theatre", "Family", "Nightlife"].map((name, i) => ({
    id: i + 1, name, slug: name.toLowerCase(),
  }));
}

export function makeVenues(seed = 7) {
  const r = rng(seed);
  return VENUE_NAMES.map((name, i) => {
    const c = CITIES[i % CITIES.length];
    return {
      id: i + 1, created_by_user_id: 1, name, address: `${Math.round(r() * 300 + 1)} George Street`,
      city: c.city, state: c.state, postcode: c.postcode, country: "Australia",
      latitude: c.lat, longitude: c.lng, capacity: Math.round(r() * 2500 + 400),
      seating_type: i % 3 === 0 ? "reserved" : "general", contact_name: null, contact_email: null,
      contact_phone: null, notes: null, image_url: null, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
  });
}

function makeTiers(r: () => number, legId: number, legName: string, date: string) {
  const defs = [["Early Bird", 39], ["General Admission", 59], ["VIP", 129]] as const;
  return defs.map(([name, base], i) => {
    const quantity = Math.round(r() * 300 + 100);
    const sold = Math.round(quantity * (0.2 + r() * 0.7));
    return {
      id: legId * 10 + i, event_leg_id: legId, name, event_name: null, venue_name: legName,
      event_date: date, event_image: null, price: (base + Math.round(r() * 15)).toFixed(2),
      quantity, remaining: quantity - sold, sold_count: sold,
      starts_at: new Date(Date.now() - 5 * 864e5).toISOString(),
      ends_at: new Date(Date.parse(date) - 864e5).toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
  });
}

export function makeEvent(seed = 2026, id = 1, tour = true) {
  const r = rng(seed + id);
  const pal = PALETTES[id % PALETTES.length];
  const legCount = tour ? 3 : 1;
  const legs = Array.from({ length: legCount }, (_, i) => {
    const c = CITIES[(i + id) % CITIES.length];
    const date = new Date(Date.now() + (20 + i * 9 + Math.round(r() * 5)) * 864e5);
    date.setUTCHours(9, 30, 0, 0);
    const venueName = VENUE_NAMES[(i + id) % VENUE_NAMES.length];
    const legId = id * 100 + i + 1;
    return {
      id: legId, event_id: id, venue_id: ((i + id) % VENUE_NAMES.length) + 1, venue_name: venueName,
      address: `${Math.round(r() * 300 + 1)} George Street, ${c.city} ${c.state}`, city: c.city,
      latitude: c.lat, longitude: c.lng, event_date: date.toISOString(),
      capacity: Math.round(r() * 1500 + 500), sequence: i + 1, seating_type: "general",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      ticket_tiers: makeTiers(r, legId, venueName, date.toISOString()), seats: [],
    };
  });
  const title = ["Sunset Sessions Live", "Harbour Lights Tour", "Neon Nights Festival", "Stand-Up Showdown"][id % 4];
  const event: any = {
    id, vendor_user_id: 7, name: title, slug: title.toLowerCase().replace(/\s+/g, "-"),
    image_url: art(pal[0], pal[1], title),
    description:
      "Three unforgettable nights of live music, big sound and bigger crowds. Doors open at 6:30pm with support acts from emerging local artists, followed by a headline set you'll be talking about for months.\n\nExpect world-class production, licensed bars, and food trucks onsite. All ages welcome until 9pm.",
    policy: "Tickets are non-refundable unless the event is cancelled or rescheduled. Photo ID required for entry. No outside food or drink. Re-entry is not permitted.",
    type: tour ? "tour" : "standalone", status: "published", languages: LANGS.slice(0, 2), watchlist_enabled: true,
    published_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null,
    media: [
      { id: id * 10 + 1, event_id: id, type: "image", path: "x", url: art(pal[0], pal[1], title), thumb_url: art(pal[0], pal[1], title), position: 0 },
      { id: id * 10 + 2, event_id: id, type: "image", path: "y", url: art(pal[1], pal[0], "Live"), thumb_url: art(pal[1], pal[0], "Live"), position: 1 },
    ],
    vendor: { id: 7, name: "Harbour Live Co" },
    artists: ARTISTS.slice(0, 3).map((name, i) => ({ id: i + 1, name, slug: name.toLowerCase().replace(/\W+/g, "-") })),
    categories: makeCategories().slice(0, 2),
    sponsors: [
      { id: 1, name: "Bondi Brewing", logo_url: null, tier: "platinum", tier_label: "Platinum", website_url: null, position: 0 },
      { id: 2, name: "Coastline Audio", logo_url: null, tier: "gold", tier_label: "Gold", website_url: null, position: 1 },
    ],
    watchlist_count: Math.round(r() * 400 + 40),
    tickets_sold: legs.flatMap((l) => l.ticket_tiers).reduce((a, t) => a + t.sold_count, 0),
    capacity: legs.reduce((a, l) => a + l.capacity, 0),
    legs,
  };
  return event;
}

export function makeEventDetails(seed = 2026, id = 1, tour = true) {
  const event = makeEvent(seed, id, tour);
  return {
    event,
    eventDetails: {
      legs: event.legs,
      relatedEvents: [makeEvent(seed, id + 1, false), makeEvent(seed, id + 2, false)],
      products: [
        { id: 1, event_id: id, title: "Official Tour Tee", slug: "tour-tee", description: "Soft cotton, limited run.", price: "45.00", status: "active", highlight: "Fan favourite", quantity: 80, image_url: art("#222", "#555", "Tee") },
        { id: 2, event_id: id, title: "VIP Lanyard Pack", slug: "lanyard", description: "Collectable lanyard + poster.", price: "25.00", status: "active", highlight: null, quantity: 120, image_url: art("#333", "#777", "Pack") },
      ],
    },
  };
}

/* ───────── Landing / search / checkout demo data ───────── */

export function makeBanners() {
  return [
    { id: 1, title: "Live Music, Locked In", subtitle: "Find your next unforgettable night across Sydney and beyond.", image_path: "x", image_url: art("#FFB627", "#2B1055", "Live Music"), button_text: "Browse events", button_link: "/events", is_active: true },
    { id: 2, title: "Comedy Nights", subtitle: "Stand-up shows from the best local and touring acts.", image_path: "y", image_url: art("#FF6F91", "#0B0B10", "Comedy"), button_text: "Get tickets", button_link: "/events", is_active: true },
    { id: 3, title: "Festival Season", subtitle: "Multi-day passes, camping and VIP upgrades.", image_path: "z", image_url: art("#4FD1C5", "#1B2A49", "Festivals"), button_text: "See festivals", button_link: "/events", is_active: true },
  ];
}

export function makeLandingCategories() {
  const pal = PALETTES;
  return makeCategories().map((c, i) => ({
    ...c,
    image_url: art(pal[i % pal.length][0], pal[i % pal.length][1], c.name),
    products_count: 8 + ((i * 7) % 23),
  }));
}

export function makeEventList(seed = 2026, count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const e = makeEvent(seed, i + 1, i % 3 === 0);
    const cats = makeCategories();
    e.categories = [cats[i % cats.length], cats[(i + 2) % cats.length]];
    return e;
  });
}
