// resources/js/utils/PhoneFormat.ts

export function formatAustralianPhone(phone?: string | null) {
  if (!phone) return "";

  let raw = phone.trim();

  // International format +61
  if (raw.startsWith("+61")) {
    const number = raw.replace(/\D/g, "").replace(/^61/, "");

    // Mobile +61 414 226 056
    if (number.startsWith("4") && number.length === 9) {
      return `+61 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }

    // Landline +61 2 8065 4661
    if (number.length === 9 && /^[2378]/.test(number)) {
      return `+61 ${number.slice(0, 1)} ${number.slice(1, 5)} ${number.slice(5)}`;
    }
  }

  let digits = raw.replace(/\D/g, "");

  // Stored as 61414226056
  if (digits.startsWith("61")) {
    digits = digits.slice(2);

    if (digits.startsWith("4") && digits.length === 9) {
      return `+61 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }

    if (digits.length === 9) {
      return `+61 ${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
    }
  }

  // Australian mobile 0414226056
  if (digits.length === 10 && digits.startsWith("04")) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
  }

  // Australian landline 0280654661
  if (digits.length === 10 && /^0[2378]/.test(digits)) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2 $3");
  }

  return phone;
}
