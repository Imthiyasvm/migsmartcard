import { DigitalProfile, ProfileTheme } from "@/types";

/**
 * Always-on polished demo cards for marketing + public /p/[slug].
 * Independent of Redis seed drift so demos stay premium and consistent.
 */

const baseTheme: ProfileTheme = {
  primaryColor: "#1a5ff5",
  secondaryColor: "#94a3b8",
  backgroundColor: "#f8fafc",
  textColor: "#0f172a",
  buttonStyle: "rounded",
  fontStyle: "minimal",
  showBranding: true,
  templateId: "default",
  layout: "classic",
  photoShape: "circle",
};

const now = "2026-01-01T00:00:00.000Z";

export const DEMO_PROFILES: Record<string, DigitalProfile> = {
  "alex-rivera": {
    id: "profile-demo-001",
    userId: "user-demo-001",
    slug: "alex-rivera",
    cardName: "Classic",
    isPrimary: true,
    fullName: "Alex Rivera",
    jobTitle: "Head of Product",
    companyName: "Mignet Technologies",
    profilePhoto: "/templates/avatar-classic.jpg",
    coverImage: "/templates/cover-classic.jpg",
    bio: "Building calm, precise digital products. Open to meaningful conversations.",
    phone: "+971 50 123 4567",
    email: "alex@mignet.io",
    website: "https://mignet.io",
    address: "Dubai, UAE",
    city: "Dubai",
    country: "United Arab Emirates",
    social: {
      linkedin: "https://linkedin.com/in/alexrivera",
      calendly: "https://calendly.com/alexrivera",
    },
    customLinks: [
      {
        id: "d1",
        title: "Website",
        url: "https://mignet.io",
        icon: "globe",
      },
    ],
    theme: { ...baseTheme },
    nfcId: "NFC-MIG-001A2B3C",
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  },
  "jordan-lee": {
    id: "profile-acme-001",
    userId: "user-company-001",
    slug: "jordan-lee",
    cardName: "Glass",
    isPrimary: true,
    fullName: "Jordan Lee",
    jobTitle: "Founder",
    companyName: "Acme",
    profilePhoto: "/templates/avatar-glass.jpg",
    coverImage: "/templates/cover-glass.jpg",
    bio: "Quiet ambition. Clear products. Founder of Acme.",
    phone: "+1 415 555 0100",
    email: "jordan@acme.com",
    website: "https://acme.com",
    social: {
      linkedin: "https://linkedin.com/in/jordanlee",
      twitter: "https://twitter.com/jordanlee",
    },
    customLinks: [],
    theme: {
      ...baseTheme,
      primaryColor: "#a78bfa",
      secondaryColor: "#7dd3fc",
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      buttonStyle: "pill",
      showBranding: false,
      templateId: "glass",
      layout: "glass",
      photoShape: "circle",
    },
    nfcId: "NFC-MIG-002D4E5F",
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  },
  "sam-chen": {
    id: "profile-emp-001",
    userId: "user-emp-001",
    slug: "sam-chen",
    cardName: "Premium",
    isPrimary: true,
    fullName: "Sam Chen",
    jobTitle: "Sales Director",
    companyName: "Acme",
    profilePhoto: "/templates/avatar-premium.jpg",
    coverImage: "/templates/cover-premium.jpg",
    bio: "Connecting people and product with intention.",
    phone: "+1 415 555 0101",
    email: "sam@acme.com",
    website: "https://acme.com",
    social: {
      linkedin: "https://linkedin.com/in/samchen",
    },
    customLinks: [
      {
        id: "s1",
        title: "Book a call",
        url: "https://calendly.com/samchen",
        icon: "calendar",
      },
    ],
    theme: {
      ...baseTheme,
      primaryColor: "#d4a574",
      secondaryColor: "#f5e6d3",
      backgroundColor: "#0a0a0a",
      textColor: "#fafaf9",
      showBranding: false,
      templateId: "premium",
      layout: "premium",
      photoShape: "circle",
    },
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  },
};

export function getDemoProfile(slug: string): DigitalProfile | undefined {
  return DEMO_PROFILES[slug.toLowerCase().trim()];
}
