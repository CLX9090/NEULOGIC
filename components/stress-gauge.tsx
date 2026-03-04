"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StressGaugeProps {
  value: number | null
  className?: string
}

export function StressGauge({ value, className }: StressGaugeProps) {
  const stress = value ?? 0
  const percentage = Math.round(stress * 100)

  const getLevel = () => {
    if (stress < 0.3) return { label: "Bajo", color: "#4ade80" }
    if (stress < 0.5) return { label: "Moderado", color: "#60a5fa" }
    if (stress < 0.7) return { label: "Elevado", color: "#fbbf24" }
    if (stress < 0.85) return { label: "Alto", color: "#f97316" }
    return { label: "Critico", color: "#ef4444" }
  }

  const level = getLevel()

  // SVG gauge arc
  const radius = 70
  const circumference = Math.PI * radius // half circle
  const offset = circumference - (stress * circumference)

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Indice de Estres
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="relative">
          <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
            {/* Background arc */}
            <path
              d="M 10 90 A 70 70 0 0 1 170 90"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              className="text-muted/40"
            />
            {/* Value arc */}
            <path
              d="M 10 90 A 70 70 0 0 1 170 90"
              fill="none"
              stroke={level.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-3xl font-bold text-foreground">{percentage}%</span>
          </div>
        </div>
        <span
          className="mt-2 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${level.color}20`, color: level.color }}
        >
          {level.label}
        </span>
      </CardContent>
    </Card>
  )
}
