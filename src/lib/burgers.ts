export const BURGERS = [
  { id: "beef", label: "Beef", emoji: "🍔", badge: "🐄", bar: "bg-red-600" },
  { id: "chicken", label: "Chicken", emoji: "🍔", badge: "🐔", bar: "bg-amber-500" },
  { id: "lebanese", label: "Lebanese", emoji: "🍔", badge: "🇱🇧", bar: "bg-emerald-600" },
  { id: "american", label: "American", emoji: "🍔", badge: "🇺🇸", bar: "bg-blue-600" },
] as const;

export type BurgerId = (typeof BURGERS)[number]["id"];
export type Counts = Record<BurgerId, number>;

export const VOTER_COOKIE = "voter_id";

export function isBurgerId(value: unknown): value is BurgerId {
  return BURGERS.some((b) => b.id === value);
}

export function emptyCounts(): Counts {
  return { beef: 0, chicken: 0, lebanese: 0, american: 0 };
}
