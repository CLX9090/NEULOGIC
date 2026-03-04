"use client"

import { useDevices } from "@/hooks/use-devices"
import { useRealtimeAlerts } from "@/hooks/use-realtime"
import { DeviceSelector } from "@/components/device-selector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Volume2,
  Activity,
  Zap,
  Check,
  Bell,
} from "lucide-react"
import { toast } from "sonner"

const alertIcons: Record<string, React.ReactNode> = {
  overstimulation: <Zap className="h-4 w-4" />,
  high_movement: <Activity className="h-4 w-4" />,
  sound_spike: <Volume2 className="h-4 w-4" />,
  rapid_change: <AlertTriangle className="h-4 w-4" />,
}

const alertTypeLabels: Record<string, string> = {
  overstimulation: "Sobreestimulacion",
  high_movement: "Movimiento alto",
  sound_spike: "Pico de sonido",
  rapid_change: "Cambio rapido",
}

const severityLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "Baja", variant: "secondary" },
  medium: { label: "Media", variant: "default" },
  high: { label: "Alta", variant: "destructive" },
}

export default function AlertsPage() {
  const { activeDevice } = useDevices()
  const deviceId = activeDevice?.devices.id ?? null
  const { alerts, acknowledgeAlert } = useRealtimeAlerts(deviceId)

  async function handleAcknowledge(alertId: string) {
    await acknowledgeAlert(alertId)
    toast.success("Alerta reconocida")
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            Historial de alertas generadas por los sensores
          </p>
        </div>
        <DeviceSelector />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Bell className="h-4 w-4 text-primary" />
              Historial de alertas
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="mb-3 h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {deviceId
                  ? "No se han generado alertas aun"
                  : "Selecciona un dispositivo para ver alertas"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Tipo</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead className="w-20">Severidad</TableHead>
                    <TableHead className="w-20">Estres</TableHead>
                    <TableHead className="w-28">Fecha</TableHead>
                    <TableHead className="w-20 text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow
                      key={alert.id}
                      className={alert.acknowledged ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {alertIcons[alert.alert_type]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">
                            {alertTypeLabels[alert.alert_type]}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {alert.message}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityLabels[alert.severity]?.variant || "secondary"}>
                          {severityLabels[alert.severity]?.label || alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {alert.stress_value
                            ? `${(alert.stress_value * 100).toFixed(0)}%`
                            : "--"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(alert.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {alert.acknowledged ? (
                          <span className="text-xs text-muted-foreground">
                            <Check className="inline h-3 w-3" /> OK
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handleAcknowledge(alert.id)}
                          >
                            Reconocer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
