import { z } from "zod";
import { sanitizeText } from "@/lib/sanitize";
import { UFS, digits, isValidCep, isValidCpf } from "./br";
import { MAX_QUANTITY } from "./cart";
import { DEFAULT_LOCALE, LOCALES } from "./locale";

export { UFS, isValidCep, isValidCpf };

const text = (max: number) => z.string().trim().max(max).transform(sanitizeText);
const requiredText = (max: number) => text(max).pipe(z.string().min(1));

export const checkoutSchema = z.object({
  customer: z.object({
    name: requiredText(120).pipe(z.string().min(3)),
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    cpf: z.string().refine(isValidCpf).transform(digits),
    phone: z
      .string()
      .optional()
      .transform((v) => (v ? digits(v) : ""))
      .refine((v) => v === "" || (v.length >= 10 && v.length <= 13)),
  }),
  address: z.object({
    cep: z.string().refine(isValidCep).transform(digits),
    street: requiredText(160),
    number: requiredText(20),
    complement: text(80).optional().default(""),
    district: requiredText(80),
    city: requiredText(80),
    state: z.enum(UFS),
  }),
  paymentMethod: z.enum(["pix", "card"]),
  items: z
    .array(
      z.object({
        slug: z.string().regex(/^[a-z0-9-]{1,64}$/),
        sizeMl: z.number().int().positive().max(1000),
        quantity: z.number().int().min(1).max(MAX_QUANTITY),
      }),
    )
    .min(1)
    .max(50),
  /** Language the customer shopped in: drives the return URL now, transactional e-mail later. */
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
  acceptTerms: z.literal(true),
  marketingOptIn: z.boolean().default(false),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Dotted paths of invalid fields — never values (C5). */
export function issuePaths(error: z.ZodError): string[] {
  return [...new Set(error.issues.map((i) => i.path.join(".")))];
}
