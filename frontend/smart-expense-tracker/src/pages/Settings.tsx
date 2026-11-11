import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, Box, Button, MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import RowMenu from "../components/RowMenu";
import FormDialog from "../components/FormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import CategoryDot from "../components/CategoryDot";
import { ErrorNotice, Loading } from "../components/LoadState";
import { changePassword, createCategory, deleteCategory, deleteMe, listCategories, logout, updateCategory, updateMe } from "../api";
import { ApiError, errorMessage } from "../api/errors";
import type { Category, NecessityLevel, TransactionType, User } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useDialog } from "../hooks/useDialog";
import { displayName, useUser } from "../context/user";
import { NECESSITY_LABELS, categoryColors } from "../lib/categories";
import { formatDate } from "../lib/format";
import { required } from "../lib/validation";
import { COLORS, FONT_SERIF } from "../theme";

type TabKey = "profile" | "security" | "categories";

// Inline form state shared by the profile and password forms.
function useInlineForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  async function run(event: FormEvent, action: () => Promise<void>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await action();
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, saved, run };
}

function SavedNote({ show, text = "Saved" }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: COLORS.accent }} role="status">
      <CheckRoundedIcon sx={{ fontSize: 17 }} />
      <Typography fontSize={13.5} fontWeight={600}>
        {text}
      </Typography>
    </Stack>
  );
}

// ---------------- Profile ----------------

function ProfileTab() {
  const { user } = useUser();
  return user ? <ProfileForm key={user.id} user={user} /> : <Loading />;
}

function ProfileForm({ user }: { user: User }) {
  const { setUser } = useUser();
  const [name, setName] = useState(user.name ?? "");
  const [fullname, setFullname] = useState(user.fullname ?? "");
  const form = useInlineForm();

  return (
    <Panel title="Profile" sx={{ maxWidth: 640 }}>
      <Stack direction="row" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: COLORS.ink, color: COLORS.bg, fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 600 }}>
          {displayName(user).charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography fontWeight={600} color={COLORS.ink}>
            {displayName(user)}
          </Typography>
          <Typography fontSize={13} color={COLORS.muted}>
            Member since {formatDate(user.created_at, { year: true })}
          </Typography>
        </Box>
      </Stack>

      <form
        onSubmit={(e) =>
          form.run(e, async () => {
            setUser(await updateMe({ name: name.trim() || null, fullname: fullname.trim() || null }));
          })
        }
        noValidate
      >
        <Stack spacing={2.25}>
          {form.error && <ErrorNotice message={form.error} />}
          <TextField label="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} helperText="Used in greetings." fullWidth />
          <TextField label="Full name" value={fullname} onChange={(e) => setFullname(e.target.value)} fullWidth />
          <TextField label="Email" value={user.email} disabled fullWidth helperText="Changing your email isn't supported yet." />
          <Stack direction="row" alignItems="center" gap={2}>
            <Button type="submit" variant="contained" disabled={form.busy}>
              {form.busy ? "Saving…" : "Save profile"}
            </Button>
            <SavedNote show={form.saved} />
          </Stack>
        </Stack>
      </form>
    </Panel>
  );
}

// ---------------- Security ----------------

function SecurityTab() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const form = useInlineForm();

  return (
    <Stack spacing={3} maxWidth={640}>
      <Panel title="Change password">
        <form
          onSubmit={(e) =>
            form.run(e, async () => {
              if (next !== confirm) throw new ApiError("The new passwords don't match.", 422);
              await changePassword(current, next);
              setCurrent("");
              setNext("");
              setConfirm("");
            })
          }
          noValidate
        >
          <Stack spacing={2.25}>
            {form.error && <ErrorNotice message={form.error} />}
            <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} fullWidth />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              helperText="At least 8 characters."
              fullWidth
            />
            <TextField label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} fullWidth />
            <Stack direction="row" alignItems="center" gap={2}>
              <Button type="submit" variant="contained" disabled={form.busy}>
                {form.busy ? "Updating…" : "Update password"}
              </Button>
              <SavedNote show={form.saved} text="Password updated" />
            </Stack>
          </Stack>
        </form>
      </Panel>

      <Panel title="Session">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
          <Typography fontSize={14} color={COLORS.muted}>
            Log out of Centsible on this device.
          </Typography>
          <Button
            variant="outlined"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Log out
          </Button>
        </Stack>
      </Panel>

      <Panel title="Delete account" sx={{ borderColor: COLORS.negativeSoft }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
          <Typography fontSize={14} color={COLORS.muted}>
            Permanently delete your account and every transaction, budget and goal in it.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setDeleteOpen(true)}
            sx={{ color: COLORS.negative, borderColor: COLORS.negative, flexShrink: 0, "&:hover": { borderColor: COLORS.negative, background: COLORS.negativeSoft } }}
          >
            Delete account
          </Button>
        </Stack>
      </Panel>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        message="This removes all of your data and can't be undone. Enter your password to confirm."
        confirmLabel="Delete my account"
        onConfirm={async () => {
          await deleteMe(deletePassword);
          navigate("/signup");
        }}
        onClose={() => {
          setDeleteOpen(false);
          setDeletePassword("");
        }}
      >
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          fullWidth
          sx={{ mt: 2.5 }}
        />
      </ConfirmDialog>
    </Stack>
  );
}

// ---------------- Categories ----------------

function CategoryDialog({
  open,
  category,
  type,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: Category | null;
  type: TransactionType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [necessity, setNecessity] = useState<NecessityLevel | "">(category?.necessity ?? (type === "expense" ? "medium" : ""));

  async function submit() {
    const input = { name: required(name, "Give the category a name."), type, necessity: type === "expense" && necessity ? necessity : null };
    if (category) await updateCategory(category.id, input);
    else await createCategory(input);
    onSaved();
  }

  return (
    <FormDialog
      open={open}
      title={category ? "Edit category" : type === "expense" ? "New expense category" : "New income category"}
      submitLabel={category ? "Save changes" : "Add category"}
      onSubmit={submit}
      onClose={onClose}
    >
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required fullWidth />
      {type === "expense" && (
        <TextField
          select
          label="How essential is it?"
          value={necessity}
          onChange={(e) => setNecessity(e.target.value as NecessityLevel)}
          helperText="Saving suggestions look at optional spending first."
          fullWidth
        >
          {(Object.keys(NECESSITY_LABELS) as NecessityLevel[]).map((n) => (
            <MenuItem key={n} value={n}>
              {NECESSITY_LABELS[n]}
            </MenuItem>
          ))}
        </TextField>
      )}
    </FormDialog>
  );
}

function CategoriesTab() {
  const categories = useApi(listCategories, []);
  const editor = useDialog<{ category: Category | null; type: TransactionType }>();
  const remover = useDialog<Category>();
  const colors = useMemo(() => categoryColors(categories.data ?? []), [categories.data]);

  if (categories.error) return <ErrorNotice message={categories.error} onRetry={categories.reload} />;
  if (!categories.data) return <Loading />;

  const sections: { type: TransactionType; title: string }[] = [
    { type: "expense", title: "Expense categories" },
    { type: "income", title: "Income categories" },
  ];

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, alignItems: "start" }}>
      {sections.map((section) => (
        <Panel
          key={section.type}
          title={section.title}
          action={
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => editor.show({ category: null, type: section.type })}>
              Add
            </Button>
          }
        >
          <Stack>
            {categories.data!
              .filter((c) => c.type === section.type)
              .map((c) => (
                <Stack
                  key={c.id}
                  direction="row"
                  alignItems="center"
                  gap={1.5}
                  sx={{ py: 1.25, minHeight: 50, borderBottom: `1px solid ${COLORS.border}`, "&:last-of-type": { borderBottom: "none" } }}
                >
                  <CategoryDot color={colors.get(c.id)} size={8} />
                  <Typography fontSize={14.5} fontWeight={500} color={COLORS.ink} flex={1} noWrap>
                    {c.name}
                  </Typography>
                  {c.necessity && (
                    <Typography fontSize={12.5} color={COLORS.muted}>
                      {NECESSITY_LABELS[c.necessity]}
                    </Typography>
                  )}
                  {c.is_system ? (
                    <Tooltip title="Default category: can't be edited">
                      <LockOutlinedIcon sx={{ fontSize: 16, color: COLORS.faint, mx: 1 }} aria-label="Default category" />
                    </Tooltip>
                  ) : (
                    <RowMenu
                      label={`Actions for ${c.name}`}
                      items={[
                        { label: "Edit", icon: <EditOutlinedIcon />, onClick: () => editor.show({ category: c, type: c.type }) },
                        { label: "Delete", icon: <DeleteOutlineRoundedIcon />, onClick: () => remover.show(c), danger: true },
                      ]}
                    />
                  )}
                </Stack>
              ))}
          </Stack>
        </Panel>
      ))}

      <CategoryDialog
        key={editor.key}
        open={editor.open}
        category={editor.value?.category ?? null}
        type={editor.value?.type ?? "expense"}
        onClose={editor.close}
        onSaved={categories.reload}
      />
      <ConfirmDialog
        open={remover.open}
        title="Delete category?"
        message={remover.value && `"${remover.value.name}" will be removed. This can't be undone.`}
        onConfirm={async () => {
          await deleteCategory(remover.value!.id);
          categories.reload();
        }}
        onClose={remover.close}
      />
    </Box>
  );
}

// ---------------- Page ----------------

const TABS: { key: TabKey; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "categories", label: "Categories" },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "profile") as TabKey;

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, password and categories." />
      <Tabs
        value={tab}
        onChange={(_, v: TabKey) => setParams(v === "profile" ? {} : { tab: v }, { replace: true })}
        sx={{ mb: 3, borderBottom: `1px solid ${COLORS.border}`, "& .MuiTab-root": { color: COLORS.muted }, "& .Mui-selected": { color: `${COLORS.ink} !important` } }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>
      {tab === "profile" && <ProfileTab />}
      {tab === "security" && <SecurityTab />}
      {tab === "categories" && <CategoriesTab />}
    </>
  );
}
