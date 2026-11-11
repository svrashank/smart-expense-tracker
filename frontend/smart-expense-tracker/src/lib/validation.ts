import { ApiError } from "../api/errors";

// Parses a money input. Throws an ApiError the form dialogs show as-is.
export function parseAmount(raw: string, field = "an amount", opts: { allowZero?: boolean } = {}) {
  const value = Number(raw.replace(/,/g, ""));
  const tooSmall = opts.allowZero ? value < 0 : value <= 0;
  if (!raw.trim() || !Number.isFinite(value) || tooSmall) {
    throw new ApiError(`Enter ${field}${opts.allowZero ? "" : " greater than zero"}.`, 422);
  }
  if (Math.round(value * 100) !== value * 100) throw new ApiError("Amounts can have at most 2 decimal places.", 422);
  return value;
}

export function required(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new ApiError(message, 422);
  return trimmed;
}
