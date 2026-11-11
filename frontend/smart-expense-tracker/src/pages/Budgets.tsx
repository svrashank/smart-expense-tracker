import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DonutLargeOutlinedIcon from "@mui/icons-material/DonutLargeOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Stat from "../components/Stat";
import Meter from "../components/Meter";
import MonthSwitcher from "../components/MonthSwitcher";
import EmptyState from "../components/EmptyState";
import RowMenu from "../components/RowMenu";
import FormDialog from "../components/FormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import MoneyField from "../components/MoneyField";
import CategoryDot from "../components/CategoryDot";
import { ErrorNotice, Loading } from "../components/LoadState";
import { refetchSx } from "../components/styles";
import { createBudget, deleteBudget, getSpendByCategory, listBudgets, listCategories, updateBudget } from "../api";
import { ApiError } from "../api/errors";
import type { Budget, Category } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useDialog } from "../hooks/useDialog";
import { categoryColors } from "../lib/categories";
import { formatINR, formatMonth, toDateKey } from "../lib/format";
import { parseAmount } from "../lib/validation";
import { COLORS, FONT_MONO } from "../theme";

type Status = "ok" | "near" | "over";

const STATUS = {
  ok: { label: "On track", color: COLORS.accent, track: COLORS.accentSoft, icon: CheckCircleOutlineRoundedIcon },
  near: { label: "Near limit", color: COLORS.warning, track: COLORS.warningSoft, icon: WarningAmberRoundedIcon },
  over: { label: "Over budget", color: COLORS.negative, track: COLORS.negativeSoft, icon: ErrorOutlineRoundedIcon },
} as const;

const statusOf = (spent: number, limit: number): Status => (spent > limit ? "over" : spent >= limit * 0.8 ? "near" : "ok");

function StatusLabel({ status }: { status: Status }) {
  const { label, color, icon: Icon } = STATUS[status];
  return (
    <Stack direction="row" alignItems="center" gap={0.5} sx={{ color }}>
      <Icon sx={{ fontSize: 15 }} />
      <Typography fontSize={12.5} fontWeight={600}>
        {label}
      </Typography>
    </Stack>
  );
}

function BudgetDialog({
  open,
  budget,
  presetCategoryId,
  month,
  year,
  categories,
  budgetedIds,
  spend,
  onClose,
  onSaved,
}: {
  open: boolean;
  budget: Budget | null;
  presetCategoryId?: number;
  month: number;
  year: number;
  categories: Category[];
  budgetedIds: Set<number>;
  spend: Map<number, number>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState<number | "">(budget?.category_id ?? presetCategoryId ?? "");
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const colors = useMemo(() => categoryColors(categories), [categories]);
  const options = categories.filter((c) => c.type === "expense" && (!budgetedIds.has(c.id) || c.id === budget?.category_id));
  const spent = categoryId ? spend.get(categoryId) ?? 0 : null;

  async function submit() {
    if (!categoryId) throw new ApiError("Pick a category.", 422);
    const value = parseAmount(amount, "a monthly limit");
    if (budget) await updateBudget(budget.id, value);
    else await createBudget({ category_id: categoryId, month, year, amount: value });
    onSaved();
  }

  return (
    <FormDialog
      open={open}
      title={budget ? "Edit budget" : "Add budget"}
      subtitle={`For ${formatMonth(month, year)}`}
      submitLabel={budget ? "Save changes" : "Add budget"}
      onSubmit={submit}
      onClose={onClose}
    >
      <TextField
        select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(Number(e.target.value))}
        disabled={Boolean(budget)}
        required
        fullWidth
        helperText={options.length === 0 ? "Every expense category already has a budget this month." : undefined}
      >
        {options.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            <Stack direction="row" alignItems="center" gap={1.25}>
              <CategoryDot color={colors.get(c.id)} />
              {c.name}
            </Stack>
          </MenuItem>
        ))}
      </TextField>
      <MoneyField
        label="Monthly limit"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        autoFocus={Boolean(budget || presetCategoryId)}
        required
        fullWidth
        helperText={spent !== null ? `Spent so far in ${formatMonth(month, year)}: ${formatINR(spent)}` : undefined}
      />
    </FormDialog>
  );
}

export default function Budgets() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const today = new Date();
  const [year, month] = (params.get("month") ?? `${today.getFullYear()}-${today.getMonth() + 1}`).split("-").map(Number);
  const setMonth = (m: number, y: number) => {
    const isCurrent = m === today.getMonth() + 1 && y === today.getFullYear();
    setParams(isCurrent ? {} : { month: `${y}-${String(m).padStart(2, "0")}` }, { replace: true });
  };

  const categories = useApi(listCategories, []);
  const budgets = useApi(() => listBudgets(month, year), [month, year]);
  const spendRows = useApi(() => getSpendByCategory(month, year), [month, year]);

  const editor = useDialog<{ budget: Budget | null; categoryId?: number }>();
  const remover = useDialog<Budget>();
  const [copyError, setCopyError] = useState<string | null>(null);

  const colors = useMemo(() => categoryColors(categories.data ?? []), [categories.data]);
  const categoryById = useMemo(() => new Map((categories.data ?? []).map((c) => [c.id, c])), [categories.data]);
  const spend = useMemo(() => new Map((spendRows.data ?? []).map((r) => [r.category_id, r.amount])), [spendRows.data]);
  const budgetedIds = useMemo(() => new Set((budgets.data ?? []).map((b) => b.category_id)), [budgets.data]);

  const rows = useMemo(
    () => [...(budgets.data ?? [])].sort((a, b) => b.spent / b.amount - a.spent / a.amount),
    [budgets.data]
  );
  const unbudgeted = (spendRows.data ?? []).filter((r) => !budgetedIds.has(r.category_id));

  const totalLimit = rows.reduce((n, b) => n + b.amount, 0);
  const totalSpent = rows.reduce((n, b) => n + b.spent, 0);
  const totalUnbudgeted = unbudgeted.reduce((n, r) => n + r.amount, 0);
  const left = totalLimit - totalSpent;

  // Where an even pace would put you today; only meaningful for the current month.
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const pace = isCurrentMonth ? today.getDate() / daysInMonth : null;
  const daysLeft = daysInMonth - today.getDate() + 1;

  const reload = () => {
    budgets.reload();
    spendRows.reload();
  };

  async function copyPreviousMonth() {
    setCopyError(null);
    const prev = new Date(year, month - 2, 1);
    try {
      const previous = await listBudgets(prev.getMonth() + 1, prev.getFullYear());
      if (previous.length === 0) {
        setCopyError(`There were no budgets in ${formatMonth(prev.getMonth() + 1, prev.getFullYear())} either.`);
        return;
      }
      for (const b of previous) await createBudget({ category_id: b.category_id, amount: b.amount, month, year });
      reload();
    } catch {
      setCopyError("Couldn't copy last month's budgets. Please try again.");
    }
  }

  const monthRange = `from=${toDateKey(new Date(year, month - 1, 1))}&to=${toDateKey(new Date(year, month, 0))}`;
  const loading = budgets.loading || spendRows.loading;

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="A monthly limit per category, and how close you are to it."
        actions={
          <>
            <MonthSwitcher month={month} year={year} onChange={setMonth} />
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show({ budget: null })}>
              Add budget
            </Button>
          </>
        }
      />

      {(budgets.error || spendRows.error) && (
        <Box mb={3}>
          <ErrorNotice message={(budgets.error ?? spendRows.error)!} onRetry={reload} />
        </Box>
      )}

      {!budgets.data && loading && <Loading minHeight={300} />}

      {budgets.data && rows.length === 0 && (
        <Panel sx={{ mb: 3 }}>
          <EmptyState
            icon={<DonutLargeOutlinedIcon />}
            title={`No budgets for ${formatMonth(month, year)}`}
            body="Pick the categories you want to keep an eye on and give each a monthly limit."
            action={
              <Stack direction="row" gap={1.5} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show({ budget: null })}>
                  Add budget
                </Button>
                <Button variant="outlined" onClick={copyPreviousMonth}>
                  Copy last month's
                </Button>
              </Stack>
            }
          />
          {copyError && <ErrorNotice message={copyError} />}
        </Panel>
      )}

      {rows.length > 0 && (
        <Box sx={refetchSx(loading)}>
          {/* ---------- Month summary ---------- */}
          <Panel sx={{ mb: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 3, md: 6 }} alignItems={{ md: "flex-end" }}>
              <Box flex={1} minWidth={0}>
                <Stat
                  size="hero"
                  label={left >= 0 ? "Left to spend" : "Over budget by"}
                  value={formatINR(Math.abs(left))}
                  valueColor={left >= 0 ? COLORS.ink : COLORS.negative}
                  caption={
                    isCurrentMonth && left > 0
                      ? `About ${formatINR(Math.floor(left / daysLeft))} a day for the next ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`
                      : undefined
                  }
                />
                <Box mt={2.5} maxWidth={520}>
                  <Meter
                    value={totalLimit ? totalSpent / totalLimit : 0}
                    color={STATUS[statusOf(totalSpent, totalLimit)].color}
                    track={STATUS[statusOf(totalSpent, totalLimit)].track}
                    height={8}
                    label="Total budget used"
                  />
                </Box>
              </Box>
              <Stack direction="row" gap={5} sx={{ borderLeft: { md: `1px solid ${COLORS.border}` }, pl: { md: 5 } }} flexWrap="wrap">
                <Stat label="Budgeted" value={formatINR(totalLimit)} />
                <Stat label="Spent" value={formatINR(totalSpent)} />
                <Stat label="Not budgeted" value={formatINR(totalUnbudgeted)} />
              </Stack>
            </Stack>
          </Panel>

          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, alignItems: "start" }}>
            {/* ---------- Per-category budgets ---------- */}
            <Panel
              title="By category"
              subtitle={pace !== null ? "The tick on each bar is where an even pace would put you today." : undefined}
            >
              <Stack>
                {rows.map((b) => {
                  const category = categoryById.get(b.category_id);
                  const status = statusOf(b.spent, b.amount);
                  const remaining = b.amount - b.spent;
                  return (
                    <Box
                      key={b.id}
                      sx={{ py: 2, borderBottom: `1px solid ${COLORS.border}`, "&:last-of-type": { borderBottom: "none", pb: 0.5 } }}
                    >
                      <Stack direction="row" alignItems="center" gap={1.5} mb={1.25}>
                        <CategoryDot color={colors.get(b.category_id)} size={8} />
                        <Typography fontWeight={600} fontSize={14.5} color={COLORS.ink} flex={1} noWrap>
                          {category?.name ?? "Unknown category"}
                        </Typography>
                        <StatusLabel status={status} />
                        <RowMenu
                          label={`Actions for ${category?.name ?? "budget"}`}
                          items={[
                            { label: "Edit limit", icon: <EditOutlinedIcon />, onClick: () => editor.show({ budget: b }) },
                            {
                              label: "View transactions",
                              icon: <ReceiptLongOutlinedIcon />,
                              onClick: () => navigate(`/transactions?category=${b.category_id}&${monthRange}`),
                            },
                            { label: "Delete", icon: <DeleteOutlineRoundedIcon />, onClick: () => remover.show(b), danger: true },
                          ]}
                        />
                      </Stack>
                      <Box position="relative">
                        <Meter
                          value={b.spent / b.amount}
                          color={STATUS[status].color}
                          track={STATUS[status].track}
                          label={`${category?.name} budget used`}
                        />
                        {pace !== null && (
                          <Tooltip title="Even pace for today">
                            <Box
                              sx={{
                                position: "absolute",
                                top: -3,
                                bottom: -3,
                                left: `${pace * 100}%`,
                                width: 2,
                                ml: "-1px",
                                background: COLORS.ink,
                                borderRadius: 1,
                                opacity: 0.55,
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Stack direction="row" justifyContent="space-between" mt={1} gap={2}>
                        <Typography fontSize={13} color={COLORS.muted}>
                          <Box component="span" fontFamily={FONT_MONO} fontWeight={600} color={COLORS.ink}>
                            {formatINR(b.spent)}
                          </Box>{" "}
                          of {formatINR(b.amount)}
                        </Typography>
                        <Typography fontSize={13} color={remaining < 0 ? COLORS.negative : COLORS.muted} fontWeight={remaining < 0 ? 600 : 400}>
                          {remaining >= 0 ? `${formatINR(remaining)} left` : `${formatINR(-remaining)} over`}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Panel>

            {/* ---------- Spending with no budget ---------- */}
            <Panel title="Not budgeted" subtitle="Spending in categories without a limit.">
              {unbudgeted.length === 0 ? (
                <Typography fontSize={13.5} color={COLORS.muted} py={1}>
                  Every category you spent in has a budget. Nice.
                </Typography>
              ) : (
                <Stack>
                  {unbudgeted.map((r) => (
                    <Stack
                      key={r.category_id}
                      direction="row"
                      alignItems="center"
                      gap={1.25}
                      sx={{ py: 1.25, borderBottom: `1px solid ${COLORS.border}`, "&:last-of-type": { borderBottom: "none" } }}
                    >
                      <CategoryDot color={colors.get(r.category_id)} />
                      <Typography fontSize={14} color={COLORS.ink} flex={1} noWrap>
                        {categoryById.get(r.category_id)?.name ?? "Unknown"}
                      </Typography>
                      <Typography fontFamily={FONT_MONO} fontSize={13.5} fontWeight={600} color={COLORS.ink}>
                        {formatINR(r.amount)}
                      </Typography>
                      <Button size="small" onClick={() => editor.show({ budget: null, categoryId: r.category_id })}>
                        Set limit
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Panel>
          </Box>
        </Box>
      )}

      <BudgetDialog
        key={editor.key}
        open={editor.open}
        budget={editor.value?.budget ?? null}
        presetCategoryId={editor.value?.categoryId}
        month={month}
        year={year}
        categories={categories.data ?? []}
        budgetedIds={budgetedIds}
        spend={spend}
        onClose={editor.close}
        onSaved={reload}
      />
      <ConfirmDialog
        open={remover.open}
        title="Delete budget?"
        message={
          remover.value &&
          `The ${categoryById.get(remover.value.category_id)?.name ?? ""} budget for ${formatMonth(month, year)} will be removed. Your transactions aren't affected.`
        }
        onConfirm={async () => {
          await deleteBudget(remover.value!.id);
          reload();
        }}
        onClose={remover.close}
      />
    </>
  );
}
