import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  User,
  DigitalProfile,
  Lead,
  AnalyticsEvent,
  NfcCard,
  CardOrder,
  Company,
  ProfileTheme,
} from "@/types";
import {
  loadStoreFromRedis,
  saveStoreToRedis,
  isRedisEnabled,
  redisSaveProfile,
  redisGetProfileBySlug,
  redisGetProfileByUserId,
} from "./store-ready";

/**
 * Storage strategy:
 * - Local/dev: JSON files in ./data (persistent)
 * - Vercel without Redis: in-memory (demo seeds only; Live Preview in editor)
 * - Vercel with Upstash Redis env vars: persistent across instances
 *
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for real card URLs on Vercel.
 */

const IS_SERVERLESS =
  process.env.VERCEL === "1" ||
  process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
  process.env.USE_MEMORY_DB === "1";

const DATA_DIR = path.join(process.cwd(), "data");

type Store = {
  users: User[];
  profiles: DigitalProfile[];
  companies: Company[];
  leads: Lead[];
  analytics: AnalyticsEvent[];
  nfcCards: NfcCard[];
  orders: CardOrder[];
  seeded: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __migsmartcard_store: Store | undefined;
  // eslint-disable-next-line no-var
  var __migsmartcard_hydrated: boolean | undefined;
  // eslint-disable-next-line no-var
  var __migsmartcard_hydrate_promise: Promise<void> | undefined;
}

function getMemoryStore(): Store {
  if (!global.__migsmartcard_store) {
    global.__migsmartcard_store = {
      users: [],
      profiles: [],
      companies: [],
      leads: [],
      analytics: [],
      nfcCards: [],
      orders: [],
      seeded: false,
    };
  }
  return global.__migsmartcard_store;
}

const FILE_MAP: Record<keyof Omit<Store, "seeded">, string> = {
  users: "users.json",
  profiles: "profiles.json",
  companies: "companies.json",
  leads: "leads.json",
  analytics: "analytics.json",
  nfcCards: "nfc-cards.json",
  orders: "orders.json",
};

function ensureDataDir() {
  if (IS_SERVERLESS) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filename, fallback);
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  if (IS_SERVERLESS) return;
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readCollection<K extends keyof Omit<Store, "seeded">>(
  key: K
): Store[K] {
  ensureSeeded();
  if (IS_SERVERLESS) {
    return getMemoryStore()[key];
  }
  return readJsonFile(FILE_MAP[key], [] as Store[K]);
}

function writeCollection<K extends keyof Omit<Store, "seeded">>(
  key: K,
  data: Store[K]
): void {
  if (IS_SERVERLESS) {
    const store = getMemoryStore();
    store[key] = data;
    return;
  }
  writeJsonFile(FILE_MAP[key], data);
}

/** Persist full memory store to Redis (await this after writes). */
export async function persistDb(): Promise<void> {
  if (!IS_SERVERLESS || !isRedisEnabled()) return;
  const store = getMemoryStore();
  await saveStoreToRedis(store as unknown as Record<string, unknown>);
}

/**
 * Call from server routes/pages before reading data on Vercel.
 * When Redis is configured, always reloads from Redis so every
 * serverless instance sees the latest cards.
 */
export async function ensureDbReady(): Promise<void> {
  if (typeof window !== "undefined") return;

  if (!IS_SERVERLESS) {
    ensureSeeded();
    return;
  }

  if (isRedisEnabled()) {
    try {
      const remote = await loadStoreFromRedis();
      const store = getMemoryStore();
      if (remote && Array.isArray(remote.users) && remote.users.length > 0) {
        store.users = remote.users as Store["users"];
        store.profiles = (remote.profiles as Store["profiles"]) || [];
        store.companies = (remote.companies as Store["companies"]) || [];
        store.leads = (remote.leads as Store["leads"]) || [];
        store.analytics = (remote.analytics as Store["analytics"]) || [];
        store.nfcCards = (remote.nfcCards as Store["nfcCards"]) || [];
        store.orders = (remote.orders as Store["orders"]) || [];
        store.seeded = true;
      } else {
        ensureSeeded();
        await saveStoreToRedis(store as unknown as Record<string, unknown>);
      }
      global.__migsmartcard_hydrated = true;
    } catch (e) {
      console.error("ensureDbReady redis error", e);
      ensureSeeded();
    }
    return;
  }

  // No Redis: memory-only demo seeds (public custom cards will 404 across instances)
  ensureSeeded();
}

/** Resolve a public profile by slug (memory first, then Redis key). */
export async function findProfileBySlug(
  slug: string
): Promise<DigitalProfile | undefined> {
  await ensureDbReady();
  const key = (slug || "").toLowerCase().trim();
  if (!key) return undefined;
  const local =
    db.profiles.getBySlug(key) ||
    db.profiles.getAll().find((p) => p.slug?.toLowerCase() === key);
  if (local) return local;
  const remote = await redisGetProfileBySlug(key);
  if (remote && typeof remote.slug === "string") {
    const prof = remote as unknown as DigitalProfile;
    const all = db.profiles.getAll();
    const idx = all.findIndex((p) => p.id === prof.id || p.slug === prof.slug);
    if (idx >= 0) all[idx] = prof;
    else all.push(prof);
    writeCollection("profiles", all);
    return prof;
  }
  return undefined;
}

export async function findProfileByUserId(
  userId: string
): Promise<DigitalProfile | undefined> {
  await ensureDbReady();
  const local = db.profiles.getByUserId(userId);
  if (local) return local;
  const remote = await redisGetProfileByUserId(userId);
  if (remote && typeof remote.userId === "string") {
    const prof = remote as unknown as DigitalProfile;
    const all = db.profiles.getAll();
    const idx = all.findIndex(
      (p) => p.id === prof.id || p.userId === prof.userId
    );
    if (idx >= 0) all[idx] = prof;
    else all.push(prof);
    writeCollection("profiles", all);
    return prof;
  }
  return undefined;
}


export async function listProfilesByUserId(
  userId: string
): Promise<DigitalProfile[]> {
  await ensureDbReady();
  return db.profiles.getAllByUserId(userId);
}

export async function saveProfilePersistent(
  profile: DigitalProfile
): Promise<DigitalProfile> {
  await ensureDbReady();
  const all = db.profiles.getAll();
  const idx = all.findIndex((p) => p.id === profile.id);
  const next: DigitalProfile = {
    ...profile,
    slug: (profile.slug || "card").toLowerCase().trim(),
    isPublic: profile.isPublic !== false,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  writeCollection("profiles", all);

  // Always write dedicated slug key first (public card lookup)
  const ok = await redisSaveProfile(next);
  await persistDb();

  if (isRedisEnabled() && !ok) {
    console.error("Redis profile write failed for slug", next.slug);
  }
  return next;
}

/** Re-push all profiles for a user into Redis (heal missing /p/slug). */
export async function republishUserProfiles(
  userId: string
): Promise<{ slugs: string[]; redisOk: boolean[] }> {
  await ensureDbReady();
  const list = db.profiles.getAllByUserId(userId);
  const redisOk: boolean[] = [];
  const slugs: string[] = [];
  for (const p of list) {
    const saved = await saveProfilePersistent({
      ...p,
      isPublic: p.isPublic !== false,
    });
    slugs.push(saved.slug);
    if (isRedisEnabled()) {
      const { redisVerifySlug } = await import("./store-ready");
      redisOk.push(await redisVerifySlug(saved.slug));
    } else {
      redisOk.push(false);
    }
  }
  return { slugs, redisOk };
}

export { isRedisEnabled };

export const DEFAULT_THEME: ProfileTheme = {
  primaryColor: "#1a5ff5",
  secondaryColor: "#22c55e",
  backgroundColor: "#ffffff",
  textColor: "#0f172a",
  buttonStyle: "rounded",
  fontStyle: "modern",
  showBranding: true,
  templateId: "default",
  layout: "classic",
};

function buildSeedData(): Omit<Store, "seeded"> {
  const now = new Date().toISOString();
  const password = bcrypt.hashSync("password123", 10);

  const admin: User = {
    id: "user-admin-001",
    email: "admin@migsmartcard.com",
    password,
    name: "Platform Admin",
    role: "admin",
    plan: "enterprise",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const demoUser: User = {
    id: "user-demo-001",
    email: "demo@migsmartcard.com",
    password,
    name: "Alex Rivera",
    role: "user",
    plan: "pro",
    status: "active",
    avatar: "",
    createdAt: now,
    updatedAt: now,
  };

  const companyAdmin: User = {
    id: "user-company-001",
    email: "ceo@acme.com",
    password,
    name: "Jordan Lee",
    role: "company_admin",
    plan: "business",
    status: "active",
    companyId: "company-acme-001",
    createdAt: now,
    updatedAt: now,
  };

  const employee: User = {
    id: "user-emp-001",
    email: "sam@acme.com",
    password,
    name: "Sam Chen",
    role: "user",
    plan: "business",
    status: "active",
    companyId: "company-acme-001",
    createdAt: now,
    updatedAt: now,
  };

  const company: Company = {
    id: "company-acme-001",
    name: "Acme Innovations",
    slug: "acme",
    primaryColor: "#1a5ff5",
    adminUserId: companyAdmin.id,
    plan: "business",
    employeeIds: [companyAdmin.id, employee.id],
    createdAt: now,
  };

  const demoProfile: DigitalProfile = {
    id: "profile-demo-001",
    userId: demoUser.id,
    slug: "alex-rivera",
    cardName: "Work",
    isPrimary: true,
    fullName: "Alex Rivera",
    jobTitle: "Head of Product",
    companyName: "NovaTech Solutions",
    profilePhoto: "",
    coverImage: "",
    bio: "Product leader passionate about building digital experiences that connect people. 10+ years in SaaS and fintech. Let's connect!",
    phone: "+971 50 123 4567",
    email: "alex@novatech.io",
    website: "https://novatech.io",
    address: "Dubai Internet City, Dubai, UAE",
    city: "Dubai",
    country: "United Arab Emirates",
    mapsUrl: "https://maps.google.com/?q=Dubai+Internet+City",
    social: {
      linkedin: "https://linkedin.com/in/alexrivera",
      instagram: "https://instagram.com/alexrivera",
      twitter: "https://twitter.com/alexrivera",
      whatsapp: "+971501234567",
      calendly: "https://calendly.com/alexrivera",
      youtube: "https://youtube.com/@alexrivera",
    },
    customLinks: [
      {
        id: "link-1",
        title: "My Portfolio",
        url: "https://alexrivera.dev",
        icon: "globe",
      },
      {
        id: "link-2",
        title: "Book a Meeting",
        url: "https://calendly.com/alexrivera",
        icon: "calendar",
      },
      {
        id: "link-3",
        title: "Company Deck",
        url: "https://novatech.io/deck",
        icon: "file",
      },
    ],
    theme: { ...DEFAULT_THEME, showBranding: false },
    nfcId: "NFC-MIG-001A2B3C",
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  };

  const acmeProfile: DigitalProfile = {
    id: "profile-acme-001",
    userId: companyAdmin.id,
    slug: "jordan-lee",
    cardName: "CEO Card",
    isPrimary: true,
    fullName: "Jordan Lee",
    jobTitle: "CEO & Founder",
    companyName: "Acme Innovations",
    bio: "Building the future of workplace connectivity. Founder of Acme Innovations.",
    phone: "+1 415 555 0100",
    email: "jordan@acme.com",
    website: "https://acme.com",
    social: {
      linkedin: "https://linkedin.com/in/jordanlee",
      twitter: "https://twitter.com/jordanlee",
    },
    customLinks: [],
    theme: { ...DEFAULT_THEME, primaryColor: "#7c3aed" },
    nfcId: "NFC-MIG-002D4E5F",
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  };

  const empProfile: DigitalProfile = {
    id: "profile-emp-001",
    userId: employee.id,
    slug: "sam-chen",
    cardName: "Sales",
    isPrimary: true,
    fullName: "Sam Chen",
    jobTitle: "Sales Director",
    companyName: "Acme Innovations",
    bio: "Helping enterprises transform how they network. Reach out anytime!",
    phone: "+1 415 555 0101",
    email: "sam@acme.com",
    social: {
      linkedin: "https://linkedin.com/in/samchen",
      whatsapp: "+14155550101",
    },
    customLinks: [
      {
        id: "link-s1",
        title: "Product Demo",
        url: "https://acme.com/demo",
        icon: "play",
      },
    ],
    theme: { ...DEFAULT_THEME, primaryColor: "#7c3aed" },
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  };

  const leads: Lead[] = [
    {
      id: "lead-001",
      profileId: demoProfile.id,
      userId: demoUser.id,
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+34 600 111 222",
      company: "Iberia Tech",
      message: "Great meeting you at GITEX!",
      source: "form",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      viewed: true,
    },
    {
      id: "lead-002",
      profileId: demoProfile.id,
      userId: demoUser.id,
      name: "James Okonkwo",
      email: "james@startup.co",
      phone: "+44 7700 900123",
      source: "nfc",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      viewed: false,
    },
    {
      id: "lead-003",
      profileId: demoProfile.id,
      userId: demoUser.id,
      name: "Priya Sharma",
      email: "priya@corp.in",
      company: "Corp India",
      message: "Interested in partnership",
      source: "qr",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      viewed: false,
    },
  ];

  const events: AnalyticsEvent[] = [];
  const devices: Array<"mobile" | "desktop" | "tablet"> = [
    "mobile",
    "desktop",
    "tablet",
  ];
  const countries = [
    { country: "United Arab Emirates", city: "Dubai" },
    { country: "United States", city: "San Francisco" },
    { country: "United Kingdom", city: "London" },
    { country: "India", city: "Mumbai" },
    { country: "Germany", city: "Berlin" },
    { country: "Singapore", city: "Singapore" },
  ];
  const types: AnalyticsEvent["type"][] = [
    "view",
    "view",
    "view",
    "link_click",
    "save_contact",
    "nfc_tap",
    "qr_scan",
    "lead",
  ];

  for (let i = 0; i < 120; i++) {
    const loc = countries[i % countries.length];
    const daysAgo = Math.floor(Math.random() * 30);
    events.push({
      id: `evt-${i + 1}`,
      profileId: demoProfile.id,
      userId: demoUser.id,
      type: types[i % types.length],
      linkLabel: i % 5 === 0 ? "My Portfolio" : undefined,
      device: devices[i % 3],
      browser: i % 2 === 0 ? "Chrome" : "Safari",
      os: i % 3 === 0 ? "iOS" : i % 3 === 1 ? "Android" : "Windows",
      country: loc.country,
      city: loc.city,
      createdAt: new Date(
        Date.now() - daysAgo * 86400000 - Math.random() * 86400000
      ).toISOString(),
    });
  }

  const nfcCards: NfcCard[] = [
    {
      id: "nfc-1",
      nfcUid: "NFC-MIG-001A2B3C",
      profileId: demoProfile.id,
      userId: demoUser.id,
      status: "assigned",
      design: "classic-black",
      assignedAt: now,
    },
    {
      id: "nfc-2",
      nfcUid: "NFC-MIG-002D4E5F",
      profileId: acmeProfile.id,
      userId: companyAdmin.id,
      status: "assigned",
      design: "premium-metal",
      assignedAt: now,
    },
    {
      id: "nfc-3",
      nfcUid: "NFC-MIG-003G6H7I",
      status: "unassigned",
      design: "classic-black",
    },
    {
      id: "nfc-4",
      nfcUid: "NFC-MIG-004J8K9L",
      status: "unassigned",
      design: "wood-grain",
    },
    {
      id: "nfc-5",
      nfcUid: "NFC-MIG-005M0N1O",
      status: "unassigned",
      design: "classic-white",
    },
  ];

  const orders: CardOrder[] = [
    {
      id: "order-001",
      userId: demoUser.id,
      quantity: 1,
      design: "classic-black",
      status: "delivered",
      shippingAddress: "Dubai Marina, Dubai, UAE",
      totalAmount: 29,
      trackingNumber: "MIG-TRK-88421",
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  return {
    users: [admin, demoUser, companyAdmin, employee],
    profiles: [demoProfile, acmeProfile, empProfile],
    companies: [company],
    leads,
    analytics: events,
    nfcCards,
    orders,
  };
}

function ensureSeeded() {
  if (typeof window !== "undefined") return;

  if (IS_SERVERLESS) {
    const store = getMemoryStore();
    if (store.seeded && store.users.length > 0) return;
    const seed = buildSeedData();
    Object.assign(store, seed, { seeded: true });
    return;
  }

  ensureDataDir();
  const usersFile = path.join(DATA_DIR, "users.json");
  if (fs.existsSync(usersFile)) return;

  const seed = buildSeedData();
  writeJsonFile("users.json", seed.users);
  writeJsonFile("profiles.json", seed.profiles);
  writeJsonFile("companies.json", seed.companies);
  writeJsonFile("leads.json", seed.leads);
  writeJsonFile("analytics.json", seed.analytics);
  writeJsonFile("nfc-cards.json", seed.nfcCards);
  writeJsonFile("orders.json", seed.orders);
}

// Seed on module load (server-side only)
if (typeof window === "undefined") {
  try {
    ensureSeeded();
  } catch (e) {
    console.error("DB seed error:", e);
  }
}

// ─── Users ───────────────────────────────────────────────
export const db = {
  users: {
    getAll: (): User[] => readCollection("users"),
    getById: (id: string): User | undefined =>
      db.users.getAll().find((u) => u.id === id),
    getByEmail: (email: string): User | undefined =>
      db.users
        .getAll()
        .find((u) => u.email.toLowerCase() === email.toLowerCase()),
    create: (user: User): User => {
      const users = db.users.getAll();
      users.push(user);
      writeCollection("users", users);
      return user;
    },
    update: (id: string, data: Partial<User>): User | null => {
      const users = db.users.getAll();
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      users[idx] = {
        ...users[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeCollection("users", users);
      return users[idx];
    },
    delete: (id: string): boolean => {
      writeCollection(
        "users",
        db.users.getAll().filter((u) => u.id !== id)
      );
      return true;
    },
  },

  profiles: {
    getAll: (): DigitalProfile[] => readCollection("profiles"),
    getById: (id: string): DigitalProfile | undefined =>
      db.profiles.getAll().find((p) => p.id === id),
    getByUserId: (userId: string): DigitalProfile | undefined => {
      const list = db.profiles.getAllByUserId(userId);
      return list.find((p) => p.isPrimary) || list[0];
    },
    getAllByUserId: (userId: string): DigitalProfile[] =>
      db.profiles
        .getAll()
        .filter((p) => p.userId === userId)
        .sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }),
    getBySlug: (slug: string): DigitalProfile | undefined =>
      db.profiles.getAll().find((p) => p.slug === slug),
    getByNfcId: (nfcId: string): DigitalProfile | undefined =>
      db.profiles.getAll().find((p) => p.nfcId === nfcId),
    create: (profile: DigitalProfile): DigitalProfile => {
      const profiles = db.profiles.getAll();
      profiles.push(profile);
      writeCollection("profiles", profiles);
      return profile;
    },
    update: (
      id: string,
      data: Partial<DigitalProfile>
    ): DigitalProfile | null => {
      const profiles = db.profiles.getAll();
      const idx = profiles.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      profiles[idx] = {
        ...profiles[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeCollection("profiles", profiles);
      return profiles[idx];
    },
    delete: (id: string): boolean => {
      writeCollection(
        "profiles",
        db.profiles.getAll().filter((p) => p.id !== id)
      );
      return true;
    },
  },

  leads: {
    getAll: (): Lead[] => readCollection("leads"),
    getByUserId: (userId: string): Lead[] =>
      db.leads
        .getAll()
        .filter((l) => l.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    create: (lead: Lead): Lead => {
      const leads = db.leads.getAll();
      leads.push(lead);
      writeCollection("leads", leads);
      return lead;
    },
    markViewed: (id: string): void => {
      const leads = db.leads.getAll();
      const idx = leads.findIndex((l) => l.id === id);
      if (idx !== -1) {
        leads[idx].viewed = true;
        writeCollection("leads", leads);
      }
    },
    delete: (id: string): boolean => {
      writeCollection(
        "leads",
        db.leads.getAll().filter((l) => l.id !== id)
      );
      return true;
    },
  },

  analytics: {
    getAll: (): AnalyticsEvent[] => readCollection("analytics"),
    getByUserId: (userId: string): AnalyticsEvent[] =>
      db.analytics.getAll().filter((e) => e.userId === userId),
    getByProfileId: (profileId: string): AnalyticsEvent[] =>
      db.analytics.getAll().filter((e) => e.profileId === profileId),
    create: (event: AnalyticsEvent): AnalyticsEvent => {
      const events = db.analytics.getAll();
      events.push(event);
      writeCollection("analytics", events);
      return event;
    },
  },

  nfc: {
    getAll: (): NfcCard[] => readCollection("nfcCards"),
    getByUid: (uid: string): NfcCard | undefined =>
      db.nfc.getAll().find((c) => c.nfcUid === uid),
    assign: (
      uid: string,
      userId: string,
      profileId: string
    ): NfcCard | null => {
      const cards = db.nfc.getAll();
      const idx = cards.findIndex((c) => c.nfcUid === uid);
      if (idx === -1) return null;
      cards[idx] = {
        ...cards[idx],
        userId,
        profileId,
        status: "assigned",
        assignedAt: new Date().toISOString(),
      };
      writeCollection("nfcCards", cards);
      db.profiles.update(profileId, { nfcId: uid });
      return cards[idx];
    },
    create: (card: NfcCard): NfcCard => {
      const cards = db.nfc.getAll();
      cards.push(card);
      writeCollection("nfcCards", cards);
      return card;
    },
  },

  orders: {
    getAll: (): CardOrder[] => readCollection("orders"),
    getByUserId: (userId: string): CardOrder[] =>
      db.orders.getAll().filter((o) => o.userId === userId),
    create: (order: CardOrder): CardOrder => {
      const orders = db.orders.getAll();
      orders.push(order);
      writeCollection("orders", orders);
      return order;
    },
    update: (id: string, data: Partial<CardOrder>): CardOrder | null => {
      const orders = db.orders.getAll();
      const idx = orders.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      orders[idx] = {
        ...orders[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeCollection("orders", orders);
      return orders[idx];
    },
  },

  companies: {
    getAll: (): Company[] => readCollection("companies"),
    getById: (id: string): Company | undefined =>
      db.companies.getAll().find((c) => c.id === id),
    getBySlug: (slug: string): Company | undefined =>
      db.companies.getAll().find((c) => c.slug === slug),
    create: (company: Company): Company => {
      const companies = db.companies.getAll();
      companies.push(company);
      writeCollection("companies", companies);
      return company;
    },
    update: (id: string, data: Partial<Company>): Company | null => {
      const companies = db.companies.getAll();
      const idx = companies.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      companies[idx] = { ...companies[idx], ...data };
      writeCollection("companies", companies);
      return companies[idx];
    },
  },
};
