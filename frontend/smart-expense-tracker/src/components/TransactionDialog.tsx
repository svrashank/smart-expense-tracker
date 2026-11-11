import { useMemo, useState } from "react";
import { Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import FormDialog from "./FormDialog";
import MoneyField from "./MoneyField";
import CategoryDot from "./CategoryDot";
import { createTransaction, updateTransaction } from "../api";
import { ApiError } from "../api/errors";
import type { Account, Category, ModeOfPurchase, Transaction, TransactionIn, TransactionType } from "../api/types";
import { categoryColors } from "../lib/categories";
import { toDateTimeInput } from "../lib/format";
import { parseAmount } from "../lib/validation";
import { COLORS } from "../theme";

export default function TransactionDialog({
  open,
  transaction,
  defaults,
  categories,
  accounts,
  onClose,
  onSaved,
  onDelete,
}: {
  open: boolean;
  transaction?: Transaction | null;
  defaults?: Partial<TransactionIn>;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
  onDelete?: (transaction: Transaction) => void;
}) {
  const initial = transaction ?? defaults ?? {};
  const [type, setType] = useState<TransactionType>(initial.type ?? "expense");
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(initial.category_id ?? "");
  const [accountId, setAccountId] = useState<number | "">(initial.account_id ?? "");
  const [date, setDate] = useState(toDateTimeInput(initial.date ?? new Date().toISOString()));
  const [mode, setMode] = useState<ModeOfPurchase | "">(initial.mode_of_purchase ?? "");
  const [note, setNote] = useState(initial.note ?? "");

  const colors = useMemo(() => categoryColors(categories), [categories]);
  const options = categories.filter((c) => c.type === type);

  function changeType(next: TransactionType | null) {
    if (!next) return;
    setType(next);
    if (categories.find((c) => c.id === categoryId)?.type !== next) setCategoryId("");
  }

  async function submit() {
    if (!date || Number.isNaN(new Date(date).getTime())) throw new ApiError("Pick a date.", 422);
    const input: TransactionIn = {
      type,
      amount: parseAmount(amount),
      description: description.trim(),
      category_id: Number(categoryId),
      account_id: accountId === "" ? null : accountId,
      date: new Date(date).toISOString(),
      mode_of_purchase: type === "expense" && mode ? mode : null,
      note: note.trim() || null,
    };
    if (!input.description) throw new ApiError(type === "expense" ? "Who did you pay?" : "Who paid you?", 422);
    if (!categoryId) throw new ApiError("Pick a category.", 422);

    if (transaction) await updateTransaction(transaction.id, input);
    else await createTransaction(input);
    onSaved();
  }

  return (
    <FormDialog
      open={open}
      title={transaction ? "Edit transaction" : "Add transaction"}
      submitLabel={transaction ? "Save changes" : "Add"}
      onSubmit={submit}
      onClose={onClose}
      secondaryAction={
        transaction &&
        onDelete && (
          <Button onClick={() => onDelete(transaction)} sx={{ color: COLORS.negative }}>
            Delete
          </Button>
        )
      }
    >
      <ToggleButtonGroup exclusive fullWidth size="small" value={type} onChange={(_, v) => changeType(v)} aria-label="Transaction type">
        <ToggleButton value="expense">Expense</ToggleButton>
        <ToggleButton value="income">Income</ToggleButton>
      </ToggleButtonGroup>

      <MoneyField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required fullWidth />

      <TextField
        label={type === "expense" ? "Paid to" : "Received from"}
        placeholder={type === "expense" ? "e.g. Swiggy" : "e.g. Acme Corp"}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        fullWidth
      />

      <TextField select label="Category" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required fullWidth>
        {options.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            <Stack direction="row" alignItems="center" gap={1.25}>
              <CategoryDot color={colors.get(c.id)} />
              {c.name}
            </Stack>
          </MenuItem>
        ))}
      </TextField>

      <Stack direction={{ xs: "column", sm: "row" }} gap={2.25}>
        <TextField
          label="Date & time"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label="Account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value === "" ? "" : Number(e.target.value))}
          fullWidth
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {type === "expense" && (
        <TextField select label="Payment" value={mode} onChange={(e) => setMode(e.target.value as ModeOfPurchase | "")} fullWidth>
          <MenuItem value="">
            <em>Not specified</em>
          </MenuItem>
          <MenuItem value="online">Online</MenuItem>
          <MenuItem value="offline">In person</MenuItem>
        </TextField>
      )}

      <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} fullWidth />
    </FormDialog>
  );
}
