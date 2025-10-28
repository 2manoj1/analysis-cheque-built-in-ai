"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useChequeSession } from "@/hooks/use-cheque-session"
import type { ChequeFields } from "@/hooks/use-cheque-session"
import { ChequeImageViewer } from "./cheque-image-viewer"

const fieldDefs: Array<{ key: keyof ChequeFields; label: string; placeholder?: string }> = [
  { key: "bank_name", label: "Bank Name" },
  { key: "branch", label: "Branch" },
  { key: "cheque_number", label: "Cheque Number" },
  { key: "date", label: "Date (YYYY-MM-DD)" },
  { key: "payee", label: "Payee" },
  { key: "amount_numeric", label: "Amount (Numeric)" },
  { key: "amount_words", label: "Amount (Words)" },
  { key: "account_number", label: "Account Number" },
  { key: "ifsc", label: "IFSC" },
  { key: "micr", label: "MICR" },
  { key: "notes_visible_marks", label: "Visible Marks/Notes" },
]

export function ChequeForm() {
  const { data: session, update } = useChequeSession()

  const values = useMemo<ChequeFields>(() => {
    return {
      bank_name: session?.edited?.bank_name || "",
      branch: session?.edited?.branch || "",
      cheque_number: session?.edited?.cheque_number || "",
      date: session?.edited?.date || "",
      payee: session?.edited?.payee || "",
      amount_numeric: session?.edited?.amount_numeric || "",
      amount_words: session?.edited?.amount_words || "",
      account_number: session?.edited?.account_number || "",
      ifsc: session?.edited?.ifsc || "",
      micr: session?.edited?.micr || "",
      notes_visible_marks: session?.edited?.notes_visible_marks || "",
    }
  }, [session?.edited])

  const onChange = (k: keyof ChequeFields, v: string) => {
    update({
      edited: {
        ...values,
        [k]: v,
      },
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Image Viewer - Sticky on larger screens */}
      <div className="lg:col-span-1 lg:sticky lg:top-4 lg:h-fit">
        <ChequeImageViewer />
      </div>
     <Card className="p-4 bg-card text-card-foreground lg:col-span-2">
      <div className="grid gap-4">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">Review the extracted data and make corrections if needed.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {fieldDefs.map((f) => (
            <div key={String(f.key)} className="grid gap-1">
              <Label htmlFor={`f-${String(f.key)}`}>{f.label}</Label>
              {f.key === "notes_visible_marks" ? (
                <Textarea
                  id={`f-${String(f.key)}`}
                  value={values[f.key] || ""}
                  placeholder={f.placeholder || ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              ) : (
                <Input
                  id={`f-${String(f.key)}`}
                  value={values[f.key] || ""}
                  placeholder={f.placeholder || ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
    </div>
  )
}
