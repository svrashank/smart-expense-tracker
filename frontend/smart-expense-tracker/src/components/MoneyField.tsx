import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";

// Amount input with a ₹ prefix. Keeps the raw string so the user can type "12."
// mid-edit; parse it with Number() on submit.
export default function MoneyField(props: Omit<TextFieldProps, "type">) {
  return (
    <TextField
      {...props}
      type="text"
      slotProps={{
        ...props.slotProps,
        htmlInput: { inputMode: "decimal", ...(props.slotProps?.htmlInput as object) },
        input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
      }}
    />
  );
}
