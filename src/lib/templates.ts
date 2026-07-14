import { ProfileTheme } from "@/types";
import { PlanId } from "@/types";

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

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "default",
    name: "Classic",
    description: "Clean professional card — free for everyone",
    minPlan: "free",
    avatar: "/templates/avatar-default.jpg",
    cover: "/templates/cover-default.jpg",
    layout: "classic",
    theme: {
      primaryColor: "#1a5ff5",
      secondaryColor: "#22c55e",
      backgroundColor: "#f8fafc",
      textColor: "#0f172a",
      buttonStyle: "rounded",
      fontStyle: "modern",
      showBranding: true,
    },
  },
  {
    id: "glass",
    name: "Glassmorphism",
    description: "Frosted glass, blur & glow — Pro+",
    minPlan: "pro",
    avatar: "/templates/avatar-glass.jpg",
    cover: "/templates/cover-glass.jpg",
    layout: "glass",
    theme: {
      primaryColor: "#a78bfa",
      secondaryColor: "#38bdf8",
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      buttonStyle: "pill",
      fontStyle: "modern",
      showBranding: false,
    },
  },
  {
    id: "premium",
    name: "Premium Dark",
    description: "Luxury dark + gold accents — Pro+",
    minPlan: "pro",
    avatar: "/templates/avatar-premium.jpg",
    cover: "/templates/cover-premium.jpg",
    layout: "premium",
    theme: {
      primaryColor: "#fbbf24",
      secondaryColor: "#f59e0b",
      backgroundColor: "#0a0a0a",
      textColor: "#fafaf9",
      buttonStyle: "rounded",
      fontStyle: "classic",
      showBranding: false,
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
