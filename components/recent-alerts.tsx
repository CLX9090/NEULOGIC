"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Volume2, Activity, Zap } from "lucide-react"
import type { AlertRecord } from "@/hooks/use-realtime"
import { cn } from "@/lib/utils"

interface RecentAlertsProps {
  alerts: AlertRecord[]
  className?: string
}

const alertIcons: Record<string, React.ReactNode> = {
  overstimulation: <Zap className="h-4 w-4" />,
  high_movement: <Activity className="h-4 w-4" />,
  sound_spike: <Volume2 className="h-4 w-4" />,
  rapid_change: <AlertTriangle className="h-4 w-4" />,
}

const severityStyles: Record<string, string> = {
  low: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
}

const alertTypeLabels: Record<string, string> = {
  overstimulation: "Sobreestimulacion",
  high_movement: "Movimiento alto",
  sound_spike: "Pico de sonido",
  rapid_change: "Cambio rapido",
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Ahora"
  if (minutes < 60) return `Hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

export function RecentAlerts({ alerts, className }: RecentAlertsProps) {
  const recentAlerts = alerts.filter((a) => !a.acknowledged).slice(0, 8)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Alertas Recientes
          </CardTitle>
          {recentAlerts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {recentAlerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          {recentAlerts.length === 0 ? (
            <div className="flex h-[260px] flex-col items-center justify-center text-muted-foreground">
              <Activity className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">Sin alertas pendientes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    severityStyles[alert.severity]
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {alertIcons[alert.alert_type]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        {alertTypeLabels[alert.alert_type]}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatRelativeTime(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-80">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
