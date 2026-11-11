import { useState } from "react";
import { Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Stat from "../components/Stat";
import Meter from "../components/Meter";
import EmptyState from "../components/EmptyState";
import RowMenu from "../components/RowMenu";
import FormDialog from "../components/FormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import MoneyField from "../components/MoneyField";
import { ErrorNotice, Loading } from "../components/LoadState";
import { refetchSx } from "../components/styles";
import { contributeToGoal, createGoal, deleteGoal, listGoals, updateGoal } from "../api";
import { ApiError } from "../api/errors";
import type { Goal } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useDialog } from "../hooks/useDialog";
import { formatDate, formatINR, monthsBetween, parseDateKey, toDateKey } from "../lib/format";
import { parseAmount, required } from "../lib/validation";
import { COLORS, FONT_SERIF } from "../theme";

function progress(goal: Goal) {
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const target = parseDateKey(goal.target_date);
  const today = new Date();
  const overdue = remaining > 0 && toDateKey(target) < toDateKey(today);
  // Count the current month, so a goal due this month needs the whole remainder now.
  const monthsLeft = Math.max(1, monthsBetween(today, target) + 1);
  return {
    pct: goal.saved_amount / goal.target_amount,
    remaining,
    done: remaining === 0,
    overdue,
    monthsLeft,
    perMonth: overdue ? remaining : Math.ceil(remaining / monthsLeft),
  };
}

function GoalDialog({ open, goal, onClose, onSaved }: { open: boolean; goal: Goal | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target_amount) : "");
  const [date, setDate] = useState(goal?.target_date ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");

  async function submit() {
    const input = {
      name: required(name, "Give the goal a name."),
      target_amount: parseAmount(target, "a target amount"),
      target_date: required(date, "Pick a target date."),
      description: description.trim() || null,
    };
    if (goal) await updateGoal(goal.id, input);
    else await createGoal(input);
    onSaved();
  }

  return (
    <FormDialog open={open} title={goal ? "Edit goal" : "New goal"} submitLabel={goal ? "Save changes" : "Create goal"} onSubmit={submit} onClose={onClose}>
      <TextField label="What are you saving for?" placeholder="e.g. Goa trip" value={name} onChange={(e) => setName(e.target.value)} autoFocus required fullWidth />
      <Stack direction={{ xs: "column", sm: "row" }} gap={2.25}>
        <MoneyField label="Target amount" value={target} onChange={(e) => setTarget(e.target.value)} required fullWidth />
        <TextField
          label="Target date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
      <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} fullWidth />
    </FormDialog>
  );
}

function MoneyDialog({
  open,
  goal,
  initialMode,
  onClose,
  onSaved,
}: {
  open: boolean;
  goal: Goal | null;
  initialMode: "add" | "withdraw";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [amount, setAmount] = useState("");

  async function submit() {
    if (!goal) return;
    const value = parseAmount(amount);
    if (mode === "withdraw" && value > goal.saved_amount) throw new ApiError(`You've only saved ${formatINR(goal.saved_amount)} so far.`, 422);
    await contributeToGoal(goal.id, mode === "add" ? value : -value);
    onSaved();
  }

  return (
    <FormDialog
      open={open}
      title={goal?.name ?? ""}
      subtitle={goal && `${formatINR(goal.saved_amount)} saved of ${formatINR(goal.target_amount)}`}
      submitLabel={mode === "add" ? "Add money" : "Withdraw"}
      onSubmit={submit}
      onClose={onClose}
    >
      <ToggleButtonGroup exclusive fullWidth size="small" value={mode} onChange={(_, v) => v && setMode(v)} aria-label="Add or withdraw">
        <ToggleButton value="add">Add money</ToggleButton>
        <ToggleButton value="withdraw">Withdraw</ToggleButton>
      </ToggleButtonGroup>
      <MoneyField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required fullWidth />
    </FormDialog>
  );
}

function GoalCard({
  goal,
  onAddMoney,
  onWithdraw,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onAddMoney: () => void;
  onWithdraw: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const p = progress(goal);
  return (
    <Panel sx={{ display: "flex", flexDirection: "column" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box minWidth={0}>
          <Typography component="h2" fontFamily={FONT_SERIF} fontSize={18} fontWeight={500} color={COLORS.ink}>
            {goal.name}
          </Typography>
          {goal.description && (
            <Typography fontSize={13} color={COLORS.muted} mt={0.25}>
              {goal.description}
            </Typography>
          )}
        </Box>
        <RowMenu
          label={`Actions for ${goal.name}`}
          items={[
            { label: "Withdraw", icon: <RemoveCircleOutlineRoundedIcon />, onClick: onWithdraw },
            { label: "Edit", icon: <EditOutlinedIcon />, onClick: onEdit },
            { label: "Delete", icon: <DeleteOutlineRoundedIcon />, onClick: onDelete, danger: true },
          ]}
        />
      </Stack>

      <Stack direction="row" alignItems="baseline" gap={1} mt={2.5} mb={1.25}>
        <Typography fontSize={24} fontWeight={600} color={COLORS.ink} letterSpacing="-0.01em">
          {formatINR(goal.saved_amount)}
        </Typography>
        <Typography fontSize={13.5} color={COLORS.muted}>
          of {formatINR(goal.target_amount)}
        </Typography>
        <Typography fontSize={13} fontWeight={600} color={COLORS.ink} ml="auto">
          {Math.floor(p.pct * 100)}%
        </Typography>
      </Stack>
      <Meter value={p.pct} color={COLORS.accent} track={COLORS.accentSoft} height={8} label={`${goal.name} progress`} />

      <Box flex={1} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mt={2.5} gap={2}>
        <Box>
          <Typography fontSize={12.5} color={p.overdue ? COLORS.negative : COLORS.muted} fontWeight={p.overdue ? 600 : 400}>
            {p.overdue
              ? `Target date passed (${formatDate(goal.target_date, { year: true })})`
              : `By ${formatDate(goal.target_date, { year: true })} · ${p.monthsLeft} month${p.monthsLeft === 1 ? "" : "s"} left`}
          </Typography>
          <Typography fontSize={13} color={COLORS.ink} mt={0.25}>
            {p.overdue ? `${formatINR(p.remaining)} still to go` : `Save ${formatINR(p.perMonth)} a month to get there`}
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<SavingsOutlinedIcon />} onClick={onAddMoney} sx={{ flexShrink: 0 }}>
          Add money
        </Button>
      </Stack>
    </Panel>
  );
}

export default function Goals() {
  const goals = useApi(listGoals, []);
  const editor = useDialog<Goal>();
  const money = useDialog<{ goal: Goal; mode: "add" | "withdraw" }>();
  const remover = useDialog<Goal>();

  const all = goals.data ?? [];
  const active = all.filter((g) => !progress(g).done).sort((a, b) => a.target_date.localeCompare(b.target_date));
  const completed = all.filter((g) => progress(g).done);

  const saved = active.reduce((n, g) => n + g.saved_amount, 0);
  const target = active.reduce((n, g) => n + g.target_amount, 0);
  const perMonth = active.reduce((n, g) => n + progress(g).perMonth, 0);

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="What you're saving towards, and what it takes to get there."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
            New goal
          </Button>
        }
      />

      {goals.error && (
        <Box mb={3}>
          <ErrorNotice message={goals.error} onRetry={goals.reload} />
        </Box>
      )}
      {!goals.data && goals.loading && <Loading minHeight={300} />}

      {goals.data && all.length === 0 && (
        <Panel>
          <EmptyState
            icon={<FlagOutlinedIcon />}
            title="No goals yet"
            body="A trip, an emergency fund, a new laptop. Set a target and a date and we'll work out how much to put aside each month."
            action={
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
                New goal
              </Button>
            }
          />
        </Panel>
      )}

      {all.length > 0 && (
        <Box sx={refetchSx(goals.loading)}>
          {active.length > 0 && (
            <Panel sx={{ mb: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 3, md: 6 }} alignItems={{ md: "flex-end" }}>
                <Box flex={1}>
                  <Stat size="hero" label="Saved towards active goals" value={formatINR(saved)} caption={`of ${formatINR(target)} across ${active.length} goal${active.length === 1 ? "" : "s"}`} />
                  <Box mt={2.5} maxWidth={520}>
                    <Meter value={target ? saved / target : 0} color={COLORS.accent} track={COLORS.accentSoft} height={8} label="Overall progress" />
                  </Box>
                </Box>
                <Stack direction="row" gap={5} sx={{ borderLeft: { md: `1px solid ${COLORS.border}` }, pl: { md: 5 } }}>
                  <Stat label="Needed each month" value={formatINR(perMonth)} />
                  <Stat label="Completed" value={`${completed.length} of ${all.length}`} />
                </Stack>
              </Stack>
            </Panel>
          )}

          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1fr" } }}>
            {active.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onAddMoney={() => money.show({ goal: g, mode: "add" })}
                onWithdraw={() => money.show({ goal: g, mode: "withdraw" })}
                onEdit={() => editor.show(g)}
                onDelete={() => remover.show(g)}
              />
            ))}
          </Box>

          {completed.length > 0 && (
            <Panel title="Completed" sx={{ mt: 3 }}>
              <Stack>
                {completed.map((g) => (
                  <Stack
                    key={g.id}
                    direction="row"
                    alignItems="center"
                    gap={1.5}
                    sx={{ py: 1.25, borderBottom: `1px solid ${COLORS.border}`, "&:last-of-type": { borderBottom: "none" } }}
                  >
                    <CheckCircleRoundedIcon sx={{ color: COLORS.accent, fontSize: 20 }} />
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={600} fontSize={14.5} color={COLORS.ink} noWrap>
                        {g.name}
                      </Typography>
                      <Typography fontSize={12.5} color={COLORS.muted}>
                        Target was {formatDate(g.target_date, { year: true })}
                      </Typography>
                    </Box>
                    <Typography fontWeight={600} fontSize={14} color={COLORS.ink}>
                      {formatINR(g.target_amount)}
                    </Typography>
                    <RowMenu
                      label={`Actions for ${g.name}`}
                      items={[
                        { label: "Withdraw", icon: <RemoveCircleOutlineRoundedIcon />, onClick: () => money.show({ goal: g, mode: "withdraw" }) },
                        { label: "Edit", icon: <EditOutlinedIcon />, onClick: () => editor.show(g) },
                        { label: "Delete", icon: <DeleteOutlineRoundedIcon />, onClick: () => remover.show(g), danger: true },
                      ]}
                    />
                  </Stack>
                ))}
              </Stack>
            </Panel>
          )}
        </Box>
      )}

      <GoalDialog key={`goal-${editor.key}`} open={editor.open} goal={editor.value} onClose={editor.close} onSaved={goals.reload} />
      <MoneyDialog
        key={`money-${money.key}`}
        open={money.open}
        goal={money.value?.goal ?? null}
        initialMode={money.value?.mode ?? "add"}
        onClose={money.close}
        onSaved={goals.reload}
      />
      <ConfirmDialog
        open={remover.open}
        title="Delete goal?"
        message={remover.value && `"${remover.value.name}" and its ${formatINR(remover.value.saved_amount)} progress record will be removed. This can't be undone.`}
        onConfirm={async () => {
          await deleteGoal(remover.value!.id);
          goals.reload();
        }}
        onClose={remover.close}
      />
    </>
  );
}
