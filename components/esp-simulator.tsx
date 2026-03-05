"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Play,
  Square,
  Radio,
  Timer,
  Zap,
} from "lucide-react"

interface SimulatorProps {
  deviceId: string | null
}

type Scenario = "normal" | "calm" | "stressed" | "spike"

const scenarioLabels: Record<Scenario, { label: string; description: string }> = {
  calm: {
    label: "Calma",
    description: "Valores bajos de estres, entorno tranquilo",
  },
  normal: {
    label: "Normal",
    description: "Valores tipicos de un dia regular",
  },
  stressed: {
    label: "Estres alto",
    description: "Sobreestimulacion sensorial simulada",
  },
  spike: {
    label: "Pico critico",
    description: "Evento critico con maximos de todos los sensores",
  },
}

interface SimStats {
  totalSent: number
  totalAlerts: number
  avgLatency: number
  avgProcessingTime: number
  lastStress: number
  latencies: number[]
}

export function EspSimulator({ deviceId }: SimulatorProps) {
  const [running, setRunning] = useState(false)
  const [scenario, setScenario] = useState<Scenario>("normal")
  const [stats, setStats] = useState<SimStats>({
    totalSent: 0,
    totalAlerts: 0,
    avgLatency: 0,
    avgProcessingTime: 0,
    lastStress: 0,
    latencies: [],
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sendSimulatedData = useCallback(async () => {
    if (!deviceId) return

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, scenario }),
      })

      if (res.ok) {
        const json = await res.json()
        setStats((prev) => {
          const newLatencies = [...prev.latencies, json.latency_ms].slice(-30)
          const avgLat =
            newLatencies.reduce((a, b) => a + b, 0) / newLatencies.length
          return {
            totalSent: prev.totalSent + 1,
            totalAlerts: prev.totalAlerts + (json.alerts || 0),
            avgLatency: Math.round(avgLat),
            avgProcessingTime:
              Math.round(
                (prev.avgProcessingTime * prev.totalSent +
                  json.processing_time_ms) /
                  (prev.totalSent + 1)
              ),
            lastStress: json.stress_index,
            latencies: newLatencies,
          }
        })
      }
    } catch {
      // Silently handle network errors during simulation
    }
  }, [deviceId, scenario])

  function handleStart() {
    if (!deviceId) return
    setRunning(true)
    setStats({
      totalSent: 0,
      totalAlerts: 0,
      avgLatency: 0,
      avgProcessingTime: 0,
      lastStress: 0,
      latencies: [],
    })
    // Send data every 2 seconds (simulating ESP8266 interval)
    sendSimulatedData()
    intervalRef.current = setInterval(sendSimulatedData, 2000)
  }

  function handleStop() {
    setRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Update interval when scenario changes while running
  useEffect(() => {
    if (running && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(sendSimulatedData, 2000)
    }
  }, [scenario, running, sendSimulatedData])

  if (!deviceId) return null

  return (
    <Card className="border-dashed border-chart-3/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Radio className={`h-4 w-4 ${running ? "animate-pulse text-chart-4" : ""}`} />
            Simulador ESP8266
          </CardTitle>
          <Badge
            variant={running ? "default" : "secondary"}
            className="text-xs"
          >
            {running ? "Transmitiendo" : "Detenido"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Controls */}
          <div className="flex items-center gap-3">
            <Select
              value={scenario}
              onValueChange={(v) => setScenario(v as Scenario)}
              disabled={running}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(scenarioLabels) as Scenario[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex flex-col">
                      <span>{scenarioLabels[s].label}</span>
                      <span className="text-xs text-muted-foreground">
                        {scenarioLabels[s].description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {running ? (
              <Button variant="destructive" size="sm" onClick={handleStop}>
                <Square className="mr-1.5 h-3.5 w-3.5" />
                Detener
              </Button>
            ) : (
              <Button size="sm" onClick={handleStart}>
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Iniciar
              </Button>
            )}
          </div>

          {/* Stats */}
          {stats.totalSent > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Enviados</p>
                <p className="text-lg font-bold text-foreground">{stats.totalSent}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  Latencia
                </p>
                <p className="text-lg font-bold text-foreground">{stats.avgLatency}ms</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  Alertas
                </p>
                <p className="text-lg font-bold text-foreground">{stats.totalAlerts}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Estres</p>
                <p className="text-lg font-bold text-foreground">
                  {(stats.lastStress * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
