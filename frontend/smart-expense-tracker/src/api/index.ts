// Every screen talks to the backend through these functions. Today they're backed
// by the in-memory store in ./mock.ts. As each backend task lands, replace the body
// with the real call (the endpoint is in the comment above each function) and keep
// the signature, so no page has to change.
import * as db from "./mock";
import { ApiError } from "./errors";
import type {
  Account,
  AccountIn,
  Budget,
  BudgetIn,
  CashFlowPoint,
  Category,
  CategoryIn,
  CategorySpend,
  DashboardSummary,
  Goal,
  GoalIn,
  Holding,
  HoldingIn,
  Transaction,
  TransactionFilters,
  TransactionIn,
  TransactionPage,
  User,
  UserUpdate,
} from "./types";

const LATENCY_MS = 250;

function respond<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));
}

function fail(message: string, status = 400): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiError(message, status)), LATENCY_MS));
}

function findOr404<T extends { id: number }>(rows: T[], id: number): T {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new ApiError("Not found", 404);
  return row;
}

function remove<T extends { id: number }>(rows: T[], id: number) {
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) throw new ApiError("Not found", 404);
  rows.splice(index, 1);
}

const localDateKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const monthKey = (iso: string) => localDateKey(iso).slice(0, 7);
const sum = (rows: Transaction[]) => rows.reduce((total, t) => total + t.amount, 0);
const round2 = (n: number) => Math.round(n * 100) / 100;
const pctChange = (current: number, previous: number) =>
  previous === 0 ? null : Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;

function monthSpend(month: number, year: number): Map<number, number> {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const totals = new Map<number, number>();
  for (const t of db.transactions) {
    if (t.type === "expense" && monthKey(t.date) === key) {
      totals.set(t.category_id, (totals.get(t.category_id) ?? 0) + t.amount);
    }
  }
  return totals;
}

function accountBalance(account: (typeof db.accounts)[number]): Account {
  const rows = db.transactions.filter((t) => t.account_id === account.id);
  const income = sum(rows.filter((t) => t.type === "income"));
  const expense = sum(rows.filter((t) => t.type === "expense"));
  return { ...account, balance: round2(account.opening_balance + income - expense) };
}

// ---------------- Auth & user ----------------

// GET /api/v1/users/me (B-12)
export const getMe = (): Promise<User> => respond(db.user);

// PATCH /api/v1/users/me (B-12)
export async function updateMe(input: UserUpdate): Promise<User> {
  Object.assign(db.user, input);
  return respond(db.user);
}

// POST /api/v1/users/me/password (B-14)
export async function changePassword(current: string, next: string): Promise<void> {
  if (!current) return fail("Enter your current password.");
  if (next.length < 8) return fail("New password must be at least 8 characters.");
  return respond(undefined);
}

// DELETE /api/v1/users/me with the password in the body (B-05 / B-12)
export async function deleteMe(password: string): Promise<void> {
  if (!password) return fail("Enter your password to confirm.");
  return respond(undefined);
}

// POST /api/v1/auth/logout clears the cookie (B-13)
export const logout = (): Promise<void> => respond(undefined);

// ---------------- Categories (B-20) ----------------

// GET /api/v1/categories
export const listCategories = (): Promise<Category[]> => respond(db.categories);

// POST /api/v1/categories
export async function createCategory(input: CategoryIn): Promise<Category> {
  const name = input.name.trim();
  if (db.categories.some((c) => c.type === input.type && c.name.toLowerCase() === name.toLowerCase())) {
    return fail(`You already have a category called "${name}".`, 409);
  }
  const category: Category = { ...input, name, id: db.nextId(), is_system: false };
  db.categories.push(category);
  return respond(category);
}

// PATCH /api/v1/categories/{id}
export async function updateCategory(id: number, input: CategoryIn): Promise<Category> {
  const category = findOr404(db.categories, id);
  if (category.is_system) return fail("Default categories can't be edited.", 403);
  Object.assign(category, input, { name: input.name.trim() });
  return respond(category);
}

// DELETE /api/v1/categories/{id}
export async function deleteCategory(id: number): Promise<void> {
  const category = findOr404(db.categories, id);
  if (category.is_system) return fail("Default categories can't be deleted.", 403);
  const used = db.transactions.filter((t) => t.category_id === id).length;
  if (used > 0) {
    return fail(`${used} transaction${used === 1 ? " uses" : "s use"} this category. Move them to another category first.`, 409);
  }
  remove(db.categories, id);
  return respond(undefined);
}

// ---------------- Accounts (pending D-3) ----------------

// GET /api/v1/accounts
export const listAccounts = (): Promise<Account[]> => respond(db.accounts.map(accountBalance));

// POST /api/v1/accounts
export async function createAccount(input: AccountIn): Promise<Account> {
  const account = { ...input, id: db.nextId() };
  db.accounts.push(account);
  return respond(accountBalance(account));
}

// PATCH /api/v1/accounts/{id}
export async function updateAccount(id: number, input: AccountIn): Promise<Account> {
  const account = findOr404(db.accounts, id);
  Object.assign(account, input);
  return respond(accountBalance(account));
}

// DELETE /api/v1/accounts/{id}: transactions stay, their account_id becomes null
export async function deleteAccount(id: number): Promise<void> {
  remove(db.accounts, id);
  db.transactions.forEach((t) => {
    if (t.account_id === id) t.account_id = null;
  });
  return respond(undefined);
}

// ---------------- Transactions (B-21) ----------------

// GET /api/v1/transactions?search=&type=&category_id=&account_id=&date_from=&date_to=&page=&page_size=
export async function listTransactions(filters: TransactionFilters): Promise<TransactionPage> {
  const search = filters.search?.trim().toLowerCase();
  const rows = db.transactions
    .filter((t) => {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category_id && t.category_id !== filters.category_id) return false;
      if (filters.account_id && t.account_id !== filters.account_id) return false;
      const day = localDateKey(t.date);
      if (filters.date_from && day < filters.date_from) return false;
      if (filters.date_to && day > filters.date_to) return false;
      if (search && !`${t.description} ${t.note ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const start = (filters.page - 1) * filters.page_size;
  return respond({
    items: rows.slice(start, start + filters.page_size),
    total: rows.length,
    page: filters.page,
    page_size: filters.page_size,
    totals: {
      income: round2(sum(rows.filter((t) => t.type === "income"))),
      expense: round2(sum(rows.filter((t) => t.type === "expense"))),
    },
  });
}

// POST /api/v1/transactions
export async function createTransaction(input: TransactionIn): Promise<Transaction> {
  const transaction = { ...input, id: db.nextId() };
  db.transactions.push(transaction);
  return respond(transaction);
}

// PATCH /api/v1/transactions/{id}
export async function updateTransaction(id: number, input: TransactionIn): Promise<Transaction> {
  const transaction = findOr404(db.transactions, id);
  Object.assign(transaction, input);
  return respond(transaction);
}

// DELETE /api/v1/transactions/{id}
export async function deleteTransaction(id: number): Promise<void> {
  remove(db.transactions, id);
  return respond(undefined);
}

// ---------------- Budgets (B-33) ----------------

// GET /api/v1/budgets?month=&year=
export async function listBudgets(month: number, year: number): Promise<Budget[]> {
  const spend = monthSpend(month, year);
  return respond(
    db.budgets
      .filter((b) => b.month === month && b.year === year)
      .map((b) => ({ ...b, spent: round2(spend.get(b.category_id) ?? 0) }))
  );
}

// POST /api/v1/budgets
export async function createBudget(input: BudgetIn): Promise<Budget> {
  const clash = db.budgets.some((b) => b.category_id === input.category_id && b.month === input.month && b.year === input.year);
  if (clash) return fail("This category already has a budget for that month.", 409);
  const budget = { ...input, id: db.nextId() };
  db.budgets.push(budget);
  return respond({ ...budget, spent: round2(monthSpend(input.month, input.year).get(input.category_id) ?? 0) });
}

// PATCH /api/v1/budgets/{id} (only the amount is editable)
export async function updateBudget(id: number, amount: number): Promise<Budget> {
  const budget = findOr404(db.budgets, id);
  budget.amount = amount;
  return respond({ ...budget, spent: round2(monthSpend(budget.month, budget.year).get(budget.category_id) ?? 0) });
}

// DELETE /api/v1/budgets/{id}
export async function deleteBudget(id: number): Promise<void> {
  remove(db.budgets, id);
  return respond(undefined);
}

// ---------------- Goals (B-34) ----------------

// GET /api/v1/goals
export const listGoals = (): Promise<Goal[]> => respond(db.goals);

// POST /api/v1/goals
export async function createGoal(input: GoalIn): Promise<Goal> {
  const goal: Goal = { ...input, id: db.nextId(), saved_amount: 0, created_at: new Date().toISOString() };
  db.goals.push(goal);
  return respond(goal);
}

// PATCH /api/v1/goals/{id}
export async function updateGoal(id: number, input: GoalIn): Promise<Goal> {
  const goal = findOr404(db.goals, id);
  Object.assign(goal, input);
  return respond(goal);
}

// POST /api/v1/goals/{id}/contributions  { amount }  (negative amount = withdraw)
export async function contributeToGoal(id: number, amount: number): Promise<Goal> {
  const goal = findOr404(db.goals, id);
  if (goal.saved_amount + amount < 0) return fail("You can't withdraw more than you've saved.");
  goal.saved_amount = round2(goal.saved_amount + amount);
  return respond(goal);
}

// DELETE /api/v1/goals/{id}
export async function deleteGoal(id: number): Promise<void> {
  remove(db.goals, id);
  return respond(undefined);
}

// ---------------- Investments (pending D-4) ----------------

// GET /api/v1/holdings
export const listHoldings = (): Promise<Holding[]> => respond(db.holdings);

// POST /api/v1/holdings
export async function createHolding(input: HoldingIn): Promise<Holding> {
  const holding: Holding = { ...input, id: db.nextId(), updated_at: new Date().toISOString() };
  db.holdings.push(holding);
  return respond(holding);
}

// PATCH /api/v1/holdings/{id}
export async function updateHolding(id: number, input: HoldingIn): Promise<Holding> {
  const holding = findOr404(db.holdings, id);
  Object.assign(holding, input, { updated_at: new Date().toISOString() });
  return respond(holding);
}

// DELETE /api/v1/holdings/{id}
export async function deleteHolding(id: number): Promise<void> {
  remove(db.holdings, id);
  return respond(undefined);
}

// ---------------- Dashboard aggregates (B-30 … B-32) ----------------

// GET /api/v1/dashboard/summary
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date();
  const thisMonth = monthKey(today.toISOString());
  const lastMonth = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString());
  const inMonth = (key: string, type: Transaction["type"]) =>
    sum(db.transactions.filter((t) => t.type === type && monthKey(t.date) === key));

  const income = inMonth(thisMonth, "income");
  const expenses = inMonth(thisMonth, "expense");
  const balance = db.accounts.map(accountBalance).reduce((total, a) => total + a.balance, 0);
  const balanceLastMonth = balance - (income - expenses);

  return respond({
    balance: round2(balance),
    income: round2(income),
    expenses: round2(expenses),
    balance_change_pct: pctChange(balance, balanceLastMonth),
    income_change_pct: pctChange(income, inMonth(lastMonth, "income")),
    expenses_change_pct: pctChange(expenses, inMonth(lastMonth, "expense")),
  });
}

// GET /api/v1/dashboard/cash-flow?months=
export async function getCashFlow(months: number): Promise<CashFlowPoint[]> {
  const today = new Date();
  const points: CashFlowPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = monthKey(new Date(today.getFullYear(), today.getMonth() - i, 1).toISOString());
    const rows = db.transactions.filter((t) => monthKey(t.date) === key);
    points.push({
      month: key,
      income: round2(sum(rows.filter((t) => t.type === "income"))),
      expenses: round2(sum(rows.filter((t) => t.type === "expense"))),
    });
  }
  return respond(points);
}

// GET /api/v1/dashboard/spend-by-category?month=&year=
export async function getSpendByCategory(month: number, year: number): Promise<CategorySpend[]> {
  const rows = Array.from(monthSpend(month, year), ([category_id, amount]) => ({ category_id, amount: round2(amount) }));
  return respond(rows.sort((a, b) => b.amount - a.amount));
}
