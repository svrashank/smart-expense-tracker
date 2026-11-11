import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Stat from "../components/Stat";
import EmptyState from "../components/EmptyState";
import RowMenu from "../components/RowMenu";
import ConfirmDialog from "../components/ConfirmDialog";
import TransactionDialog from "../components/TransactionDialog";
import { CategoryLabel } from "../components/CategoryDot";
import { ErrorNotice, Loading } from "../components/LoadState";
import { refetchSx } from "../components/styles";
import { deleteTransaction, listAccounts, listCategories, listTransactions } from "../api";
import type { Transaction, TransactionType } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useDialog } from "../hooks/useDialog";
import { categoryColors } from "../lib/categories";
import { formatDate, formatDayLabel, formatINR, formatTime, parseDateKey, toDateKey } from "../lib/format";
import { COLORS, FONT_MONO } from "../theme";

const PAGE_SIZE = 25;

type Period = "this_month" | "last_month" | "last_3_months" | "this_year" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "All time" },
];

function periodRange(period: Period): { from?: string; to?: string } {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const range = (from: Date, to: Date) => ({ from: toDateKey(from), to: toDateKey(to) });
  switch (period) {
    case "this_month":
      return range(new Date(y, m, 1), new Date(y, m + 1, 0));
    case "last_month":
      return range(new Date(y, m - 1, 1), new Date(y, m, 0));
    case "last_3_months":
      return range(new Date(y, m - 2, 1), new Date(y, m + 1, 0));
    case "this_year":
      return range(new Date(y, 0, 1), new Date(y, 11, 31));
    case "all":
      return {};
  }
}

export default function Transactions() {
  const [params, setParams] = useSearchParams();
  const type = (params.get("type") as TransactionType | null) ?? undefined;
  const categoryId = Number(params.get("category")) || undefined;
  const accountId = Number(params.get("account")) || undefined;
  const page = Number(params.get("page")) || 1;
  const search = params.get("q") ?? "";
  // A from/to pair in the URL (e.g. from a budget) wins over the period presets.
  const customRange = params.get("from") && params.get("to") ? { from: params.get("from")!, to: params.get("to")! } : null;
  const period = (params.get("period") as Period | null) ?? "this_month";
  const range = customRange ?? periodRange(period);

  const [searchInput, setSearchInput] = useState(search);

  function update(patch: Record<string, string | null>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v === null || v === "" ? next.delete(k) : next.set(k, v)));
        if (!("page" in patch)) next.delete("page");
        return next;
      },
      { replace: true }
    );
  }

  // Debounce typing into the URL so each keystroke isn't a request.
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => update({ q: searchInput.trim() || null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const categories = useApi(listCategories, []);
  const accounts = useApi(listAccounts, []);
  const txns = useApi(
    () =>
      listTransactions({
        search: search || undefined,
        type,
        category_id: categoryId,
        account_id: accountId,
        date_from: range.from,
        date_to: range.to,
        page,
        page_size: PAGE_SIZE,
      }),
    [search, type, categoryId, accountId, range.from, range.to, page]
  );

  const editor = useDialog<Transaction>();
  const remover = useDialog<Transaction>();

  const colors = useMemo(() => categoryColors(categories.data ?? []), [categories.data]);
  const categoryById = useMemo(() => new Map((categories.data ?? []).map((c) => [c.id, c])), [categories.data]);
  const accountById = useMemo(() => new Map((accounts.data ?? []).map((a) => [a.id, a])), [accounts.data]);

  const groups = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const t of txns.data?.items ?? []) {
      const key = toDateKey(new Date(t.date));
      byDay.set(key, [...(byDay.get(key) ?? []), t]);
    }
    return Array.from(byDay, ([day, items]) => ({
      day,
      items,
      net: items.reduce((n, t) => n + (t.type === "income" ? t.amount : -t.amount), 0),
    }));
  }, [txns.data]);

  const filtersActive = Boolean(search || type || categoryId || accountId || customRange || params.get("period"));
  const totals = txns.data?.totals;
  const pageCount = txns.data ? Math.ceil(txns.data.total / PAGE_SIZE) : 0;
  const refresh = () => {
    txns.reload();
    accounts.reload();
  };

  const categoryOptions = (categories.data ?? []).filter((c) => !type || c.type === type);

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every rupee in and out, searchable."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
            Add transaction
          </Button>
        }
      />

      {/* ---------- Filters: one row above everything they scope ---------- */}
      <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center" mb={3}>
        <TextField
          size="small"
          placeholder="Search payee or note"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flex: "1 1 220px", maxWidth: { sm: 300 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: COLORS.faint }} />
                </InputAdornment>
              ),
            },
            htmlInput: { "aria-label": "Search transactions" },
          }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={type ?? "all"}
          onChange={(_, v) => v && update({ type: v === "all" ? null : v, category: null })}
          aria-label="Type"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="expense">Expenses</ToggleButton>
          <ToggleButton value="income">Income</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          select
          size="small"
          label="Category"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          value={categoryId ?? ""}
          onChange={(e) => update({ category: e.target.value ? String(e.target.value) : null })}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All categories</MenuItem>
          {categoryOptions.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Account"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          value={accountId ?? ""}
          onChange={(e) => update({ account: e.target.value ? String(e.target.value) : null })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All accounts</MenuItem>
          {(accounts.data ?? []).map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Period"
          value={customRange ? "custom" : period}
          onChange={(e) => update({ period: e.target.value === "this_month" ? null : e.target.value, from: null, to: null })}
          sx={{ minWidth: 150 }}
        >
          {customRange && (
            <MenuItem value="custom">
              {formatDate(parseDateKey(customRange.from))} – {formatDate(parseDateKey(customRange.to), { year: true })}
            </MenuItem>
          )}
          {PERIODS.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </TextField>
        {filtersActive && (
          <Button
            size="small"
            onClick={() => {
              setSearchInput("");
              setParams({}, { replace: true });
            }}
          >
            Clear filters
          </Button>
        )}
      </Stack>

      {/* ---------- Totals for the filtered set ---------- */}
      <Panel sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 3,
            ...refetchSx(txns.loading),
          }}
        >
          <Stat label="Income" value={totals ? formatINR(totals.income) : "—"} />
          <Stat label="Expenses" value={totals ? formatINR(totals.expense) : "—"} />
          <Stat label="Net" value={totals ? formatINR(totals.income - totals.expense, { sign: true }) : "—"} />
          <Stat label="Transactions" value={txns.data ? txns.data.total.toLocaleString("en-IN") : "—"} />
        </Box>
      </Panel>

      {/* ---------- List ---------- */}
      <Panel>
        {txns.error && (
          <Box mb={2}>
            <ErrorNotice message={txns.error} onRetry={txns.reload} />
          </Box>
        )}
        {!txns.data && txns.loading && <Loading />}
        {txns.data && txns.data.total === 0 && (
          <EmptyState
            icon={<ReceiptLongOutlinedIcon />}
            title={filtersActive ? "Nothing matches these filters" : "No transactions this month"}
            body={filtersActive ? "Try a wider period or clear the filters." : "Add your first one, or look at an earlier period."}
            action={
              filtersActive ? (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchInput("");
                    setParams({}, { replace: true });
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
                  Add transaction
                </Button>
              )
            }
          />
        )}

        <Box sx={refetchSx(txns.loading)}>
          {groups.map((group) => (
            <Box key={group.day} component="section" aria-label={formatDayLabel(group.items[0].date)} mb={1}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ py: 1, borderBottom: `1px solid ${COLORS.border}` }}
              >
                <Typography fontSize={12.5} fontWeight={600} color={COLORS.muted}>
                  {formatDayLabel(group.items[0].date)}
                </Typography>
                <Typography fontSize={12.5} fontFamily={FONT_MONO} color={COLORS.muted} sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatINR(group.net, { sign: true })}
                </Typography>
              </Stack>
              {group.items.map((t) => {
                const category = categoryById.get(t.category_id);
                const account = t.account_id ? accountById.get(t.account_id) : undefined;
                const income = t.type === "income";
                return (
                  <Box
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => editor.show(t)}
                    onKeyDown={(e) => e.key === "Enter" && editor.show(t)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      py: 1.5,
                      cursor: "pointer",
                      borderBottom: `1px solid ${COLORS.border}`,
                      "&:last-of-type": { borderBottom: "none" },
                      "&:hover": { background: COLORS.bg, boxShadow: `-8px 0 0 ${COLORS.bg}, 8px 0 0 ${COLORS.bg}` },
                      "&:focus-visible": { outline: `2px solid ${COLORS.accent}` },
                    }}
                  >
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={600} color={COLORS.ink} fontSize={14.5} noWrap>
                        {t.description}
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={1} mt={0.25} minWidth={0} sx={{ color: COLORS.muted, fontSize: 12.5 }}>
                        <CategoryLabel name={category?.name ?? "Uncategorised"} color={colors.get(t.category_id)} />
                        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                          · {formatTime(t.date)}
                        </Box>
                        {account && (
                          <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, whiteSpace: "nowrap" }}>
                            · {account.name}
                          </Box>
                        )}
                        {t.note && (
                          <Box component="span" sx={{ display: { xs: "none", md: "inline" }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            · {t.note}
                          </Box>
                        )}
                      </Stack>
                    </Box>
                    <Typography
                      fontFamily={FONT_MONO}
                      fontWeight={600}
                      fontSize={14.5}
                      color={income ? COLORS.accent : COLORS.ink}
                      sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
                    >
                      {formatINR(income ? t.amount : -t.amount, { sign: true })}
                    </Typography>
                    <RowMenu
                      label={`Actions for ${t.description}`}
                      items={[
                        { label: "Edit", icon: <EditOutlinedIcon />, onClick: () => editor.show(t) },
                        { label: "Delete", icon: <DeleteOutlineRoundedIcon />, onClick: () => remover.show(t), danger: true },
                      ]}
                    />
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {pageCount > 1 && (
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={1.5} mt={2}>
            <Typography fontSize={13} color={COLORS.muted}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, txns.data!.total)} of {txns.data!.total}
            </Typography>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, p) => update({ page: p === 1 ? null : String(p) })}
              shape="rounded"
              size="small"
            />
          </Stack>
        )}
      </Panel>

      <TransactionDialog
        key={editor.key}
        open={editor.open}
        transaction={editor.value}
        defaults={{ account_id: accountId ?? null, category_id: categoryId, type: type ?? (categoryId ? categoryById.get(categoryId)?.type : undefined) }}
        categories={categories.data ?? []}
        accounts={accounts.data ?? []}
        onClose={editor.close}
        onSaved={refresh}
        onDelete={(t) => {
          editor.close();
          remover.show(t);
        }}
      />
      <ConfirmDialog
        open={remover.open}
        title="Delete transaction?"
        message={
          remover.value &&
          `${remover.value.description}, ${formatINR(remover.value.amount)} on ${formatDate(remover.value.date, { year: true })}. This can't be undone.`
        }
        onConfirm={async () => {
          await deleteTransaction(remover.value!.id);
          refresh();
        }}
        onClose={remover.close}
      />
    </>
  );
}
