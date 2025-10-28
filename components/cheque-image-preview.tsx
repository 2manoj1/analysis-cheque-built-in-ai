"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  RotateCw,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ChequeImagePreviewProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
}

export function ChequeImagePreview({ isOpen, onOpenChange, imageUrl }: ChequeImagePreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isMirrored, setIsMirrored] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })

  // Touch/pointer state
  const [pointers, setPointers] = useState<Map<number, { x: number; y: number }>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setZoom(1)
      setRotation(0)
      setIsMirrored(false)
      setPanOffset({ x: 0, y: 0 })
    }
  }, [isOpen])

  // ———————— ACTIONS ————————
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.2))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleMirror = () => setIsMirrored(!isMirrored)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setIsMirrored(false)
    setPanOffset({ x: 0, y: 0 })
  }

  // ———————— KEYBOARD SHORTCUTS ————————
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      } else if (e.key === "0" || e.key === "Escape") {
        handleReset()
      } else if (e.key === "+") {
        handleZoomIn()
      } else if (e.key === "-") {
        handleZoomOut()
      } else if (e.key.toLowerCase() === "r") {
        handleRotate()
      } else if (e.key.toLowerCase() === "m") {
        handleMirror()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, zoom, rotation, isMirrored])

  // ———————— POINTER (MOUSE + TOUCH + TRACKPAD) ————————
  const getDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

  const getMidpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  })

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return
    containerRef.current.setPointerCapture(e.pointerId)
    const newPointers = new Map(pointers)
    newPointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setPointers(newPointers)

    if (newPointers.size === 1 && zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      setStartPan({ ...panOffset })
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const newPointers = new Map(pointers)
    if (!newPointers.has(e.pointerId)) return
    newPointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setPointers(newPointers)

    if (isDragging && newPointers.size === 1) {
      setPanOffset({
        x: startPan.x + (e.clientX - dragStart.x),
        y: startPan.y + (e.clientY - dragStart.y),
      })
    } else if (newPointers.size === 2) {
      // Two-finger pinch/pan (basic)
      const [id1, id2] = Array.from(newPointers.keys())
      const p1 = newPointers.get(id1)!
      const p2 = newPointers.get(id2)!
      const prevP1 = pointers.get(id1)!
      const prevP2 = pointers.get(id2)!

      const startDist = getDistance(prevP1, prevP2)
      const currentDist = getDistance(p1, p2)
      const scale = currentDist / startDist

      if (Math.abs(scale - 1) > 0.01) {
        setZoom((z) => Math.min(Math.max(z * scale, 0.2), 3))
      }

      // Optional: pan with two fingers
      const prevMid = getMidpoint(prevP1, prevP2)
      const currMid = getMidpoint(p1, p2)
      setPanOffset((prev) => ({
        x: prev.x + (currMid.x - prevMid.x),
        y: prev.y + (currMid.y - prevMid.y),
      }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const newPointers = new Map(pointers)
    newPointers.delete(e.pointerId)
    setPointers(newPointers)

    if (isDragging && newPointers.size === 0) {
      setIsDragging(false)
    }
  }

  // Auto reset pan when zoom ≤ 1
  useEffect(() => {
    if (zoom <= 1) {
      setPanOffset({ x: 0, y: 0 })
    }
  }, [zoom])

  // ———————— RENDER ————————
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full md:w-3/5 !max-w-full flex flex-col p-0 overflow-hidden"
      >
        {/* Header with controls */}
        <SheetHeader className="p-2 flex flex-row items-center justify-between">
          <SheetTitle className="text-sm font-medium">Cheque Preview</SheetTitle>

          <TooltipProvider>
            <div className="flex mr-16 items-center p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm border border-white/20 dark:border-gray-700/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.2}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out (–)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in (+)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleRotate}
                    aria-label="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate (R)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={isMirrored ? "secondary" : "ghost"}
                    onClick={handleMirror}
                    aria-label={isMirrored ? "Unmirror" : "Mirror"}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mirror (M)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleReset}
                    aria-label="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset (0)</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </SheetHeader>

        {/* Image Viewport */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-muted relative touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => setIsDragging(false)}
          style={{
            cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default",
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
          >
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${isMirrored ? -1 : 1})`,
                transformOrigin: "center",
                transition: isDragging ? "none" : "transform 0.2s ease-out",
              }}
            >
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Cheque image"
                className="max-w-none select-none"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>

        {/* Zoom indicator (subtle) */}
        <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
          {Math.round(zoom * 100)}%
        </div>
      </SheetContent>
    </Sheet>
  )
}