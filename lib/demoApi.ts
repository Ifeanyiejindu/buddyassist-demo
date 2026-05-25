/**
 * demoApi — server-side fetch helpers for the BuddyAssist demo backend
 * (the same backend Buddy's playbooks call). The demo storefront reads
 * its real catalog from here, so the page, the chat cards, and the
 * product pages all show the actual seeded products and images.
 */
const DEMO_API =
  process.env.DEMO_API_BASE || "https://lionfish-app-ss6rs.ondigitalocean.app/api/v1";
const DEMO_KEY = process.env.DEMO_API_KEY || "buddyassist-demo-key";

export interface AcmeProduct {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  images?: string[];
  tags: string[];
  material: string;
  stock: number;
  rating: number;
  inStock?: boolean;
  availability?: string;
}

async function demoGet(path: string): Promise<any> {
  const res = await fetch(`${DEMO_API}${path}`, {
    headers: { "x-api-key": DEMO_KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`demo API ${res.status}`);
  return res.json();
}

/** Full Acme catalogue — real seeded products with real images. */
export async function fetchAcmeProducts(): Promise<AcmeProduct[]> {
  try {
    const json = await demoGet("/acme/products");
    return (json?.data?.products as AcmeProduct[]) ?? [];
  } catch {
    return [];
  }
}

/** One Acme product by SKU. */
export async function fetchAcmeProduct(sku: string): Promise<AcmeProduct | null> {
  try {
    const json = await demoGet(`/acme/products/${encodeURIComponent(sku)}`);
    return (json?.data as AcmeProduct) ?? null;
  } catch {
    return null;
  }
}

// ── Wayfare (travel) ──────────────────────────────────────────────────────

export interface WfDestination {
  code: string;
  name: string;
  country: string;
  region: string;
  summary: string;
  tags: string[];
  bestSeasons: string[];
  highlights: string[];
  image?: string;
}

export interface WfPackage {
  packageId: string;
  title: string;
  destinationCode: string;
  priceFromUsd: number;
  durationDays?: number;
  seatsLeft: number;
  departures: string[];
  summary?: string;
  image?: string;
}

export interface WfStay {
  stayId: string;
  name: string;
  destinationCode: string;
  type: string;
  pricePerNightUsd: number;
  rating: number;
  roomsAvailable: number;
  image?: string;
}

/** Inspiration grid — every seeded destination. */
export async function fetchWayfareDestinations(): Promise<WfDestination[]> {
  try {
    const json = await demoGet("/wayfare/destinations");
    return (json?.data?.destinations as WfDestination[]) ?? [];
  } catch {
    return [];
  }
}

/** All curated trip packages — used for the "Trip packages" sidebar. */
export async function fetchWayfarePackages(opts?: {
  destination?: string;
  maxBudget?: number;
}): Promise<WfPackage[]> {
  const qs = new URLSearchParams();
  if (opts?.destination) qs.set("destination", opts.destination);
  if (opts?.maxBudget) qs.set("maxBudget", String(opts.maxBudget));
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/wayfare/packages${query}`);
    return (json?.data?.packages as WfPackage[]) ?? [];
  } catch {
    return [];
  }
}

/** Single destination by code — wraps the search endpoint with a code filter. */
export async function fetchWayfareDestination(
  code: string,
): Promise<WfDestination | null> {
  try {
    // Backend filters destinations by `q` (which matches name/country/summary/tags)
    // or `region`. There's no by-code GET, so we fetch all and pick — cheap (~6 rows).
    const all = await fetchWayfareDestinations();
    const match = all.find(
      (d) => d.code.toLowerCase() === code.toLowerCase(),
    );
    return match ?? null;
  } catch {
    return null;
  }
}

/** Available stays for a destination (rooms > 0), sorted by rating. */
export async function fetchWayfareStays(
  destinationCode: string,
  opts?: { maxPrice?: number },
): Promise<WfStay[]> {
  const qs = new URLSearchParams({ destination: destinationCode });
  if (opts?.maxPrice) qs.set("maxPrice", String(opts.maxPrice));
  try {
    const json = await demoGet(`/wayfare/stays?${qs}`);
    return (json?.data?.stays as WfStay[]) ?? [];
  } catch {
    return [];
  }
}

// ── Olivetta (restaurant) ─────────────────────────────────────────────────

export interface OlPairing {
  wine?: string;
  region?: string;
  why?: string;
  side?: string;
}

export interface OlDish {
  itemId: string;
  name: string;
  description: string;
  course: string; // starter | main | pizza | dessert | side
  price: number;
  allergens: string[];
  dietary: string[]; // vegetarian | vegan | gluten-free | dairy-free
  popular: boolean;
  isSpecial: boolean;
  pairings: OlPairing[];
  available: boolean;
  image?: string;
}

export interface OlAvailabilitySlot {
  time: string; // "19:00"
  seatsRemaining: number;
}

export interface OlAvailability {
  date: string;
  partySize: number;
  openSlots: OlAvailabilitySlot[];
}

/** Full menu, optionally filtered by course / dietary on the server. */
export async function fetchOlivettaMenu(opts?: {
  course?: string;
  dietary?: string;
}): Promise<OlDish[]> {
  const qs = new URLSearchParams();
  if (opts?.course) qs.set("course", opts.course);
  if (opts?.dietary) qs.set("dietary", opts.dietary);
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/olivetta/menu${query}`);
    // Backend may return menu or dishes — accept both shapes.
    return (json?.data?.menu ||
      json?.data?.dishes ||
      []) as OlDish[];
  } catch {
    return [];
  }
}

/** Tonight's chef specials. */
export async function fetchOlivettaSpecials(): Promise<OlDish[]> {
  try {
    const json = await demoGet("/olivetta/specials");
    return (json?.data?.specials as OlDish[]) ?? [];
  } catch {
    return [];
  }
}

/** Single dish detail (includes its pairings). */
export async function fetchOlivettaDish(itemId: string): Promise<OlDish | null> {
  try {
    const json = await demoGet(`/olivetta/menu/${encodeURIComponent(itemId)}`);
    return (json?.data as OlDish) ?? null;
  } catch {
    return null;
  }
}

/** Available reservation slots for a date + party size. */
export async function fetchOlivettaAvailability(
  date: string,
  partySize: number,
): Promise<OlAvailability | null> {
  const qs = new URLSearchParams({ date, partySize: String(partySize) });
  try {
    const json = await demoGet(`/olivetta/availability?${qs}`);
    return (json?.data as OlAvailability) ?? null;
  } catch {
    return null;
  }
}

// ── Keystone (real estate) ────────────────────────────────────────────────

export interface KsAgent {
  agentId: string;
  name: string;
  phone?: string;
  rating?: number;
  neighborhoods?: string[];
}

export interface KsListing {
  listingId: string;
  title: string;
  propertyType: string; // condo | house | townhouse
  status: string; // active | pending | sold
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  minOffer?: number;
  neighborhood: string;
  nearTransit?: boolean;
  transitNote?: string;
  address: string;
  agentId: string;
  image?: string;
  images?: string[];
  agent?: KsAgent;
}

export interface KsComparable {
  address: string;
  soldUsd: number;
  beds: number;
}

export interface KsNeighborhood {
  name: string;
  city: string;
  summary: string;
  medianPriceUsd: number;
  walkScore: number;
  transitScore: number;
  comparables: KsComparable[];
  activeListings: number;
}

/** All listings, optionally filtered by neighborhood / price range / beds. */
export async function fetchKeystoneListings(opts?: {
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
}): Promise<KsListing[]> {
  const qs = new URLSearchParams();
  if (opts?.neighborhood) qs.set("neighborhood", opts.neighborhood);
  if (opts?.minPrice) qs.set("minPrice", String(opts.minPrice));
  if (opts?.maxPrice) qs.set("maxPrice", String(opts.maxPrice));
  if (opts?.beds) qs.set("beds", String(opts.beds));
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/keystone/listings${query}`);
    return (json?.data?.listings as KsListing[]) ?? [];
  } catch {
    return [];
  }
}

/** Single listing — includes the assigned agent (joined server-side). */
export async function fetchKeystoneListing(id: string): Promise<KsListing | null> {
  try {
    const json = await demoGet(`/keystone/listings/${encodeURIComponent(id)}`);
    return (json?.data as KsListing) ?? null;
  } catch {
    return null;
  }
}

/** Open viewing slots for a listing (next ~2 weeks of working hours). */
export async function fetchKeystoneViewingSlots(id: string): Promise<string[]> {
  try {
    const json = await demoGet(
      `/keystone/listings/${encodeURIComponent(id)}/viewing-slots`,
    );
    return (json?.data?.openSlots as string[]) ?? [];
  } catch {
    return [];
  }
}

/** Neighborhood profile with walkability + comparables. */
export async function fetchKeystoneNeighborhood(
  name: string,
): Promise<KsNeighborhood | null> {
  try {
    const json = await demoGet(
      `/keystone/neighborhoods/${encodeURIComponent(name)}`,
    );
    return (json?.data as KsNeighborhood) ?? null;
  } catch {
    return null;
  }
}

// ── Northbank (banking) ───────────────────────────────────────────────────

export interface NbCustomer {
  customerId: string;
  name: string;
  email: string;
  creditScore: number;
  memberSince: string;
}

export interface NbAccount {
  accountNumber: string;
  customerId: string;
  type: string; // checking | savings | brokerage | credit
  balance: number;
  currency: string;
  dailyTransferLimit?: number;
  status: string; // active | frozen | closed
}

export interface NbTransaction {
  txnId: string;
  accountNumber: string;
  date: string;
  description: string;
  merchant: string;
  category: string; // groceries | dining | transport | utilities | shopping | income
  amount: number; // negative = debit, positive = credit
  disputed?: boolean;
  disputeStatus?: string;
}

export interface NbStatement {
  accountNumber: string;
  month: string;
  transactionCount: number;
  totalIncome: number;
  totalSpending: number;
  net: number;
  byCategory: Record<string, number>;
}

/** A customer + their accounts (joined server-side). */
export async function fetchNorthbankCustomerAccounts(
  customerId: string,
): Promise<{ customer: NbCustomer | null; accounts: NbAccount[] }> {
  try {
    const json = await demoGet(
      `/northbank/customers/${encodeURIComponent(customerId)}/accounts`,
    );
    return {
      customer: (json?.data?.customer as NbCustomer) ?? null,
      accounts: (json?.data?.accounts as NbAccount[]) ?? [],
    };
  } catch {
    return { customer: null, accounts: [] };
  }
}

/** One account by number. */
export async function fetchNorthbankAccount(
  accountNumber: string,
): Promise<NbAccount | null> {
  try {
    const json = await demoGet(
      `/northbank/accounts/${encodeURIComponent(accountNumber)}`,
    );
    return (json?.data as NbAccount) ?? null;
  } catch {
    return null;
  }
}

/** Transactions for an account, optionally filtered by YYYY-MM month + category. */
export async function fetchNorthbankTransactions(
  accountNumber: string,
  opts?: { month?: string; category?: string },
): Promise<NbTransaction[]> {
  const qs = new URLSearchParams();
  if (opts?.month) qs.set("month", opts.month);
  if (opts?.category) qs.set("category", opts.category);
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(
      `/northbank/accounts/${encodeURIComponent(accountNumber)}/transactions${query}`,
    );
    return (json?.data?.transactions as NbTransaction[]) ?? [];
  } catch {
    return [];
  }
}

/** Categorised statement summary for an account (current month if omitted). */
export async function fetchNorthbankStatement(
  accountNumber: string,
  month?: string,
): Promise<NbStatement | null> {
  const qs = new URLSearchParams();
  if (month) qs.set("month", month);
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(
      `/northbank/accounts/${encodeURIComponent(accountNumber)}/statement${query}`,
    );
    return (json?.data as NbStatement) ?? null;
  } catch {
    return null;
  }
}

// ── Lumen (edtech) ────────────────────────────────────────────────────────

export interface LumCourse {
  courseId: string;
  title: string;
  subject: string;
  level: string; // beginner | intermediate | advanced
  description?: string;
  prerequisites?: string[];
  lessonCount: number;
  seats?: number;
  enrolledCount?: number;
}

export interface LumLesson {
  lessonId: string;
  courseId: string;
  order: number;
  title: string;
  durationMin: number;
  quiz?: any;
}

export interface LumProgressItem {
  courseId: string;
  status: string;
  lessonsCompleted: number;
  totalLessons: number;
  progressPct: number;
}

export interface LumProgress {
  studentId: string;
  completedCourses: string[];
  progress: LumProgressItem[];
}

export interface LumRecommendation {
  courseId: string;
  title: string;
  subject: string;
  level: string;
  reason: string;
}

/** All available courses, optionally filtered by subject / level. */
export async function fetchLumenCourses(opts?: {
  subject?: string;
  level?: string;
}): Promise<LumCourse[]> {
  const qs = new URLSearchParams();
  if (opts?.subject) qs.set("subject", opts.subject);
  if (opts?.level) qs.set("level", opts.level);
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/lumen/courses${query}`);
    return (json?.data?.courses as LumCourse[]) ?? [];
  } catch {
    return [];
  }
}

/** One course by id. */
export async function fetchLumenCourse(courseId: string): Promise<LumCourse | null> {
  try {
    const json = await demoGet(`/lumen/courses/${encodeURIComponent(courseId)}`);
    return (json?.data as LumCourse) ?? null;
  } catch {
    return null;
  }
}

/** Lessons of a course, ordered. */
export async function fetchLumenLessons(courseId: string): Promise<LumLesson[]> {
  try {
    const json = await demoGet(
      `/lumen/courses/${encodeURIComponent(courseId)}/lessons`,
    );
    return (json?.data?.lessons as LumLesson[]) ?? [];
  } catch {
    return [];
  }
}

/** Per-student progress across enrolled courses. */
export async function fetchLumenProgress(studentId: string): Promise<LumProgress | null> {
  try {
    const json = await demoGet(
      `/lumen/students/${encodeURIComponent(studentId)}/progress`,
    );
    return (json?.data as LumProgress) ?? null;
  } catch {
    return null;
  }
}

/** Recommendations engine — what should the student take next. */
export async function fetchLumenRecommendations(
  studentId: string,
): Promise<LumRecommendation[]> {
  try {
    const json = await demoGet(
      `/lumen/students/${encodeURIComponent(studentId)}/recommendations`,
    );
    return (json?.data?.recommendations as LumRecommendation[]) ?? [];
  } catch {
    return [];
  }
}

// ── Helix (support helpdesk) ──────────────────────────────────────────────

export interface HxMessage {
  author: string;
  role: string; // customer | agent | system
  body: string;
  at: string;
}

export interface HxTicket {
  number: string;
  customerEmail: string;
  subject: string;
  description: string;
  priority: string; // urgent | high | normal | low
  status: string; // open | pending | resolved | closed
  team?: string;
  channel?: string;
  tags?: string[];
  createdAt: string;
  messages?: HxMessage[];
  assignee?: string;
}

export interface HxSla {
  number: string;
  priority: string;
  slaHours: number;
  ageHours: number;
  firstResponseAt: string | null;
  responded: boolean;
  slaRemainingHours: number;
  breached: boolean;
}

export interface HxKbArticle {
  articleId: string;
  title: string;
  body?: string;
  tags?: string[];
}

/** One ticket by number (includes messages, customer, agent). */
export async function fetchHelixTicket(number: string): Promise<HxTicket | null> {
  try {
    const json = await demoGet(`/helix/tickets/${encodeURIComponent(number)}`);
    return (json?.data as HxTicket) ?? null;
  } catch {
    return null;
  }
}

/** Fan-out fetch for the demo queue (no list-all endpoint). */
export async function fetchHelixTickets(numbers: string[]): Promise<HxTicket[]> {
  const results = await Promise.all(numbers.map((n) => fetchHelixTicket(n)));
  return results.filter((t): t is HxTicket => t !== null);
}

/** SLA status for a ticket — remaining time, breached flag, etc. */
export async function fetchHelixSla(number: string): Promise<HxSla | null> {
  try {
    const json = await demoGet(`/helix/tickets/${encodeURIComponent(number)}/sla`);
    return (json?.data as HxSla) ?? null;
  } catch {
    return null;
  }
}

/** All tickets for a single customer email. */
export async function fetchHelixCustomerTickets(email: string): Promise<{
  customer: { name: string; email: string; company?: string; plan?: string } | null;
  tickets: HxTicket[];
}> {
  try {
    const json = await demoGet(
      `/helix/customers/${encodeURIComponent(email)}/tickets`,
    );
    return {
      customer: (json?.data?.customer as any) ?? null,
      tickets: (json?.data?.tickets as HxTicket[]) ?? [],
    };
  } catch {
    return { customer: null, tickets: [] };
  }
}

/** Similar resolved tickets for a query (the AI uses this for context). */
export async function fetchHelixSimilarTickets(query: string): Promise<HxTicket[]> {
  const qs = new URLSearchParams({ q: query });
  try {
    const json = await demoGet(`/helix/tickets/similar?${qs}`);
    return (json?.data?.tickets as HxTicket[]) ?? [];
  } catch {
    return [];
  }
}

/** KB search. */
export async function fetchHelixKb(query: string): Promise<HxKbArticle[]> {
  if (!query) return [];
  const qs = new URLSearchParams({ q: query });
  try {
    const json = await demoGet(`/helix/kb?${qs}`);
    return (json?.data?.articles as HxKbArticle[]) ?? [];
  } catch {
    return [];
  }
}

// ── Pulse (marketing analytics) ───────────────────────────────────────────

export interface PsAudience {
  name: string;
  impressions: number;
  conversions: number;
  cpa: number;
}

export interface PsCampaign {
  campaignId: string;
  clientId: string;
  name: string;
  channel: string; // Meta | Google | TikTok | LinkedIn
  status: string; // live | paused | ended
  budgetUsd: number;
  spentUsd: number;
  startDate: string;
  cycleDays: number;
  daysElapsed: number;
  audiences?: PsAudience[];
}

export interface PsPacing {
  campaignId: string;
  budgetUsd: number;
  spentUsd: number;
  daysElapsed: number;
  cycleDays: number;
  expectedSpend: number;
  variance: number;
  projectedEndSpend: number;
  status: string; // overpacing | underpacing | on-track
}

export interface PsRoas {
  periodWeeks: number;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number;
}

export interface PsAlert {
  channel: string;
  metric: string;
  changePct: number;
  severity: string; // high | medium | low
  explanation: string;
}

/** All campaigns, optionally filtered by client / status. */
export async function fetchPulseCampaigns(opts?: {
  clientId?: string;
  status?: string;
}): Promise<PsCampaign[]> {
  const qs = new URLSearchParams();
  if (opts?.clientId) qs.set("clientId", opts.clientId);
  if (opts?.status) qs.set("status", opts.status);
  const query = qs.toString() ? `?${qs}` : "";
  try {
    const json = await demoGet(`/pulse/campaigns${query}`);
    return (json?.data?.campaigns as PsCampaign[]) ?? [];
  } catch {
    return [];
  }
}

/** Single campaign by id (includes audiences). */
export async function fetchPulseCampaign(id: string): Promise<PsCampaign | null> {
  try {
    const json = await demoGet(`/pulse/campaigns/${encodeURIComponent(id)}`);
    return (json?.data as PsCampaign) ?? null;
  } catch {
    return null;
  }
}

/** Pacing analysis for one campaign. */
export async function fetchPulsePacing(id: string): Promise<PsPacing | null> {
  try {
    const json = await demoGet(`/pulse/campaigns/${encodeURIComponent(id)}/pacing`);
    return (json?.data as PsPacing) ?? null;
  } catch {
    return null;
  }
}

/** ROAS rollup for a client over the last N weeks (default 4). */
export async function fetchPulseRoas(clientId: string): Promise<PsRoas | null> {
  try {
    const json = await demoGet(`/pulse/clients/${encodeURIComponent(clientId)}/roas`);
    return (json?.data as PsRoas) ?? null;
  } catch {
    return null;
  }
}

/** WoW alerts (spend / conversion anomalies) for a client. */
export async function fetchPulseAlerts(clientId: string): Promise<PsAlert[]> {
  try {
    const json = await demoGet(`/pulse/clients/${encodeURIComponent(clientId)}/alerts`);
    return (json?.data?.alerts as PsAlert[]) ?? [];
  } catch {
    return [];
  }
}
