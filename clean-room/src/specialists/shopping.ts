export type ShoppingTruth = "verified" | "estimated" | "stale" | "unavailable";
export type SavingsTiming = "immediate" | "delayed_rebate" | "cashback";
export type TripPriority = "preserve_cash_today" | "lowest_final_cost" | "closest_practical";

export interface ShoppingOfferEvidence {
  readonly id: string;
  readonly ownerId: string;
  readonly providerKey: string;
  readonly merchantRef: string;
  readonly itemRef: string;
  readonly amount: number;
  readonly timing: SavingsTiming;
  readonly truth: ShoppingTruth;
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
  readonly expiresAt?: string;
}

export interface ShoppingTripOption {
  readonly merchantRef: string;
  readonly baseCost: number;
  readonly travelCost: number;
  readonly offers: readonly ShoppingOfferEvidence[];
}

export interface ShoppingTripAssessment {
  readonly merchantRef: string;
  readonly outOfPocketToday: number;
  readonly delayedSavings: number;
  readonly effectiveFinalCost: number;
  readonly priority: TripPriority;
  readonly evidenceRefs: readonly string[];
}

export interface ShoppingSpecialistProfile {
  readonly key: "shopping";
  readonly truthOwner: "specialist:shopping";
  readonly privacyClass: "personal_family";
  readonly providerCapabilities: readonly string[];
  readonly sourceRefs: readonly string[];
}

export const SHOPPING_SPECIALIST_PROFILE: ShoppingSpecialistProfile = Object.freeze({
  key: "shopping",
  truthOwner: "specialist:shopping",
  privacyClass: "personal_family",
  providerCapabilities: Object.freeze(["offers_read","loyalty_read"]),
  sourceRefs: Object.freeze(["roadmap:P12.2"])
});

function ts(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} invalid`);
  return parsed;
}

function refs(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !value.trim())) throw new Error(`${label} required`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

export function validateShoppingOffer(offer: ShoppingOfferEvidence, now?: string): ShoppingOfferEvidence {
  if (!offer.id.trim() || !offer.ownerId.trim() || !offer.providerKey.trim() || !offer.merchantRef.trim() || !offer.itemRef.trim()) throw new Error("shopping offer identity required");
  if (!Number.isFinite(offer.amount) || offer.amount < 0) throw new Error("shopping offer amount invalid");
  const observedAt=ts(offer.observedAt,"shopping offer observedAt");
  if (offer.expiresAt !== undefined && ts(offer.expiresAt,"shopping offer expiresAt") < observedAt) throw new Error("shopping offer expires before observation");
  if (now !== undefined && offer.expiresAt !== undefined && ts(offer.expiresAt,"shopping offer expiresAt") < ts(now,"shopping offer now") && offer.truth === "verified") throw new Error("expired shopping offer cannot remain verified");
  return Object.freeze({ ...offer, sourceRefs: refs(offer.sourceRefs,"shopping offer source refs") });
}

export function assessShoppingTrip(option: ShoppingTripOption, priority: TripPriority, now: string): ShoppingTripAssessment {
  if (!option.merchantRef.trim() || !Number.isFinite(option.baseCost) || option.baseCost < 0 || !Number.isFinite(option.travelCost) || option.travelCost < 0) throw new Error("shopping trip option invalid");
  const offers=option.offers.map((offer)=>validateShoppingOffer(offer,now)).filter((offer)=>offer.truth === "verified");
  const immediate=offers.filter((offer)=>offer.timing === "immediate").reduce((sum,offer)=>sum+offer.amount,0);
  const delayed=offers.filter((offer)=>offer.timing !== "immediate").reduce((sum,offer)=>sum+offer.amount,0);
  const outOfPocketToday=Math.max(0,option.baseCost+option.travelCost-immediate);
  const effectiveFinalCost=Math.max(0,outOfPocketToday-delayed);
  return Object.freeze({ merchantRef:option.merchantRef,outOfPocketToday,delayedSavings:delayed,effectiveFinalCost,priority,evidenceRefs:Object.freeze(offers.flatMap((offer)=>offer.sourceRefs)) });
}

export function rankShoppingTrips(options: readonly ShoppingTripOption[], priority: TripPriority, now: string): readonly ShoppingTripAssessment[] {
  const assessed=options.map((option)=>assessShoppingTrip(option,priority,now));
  const score=(item:ShoppingTripAssessment)=>priority === "preserve_cash_today" ? item.outOfPocketToday : priority === "lowest_final_cost" ? item.effectiveFinalCost : item.outOfPocketToday + item.delayedSavings;
  return Object.freeze([...assessed].sort((a,b)=>score(a)-score(b) || a.merchantRef.localeCompare(b.merchantRef)));
}

export function assertShoppingTruthOwnership(truthOwner: string): void {
  if (truthOwner !== SHOPPING_SPECIALIST_PROFILE.truthOwner) throw new Error("Command Center may orchestrate shopping but cannot duplicate specialist shopping truth ownership");
}
