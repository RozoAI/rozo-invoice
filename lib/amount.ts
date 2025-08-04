import { formatUnits, parseUnits } from "viem";

/**
 * Check if a value appears to be in human-readable format (has decimals or is very small)
 */
function isHumanReadableFormat(value: string | number): boolean {
  const str = value.toString().toLowerCase();

  // Has decimal point or scientific notation with negative exponent
  if (str.includes(".") || /e-\d+/.test(str)) {
    return true;
  }

  // Scientific notation with small positive exponent (like 2.014e3 = 2014)
  if (str.includes("e")) {
    const [, expStr] = str.split("e");
    const exp = parseInt(expStr, 10);
    return exp < 10; // Arbitrary threshold - adjust as needed
  }

  // Very large numbers are likely already in wei
  const num = Number(str);
  return num < 1000000; // Numbers under 1M are likely human-readable
}

/**
 * Convert scientific notation to regular decimal string
 */
function normalizeScientificNotation(value: string): string {
  const str = value.toLowerCase();
  if (!str.includes("e")) {
    return value;
  }

  // Use Number to convert scientific notation, but handle precision loss
  const num = Number(str);
  if (!isFinite(num)) {
    throw new Error(`Invalid scientific notation: ${value}`);
  }

  // For very large numbers, we need to handle precision carefully
  if (Math.abs(num) >= Number.MAX_SAFE_INTEGER) {
    // Manual parsing for large scientific notation
    const [base, expStr] = str.split("e");
    const exp = parseInt(expStr, 10);
    const [intPart, fracPart = ""] = base.split(".");

    if (exp >= 0) {
      const totalDigits = intPart + fracPart;
      const zerosToAdd = exp - fracPart.length;
      if (zerosToAdd >= 0) {
        return totalDigits + "0".repeat(zerosToAdd);
      } else {
        const decimalPos = intPart.length + exp;
        return (
          totalDigits.slice(0, decimalPos) + "." + totalDigits.slice(decimalPos)
        );
      }
    } else {
      const totalDigits = intPart + fracPart;
      const zerosToAdd = Math.abs(exp) - intPart.length;
      if (zerosToAdd > 0) {
        return "0." + "0".repeat(zerosToAdd) + totalDigits;
      } else {
        const decimalPos = intPart.length + exp;
        return (
          totalDigits.slice(0, decimalPos) + "." + totalDigits.slice(decimalPos)
        );
      }
    }
  }

  return num.toString();
}

/**
 * Convert any input to BigInt representing the smallest unit (wei)
 */
function toWeiBigInt(
  value: string | number | bigint,
  decimals: number
): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  let str = value.toString().trim();

  if (str === "0" || str === "0.0" || str === "") {
    return BigInt(0);
  }

  // Convert scientific notation to regular format first
  str = normalizeScientificNotation(str);

  // If it looks like it's already in wei format, use it directly
  if (!isHumanReadableFormat(str)) {
    try {
      return BigInt(str);
    } catch {
      // Fall through to parseUnits if BigInt conversion fails
    }
  }

  // Otherwise, treat as human-readable and convert using parseUnits
  try {
    return parseUnits(str, decimals);
  } catch (error) {
    throw new Error(
      `Failed to parse value "${str}" with ${decimals} decimals: ${error}`
    );
  }
}

/**
 * Formats EVM token amount with smart decimal inference.
 */
export function formatAmount(
  value: string | number | bigint,
  decimals?: number,
  options?: {
    usdcDefaultDecimals?: number; // default 6
    maxFractionDigits?: number; // default 6
  }
): string {
  const defaultDecimals = options?.usdcDefaultDecimals ?? 6;
  const maxDigits = options?.maxFractionDigits ?? 6;

  // Smart decimal inference
  let usedDecimals: number;
  if (decimals !== undefined) {
    usedDecimals = decimals;
  } else if (typeof value === "bigint") {
    usedDecimals = 18; // Default for bigint
  } else if (isHumanReadableFormat(value)) {
    usedDecimals = 18; // Default for human-readable numbers
  } else {
    usedDecimals = defaultDecimals; // Default for large integers (likely USDC)
  }

  try {
    const weiBigInt = toWeiBigInt(value, usedDecimals);
    const formatted = formatUnits(weiBigInt, usedDecimals);

    // Trim trailing zeros and limit decimal places
    const [intPart, fracPart = ""] = formatted.split(".");
    const trimmedFrac = fracPart.slice(0, maxDigits).replace(/0+$/, "");

    return trimmedFrac ? `${intPart}.${trimmedFrac}` : intPart;
  } catch (error) {
    console.warn("Failed to format amount:", value, error);
    return "0";
  }
}
