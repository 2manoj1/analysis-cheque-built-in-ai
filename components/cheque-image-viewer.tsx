"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useChequeSession } from "@/hooks/use-cheque-session"
import { Eye } from "lucide-react"
import { ChequeImagePreview } from "./cheque-image-preview"

export function ChequeImageViewer() {
  const { data: session } = useChequeSession()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const imageUrl = useMemo(() => {
    return session?.imageDataUrl || null
  }, [session?.imageDataUrl])

  if (!imageUrl) {
    return (
      <Card className="p-4 bg-card text-card-foreground flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">No cheque image uploaded</p>
      </Card>
    )
  }

  return (
    <>
      <Card
        className="p-4 bg-card text-card-foreground cursor-pointer hover:bg-accent transition-colors"
        onClick={() => setIsPreviewOpen(true)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Cheque Image</p>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Thumbnail */}
          <div className="relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-48">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Cheque front"
              className="w-full h-auto object-contain max-h-48"
            />
          </div>

          <Button variant="outline" className="w-full gap-2 bg-transparent">
            <Eye className="w-4 h-4" />
            Click to Preview
          </Button>
        </div>
      </Card>

      <ChequeImagePreview isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} imageUrl={imageUrl} />
    </>
  )
}
