export type UserRole = "user" | "admin" | "company_admin";
export type PlanId = "free" | "pro" | "business" | "enterprise";
export type AccountStatus = "active" | "suspended" | "pending";

export interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  github?: string;
  whatsapp?: string;
  calendly?: string;
}

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface ProfileTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonStyle: "rounded" | "pill" | "square";
  fontStyle: "modern" | "classic" | "minimal";
  showBranding: boolean;
  /** Visual template: default | glass | premium */
  templateId?: "default" | "glass" | "premium";
  layout?: "classic" | "glass" | "premium";
  /** Profile photo mask on digital card */
  photoShape?: "circle" | "square";
}

export interface DigitalProfile {
  id: string;
  userId: string;
  slug: string;
  /** Card label in the dashboard, e.g. "Work", "Personal" */
  cardName?: string;
  /** Primary card shown by default */
  isPrimary?: boolean;
  fullName: string;
  jobTitle: string;
  companyName: string;
  profilePhoto?: string;
  coverImage?: string;
  bio?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  mapsUrl?: string;
  social: SocialLinks;
  customLinks: CustomLink[];
  theme: ProfileTheme;
  nfcId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  plan: PlanId;
  status: AccountStatus;
  companyId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  stripeCustomerId?: string;
  subscriptionEndsAt?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  adminUserId: string;
  plan: PlanId;
  customDomain?: string;
  employeeIds: string[];
  createdAt: string;
}

export interface Lead {
  id: string;
  profileId: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  source: "form" | "nfc" | "qr" | "link";
  createdAt: string;
  viewed: boolean;
}

export interface AnalyticsEvent {
  id: string;
  profileId: string;
  userId: string;
  type: "view" | "link_click" | "save_contact" | "lead" | "nfc_tap" | "qr_scan";
  linkId?: string;
  linkLabel?: string;
  device: "mobile" | "desktop" | "tablet";
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  referrer?: string;
  createdAt: string;
}

export interface NfcCard {
  id: string;
  nfcUid: string;
  profileId?: string;
  userId?: string;
  status: "unassigned" | "assigned" | "disabled";
  design: string;
  orderedAt?: string;
  assignedAt?: string;
  orderId?: string;
}

export interface CardOrder {
  id: string;
  userId: string;
  companyId?: string;
  quantity: number;
  design: string;
  logoUrl?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: string;
  totalAmount: number;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price: number;
  priceYearly: number;
  description: string;
  features: string[];
  limits: {
    maxCards: number;
    maxLinks: number;
    analytics: boolean;
    leadCapture: boolean;
    removeBranding: boolean;
    customTheme: boolean;
    teamMembers: number;
    bulkNfc: boolean;
    crmExport: boolean;
    customDomain: boolean;
    photoUpload: boolean;
    businessCardDesigner: boolean;
  };
  popular?: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: PlanId;
  avatar?: string;
}
