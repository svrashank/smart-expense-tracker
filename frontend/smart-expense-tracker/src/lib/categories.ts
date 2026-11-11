import type { AccountType, AssetType, Category, NecessityLevel } from "../api/types";
import { CATEGORY_PALETTE, COLORS, OTHER_COLOR } from "../theme";

// Expense categories take palette slots in id order, so a category keeps its
// colour no matter which page or filter is showing it. Income categories share
// the accent: they only ever appear as a dot beside a "+₹" amount.
export function categoryColors(categories: Category[]) {
  const colors = new Map<number, string>();
  categories
    .filter((c) => c.type === "expense")
    .sort((a, b) => a.id - b.id)
    .forEach((c, i) => colors.set(c.id, CATEGORY_PALETTE[i] ?? OTHER_COLOR));
  categories.filter((c) => c.type === "income").forEach((c) => colors.set(c.id, COLORS.accent));
  return colors;
}

export const NECESSITY_LABELS: Record<NecessityLevel, string> = {
  high: "Essential",
  medium: "Regular",
  low: "Optional",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank account",
  cash: "Cash",
  wallet: "Wallet",
  credit_card: "Credit card",
};

export const ASSET_TYPES: { type: AssetType; label: string; color: string }[] = [
  { type: "stock", label: "Stocks", color: CATEGORY_PALETTE[0] },
  { type: "mutual_fund", label: "Mutual funds", color: CATEGORY_PALETTE[1] },
  { type: "etf", label: "ETFs", color: CATEGORY_PALETTE[2] },
  { type: "gold", label: "Gold", color: CATEGORY_PALETTE[3] },
  { type: "fixed_deposit", label: "Fixed deposits", color: CATEGORY_PALETTE[4] },
  { type: "crypto", label: "Crypto", color: CATEGORY_PALETTE[5] },
  { type: "other", label: "Other", color: OTHER_COLOR },
];
