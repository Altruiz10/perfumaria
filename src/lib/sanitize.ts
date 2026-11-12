/**
 * S4: normalise untrusted free text. React already escapes on render; this is
 * defence in depth for data that leaves the app (e-mails, ERP, logs).
 */
export function sanitizeText(input: string): string {
  return input
    .normalize("NFC")
    .replace(/<\/?[a-zA-Z!][^>]*>/g, " ") // tags
    .replace(/[<>]/g, " ") // stray brackets
    .replace(/[\u0000-\u001f\u007f]/g, " ") // control chars
    .replace(/\s+/g, " ")
    .trim();
}
