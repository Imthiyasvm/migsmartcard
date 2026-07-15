/**
 * Physical MigSmartCard NFC card catalogue — the single source of truth
 * for designs and prices, shared by the shop UI and the orders API.
 *
 * Prices are stored in USD and converted to AED at checkout
 * (see src/lib/billing.ts).
 */

export interface CardDesign {
  id: string;
  name: string;
  /** Unit price in USD */
  priceUsd: number;
  description: string;
  image: string;
}

export const CARD_DESIGNS: CardDesign[] = [
  {
    id: "premium-metal",
    name: "Premium Metal Card",
    priceUsd: 59,
    description:
      "Premium metal NFC card with engraved MigSmartCard branding",
    image: "/shop/premium-metal.webp",
  },
  {
    id: "wood-grain",
    name: "Premium Wood Grain NFC Card",
    priceUsd: 45,
    description:
      "Premium wood grain NFC card with engraved MigSmartCard branding",
    image: "/shop/wood-grain.webp",
  },
  {
    id: "custom-print",
    name: "Premium Custom Printed NFC Card",
    priceUsd: 49,
    description:
      "Premium custom printed NFC card with engraved MigSmartCard branding",
    image: "/shop/custom-print.webp",
  },
];

export function getCardDesign(id: string): CardDesign | undefined {
  return CARD_DESIGNS.find((d) => d.id === id);
}

/** Unit price in USD; legacy/custom designs fall back to the base price. */
export function cardUnitPriceUsd(designId: string): number {
  return getCardDesign(designId)?.priceUsd ?? 29;
}
