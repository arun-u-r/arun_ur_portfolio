import { z } from "zod";

const safeText = (maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(maxLength, `Use no more than ${maxLength} characters.`)
    .refine(
      (value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value),
      "Please remove unsupported control characters.",
    );

export const contactSchema = z
  .object({
    name: safeText(100),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address.")
      .max(254, "Email address is too long.")
      .email("Enter a valid email address."),
    subject: safeText(160),
    message: safeText(5000),
    website: z.string().max(200).optional(),
  })
  .strict();

export type ContactValues = z.infer<typeof contactSchema>;

export type ContactFormValues = Omit<ContactValues, "website">;
