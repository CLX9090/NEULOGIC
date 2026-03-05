"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface SensorReading {
  id: string
  device_id: string
  gsr: number
  sound: number
  accel_x: number
  accel_y: number
  accel_z: number
  stress_index: number
  timestamp: number
  latency_ms: number | null
  created_at: string
}

export interface AlertRecord {
  id: string
  device_id: string
  alert_type: string
  severity: string
  message: string
  stress_value: number
  acknowledged: boolean
  created_at: string
}

export function useRealtimeSensorData(deviceId: string | null) {
  const [data, setData] = useState<SensorReading[]>([])
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null)

  // Fetch initial data
  const fetchInitial = useCallback(async () => {
    if (!deviceId) return
    try {
      const res = await fetch(`/api/sensor-data?device_id=${deviceId}&limit=60`)
      const json = await res.json()
      if (json.data) {
        setData(json.data)
        if (json.data.length > 0) {
          setLatestReading(json.data[json.data.length - 1])
        }
      }
    } catch {
      // Silently handle fetch errors
    }
  }, [deviceId])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  // Subscribe to realtime
  useEffect(() => {
    if (!deviceId) return

    const supabase = createClient()
    let channel: RealtimeChannel

    channel = supabase
      .channel(`sensor-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_data",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newReading = payload.new as SensorReading
          setData((prev) => {
            const updated = [...prev, newReading]
            // Keep last 120 readings
            return updated.slice(-120)
          })
          setLatestReading(newReading)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deviceId])

  return { data, latestReading, refetch: fetchInitial }
}

export function useRealtimeAlerts(deviceId: string | null) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0)

  const fetchAlerts = useCallback(async () => {
    if (!deviceId) return
    try {
      const res = await fetch(`/api/alerts?device_id=${deviceId}`)
      const json = await res.json()
      if (json.alerts) {
        setAlerts(json.alerts)
        setUnacknowledgedCount(json.alerts.filter((a: AlertRecord) => !a.acknowledged).length)
      }
    } catch {
      // Silently handle
    }
  }, [deviceId])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  useEffect(() => {
    if (!deviceId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`alerts-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newAlert = payload.new as AlertRecord
          setAlerts((prev) => [newAlert, ...prev].slice(0, 100))
          setUnacknowledgedCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deviceId])

  async function acknowledgeAlert(alertId: string) {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId }),
      })
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      )
      setUnacknowledgedCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Handle error
    }
  }

  return { alerts, unacknowledgedCount, acknowledgeAlert, refetch: fetchAlerts }
}
