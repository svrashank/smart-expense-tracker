import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Stat from "../components/Stat";
import EmptyState from "../components/EmptyState";
import RowMenu from "../components/RowMenu";
import FormDialog from "../components/FormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import MoneyField from "../components/MoneyField";
import { ErrorNotice, Loading } from "../components/LoadState";
import { refetchSx } from "../components/styles";
import { createAccount, deleteAccount, listAccounts, listHoldings, updateAccount } from "../api";
import { ApiError } from "../api/errors";
import type { Account, AccountType } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useDialog } from "../hooks/useDialog";
import { ACCOUNT_TYPE_LABELS } from "../lib/categories";
import { formatINR } from "../lib/format";
import { parseAmount, required } from "../lib/validation";
import { COLORS, FONT_MONO } from "../theme";

const GROUPS: { type: AccountType; title: string; icon: SvgIconComponent }[] = [
  { type: "bank", title: "Bank accounts", icon: AccountBalanceOutlinedIcon },
  { type: "wallet", title: "Wallets", icon: AccountBalanceWalletOutlinedIcon },
  { type: "cash", title: "Cash", icon: PaymentsOutlinedIcon },
  { type: "credit_card", title: "Credit cards", icon: CreditCardOutlinedIcon },
];

function AccountDialog({ open, account, onClose, onSaved }: { open: boolean; account: Account | null; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<AccountType>(account?.type ?? "bank");
  const [name, setName] = useState(account?.name ?? "");
  const [institution, setInstitution] = useState(account?.institution ?? "");
  const [last4, setLast4] = useState(account?.last4 ?? "");
  // Credit cards are entered as a positive "amount owed" and stored negative.
  const [opening, setOpening] = useState(
    account ? String(account.type === "credit_card" ? -account.opening_balance : account.opening_balance) : ""
  );
  const isCard = type === "credit_card";
  const hasNumber = type === "bank" || isCard;

  async function submit() {
    if (hasNumber && last4 && !/^\d{4}$/.test(last4)) throw new ApiError("Last 4 digits should be exactly 4 numbers.", 422);
    const amount = opening.trim() ? parseAmount(opening, isCard ? "the amount owed" : "a balance", { allowZero: true }) : 0;
    const input = {
      name: required(name, "Give the account a name."),
      type,
      institution: type === "cash" ? null : institution.trim() || null,
      last4: hasNumber ? last4 || null : null,
      opening_balance: isCard ? -amount : amount,
    };
    if (account) await updateAccount(account.id, input);
    else await createAccount(input);
    onSaved();
  }

  return (
    <FormDialog open={open} title={account ? "Edit account" : "Add account"} submitLabel={account ? "Save changes" : "Add account"} onSubmit={submit} onClose={onClose}>
      <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as AccountType)} fullWidth>
        {GROUPS.map((g) => (
          <MenuItem key={g.type} value={g.type}>
            {ACCOUNT_TYPE_LABELS[g.type]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Name"
        placeholder={isCard ? "e.g. Amazon Pay ICICI Card" : type === "wallet" ? "e.g. Paytm" : "e.g. HDFC Savings"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
        autoFocus
      />
      {type !== "cash" && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={2.25}>
          <TextField
            label={type === "wallet" ? "Provider" : "Bank"}
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            fullWidth
          />
          {hasNumber && (
            <TextField
              label="Last 4 digits"
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              sx={{ maxWidth: { sm: 140 } }}
              fullWidth
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
          )}
        </Stack>
      )}
      <MoneyField
        label={isCard ? "Amount owed when added" : "Balance when added"}
        value={opening}
        onChange={(e) => setOpening(e.target.value)}
        fullWidth
        helperText="Transactions on this account move the balance from here."
      />
    </FormDialog>
  );
}

export default function Accounts() {
  const navigate = useNavigate();
  const accounts = useApi(listAccounts, []);
  const holdings = useApi(listHoldings, []);
  const editor = useDialog<Account>();
  const remover = useDialog<Account>();

  const all = accounts.data ?? [];
  const liquid = all.filter((a) => a.type !== "credit_card").reduce((n, a) => n + a.balance, 0);
  const dues = all.filter((a) => a.type === "credit_card").reduce((n, a) => n + Math.min(0, a.balance), 0);
  const investments = (holdings.data ?? []).reduce((n, h) => n + h.units * h.current_price, 0);
  const netWorth = liquid + investments + dues;

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Where your money sits, and what you owe."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
            Add account
          </Button>
        }
      />

      {(accounts.error || holdings.error) && (
        <Box mb={3}>
          <ErrorNotice
            message={(accounts.error ?? holdings.error)!}
            onRetry={() => {
              accounts.reload();
              holdings.reload();
            }}
          />
        </Box>
      )}
      {!accounts.data && accounts.loading && <Loading minHeight={300} />}

      {accounts.data && all.length === 0 && (
        <Panel>
          <EmptyState
            icon={<AccountBalanceOutlinedIcon />}
            title="No accounts yet"
            body="Add your bank accounts, cards, wallets and cash so every transaction has a home and your balances add up."
            action={
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => editor.show(null)}>
                Add account
              </Button>
            }
          />
        </Panel>
      )}

      {all.length > 0 && (
        <Box sx={refetchSx(accounts.loading)}>
          <Panel sx={{ mb: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 3, md: 6 }} alignItems={{ md: "flex-end" }}>
              <Stat size="hero" label="Net worth" value={formatINR(Math.round(netWorth))} caption="Accounts and investments, minus card dues." />
              <Stack direction="row" gap={5} flexWrap="wrap" sx={{ borderLeft: { md: `1px solid ${COLORS.border}` }, pl: { md: 5 } }}>
                <Stat label="Cash & bank" value={formatINR(Math.round(liquid))} />
                <Stat label="Investments" value={holdings.data ? formatINR(Math.round(investments)) : "—"} />
                <Stat label="Card dues" value={formatINR(Math.round(-dues))} valueColor={dues < 0 ? COLORS.negative : COLORS.ink} />
              </Stack>
            </Stack>
          </Panel>

          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, alignItems: "start" }}>
            {GROUPS.map((group) => {
              const items = all.filter((a) => a.type === group.type);
              if (items.length === 0) return null;
              const total = items.reduce((n, a) => n + a.balance, 0);
              const isCard = group.type === "credit_card";
              return (
                <Panel
                  key={group.type}
                  title={group.title}
                  action={
                    <Typography fontFamily={FONT_MONO} fontSize={13.5} fontWeight={600} color={COLORS.muted}>
                      {isCard ? `${formatINR(Math.max(0, -total))} due` : formatINR(total)}
                    </Typography>
                  }
                >
                  <Stack>
                    {items.map((a) => {
                      const Icon = group.icon;
                      const owed = isCard ? Math.max(0, -a.balance) : 0;
                      return (
                        <Stack
                          key={a.id}
                          direction="row"
                          alignItems="center"
                          gap={1.75}
                          sx={{ py: 1.5, borderBottom: `1px solid ${COLORS.border}`, "&:last-of-type": { borderBottom: "none", pb: 0.5 } }}
                        >
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              background: COLORS.bg,
                              border: `1px solid ${COLORS.border}`,
                              color: COLORS.muted,
                              flexShrink: 0,
                            }}
                          >
                            <Icon sx={{ fontSize: 19 }} />
                          </Box>
                          <Box flex={1} minWidth={0}>
                            <Typography fontWeight={600} fontSize={14.5} color={COLORS.ink} noWrap>
                              {a.name}
                            </Typography>
                            <Typography fontSize={12.5} color={COLORS.muted} noWrap>
                              {[a.institution, a.last4 && `•••• ${a.last4}`].filter(Boolean).join(" · ") || ACCOUNT_TYPE_LABELS[a.type]}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography
                              fontFamily={FONT_MONO}
                              fontWeight={600}
                              fontSize={14.5}
                              color={isCard && owed > 0 ? COLORS.negative : COLORS.ink}
                              sx={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {isCard ? formatINR(owed) : formatINR(a.balance)}
                            </Typography>
                            {isCard && (
                              <Typography fontSize={12} color={COLORS.muted}>
                                {owed > 0 ? "due" : "no dues"}
                              </Typography>
                            )}
                          </Box>
                          <RowMenu
                            label={`Actions for ${a.name}`}
                            items={[
                              { label: "View transactions", icon: <ReceiptLongOutlinedIcon />, onClick: () => navigate(`/transactions?account=${a.id}&period=all`) },
                              { label: "Edit", icon: <EditOutlinedIcon />, onClick: () => editor.show(a) },
                              { label: "Delete", icon: <DeleteOutlineRoundedIcon />, onClick: () => remover.show(a), danger: true },
                            ]}
                          />
                        </Stack>
                      );
                    })}
                  </Stack>
                </Panel>
              );
            })}
          </Box>
        </Box>
      )}

      <AccountDialog key={editor.key} open={editor.open} account={editor.value} onClose={editor.close} onSaved={accounts.reload} />
      <ConfirmDialog
        open={remover.open}
        title="Delete account?"
        message={remover.value && `${remover.value.name} will be removed. Its transactions stay, they just won't be linked to an account any more.`}
        onConfirm={async () => {
          await deleteAccount(remover.value!.id);
          accounts.reload();
        }}
        onClose={remover.close}
      />
    </>
  );
}
