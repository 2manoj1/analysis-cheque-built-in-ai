"use client"

export function Separator({ className = "" }: { className?: string }) {
  return <div role="separator" className={`h-px w-full bg-border ${className}`} />
}
