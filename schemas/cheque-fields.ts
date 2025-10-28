import { z } from "zod"

export const ChequeFieldsSchema = z.object({
  bank_name: z.string().optional(),
  branch: z.string().optional(),
  cheque_number: z.string().optional(),
  date: z.string().optional(), // optionally use regex here
  payee: z.string().optional(),
  amount_numeric: z.string().optional(),
  amount_words: z.string().optional(),
  account_number: z.string().optional(),
  ifsc: z.string().optional(),
  micr: z.string().optional(),
  notes_visible_marks: z.string().optional(),
})

export type ChequeFields = z.infer<typeof ChequeFieldsSchema>