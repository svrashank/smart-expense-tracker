// API contract shared with the backend. Field names are snake_case so they match
// the Pydantic schemas 1:1. Amounts are JSON numbers in rupees. Dates are ISO 8601
// strings: `date` fields are "YYYY-MM-DD", timestamps carry a timezone offset.
// See docs/SCREENS.md for which screen uses which endpoint.

export type TransactionType = "income" | "expense";
export type NecessityLevel = "high" | "medium" | "low";
export type ModeOfPurchase = "online" | "offline";
export type AccountType = "bank" | "cash" | "wallet" | "credit_card";
export type AssetType = "stock" | "mutual_fund" | "etf" | "gold" | "fixed_deposit" | "crypto" | "other";

export interface User {
  id: number;
  email: string;
  name: string | null;
  fullname: string | null;
  created_at: string;
}

export type UserUpdate = Pick<User, "name" | "fullname">;

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  necessity: NecessityLevel | null;
  // System categories are shared defaults the user can't edit (pending D-1).
  is_system: boolean;
}

export type CategoryIn = Omit<Category, "id" | "is_system">;

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  institution: string | null;
  last4: string | null;
  // Balance when the account was added to Centsible. Negative on a credit card
  // means money already owed.
  opening_balance: number;
  // Computed by the backend: opening_balance + income - expenses on this account.
  balance: number;
}

export interface AccountIn {
  name: string;
  type: AccountType;
  institution: string | null;
  last4: string | null;
  opening_balance: number;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number; // always positive; `type` carries the direction
  description: string; // merchant or payer, e.g. "Swiggy"
  category_id: number;
  account_id: number | null;
  date: string; // timestamp
  mode_of_purchase: ModeOfPurchase | null;
  note: string | null;
}

export type TransactionIn = Omit<Transaction, "id">;

export interface TransactionFilters {
  search?: string;
  type?: TransactionType;
  category_id?: number;
  account_id?: number;
  date_from?: string; // inclusive, YYYY-MM-DD
  date_to?: string; // inclusive, YYYY-MM-DD
  page: number; // 1-based
  page_size: number;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  // Totals across every row matching the filters, not just this page.
  totals: { income: number; expense: number };
}

export interface Budget {
  id: number;
  category_id: number;
  month: number; // 1-12
  year: number;
  amount: number;
  spent: number; // computed by the backend from that month's expenses
}

export type BudgetIn = Omit<Budget, "id" | "spent">;

export interface Goal {
  id: number;
  name: string;
  description: string | null;
  target_amount: number;
  saved_amount: number;
  target_date: string; // YYYY-MM-DD
  created_at: string;
}

export type GoalIn = Omit<Goal, "id" | "saved_amount" | "created_at">;

export interface Holding {
  id: number;
  name: string;
  symbol: string | null;
  asset_type: AssetType;
  units: number;
  avg_buy_price: number;
  current_price: number; // entered manually until live prices exist
  updated_at: string;
}

export type HoldingIn = Omit<Holding, "id" | "updated_at">;

export interface DashboardSummary {
  balance: number;
  income: number; // current month
  expenses: number; // current month
  // % change vs the previous month; null when there's nothing to compare against
  balance_change_pct: number | null;
  income_change_pct: number | null;
  expenses_change_pct: number | null;
}

export interface CashFlowPoint {
  month: string; // "YYYY-MM"
  income: number;
  expenses: number;
}

export interface CategorySpend {
  category_id: number;
  amount: number;
}
