"use client"

import useSWR, { mutate as globalMutate } from "swr"
import * as z from 'zod'


export const ChequeFieldsSchema = z.object({
  bank_name: z.string().nullish().default("").describe("Name of the bank in English only in top of cheque. No Local language"),
  branch: z.string().nullish().default("").describe("Bank Branch name address in English"),
  account_number: z.string().nullish().default("").describe("Account number (A/C) of the issuer - A/C No. or A/C, Dedecated section for A/C"),
  cheque_number: z.string().nullish().default("").describe("Unique cheque number printed on the cheque with MICR Ink in bootom or footer"),
  date: z.iso.date().nullish().default("").describe("Date of issue in DD-MM-YYYY in top right corner format or empty string if not found"),
  payee: z.string().nullish().default("").describe("Name of the person or entity to whom payment is made ('Pay to the order of')"),
  amount_numeric: z.string().nullish().default("").describe("Payment amount in numeric format - would be hand wrriten, double check (e.g., '50000.00', '1,25,000')"),
  amount_words: z.string().nullish().default("").describe("Payment amount written in words - ould be hand wrriten, double check (e.g., 'Fifty Thousand Rupees Only')"),
  ifsc: z.string().nullish().default("").describe("IFSC Code - 11 character alphanumeric code, you will find in cheque header below bank and branch details"),
  micr: z.string().nullish().default("").describe("Magnetic Ink Character Recognition code (MICR Code) - Numeric code for cheque processing in footer of cheque"),
  notes_visible_marks: z.string().nullish().default("").describe("Any visible alterations, erasures, overwriting, or suspicious marks observed on the cheque."),
});

export const ChequeFieldsJSONSchema = z.toJSONSchema(ChequeFieldsSchema);

export type ChequeFields = z.infer<typeof ChequeFieldsSchema>;

export type ChequeSession = {
  imageDataUrl?: string
  extracted?: Partial<ChequeFields>
  edited?: Partial<ChequeFields>
  remarks?: string
  audioDataUrl?: string
  analysisMarkdown?: string
  translatedMarkdown?: string
  targetLanguage?: string
}

const STORAGE_KEY = "cheque-session"

const fetcher = async (): Promise<ChequeSession | undefined> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChequeSession) : {}
  } catch {
    return {}
  }
}

const persist = (data: Partial<ChequeSession>) => {
  const currentRaw = localStorage.getItem(STORAGE_KEY)
  const current = currentRaw ? (JSON.parse(currentRaw) as ChequeSession) : {}
  const next = { ...current, ...data }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function useChequeSession() {
  const { data, error, isLoading, mutate } = useSWR<ChequeSession>(STORAGE_KEY, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    fallbackData: {},
  })

  const update = async (patch: Partial<ChequeSession>) => {
    const next = persist(patch)
    await mutate(next, false)
    await globalMutate(STORAGE_KEY, next, false)
  }

  const reset = async () => {
    localStorage.removeItem(STORAGE_KEY)
    await mutate({}, false)
  }

  return { data, error, isLoading, update, reset }
}
