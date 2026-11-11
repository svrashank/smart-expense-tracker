// In-memory stand-in for the backend. Seeded so every reload shows the same data,
// and generated relative to today so "this month" always has activity. Delete this
// file once every function in ./index.ts calls the real API.
import type { AccountIn, Budget, Category, Goal, Holding, Transaction, User } from "./types";

type StoredAccount = AccountIn & { id: number };
type StoredBudget = Omit<Budget, "spent">;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261010);
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];

const now = new Date();
const monthsFromNow = (n: number, day: number) => new Date(now.getFullYear(), now.getMonth() + n, day);
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const user: User = {
  id: 1,
  email: "vrashank@example.com",
  name: "Vrashank",
  fullname: null,
  created_at: "2025-07-21T10:00:00+05:30",
};

export const categories: Category[] = [
  { id: 1, name: "Food & Dining", type: "expense", necessity: "medium", is_system: true },
  { id: 2, name: "Groceries", type: "expense", necessity: "high", is_system: true },
  { id: 3, name: "Transport", type: "expense", necessity: "medium", is_system: true },
  { id: 4, name: "Shopping", type: "expense", necessity: "low", is_system: true },
  { id: 5, name: "Bills & Utilities", type: "expense", necessity: "high", is_system: true },
  { id: 6, name: "Rent", type: "expense", necessity: "high", is_system: true },
  { id: 7, name: "Entertainment", type: "expense", necessity: "low", is_system: false },
  { id: 8, name: "Health & Fitness", type: "expense", necessity: "high", is_system: true },
  { id: 9, name: "Salary", type: "income", necessity: null, is_system: true },
  { id: 10, name: "Freelance", type: "income", necessity: null, is_system: false },
  { id: 11, name: "Interest", type: "income", necessity: null, is_system: true },
];

export const accounts: StoredAccount[] = [
  { id: 1, name: "HDFC Savings", type: "bank", institution: "HDFC Bank", last4: "4821", opening_balance: 85000 },
  { id: 2, name: "Cash", type: "cash", institution: null, last4: null, opening_balance: 4000 },
  { id: 3, name: "Amazon Pay", type: "wallet", institution: "Amazon", last4: null, opening_balance: 2000 },
  { id: 4, name: "Amazon Pay ICICI Card", type: "credit_card", institution: "ICICI Bank", last4: "7703", opening_balance: 0 },
];

function generateTransactions(): Transaction[] {
  const rows: Omit<Transaction, "id">[] = [];
  const MONTHS_BACK = 8;

  const add = (
    monthOffset: number,
    day: number,
    category_id: number,
    description: string,
    amount: number,
    opts: Partial<Pick<Transaction, "account_id" | "mode_of_purchase" | "note">> = {}
  ) => {
    const d = monthsFromNow(monthOffset, day);
    if (d.getMonth() !== (now.getMonth() + monthOffset + 120) % 12) return; // day overflowed the month
    d.setHours(between(8, 22), between(0, 59));
    if (d > now) return;
    const category = categories.find((c) => c.id === category_id)!;
    // Cards, cash and wallets only see recent activity, so their balances stay
    // realistic without modelling bill payments and top-ups.
    const recent = monthOffset >= -1;
    const accountId = opts.account_id && opts.account_id !== 1 && monthOffset < 0 ? 1 : opts.account_id;
    rows.push({
      type: category.type,
      amount,
      description,
      category_id,
      account_id: accountId ?? (category.type === "expense" && recent && rand() < 0.45 ? 4 : 1),
      date: d.toISOString(),
      mode_of_purchase: opts.mode_of_purchase ?? null,
      note: opts.note ?? null,
    });
  };

  for (let m = -MONTHS_BACK; m <= 0; m++) {
    add(m, 1, 9, "Acme Corp", 95000, { account_id: 1, note: "Monthly salary" });
    if (rand() < 0.5) add(m, between(8, 26), 10, pick(["Upwork client", "Design retainer", "Toptal"]), between(12, 40) * 1000, { account_id: 1 });
    if ((m + MONTHS_BACK) % 3 === 2) add(m, 28, 11, "HDFC Bank", between(1500, 2200), { account_id: 1, note: "Savings interest" });

    add(m, 3, 6, "Landlord", 25000, { account_id: 1, mode_of_purchase: "online" });
    add(m, 10, 5, "BESCOM", between(1400, 2300), { account_id: 1, mode_of_purchase: "online", note: "Electricity" });
    add(m, 15, 5, "ACT Fibernet", 999, { mode_of_purchase: "online" });
    add(m, 20, 5, "Jio", 599, { mode_of_purchase: "online" });
    add(m, 5, 7, "Netflix", 649, { mode_of_purchase: "online" });
    add(m, 12, 7, "Spotify", 119, { mode_of_purchase: "online" });
    add(m, 2, 8, "cult.fit", 1500, { mode_of_purchase: "online" });

    for (const day of [4, 11, 18, 25]) {
      const store = pick(["BigBasket", "Zepto", "DMart", "Blinkit"]);
      add(m, day + between(0, 2), 2, store, between(9, 35) * 100, { mode_of_purchase: store === "DMart" ? "offline" : "online" });
    }
    for (let i = 0; i < between(7, 12); i++) {
      const place = pick(["Swiggy", "Zomato", "Starbucks", "Third Wave Coffee", "Meghana Foods", "Chai Point"]);
      const online = place === "Swiggy" || place === "Zomato";
      add(m, between(1, 28), 1, place, between(18, 120) * 10, {
        mode_of_purchase: online ? "online" : "offline",
        account_id: !online && rand() < 0.3 ? 2 : undefined,
      });
    }
    for (let i = 0; i < between(6, 10); i++) {
      const ride = pick(["Uber", "Ola", "Rapido", "Namma Metro"]);
      add(m, between(1, 28), 3, ride, between(8, 60) * 10, { mode_of_purchase: "online", account_id: ride === "Namma Metro" ? 3 : undefined });
    }
    add(m, between(5, 25), 3, "Indian Oil", between(20, 30) * 100, { mode_of_purchase: "offline", note: "Fuel" });
    for (let i = 0; i < between(1, 4); i++) {
      add(m, between(1, 28), 4, pick(["Amazon", "Myntra", "Zara", "Decathlon", "IKEA"]), between(8, 45) * 100, { mode_of_purchase: "online" });
    }
    for (let i = 0; i < between(0, 2); i++) {
      add(m, between(1, 28), 7, "BookMyShow", between(40, 90) * 10, { mode_of_purchase: "online" });
    }
    if (rand() < 0.7) add(m, between(1, 28), 8, "Apollo Pharmacy", between(30, 150) * 10, { mode_of_purchase: "offline" });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows.map((r, i) => ({ ...r, id: i + 1 }));
}

export const transactions: Transaction[] = generateTransactions();

export const budgets: StoredBudget[] = [-1, 0].flatMap((offset, i) => {
  const d = monthsFromNow(offset, 1);
  const limits: [number, number][] = [
    [1, 8000],
    [2, 10000],
    [3, 4000],
    [4, 5000],
    [5, 4000],
    [7, 1500],
  ];
  return limits.map(([category_id, amount], j) => ({
    id: i * limits.length + j + 1,
    category_id,
    month: d.getMonth() + 1,
    year: d.getFullYear(),
    amount,
  }));
});

export const goals: Goal[] = [
  {
    id: 1,
    name: "Emergency fund",
    description: "Six months of expenses, parked in a liquid fund.",
    target_amount: 300000,
    saved_amount: 185000,
    target_date: isoDate(monthsFromNow(9, 0)),
    created_at: "2026-01-04T09:00:00+05:30",
  },
  {
    id: 2,
    name: "Goa trip",
    description: "December, with the college group.",
    target_amount: 60000,
    saved_amount: 42000,
    target_date: isoDate(monthsFromNow(2, 15)),
    created_at: "2026-05-12T09:00:00+05:30",
  },
  {
    id: 3,
    name: "Bike down payment",
    description: null,
    target_amount: 80000,
    saved_amount: 12000,
    target_date: isoDate(monthsFromNow(6, 0)),
    created_at: "2026-08-20T09:00:00+05:30",
  },
  {
    id: 4,
    name: "New laptop",
    description: "Replace the 2019 machine.",
    target_amount: 120000,
    saved_amount: 120000,
    target_date: isoDate(monthsFromNow(-1, 1)),
    created_at: "2025-11-02T09:00:00+05:30",
  },
];

const updated = monthsFromNow(0, Math.max(1, now.getDate() - 2)).toISOString();

export const holdings: Holding[] = [
  { id: 1, name: "UTI Nifty 50 Index Fund", symbol: null, asset_type: "mutual_fund", units: 1520.4, avg_buy_price: 142.3, current_price: 161.8, updated_at: updated },
  { id: 2, name: "Parag Parikh Flexi Cap", symbol: null, asset_type: "mutual_fund", units: 820.5, avg_buy_price: 68.2, current_price: 84.9, updated_at: updated },
  { id: 3, name: "Reliance Industries", symbol: "RELIANCE", asset_type: "stock", units: 25, avg_buy_price: 2480, current_price: 2912, updated_at: updated },
  { id: 4, name: "Infosys", symbol: "INFY", asset_type: "stock", units: 40, avg_buy_price: 1610, current_price: 1488, updated_at: updated },
  { id: 5, name: "HDFC Bank", symbol: "HDFCBANK", asset_type: "stock", units: 30, avg_buy_price: 1540, current_price: 1702, updated_at: updated },
  { id: 6, name: "Nippon India Gold BeES", symbol: "GOLDBEES", asset_type: "etf", units: 300, avg_buy_price: 52.1, current_price: 71.4, updated_at: updated },
  { id: 7, name: "SBI Fixed Deposit", symbol: null, asset_type: "fixed_deposit", units: 1, avg_buy_price: 100000, current_price: 104250, updated_at: updated },
];

let lastId = 1000;
export const nextId = () => ++lastId;
