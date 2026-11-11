import { useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Stat, { Delta } from "../components/Stat";
import EmptyState from "../components/EmptyState";
import RowMenu from "../components/RowMenu";
import FormDialog from "../components/FormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import MoneyField from "../components/MoneyField";
import CategoryDot from "../components/CategoryDot";
import { ErrorNotice, Loading } from "../components/LoadState";
import { refetchSx } from "../components/styles";
import { createHolding, deleteHolding, listHoldings, updateHolding } from "../api";
import { ApiError } from "../api/errors";
import type { AssetType, Holding } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useDialog } from "../hooks/useDialog";
import { ASSET_TYPES } from "../lib/categories";
import { formatDate, formatINR, formatPct } from "../lib/format";
import { parseAmount, required } from "../lib/validation";
import { COLORS, FONT_MONO } from "../theme";

const assetMeta = new Map(ASSET_TYPES.map((a) => [a.type, a]));

const units = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 });

function figures(h: Holding) {
  const invested = h.units * h.avg_buy_price;
  const value = h.units * h.current_price;
  return { invested, value, gain: value - invested, gainPct: invested ? ((value - invested) / invested) * 100 : 0 };
}

function HoldingDialog({ open, holding, onClose, onSaved }: { open: boolean; holding: Holding | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(holding?.name ?? "");
  const [symbol, setSymbol] = useState(holding?.symbol ?? "");
  const [assetType, setAssetType] = useState<AssetType>(holding?.asset_type ?? "stock");
  const [qty, setQty] = useState(holding ? String(holding.units) : "");
  const [avg, setAvg] = useState(holding ? String(holding.avg_buy_price) : "");
  const [price, setPrice] = useState(holding ? String(holding.current_price) : "");

  // FDs and similar have no units: one unit, priced at the deposit amount.
  const singleUnit = assetType === "fixed_deposit" || assetType === "other";

  async function submit() {
    const unitCount = singleUnit ? 1 : Number(qty);
    if (!singleUnit && (!qty.trim() || !Number.isFinite(unitCount) || unitCount <= 0)) throw new ApiError("Enter how many units you hold.", 422);
    const input = {
      name: required(name, "Give the holding a name."),
      symbol: symbol.trim().toUpperCase() || null,
      asset_type: assetType,
      units: unitCount,
      avg_buy_price: parseAmount(avg, singleUnit ? "the amount invested" : "the average buy price"),
      current_price: parseAmount(price, singleUnit ? "the current value" : "the current price"),
    };
    if (holding) await updateHolding(holding.id, input);
    else await createHolding(input);
    onSaved();
  }

  return (
    <FormDialog
      open={open}
      title={holding ? "Edit holding" : "Add holding"}
      subtitle="Prices are entered by hand for now. Update them whenever you check."
      submitLabel={holding ? "Save changes" : "Add holding"}
      onSubmit={submit}
      onClose={onClose}
    >
      <TextField select label="Type" value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)} fullWidth>
        {ASSET_TYPES.map((a) => (
          <MenuItem key={a.type} value={a.type}>
            <Stack direction="row" alignItems="center" gap={1.25}>
              <CategoryDot color={a.color} />
              {a.label}
            </Stack>
          </MenuItem>
        ))}
      </TextField>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2.25}>
        <TextField label="Name" placeholder="e.g. Infosys" value={name} onChange={(e) => setName(e.target.value)} required fullWidth autoFocus={!holding} />
        <TextField label="Symbol" placeholder="INFY" value={symbol} onChange={(e) => setSymbol(e.target.value)} sx={{ maxWidth: { sm: 130 } }} fullWidth />
      </Stack>
      {!singleUnit && (
        <TextField
          label="Units"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
        />
      )}
      <Stack direction={{ xs: "column", sm: "row" }} gap={2.25}>
        <MoneyField label={singleUnit ? "Amount invested" : "Avg buy price"} value={avg} onChange={(e) => setAvg(e.target.value)} required fullWidth />
        <MoneyField
          label={singleUnit ? "Current value" : "Current price"}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          fullWidth
          autoFocus={Boolean(holding)}
        />
      </Stack>
    </FormDialog>
  );
}

export default function Investments() {
  const holdings = useApi(listHoldings, []);
  const editor = useDialog<Holding>();
  const remover = useDialog<Holding>();

  const rows = useMemo(
    () => (holdings.data ?? []).map((h) => ({ ...h, ...figures(h) })).sort((a, b) => b.value - a.value),
    [holdings.data]
  );
  const invested = rows.reduce((n, r) => n + r.invested, 0);
  const value = rows.reduce((n, r) => n + r.value, 0);
  const gain = value - invested;
  const gainPct = invested ? (gain / invested) * 100 : 0;

  // Allocation by asset type, in the fixed ASSET_TYPES order so colours never move.
  const allocation = ASSET_TYPES.map((a) => {
    const total = rows.filter((r) => r.asset_type === a.type).reduce((n, r) => n + r.value, 0);
    return { ...a, value: total, pct: value ? (total / value) * 100 : 0 };
  }).filter((a) => a.value > 0);

  return (
    <>
      <PageHeader
        title="Investments"
        subtitle="Holdings you track by hand. Live prices come later."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
            Add holding
          </Button>
        }
      />

      {holdings.error && (
        <Box mb={3}>
          <ErrorNotice message={holdings.error} onRetry={holdings.reload} />
        </Box>
      )}
      {!holdings.data && holdings.loading && <Loading minHeight={300} />}

      {holdings.data && rows.length === 0 && (
        <Panel>
          <EmptyState
            icon={<ShowChartOutlinedIcon />}
            title="No holdings yet"
            body="Add stocks, mutual funds, gold or fixed deposits to see your portfolio's value and returns in one place."
            action={
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
                Add holding
              </Button>
            }
          />
        </Panel>
      )}

      {rows.length > 0 && (
        <Box sx={refetchSx(holdings.loading)}>
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, mb: 3 }}>
            {/* ---------- Portfolio summary ---------- */}
            <Panel>
              <Stat size="hero" label="Current value" value={formatINR(Math.round(value))} />
              <Stack direction="row" gap={5} mt={3} flexWrap="wrap">
                <Stat label="Invested" value={formatINR(Math.round(invested))} />
                <Stat
                  label="Total returns"
                  value={formatINR(Math.round(gain), { sign: true })}
                  valueColor={gain >= 0 ? COLORS.accent : COLORS.negative}
                  delta={<Delta value={Math.round(gainPct * 10) / 10} />}
                />
                <Stat label="Holdings" value={rows.length} />
              </Stack>
            </Panel>

            {/* ---------- Allocation ---------- */}
            <Panel title="Allocation">
              <Stack direction="row" sx={{ height: 14, gap: "2px", mb: 2.5 }} aria-hidden>
                {allocation.map((a, i) => (
                  <Tooltip key={a.type} title={`${a.label}: ${formatINR(Math.round(a.value))} (${formatPct(a.pct)})`}>
                    <Box
                      sx={{
                        width: `${a.pct}%`,
                        minWidth: 3,
                        background: a.color,
                        borderTopLeftRadius: i === 0 ? 4 : 0,
                        borderBottomLeftRadius: i === 0 ? 4 : 0,
                        borderTopRightRadius: i === allocation.length - 1 ? 4 : 0,
                        borderBottomRightRadius: i === allocation.length - 1 ? 4 : 0,
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
              <Stack spacing={1.25}>
                {allocation.map((a) => (
                  <Stack key={a.type} direction="row" alignItems="center" gap={1.25}>
                    <CategoryDot color={a.color} size={8} />
                    <Typography fontSize={13.5} color={COLORS.ink} flex={1}>
                      {a.label}
                    </Typography>
                    <Typography fontSize={13} fontFamily={FONT_MONO} color={COLORS.muted} sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatPct(a.pct)}
                    </Typography>
                    <Typography
                      fontSize={13.5}
                      fontFamily={FONT_MONO}
                      fontWeight={600}
                      color={COLORS.ink}
                      sx={{ minWidth: 96, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatINR(Math.round(a.value))}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Panel>
          </Box>

          {/* ---------- Holdings table ---------- */}
          <Panel title="Holdings" subtitle="Tap a holding to update its price.">
            <Box sx={{ overflowX: "auto", mx: { xs: -2.5, md: -3 } }}>
              <Table
                size="small"
                sx={{
                  "& th": { color: COLORS.muted, fontSize: 12.5, fontWeight: 500, borderColor: COLORS.border, whiteSpace: "nowrap" },
                  "& td": { borderColor: COLORS.border, fontSize: 14, py: 1.5 },
                  "& th:first-of-type, & td:first-of-type": { pl: { xs: 2.5, md: 3 } },
                  "& th:last-of-type, & td:last-of-type": { pr: { xs: 1.5, md: 2 } },
                  "& .num": { textAlign: "right", whiteSpace: "nowrap" },
                  "& td.num": { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" },
                  "& .wide": { display: { xs: "none", md: "table-cell" } },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Holding</TableCell>
                    <TableCell className="num wide">Units</TableCell>
                    <TableCell className="num wide">Avg price</TableCell>
                    <TableCell className="num wide">Current price</TableCell>
                    <TableCell className="num">Value</TableCell>
                    <TableCell className="num wide">Returns</TableCell>
                    <TableCell padding="none" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((h) => {
                    const meta = assetMeta.get(h.asset_type)!;
                    const up = h.gain >= 0;
                    return (
                      <TableRow
                        key={h.id}
                        hover
                        onClick={() => editor.show(h)}
                        sx={{ cursor: "pointer", "&:last-of-type td": { borderBottom: "none" } }}
                      >
                        <TableCell>
                          <Typography fontWeight={600} fontSize={14.5} color={COLORS.ink}>
                            {h.name}
                          </Typography>
                          <Stack direction="row" alignItems="center" gap={0.75} mt={0.25}>
                            <CategoryDot color={meta.color} />
                            <Typography fontSize={12.5} color={COLORS.muted} noWrap>
                              {meta.label}
                              {h.symbol && ` · ${h.symbol}`} · as of {formatDate(h.updated_at)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell className="num wide">{units.format(h.units)}</TableCell>
                        <TableCell className="num wide">{formatINR(h.avg_buy_price)}</TableCell>
                        <TableCell className="num wide">{formatINR(h.current_price)}</TableCell>
                        <TableCell className="num" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {formatINR(Math.round(h.value))}
                          {/* Phones drop the Returns column, so the % rides under the value. */}
                          <Box fontSize={12} fontWeight={400} color={up ? COLORS.accent : COLORS.negative} sx={{ display: { md: "none" } }}>
                            {formatPct(h.gainPct, { sign: true })}
                          </Box>
                        </TableCell>
                        <TableCell className="num wide" sx={{ color: up ? COLORS.accent : COLORS.negative }}>
                          <Box fontWeight={600}>{formatINR(Math.round(h.gain), { sign: true })}</Box>
                          <Box fontSize={12}>{formatPct(h.gainPct, { sign: true })}</Box>
                        </TableCell>
                        <TableCell padding="none" onClick={(e) => e.stopPropagation()}>
                          <RowMenu
                            label={`Actions for ${h.name}`}
                            items={[
                              { label: "Update price", icon: <EditOutlinedIcon />, onClick: () => editor.show(h) },
                              { label: "Delete", icon: <DeleteOutlineRoundedIcon />, onClick: () => remover.show(h), danger: true },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Panel>
        </Box>
      )}

      <HoldingDialog key={editor.key} open={editor.open} holding={editor.value} onClose={editor.close} onSaved={holdings.reload} />
      <ConfirmDialog
        open={remover.open}
        title="Delete holding?"
        message={remover.value && `${remover.value.name} will be removed from your portfolio. This can't be undone.`}
        onConfirm={async () => {
          await deleteHolding(remover.value!.id);
          holdings.reload();
        }}
        onClose={remover.close}
      />
    </>
  );
}
