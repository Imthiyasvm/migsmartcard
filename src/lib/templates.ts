import { ProfileTheme, PlanId } from "@/types";

export type CardTemplateId = "default" | "glass" | "premium";

export interface CardTemplate {
  id: CardTemplateId;
  name: string;
  description: string;
  minPlan: PlanId;
  avatar: string;
  cover: string;
  theme: ProfileTheme;
  layout: "classic" | "glass" | "premium";
}

/** Profile templates — Classic (free), Glass & Premium (Pro+) */

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "default",
    name: "Classic",
    description: "Minimal light card — free for everyone",
    minPlan: "free",
    avatar: "/templates/avatar-classic.jpg",
    cover: "/templates/cover-classic.jpg",
    layout: "classic",
    theme: {
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
    },
  },
  {
    id: "glass",
    name: "Glass",
    description: "Frosted glassmorphism — Pro+",
    minPlan: "pro",
    avatar: "/templates/avatar-glass.jpg",
    cover: "/templates/cover-glass.jpg",
    layout: "glass",
    theme: {
      primaryColor: "#a78bfa",
      secondaryColor: "#7dd3fc",
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      buttonStyle: "pill",
      fontStyle: "modern",
      showBranding: false,
      templateId: "glass",
      layout: "glass",
      photoShape: "circle",
    },
  },
  {
    id: "premium",
    name: "Premium",
    description: "Champagne luxury dark — Pro+",
    minPlan: "pro",
    avatar: "/templates/avatar-premium.jpg",
    cover: "/templates/cover-premium.jpg",
    layout: "premium",
    theme: {
      primaryColor: "#d4a574",
      secondaryColor: "#f5e6d3",
      backgroundColor: "#0a0a0a",
      textColor: "#fafaf9",
      buttonStyle: "rounded",
      fontStyle: "classic",
      showBranding: false,
      templateId: "premium",
      layout: "premium",
      photoShape: "circle",
    },
  },
];

const PLAN_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

export function canUseTemplate(planId: string, templateId: CardTemplateId) {
  const t = CARD_TEMPLATES.find((x) => x.id === templateId);
  if (!t) return false;
  return (PLAN_RANK[planId] ?? 0) >= (PLAN_RANK[t.minPlan] ?? 0);
}

export function getTemplate(id?: string): CardTemplate {
  return CARD_TEMPLATES.find((t) => t.id === id) || CARD_TEMPLATES[0];
}
