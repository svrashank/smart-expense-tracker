import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Tooltip as ChartTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Stat, { Delta } from "../components/Stat";
import TransactionDialog from "../components/TransactionDialog";
import { CategoryLabel } from "../components/CategoryDot";
import { ErrorNotice, Loading } from "../components/LoadState";
import { refetchSx } from "../components/styles";
import {
  getCashFlow,
  getDashboardSummary,
  getSpendByCategory,
  listAccounts,
  listCategories,
  listHoldings,
  listTransactions,
} from "../api";
import type { TransactionType } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useDialog } from "../hooks/useDialog";
import { displayName, useUser } from "../context/user";
import { categoryColors } from "../lib/categories";
import { formatDateTimeShort, formatINR, formatINRCompact, formatMonthShort, formatPct } from "../lib/format";
import { COLORS, FONT_MONO, FONT_SERIF, OTHER_COLOR } from "../theme";

const TOP_CATEGORIES = 5;

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75}>
      <Box sx={{ width: 14, height: 2, borderRadius: 1, background: color }} />
      <Typography fontSize={12.5} color={COLORS.muted}>
        {label}
      </Typography>
    </Stack>
  );
}

const TX_TABS: { label: string; value: TransactionType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Expenses", value: "expense" },
  { label: "Income", value: "income" },
];

export default function Home() {
  const { user } = useUser();
  const today = new Date();
  const [txFilter, setTxFilter] = useState<TransactionType | "all">("all");
  const [revealAmounts, setRevealAmounts] = useState(false);
  const adder = useDialog<null>();

  const summary = useApi(getDashboardSummary, []);
  const cashFlow = useApi(() => getCashFlow(7), []);
  const spend = useApi(() => getSpendByCategory(today.getMonth() + 1, today.getFullYear()), []);
  const categories = useApi(listCategories, []);
  const accounts = useApi(listAccounts, []);
  const holdings = useApi(listHoldings, []);
  const recent = useApi(
    () => listTransactions({ type: txFilter === "all" ? undefined : txFilter, page: 1, page_size: 6 }),
    [txFilter]
  );

  const colors = useMemo(() => categoryColors(categories.data ?? []), [categories.data]);
  const categoryById = useMemo(() => new Map((categories.data ?? []).map((c) => [c.id, c])), [categories.data]);

  // Top categories by spend; the tail folds into "Other" rather than taking new colours.
  const categoryRows = useMemo(() => {
    const rows = spend.data ?? [];
    const top = rows.slice(0, TOP_CATEGORIES).map((r) => ({
      key: String(r.category_id),
      name: categoryById.get(r.category_id)?.name ?? "Unknown",
      value: r.amount,
      color: colors.get(r.category_id) ?? OTHER_COLOR,
    }));
    const rest = rows.slice(TOP_CATEGORIES).reduce((n, r) => n + r.amount, 0);
    if (rest > 0) top.push({ key: "other", name: "Other", value: rest, color: OTHER_COLOR });
    const max = Math.max(1, ...top.map((r) => r.value));
    return top.map((r) => ({ ...r, pct: (r.value / max) * 100 }));
  }, [spend.data, categoryById, colors]);

  const topHoldings = useMemo(
    () =>
      (holdings.data ?? [])
        .map((h) => {
          const invested = h.units * h.avg_buy_price;
          const value = h.units * h.current_price;
          return { ...h, value, gain: value - invested, gainPct: invested ? ((value - invested) / invested) * 100 : 0 };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    [holdings.data]
  );

  const chartData = (cashFlow.data ?? []).map((p) => ({ ...p, label: formatMonthShort(p.month) }));
  const s = summary.data;
  const refreshAll = () => {
    summary.reload();
    cashFlow.reload();
    spend.reload();
    recent.reload();
    accounts.reload();
  };

  return (
    <>
      <PageHeader
        title={`${greeting(today.getHours())}${user ? `, ${displayName(user)}` : ""}`}
        subtitle={`${today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}. Here's where things stand.`}
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => adder.show(null)}>
            Add transaction
          </Button>
        }
      />

      {/* ---------- Masthead summary ---------- */}
      <Panel sx={{ mb: 4, p: { xs: 3, md: 4 } }}>
        {summary.error && <ErrorNotice message={summary.error} onRetry={summary.reload} />}
        {!s && summary.loading && <Loading minHeight={90} />}
        {s && (
          <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 3, md: 6 }} alignItems={{ md: "flex-end" }} sx={refetchSx(summary.loading)}>
            <Stat
              size="hero"
              label="Total balance"
              value={formatINR(Math.round(s.balance))}
              delta={<Delta value={s.balance_change_pct} period="last month" />}
            />
            <Stack direction="row" gap={5} flexWrap="wrap" sx={{ borderLeft: { md: `1px solid ${COLORS.border}` }, pl: { md: 5 } }}>
              <Stat label="Income this month" value={formatINR(Math.round(s.income))} delta={<Delta value={s.income_change_pct} />} />
              <Stat
                label="Spent this month"
                value={formatINR(Math.round(s.expenses))}
                delta={<Delta value={s.expenses_change_pct} goodWhen="down" />}
              />
              <Stat
                label="Net savings"
                value={formatINR(Math.round(s.income - s.expenses), { sign: s.income - s.expenses < 0 })}
                valueColor={s.income - s.expenses < 0 ? COLORS.negative : COLORS.ink}
              />
            </Stack>
          </Stack>
        )}
      </Panel>

      {/* ---------- Main grid ---------- */}
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, alignItems: "start" }}>
        {/* ===== LEFT: cash flow + transactions ===== */}
        <Stack spacing={3} minWidth={0}>
          <Panel
            title="Cash flow"
            subtitle="Last 7 months"
            action={
              <Stack direction="row" gap={2} mt={0.5}>
                <LegendKey color={COLORS.accent} label="Income" />
                <LegendKey color={COLORS.negative} label="Expenses" />
              </Stack>
            }
          >
            {cashFlow.error && <ErrorNotice message={cashFlow.error} onRetry={cashFlow.reload} />}
            <Box sx={{ height: 260 }}>
              {cashFlow.data && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.1} />
                        <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={COLORS.border} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 11.5, fontFamily: FONT_MONO }} dy={8} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      tickFormatter={formatINRCompact}
                      tick={{ fill: COLORS.muted, fontSize: 11.5, fontFamily: FONT_MONO }}
                    />
                    <ChartTooltip
                      formatter={(v) => formatINR(Number(v))}
                      contentStyle={{ borderRadius: 4, border: `1px solid ${COLORS.border}`, boxShadow: "none", fontFamily: FONT_MONO, fontSize: 12.5 }}
                      labelStyle={{ fontFamily: FONT_SERIF, color: COLORS.ink }}
                    />
                    <Area type="monotone" dataKey="income" name="Income" stroke={COLORS.accent} strokeWidth={2} fill="url(#colorInc)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke={COLORS.negative} strokeWidth={2} fill="url(#colorExp)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Panel>

          <Panel title="Recent transactions" link={{ label: "View all", to: "/transactions" }}>
            <Stack direction="row" gap={2.5} mb={1} mt={-0.5} role="tablist">
              {TX_TABS.map((t) => (
                <Typography
                  key={t.value}
                  component="button"
                  role="tab"
                  aria-selected={txFilter === t.value}
                  onClick={() => setTxFilter(t.value)}
                  fontSize={13}
                  fontWeight={600}
                  sx={{
                    background: "none",
                    border: "none",
                    fontFamily: "inherit",
                    px: 0,
                    cursor: "pointer",
                    color: txFilter === t.value ? COLORS.ink : COLORS.muted,
                    pb: 0.5,
                    borderBottom: txFilter === t.value ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                    "&:hover": { color: COLORS.ink },
                  }}
                >
                  {t.label}
                </Typography>
              ))}
            </Stack>

            {recent.error && <ErrorNotice message={recent.error} onRetry={recent.reload} />}
            {!recent.data && recent.loading && <Loading />}
            <Stack sx={refetchSx(recent.loading)}>
              {(recent.data?.items ?? []).map((t) => {
                const income = t.type === "income";
                return (
                  <Box
                    key={t.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      py: 1.75,
                      borderBottom: `1px solid ${COLORS.border}`,
                      "&:last-of-type": { borderBottom: "none" },
                    }}
                  >
                    <Box minWidth={0}>
                      <Typography fontWeight={600} color={COLORS.ink} fontSize={14.5} noWrap>
                        {t.description}
                      </Typography>
                      <Typography variant="body2" color={COLORS.muted} fontSize={12.5} mt={0.25}>
                        {formatDateTimeShort(t.date)}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" gap={0.5} flexShrink={0}>
                      <Typography fontFamily={FONT_MONO} fontWeight={600} color={income ? COLORS.accent : COLORS.ink} fontSize={14.5}>
                        {formatINR(income ? t.amount : -t.amount, { sign: true })}
                      </Typography>
                      <CategoryLabel name={categoryById.get(t.category_id)?.name ?? ""} color={colors.get(t.category_id)} fontSize={12} />
                    </Stack>
                  </Box>
                );
              })}
              {recent.data?.items.length === 0 && (
                <Typography color={COLORS.muted} fontSize={14} textAlign="center" py={4}>
                  Nothing here yet.
                </Typography>
              )}
            </Stack>
          </Panel>
        </Stack>

        {/* ===== RIGHT: category split + investments ===== */}
        <Stack spacing={3} minWidth={0}>
          <Panel title="Spending by category" subtitle="This month" link={{ label: "Budgets", to: "/budgets" }}>
            {spend.error && <ErrorNotice message={spend.error} onRetry={spend.reload} />}
            {!spend.data && spend.loading && <Loading />}
            {spend.data?.length === 0 && (
              <Typography color={COLORS.muted} fontSize={14} py={2}>
                No spending yet this month.
              </Typography>
            )}
            <Stack spacing={2.25} sx={refetchSx(spend.loading)}>
              {categoryRows.map((c) => (
                <Box key={c.key}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75} gap={1}>
                    <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <Typography variant="body2" color={COLORS.ink} fontWeight={500} noWrap>
                        {c.name}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontFamily={FONT_MONO} color={COLORS.ink} fontWeight={600}>
                      {formatINR(Math.round(c.value))}
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 5, borderRadius: 3, background: COLORS.bg, overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${c.pct}%`, background: c.color, borderRadius: 3 }} />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Panel>

          <Panel
            title="Investments"
            subtitle="Manually tracked holdings"
            action={
              <Typography
                component="button"
                fontSize={12.5}
                color={COLORS.accent}
                fontWeight={600}
                sx={{ background: "none", border: "none", fontFamily: "inherit", cursor: "pointer", p: 0, whiteSpace: "nowrap" }}
                onClick={() => setRevealAmounts((v) => !v)}
              >
                {revealAmounts ? "Show %" : "Show ₹"}
              </Typography>
            }
          >
            {holdings.error && <ErrorNotice message={holdings.error} onRetry={holdings.reload} />}
            {!holdings.data && holdings.loading && <Loading />}
            <Stack spacing={2}>
              {topHoldings.map((h) => {
                const up = h.gain >= 0;
                return (
                  <Stack key={h.id} direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                    <Box minWidth={0}>
                      <Typography fontWeight={600} color={COLORS.ink} fontSize={14} noWrap>
                        {h.symbol ?? h.name}
                      </Typography>
                      <Typography fontFamily={FONT_MONO} fontSize={12.5} color={COLORS.muted}>
                        {formatINR(Math.round(h.value))}
                      </Typography>
                    </Box>
                    <Typography fontFamily={FONT_MONO} fontSize={13} fontWeight={600} color={up ? COLORS.accent : COLORS.negative} flexShrink={0}>
                      {revealAmounts ? formatINR(Math.round(h.gain), { sign: true }) : formatPct(h.gainPct, { sign: true })}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
            <Box mt={2.5}>
              <Typography component={RouterLink} to="/investments" fontSize={13} fontWeight={600} color={COLORS.accent}>
                All holdings →
              </Typography>
            </Box>
          </Panel>
        </Stack>
      </Box>

      <TransactionDialog
        key={adder.key}
        open={adder.open}
        categories={categories.data ?? []}
        accounts={accounts.data ?? []}
        onClose={adder.close}
        onSaved={refreshAll}
      />
    </>
  );
}
