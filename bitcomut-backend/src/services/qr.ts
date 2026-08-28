import crypto from "crypto";
import QRCode from "qrcode";

// Generates a short, human-friendly payment code a student can type.
// Guaranteed unique-ish via random bytes + base32 encoding (no ambiguous chars).
const PAYMENT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
export function generatePaymentCode(length = 8): string {
  let code = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += PAYMENT_CODE_ALPHABET[bytes[i] % PAYMENT_CODE_ALPHABET.length];
  }
  return code;
}

// Builds a QR as a data URL (PNG) that a Lightning wallet can scan.
// The QR encodes the bolt11 payment request string.
export async function generateQrDataUrl(
  bolt11: string,
  opts: { width?: number; margin?: number } = {}
): Promise<string> {
  const { width = 320, margin = 1 } = opts;
  return QRCode.toDataURL(bolt11, { width, margin, errorCorrectionLevel: "M" });
}
