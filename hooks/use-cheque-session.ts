"use client"

import useSWR, { mutate as globalMutate } from "swr"
import * as z from 'zod'


export const ChequeFieldsSchema = z.object({
  bank_name: z.string().describe("Name of the issuing bank (e.g., 'State Bank of India', 'HDFC Bank')"),
  branch: z.string().describe("Branch name or location (e.g., 'Anna Nagar, Chennai', 'Koramangala Branch')"),
  cheque_number: z.string().describe("Unique 6-digit cheque number printed on the cheque"),
  date: z.string()
    .transform((val) => {
      // If empty, return empty
      if (!val || val.trim() === "") return ""
      
      // If already in DD-MM-YYYY format, return as is
      if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val
      
      // Convert DDMMYYYY (e.g., "15032016") to MM-DD-YYYY
      if (/^\d{8}$/.test(val)) {
        const day = val.substring(0, 2)
        const month = val.substring(2, 4)
        const year = val.substring(4, 8)
        return `${day}-${month}-${year}`
      }
      
      // Convert DD/MM/YYYY or DD-MM-YYYY
      if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(val)) {
        const [day, month, year] = val.split(/[/-]/)
        return `${year}-${month}-${day}`
      }
      
      // Return original if format unknown
      return val
    }).describe("Date of issue in DD-MM-YYYY in top right corner format or empty string if not filled"),
  payee: z.string().describe("Name of the person or entity to whom payment is made ('Pay to the order of')"),
  amount_numeric: z.string().describe("Payment amount in numeric format (e.g., '50000.00', '1,25,000')"),
  amount_words: z.string().describe("Payment amount written in words (e.g., 'Fifty Thousand Rupees Only')"),
  account_number: z.string().describe("Bank account number of the cheque issuer (typically 9-18 digits)"),
  ifsc: z.string().describe("Indian Financial System Code - 11 character alphanumeric code (e.g., 'SBIN0001234')"),
  micr: z.string().describe("Magnetic Ink Character Recognition code - 9 digit code for cheque processing"),
  notes_visible_marks: z.string().describe("Any visible alterations, erasures, overwriting, or suspicious marks observed on the cheque. If not return empty string"),
})

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
