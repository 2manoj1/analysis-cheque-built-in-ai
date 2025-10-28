"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useChequeSession } from "@/hooks/use-cheque-session"
import { extractFieldsFromCheque, isPromptAvailable } from "@/lib/prompt"

export function ChequeUploader({ onNext }: { onNext: () => void }) {
  const { data: session, update } = useChequeSession()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toDataUrl = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(f)
    })

  const onFile = async (f: File) => {
    setError(null)
    setFile(f)
    try {
      const dataUrl = await toDataUrl(f)
      await update({ imageDataUrl: dataUrl }) // offline-first
    } catch (e) {
      setError("Could not store image locally.")
    }
  }

  const onExtract = async () => {
    setError(null)
    if (!file && !session?.imageDataUrl) {
      setError("Please choose a cheque image first.")
      return
    }
    const available = await isPromptAvailable()
    if (!available) {
      setError("Chrome Prompt API not available. Use Chrome Canary with Prompt API flags enabled.")
      return
    }
    try {
      setBusy(true)
      // prefer the freshly chosen file; else rebuild a Blob from dataURL
      let imageBlob: Blob | null = null
      if (file) imageBlob = file
      else if (session?.imageDataUrl) {
        const res = await fetch(session.imageDataUrl)
        imageBlob = await res.blob()
      }
      if (!imageBlob) throw new Error("No image available for extraction.")

      const extracted = await extractFieldsFromCheque(imageBlob)
      await update({
        extracted,
        edited: extracted, // prefill form
      })
      onNext()
    } catch (e: any) {
      setError(e?.message || "Extraction failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-4 bg-card text-card-foreground">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cheque-image">Cheque Image (front)</Label>
          <input
            id="cheque-image"
            type="file"
            accept="image/*"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
          />
        </div>

        {session?.imageDataUrl && (
          <div className="flex justify-start">
            <img
              src={session.imageDataUrl || "/placeholder.svg"}
              alt="Cheque preview"
              className="max-h-56 rounded-md border"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={onExtract} disabled={busy}>
            {busy ? "Extracting..." : "Extract & Prefill"}
          </Button>
          <Button variant="outline" onClick={onNext} disabled={!session?.imageDataUrl || busy}>
            Skip extraction
          </Button>
        </div>

        {error && <p className="text-sm text-destructive-foreground bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Tip: This runs entirely on-device when the Prompt API is available, preserving privacy and enabling offline
          use.
        </p>
      </div>
    </Card>
  )
}
