import { z } from "zod";

export const PROJECT_TYPES = [
  { value: "bc-integration", label: "Business Central integration" },
  { value: "api-portal", label: "API / portal build" },
  { value: "hiring", label: "Full-time or contract role" },
  { value: "other", label: "Something else" },
] as const;

const projectTypeValues = PROJECT_TYPES.map((p) => p.value) as string[];

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell me your name.")
    .max(120, "That name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "An email address lets me reply.")
    .email("That email address doesn’t look right."),
  company: z
    .string()
    .trim()
    .max(160, "That company name is too long.")
    .optional()
    .or(z.literal("")),
  projectType: z
    .string()
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => projectTypeValues.includes(v), {
      message: "Choose the closest option.",
    }),
  message: z
    .string()
    .trim()
    .min(20, "A little more detail helps — 20 characters or more.")
    .max(4000, "That message is longer than the 4,000-character limit."),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "An email address is required.")
    .email("That email address doesn’t look right."),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

/** Build a flat { field: firstMessage } map from a Zod error, version-agnostic. */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}
