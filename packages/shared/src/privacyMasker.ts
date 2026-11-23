/**
 * Kepatuhan UU No. 27 Tahun 2022 (UU PDP):
 * Masking otomatis terhadap data pribadi sensitif sebelum disimpan ke database publik.
 */

export function maskNik(nik: string): string {
  const digits = nik.replace(/\D/g, '');
  if (digits.length !== 16) return nik;
  return `${digits.slice(0, 6)}********${digits.slice(14)}`;
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return phone;
  return `${digits.slice(0, 4)}****${digits.slice(-4)}`;
}

export function maskNpwp(npwp: string): string {
  const digits = npwp.replace(/\D/g, '');
  if (digits.length < 15) return npwp;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.***.*-***.${digits.slice(-3)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visibleTail = local.length > 1 ? local.slice(-1) : '';
  const maskedLocal = `${local[0]}${'*'.repeat(Math.max(1, local.length - 2))}${visibleTail}`;
  return `${maskedLocal}@${domain}`;
}

export function sanitizeSensitiveText(content: string): string {
  if (!content) return '';

  let output = content.replace(/\b(\d{6})(\d{8})(\d{2})\b/g, '$1********$3');
  output = output.replace(/\b(?:\+62|62|0)8\d{8,12}\b/g, (match) => maskPhoneNumber(match));
  output = output.replace(
    /\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi,
    (match) => maskEmail(match)
  );
  output = output.replace(/\b\d{2}\.?\d{3}\.?\d{3}\.?\d-?\d{3}\.?\d{3}\b/g, (match) => maskNpwp(match));
  return output;
}
