import { SubscriptionPlan } from "@/types";

export const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceYearly: 0,
    description: "Get started with a basic digital profile",
    features: [
      "1 digital profile",
      "Up to 5 custom links",
      "Basic QR code",
      "vCard download",
      "Photo & cover upload",
      "MigSmartCard branding",
    ],
    limits: {
      maxCards: 1,
      maxLinks: 5,
      analytics: false,
      leadCapture: false,
      removeBranding: false,
      customTheme: false,
      teamMembers: 0,
      bulkNfc: false,
      crmExport: false,
      customDomain: false,
      photoUpload: true,
      businessCardDesigner: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 12,
    priceYearly: 120,
    description: "For professionals who want more",
    features: [
      "Up to 5 digital profiles",
      "Unlimited custom links",
      "Printable business card designer",
      "Portrait & landscape layouts",
      "Full analytics dashboard",
      "Lead capture forms",
      "Custom branding & themes",
      "Remove MigSmartCard branding",
      "Email signature generator",
      "Photo & cover upload",
    ],
    limits: {
      maxCards: 5,
      maxLinks: 100,
      analytics: true,
      leadCapture: true,
      removeBranding: true,
      customTheme: true,
      teamMembers: 0,
      bulkNfc: false,
      crmExport: false,
      customDomain: false,
      photoUpload: true,
      businessCardDesigner: true,
    },
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 39,
    priceYearly: 390,
    description: "For teams and growing companies",
    features: [
      "Up to 25 digital profiles",
      "Everything in Pro",
      "Business card designer",
      "Up to 25 team members",
      "Centralized brand control",
      "Bulk NFC card assignment",
      "CRM export (CSV)",
      "Custom domain",
      "Team admin dashboard",
    ],
    limits: {
      maxCards: 25,
      maxLinks: 100,
      analytics: true,
      leadCapture: true,
      removeBranding: true,
      customTheme: true,
      teamMembers: 25,
      bulkNfc: true,
      crmExport: true,
      customDomain: true,
      photoUpload: true,
      businessCardDesigner: true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    priceYearly: 990,
    description: "For large organizations",
    features: [
      "Unlimited digital profiles",
      "Everything in Business",
      "Business card designer",
      "Unlimited team members",
      "White-label option",
      "SSO & advanced security",
      "Dedicated account manager",
      "API & webhooks access",
      "Custom integrations",
    ],
    limits: {
      maxCards: 999,
      maxLinks: 999,
      analytics: true,
      leadCapture: true,
      removeBranding: true,
      customTheme: true,
      teamMembers: 9999,
      bulkNfc: true,
      crmExport: true,
      customDomain: true,
      photoUpload: true,
      businessCardDesigner: true,
    },
  },
];

export function getPlan(id: string): SubscriptionPlan {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

export function canUseFeature(
  planId: string,
  feature: keyof SubscriptionPlan["limits"]
): boolean {
  const plan = getPlan(planId);
  const value = plan.limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

export function getMaxCards(planId: string): number {
  return getPlan(planId).limits.maxCards;
}
