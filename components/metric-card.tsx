"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "stable"
  trendValue?: string
  icon: React.ReactNode
  color: string
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="mt-1 flex items-center gap-1.5">
          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend === "up" && "text-destructive",
                trend === "down" && "text-success",
                trend === "stable" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="mr-0.5 h-3 w-3" />}
              {trend === "down" && <TrendingDown className="mr-0.5 h-3 w-3" />}
              {trend === "stable" && <Minus className="mr-0.5 h-3 w-3" />}
              {trendValue}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
